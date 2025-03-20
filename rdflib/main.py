from rdflib import Dataset, URIRef
import uvicorn
from rdflib_endpoint import SparqlRouter
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


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
app.include_router(sparql_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)