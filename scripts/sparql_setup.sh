#!/bin/bash

python -m venv ./activate_env
source ./activate_env/bin/activate
pip install --upgrade pip
pip install rdflib-endpoint uvicorn
rdflib-endpoint serve ./src/assets/data/Beispieldaten.ttl ./src/assets/data/vocabulary.ttl