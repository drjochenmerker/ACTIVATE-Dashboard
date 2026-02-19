import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from rdflib import Dataset, URIRef
from rdflib_endpoint import SparqlRouter
import uvicorn

from lti import router as lti_router

# ===== DEBUG DIAGNOSTICS =====
print("=" * 60)
print("DEBUG: Startup Diagnostics")
print("=" * 60)
print(f"Working Directory: {os.getcwd()}")
print(f"Python Path: {os.path.abspath('.')}")

DATA_DIR = "./data/backup"
print(f"\nLooking for DATA_DIR: {DATA_DIR}")
print(f"Absolute path: {os.path.abspath(DATA_DIR)}")
print(f"Exists: {os.path.exists(DATA_DIR)}")
print(f"Is Directory: {os.path.isdir(DATA_DIR)}")

# Show structure of ./data
print("\n--- Full ./data structure ---")
if os.path.exists("./data"):
    for root, dirs, files in os.walk("./data"):
        level = root.replace("./data", "").count(os.sep)
        indent = " " * 2 * level
        print(f"{indent}{os.path.basename(root)}/")
        sub_indent = " " * 2 * (level + 1)
        for file in files:
            print(f"{sub_indent}{file}")
else:
    print("./data directory does not exist!")

# List contents of DATA_DIR
print(f"\n--- Contents of DATA_DIR ({DATA_DIR}) ---")
if os.path.exists(DATA_DIR):
    try:
        contents = os.listdir(DATA_DIR)
        print(f"Total items: {len(contents)}")
        for item in sorted(contents):
            item_path = os.path.join(DATA_DIR, item)
            if os.path.isfile(item_path):
                size = os.path.getsize(item_path)
                print(f"  FILE: {item} ({size} bytes)")
            elif os.path.isdir(item_path):
                print(f"  DIR:  {item}/")
    except Exception as e:
        print(f"Error listing directory: {e}")
else:
    print(f"DATA_DIR does not exist: {DATA_DIR}")

FILES = [file for file in os.listdir(DATA_DIR) if file.endswith(".ttl")]
print(f"\n--- TTL Files Found ---")
print(f"Total TTL files: {len(FILES)}")
for file in sorted(FILES):
    print(f"  - {file}")
print("=" * 60 + "\n")

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
async def upload_ttl(request: Request):
    ttl_string = await request.body()
    # Debug log
    print(f"Received TTL data: \n{ttl_string.decode('utf-8')}")
    if not ttl_string:
        raise HTTPException(status_code=400, detail="No TTL data provided.")

    # Generate graph id
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