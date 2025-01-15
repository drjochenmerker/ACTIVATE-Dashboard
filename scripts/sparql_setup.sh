#!/bin/bash

python -m venv ./activate_env
source ./activate_env/bin/activate
pip install --upgrade pip
pip install rdflib-endpoint uvicorn
# Should work as soon as the Syntax Errors in BeispielDatenCIRSFall.ttl have been resolved
# FILES=$(echo ./src/assets/data/*.ttl) 
# rdflib-endpoint serve $FILES
rdflib-endpoint serve ./src/assets/data/Beispieldaten.ttl ./src/assets/data/vocabulary.ttl