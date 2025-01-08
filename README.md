# Acivate-Dashboard

This project is a Vue 3 web application created using Vite. We want to use it to visualize ontologies for debriefing-settings.

## Installation

1. Clone the repository

```
git clone https://gitlab.dit.htwk-leipzig.de/iosse/activate/activate-dashboard.git
cd activate-dashboard
```

2. Install Dependencies

```
npm install
```

3. Add a ```.env``` File containing the environment variables

The File should look like this
```
KNOWLEDGE_GRAPH_URL=<URL>
KNOWLEDGE_GRAPH_PORT=<PORT>
```

## Development

Start the local development server

```
npm run dev
```

Run the development server with a SPARQL Endpoint on Port 8000

```
npm run dev-sparql
```

The application will be available at http://localhost:5173 by default.

## SPARQL Setup for local testing

Method 1 and 2 will run the sparql endpoint on http://localhost:8000

#### Method 1 - NPM
```npm run sparql```

#### Method 2 - Python
```pip install rdflib-endpoint uvicorn``` and ```rdflib-endpoint serve /path/to/ttl```


#### Method 3 - Podman
```podman run -p 3030:3030 docker.io/secoresearch/fuseki```

**Example:**
```
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX activate: <http://www.semanticweb.org/tobia/ontologies/2024/10/Activity_Theory/>
SELECT * WHERE {
    {
    	?s rdf:type activate:Community .
    	?s rdfs:label ?label .
    	FILTER (LANG(?label) = "de")
    }
} LIMIT 10
```

