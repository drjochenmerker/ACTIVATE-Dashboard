import json
import logging
import os
import urllib.parse
import uuid

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse, HTMLResponse
import httpx
from jose import jwt, JWTError

# Set up logging configuration
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Create router with /lti prefix
router = APIRouter(prefix="/lti")

# Dictionary to store state-nonce pairs for session validation
state_store = {}

# Load LTI configuration from JSON file
config_path = os.path.join(os.path.dirname(__file__), "lti.config.json")
with open(config_path, "r") as f:
    CONFIG = json.load(f)

async def get_jwk_set():
    """
    Fetch JWK (JSON Web Key) set from the configured URL.
    Used for token verification.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(CONFIG['jwks_url'])
        response.raise_for_status()
        return response.json()

async def verify_id_token(token: str, audience: str, nonce: str):
    """
    Verify the LTI ID token's authenticity and claims.
    
    Args:
        token: The ID token to verify
        audience: Expected audience (client_id)
        nonce: Expected nonce value for preventing replay attacks
    
    Returns:
        dict: Decoded token payload if verification succeeds
    """
    jwks = await get_jwk_set()
    try:
        payload = jwt.decode(token, jwks, algorithms=["RS256"], audience=audience)
        if payload.get("nonce") != nonce:
            raise ValueError("Invalid Nonce")
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid ID-Token: {e}")

@router.api_route("/login", methods=["GET", "POST"])
async def lti_login(request: Request):
    """
    Handle LTI login initiation.
    Creates state and nonce for security, then redirects to authentication URL.
    """
    if request.method == "GET":
        login_hint = request.query_params.get("login_hint")
    else:
        form = await request.form()
        login_hint = form.get("login_hint")

    if not login_hint:
        raise HTTPException(status_code=400, detail="Missing login_hint")

    # Generate state and nonce for security
    state = uuid.uuid4().hex
    nonce = uuid.uuid4().hex
    state_store[state] = nonce

    # Prepare OIDC authentication parameters
    params = {
        "response_type": "id_token",
        "response_mode": "form_post",
        "client_id": CONFIG['client_id'],
        "redirect_uri": CONFIG['redirect_uri'],
        "scope": "openid",
        "login_hint": login_hint,
        "state": state,
        "nonce": nonce
    }

    url = CONFIG['auth_url'] + "?" + urllib.parse.urlencode(params)

    # Return HTML with button to redirect the user to the ACTIVATE-instance
    # Currently necessary, 
    content = f"""
    <html>
    <body>
        <p>Please click here to open the tool:</p>
        <button onclick="window.location.href='{url}'">Continue</button>
    </body>
    </html>
    """

    return HTMLResponse(content=content)

@router.api_route("/launch", methods=["GET", "POST"])
async def lti_launch(request: Request):
    """
    Handle LTI tool launch.
    Verifies the ID token and processes user information.
    Redirects to the application start page on successful authentication.
    """
    form = await request.form()
    id_token = form.get("id_token")
    state = form.get("state")

    if not id_token or not state:
        raise HTTPException(status_code=400, detail="Missing launch parameters")

    # Verify state and retrieve corresponding nonce
    nonce = state_store.pop(state, None)
    if not nonce:
        raise HTTPException(status_code=400, detail="Unknown state")

    try:
        # Verify token and extract user information
        payload = await verify_id_token(id_token, CONFIG['client_id'], nonce)

        user_info = {
            "name": payload.get("name"),
            "email": payload.get("email"),
            "roles": payload.get("https://purl.imsglobal.org/spec/lti/claim/roles", [])
        }

        print(f"Name: {user_info['name']}, Email: {user_info['email']}")

        return RedirectResponse(url="/start")

    except Exception as e:
        logger.error(f"Error verifying token: {e}")
        return {"error": str(e)}