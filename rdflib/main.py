from rdflib import Dataset, URIRef
import uvicorn
from rdflib_endpoint import SparqlEndpoint
import os


example_query = """PREFIX : <http://activate.htwk-leipzig.de/model#> 
PREFIX owl: <http://www.w3.org/2002/07/owl#> 
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> 
PREFIX xml: <http://www.w3.org/XML/1998/namespace> 
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> 
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 

SELECT * WHERE {
    ?s ?p ?o .
} LIMIT 100"""


# Use ConjunctiveGraph to support nquads and graphs in SPARQL queries
# identifier is the default graph
ds = Dataset()

graph_vocabulary = ds.graph(URIRef("http://activate.htwk-leipzig.de/graph/Vocabulary"))
graph_after = ds.graph(URIRef("http://activate.htwk-leipzig.de/graph/Urology_Emergency_after_Debriefing"))
graph_before = ds.graph(URIRef("http://activate.htwk-leipzig.de/graph/Urology_Emergency_before_Debriefing"))

graph_vocabulary.parse(os.path.join(".", "data", "Vocabulary.ttl"), format="turtle")
graph_after.parse(os.path.join(".", "data", "Urology Emergency after Debriefing.ttl"), format="turtle")
graph_before.parse(os.path.join(".", "data", "Urology Emergency before Debriefing.ttl"), format="turtle")

# Start the SPARQL endpoint based on the RDFLib Graph
app = SparqlEndpoint(
    graph=ds,
    path="/",
    cors_enabled=True,
    # Metadata used for the SPARQL service description and Swagger UI:
    title="SPARQL endpoint for RDFLib graph",
    version="0.1.0",
    # Example query displayed in YASGUI default tab
    example_query = example_query,
    enable_update=True,
)

# Uncomment to run it directly with python app/main.py
if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)