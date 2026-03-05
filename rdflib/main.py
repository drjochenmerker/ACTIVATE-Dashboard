import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from rdflib import Dataset, URIRef
from rdflib_endpoint import SparqlRouter
import uvicorn

from lti import router as lti_router

DATA_DIR = "./data/backup"
# Ensure DATA_DIR exists
if not os.path.exists(DATA_DIR):
    raise FileNotFoundError(f"ERROR: Required directory '{DATA_DIR}' does not exist. Check volume mount or entrypoint script.")
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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary TTL reader
from fastapi import Request, HTTPException
from uuid import uuid4

@app.post("/upload-ttl/")
async def upload_ttl(request: Request, graph_id: str = None):
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
        graph.parse(data=ttl_string.decode("utf-8"), format="turtle")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid TTL: {e}")

    # Add ttl file
    with open(os.path.join(DATA_DIR, f"{graph_id}.ttl"), "w") as f:
        f.write(ttl_string.decode("utf-8"))

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
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid TTL: {e}")

    return {"graph_id": graph_id, "message": "success"}

# @app.get("/")
# async def serve_frontend():
#     return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)