import os
import re
from uuid import uuid4
import json
from datetime import datetime

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from rdflib import Dataset, URIRef
from rdflib_endpoint import SparqlRouter
import uvicorn
from jose import jwt, JWTError

from lti import router as lti_router

# Constants for authentication
JWT_SECRET = os.getenv("JWT_SECRET", "activate-secret-key")

# Configure allowed origins for CORS (localhost for development, public domain for production)
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:8000",
    "http://localhost:8001",
    "http://localhost:8002",
    "http://localhost:8005",
    "https://activate.htwk-leipzig.de",  # Production domain
    "https://www.activate.htwk-leipzig.de",  # Production domain with www
]

DATA_DIR = "./data/backup"
LOG_DIR = "./logs"
AUTH_LOG_FILENAME = "misc.log"
# Ensure DATA_DIR exists
if not os.path.exists(DATA_DIR):
    raise FileNotFoundError(f"ERROR: Required directory '{DATA_DIR}' does not exist. Check volume mount or entrypoint script.")
os.makedirs(LOG_DIR, exist_ok=True)
FILES = [file for file in os.listdir(DATA_DIR) if file.endswith(".ttl")]

# Log data source
print(f"\n[INFO] Loading TTL files from: {os.path.abspath(DATA_DIR)}")
print(f"[INFO] Found {len(FILES)} TTL file(s):")
for file in sorted(FILES):
    file_path = os.path.join(DATA_DIR, file)
    size = os.path.getsize(file_path)
    print(f"[INFO]  - {file} ({size} bytes)")
print()

# Create dataset with Namespaces and dynamically define graphs
ds = Dataset()
graphs = {file: ds.graph(URIRef(f"http://activate.htwk-leipzig.de/graph/{file[:-4].replace(' ', '_')}")) for file in FILES}
ttl_filepath_dict = {file[:-4].replace(" ", "_"): os.path.join(DATA_DIR, file) for file in FILES}

# Load TTL files into graphs
for filename, graph in graphs.items():
    ttl_path = os.path.join(DATA_DIR, filename)
    if os.path.exists(ttl_path):
        graph.parse(ttl_path, format="turtle")

sparql_router = SparqlRouter(
    graph=ds,
    graphs=graphs,
    path="/",
    # Metadata used for the SPARQL service description and Swagger UI:
    title="SPARQL endpoint for RDFLib graph",
    description="A SPARQL endpoint to serve machine learning models, or any other logic implemented in Python. \n[Source code](https://github.com/vemonet/rdflib-endpoint)",
    version="0.1.0",
    ttl_files=ttl_filepath_dict,
    enable_update=True
)

app = FastAPI()

# FRONTEND_DIR = "/root/projects/activate-dashboard/dist"
# app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

# API Routes
app.include_router(sparql_router)
app.include_router(lti_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Extracts bearer token from the request header
def extract_bearer_token(request: Request) -> str:
    auth_header = request.headers.get("authorization")
    if not auth_header:
        write_auth_log("Missing authentication token", dict(request.headers))
        raise HTTPException(status_code=401, detail="Access denied. No authentication token provided.")

    parts = auth_header.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        write_auth_log("Invalid authorization header", dict(request.headers))
        raise HTTPException(status_code=401, detail="Access denied. Invalid authorization header.")

    return parts[1]

def verify_app_token(request: Request, instructor_only: bool = False) -> dict:
    write_auth_log("Authentication attempt", dict(request.headers))
    token = extract_bearer_token(request)

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except JWTError:
        write_auth_log("Invalid or expired authentication token", dict(request.headers))
        raise HTTPException(status_code=403, detail="Invalid or expired authentication token.")

    if instructor_only and payload.get("role") != "root":
        write_auth_log("Non-instructor user attempted instructor operation", payload)
        raise HTTPException(status_code=403, detail="Access denied. Instructor-only operation.")

    return payload

def write_auth_log(header: str, content) -> None:
    log_path = os.path.join(LOG_DIR, AUTH_LOG_FILENAME)
    if isinstance(content, (dict, list)):
        content = json.dumps(content, indent=2, default=str)
    with open(log_path, "a", encoding="utf-8") as log_file:
        log_file.write(f"{datetime.now().isoformat()} - {header}\n{content}\n")

def build_cors_headers(request: Request) -> dict:
    origin = request.headers.get("origin")
    if not origin:
        return {}

    allowed_origin = (
        origin in ALLOWED_ORIGINS
       )

    if not allowed_origin:
        return {}

    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin",
    }

@app.middleware("http")
async def protect_mutating_routes(request: Request, call_next):
    content_type = request.headers.get("content-type", "")
    requires_auth = (
        request.method == "POST"
        and request.url.path == "/"
        and "application/x-www-form-urlencoded" in content_type
    )

    if requires_auth:
        try:
            verify_app_token(request)
        except HTTPException as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
                headers=build_cors_headers(request),
            )

    return await call_next(request)

