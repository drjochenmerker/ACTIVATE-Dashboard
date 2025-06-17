import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from rdflib import Dataset, URIRef
from rdflib_endpoint import SparqlRouter
import uvicorn

from lti import router as lti_router

DATA_DIR = "./data"
FILES = [file for file in os.listdir(DATA_DIR) if file.endswith(".ttl")]

# Create dataset with Namespaces and dynamically define graphs
ds = Dataset()
graphs = {file: ds.graph(URIRef(f"http://activate.htwk-leipzig.de/graph/{file[:-4].replace(" ", "_")}")) for file in FILES}
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
    print(f"Received TTL data: {ttl_string[:100]}...")
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

    # Optional: Graph im graphs- und ttl_filepath_dict registrieren (nur temporär im RAM)
    graphs[graph_id] = graph
    ttl_filepath_dict[graph_id] = None  # Kein File, nur temporär

    return {"graph_id": graph_id, "graph_uri": graph_uri, "message": "success"}

# @app.get("/")
# async def serve_frontend():
#     return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)