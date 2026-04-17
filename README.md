# Acivate-Dashboard

This project is a Vue 3 web application created using Vite. We want to use it to visualize ontologies for debriefing-settings.

## Installation

1. Clone the repository

```
git clone https://github.com/drjochenmerker/ACTIVATE-Dashboard.git
cd activate-dashboard
```

2. Install Dependencies

```
npm install
cd feedback-parser
npm install
cd ..
```

3. Add a `.env` File containing the environment variables, according to `.env.template`

4. Optional for **Windows**: Set up the SPARQL endpoint manually

This step is only needed if you want to start the SPARQL endpoint manually instead of using `npm run sparql`.

Run the following commands in an Anaconda Prompt:

```sh
conda create -n activate_env python=3.13
conda activate activate_env
pip install --upgrade pip
pip install git+https://github.com/Kejoka/rdflib-endpoint-ttl.git@main#egg=rdflib-endpoint
pip install fastapi uvicorn rdflib httpx jose "python-jose[cryptography]"
python rdflib/main.py
```

## Development

Start the frontend

```
npm run dev
```

Start the rdflib backend

Option 1 for **Windows**:

```sh
python rdflib/main.py
```

Option 2:

```
npm run sparql
```

Start the llm backend

```
npm run llm
```

The application will be available at http://localhost:5173 by default.

## Deployment using Docker/Podman

It's highly recommended to use the following commands:
```
podman network create activate-network
podman compose up -d --build
```

Note that the deployment uses different host ports according to `docker-compose.yml`: frontend on `8001`, rdflib backend on `8002`, and llm backend on `8003`.
