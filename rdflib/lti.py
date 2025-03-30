import json
import logging
import os
import urllib.parse
import uuid

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse, HTMLResponse
import httpx
from jose import jwt, JWTError

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

router = APIRouter(prefix="/lti")

state_store = {}

config_path = os.path.join(os.path.dirname(__file__), "lti.config.json")
with open(config_path, "r") as f:
    CONFIG = json.load(f)

async def get_jwk_set():
    async with httpx.AsyncClient() as client:
        response = await client.get(CONFIG['jwks_url'])
        response.raise_for_status()
        return response.json()

async def verify_id_token(token: str, audience: str, nonce: str):
    jwks = await get_jwk_set()
    try:
        payload = jwt.decode(token, jwks, algorithms=["RS256"], audience=audience)
        if payload.get("nonce") != nonce:
            raise ValueError("Ungültige Nonce")
        return payload
    except JWTError as e:
        raise ValueError(f"Ungültiger ID-Token: {e}")

@router.api_route("/login", methods=["GET", "POST"])
async def lti_login(request: Request):
    if request.method == "GET":
        login_hint = request.query_params.get("login_hint")
    else:
        form = await request.form()
        login_hint = form.get("login_hint")

    if not login_hint:
        raise HTTPException(status_code=400, detail="login_hint fehlt")

    state = uuid.uuid4().hex
    nonce = uuid.uuid4().hex
    state_store[state] = nonce

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

    content = f"""
    <html>
    <body>
        <p>Bitte klicken Sie hier, um das Tool zu öffnen:</p>
        <button onclick="window.location.href='{url}'">Weiter</button>
    </body>
    </html>
    """

    return HTMLResponse(content=content)

@router.api_route("/launch", methods=["GET", "POST"])
async def lti_launch(request: Request):
    form = await request.form()
    id_token = form.get("id_token")
    state = form.get("state")

    if not id_token or not state:
        raise HTTPException(status_code=400, detail="Fehlende Launch-Parameter")

    nonce = state_store.pop(state, None)
    if not nonce:
        raise HTTPException(status_code=400, detail="Unbekannter state")

    try:
        payload = await verify_id_token(id_token, CONFIG['client_id'], nonce)

        user_info = {
            "name": payload.get("name"),
            "email": payload.get("email"),
            "roles": payload.get("https://purl.imsglobal.org/spec/lti/claim/roles", [])
        }

        print(f"Name: {user_info['name']}, Email: {user_info['email']}")

        return RedirectResponse(url="/start")

    except Exception as e:
        logger.error(f"Fehler beim Verifizieren des Tokens: {e}")
        return {"error": str(e)}