# Input validation functions - prevent malformed input
def validate_ttl_input(ttl_data: bytes) -> str:
    """Validate TTL input for encoding and Turtle syntax."""
    if len(ttl_data) == 0:
        raise HTTPException(status_code=400, detail="No TTL data provided.")
    
    try:
        ttl_string = ttl_data.decode('utf-8')
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Invalid UTF-8 encoding in TTL data.")

    # Rudimentary syntax check: try parsing into a temporary graph.
    from rdflib import Graph
    tmp = Graph()
    try:
        tmp.parse(data=ttl_string, format="turtle")
    except Exception as e:
        raise HTTPException(status_code=400, detail=get_error_detail(e, "Malformed TTL syntax."))

    return ttl_string

def get_error_detail(e: Exception, generic_detail: str) -> str:
    """Return detailed error message in development mode, generic in production."""
    if DEVELOPMENT_MODE:
        return f"{generic_detail} - {str(e)}"
    return generic_detail

@app.post("/upload-ttl/")
async def upload_ttl(request: Request, graph_id: str = None):
    verify_app_token(request)
    ttl_string = await request.body()
    # Debug log
    print(f"Received TTL data: \n{ttl_string.decode('utf-8')}")
    if not ttl_string:
        raise HTTPException(status_code=400, detail="No TTL data provided.")

    # Use provided graph_id or generate a new one
    if not graph_id:
        graph_id = str(uuid4())
    graph_uri = f"http://activate.htwk-leipzig.de/graph/{graph_id}"
    graph = ds.graph(URIRef(graph_uri))

    try:
        graph.parse(data=ttl_string, format="turtle")
    except Exception as e:
        # Log error with details
        print(f"[ERROR] TTL parsing failed: {e}")
        raise HTTPException(status_code=400, detail=get_error_detail(e, "Invalid TTL format. Please provide valid Turtle RDF syntax."))

    # Add ttl file
    with open(os.path.join(DATA_DIR, f"{graph_id}.ttl"), "w") as f:
        f.write(ttl_string)

    # Properly register the graph
    graphs[f"{graph_id}.ttl"] = graph
    ttl_filepath_dict[graph_id] = os.path.join(DATA_DIR, f"{graph_id}.ttl")

    return {"graph_id": graph_id, "graph_uri": graph_uri, "message": "success"}

@app.get("/export-graph/{graph_id}")
async def export_graph(graph_id: str):
    """
    Exports a graph as TTL string.
    Used for cloning: fetch the graph content as TTL.
    """
    graph = graphs.get(f"{graph_id}.ttl")
    if not graph:
        raise HTTPException(status_code=404, detail=f"Graph {graph_id} not found.")
    
    try:
        ttl_string = graph.serialize(format="turtle")
        return {"graph_id": graph_id, "ttl": ttl_string, "message": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export graph: {e}")

@app.post("/parse-pool/")
async def parse_pool(request: Request):
    verify_app_token(request)
    data = await request.json()
    graph_id = data.get("graph_id")
    ttl_string = data.get("ttl")

    if not graph_id or not ttl_string:
        raise HTTPException(status_code=400, detail="Missing graph_id or ttl.")
    
    try:
        graph = graphs.get(f"{graph_id}.ttl")
        if not graph:
            raise HTTPException(status_code=404, detail="Graph not found.")
        graph.parse(data=ttl_string, format="turtle")
        graph.serialize(destination=ttl_filepath_dict[graph_id], format="turtle")
    except HTTPException:
        raise
    except Exception as e:
        # Log error with details
        print(f"[ERROR] Graph update failed for {graph_id}: {e}")
        raise HTTPException(status_code=400, detail=get_error_detail(e, "Invalid TTL format. Please provide valid Turtle RDF syntax."))

    return {"graph_id": graph_id, "message": "success"}

# @app.get("/")
# async def serve_frontend():
#     return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

# debug endpoint to print TTL content of a graph
@app.get("/debug-ttl/{graph_id}")
async def debug_ttl(graph_id: str):
    file_path = os.path.join(DATA_DIR, f"{graph_id}.ttl")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"content": content} # Hier schicken wir den Inhalt mit!
    raise HTTPException(status_code=404)

# Logging endpoint for activity changes
@app.post("/api/logs/activity")
async def log_activity(request: Request):
    """
    Logs manual changes to activities/situations
    Stores logs in ./logs directory with format: [timestamp] - Action: [operation]
    """
    try:      
        verify_app_token(request)
        data = await request.json()
        graph_id = data.get("graphId")
        operation = data.get("operation")
        timestamp = data.get("timestamp")
        log_message = data.get("logMessage")
        
        # Validate required fields
        if not graph_id or not operation or not timestamp:
            raise HTTPException(status_code=400, detail="Missing required fields: graphId, operation, timestamp")
        
        # Validate operation type
        valid_operations = ["Creation", "Deletion", "Modification"]
        if operation not in valid_operations:
            raise HTTPException(status_code=400, detail=f"Invalid operation type. Must be one of: {', '.join(valid_operations)}")
        
        # Create logs directory if it doesn't exist
        logs_dir = "./logs"
        if not os.path.exists(logs_dir):
            os.makedirs(logs_dir, exist_ok=True)
        
        # Write to log file named after the graphId
        log_file = os.path.join(logs_dir, f"activity_{graph_id}.log")
        final_message = log_message or f"[{timestamp}] - Action: {operation}"
        
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"{final_message}\n")
        
        return {
            "status": "OK",
            "message": "Log entry recorded successfully",
            "logFile": f"activity_{graph_id}.log"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging activity change: {str(e)}")
    
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)