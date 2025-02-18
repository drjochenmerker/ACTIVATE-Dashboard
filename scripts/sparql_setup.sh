#!/bin/bash

python -m venv ./activate_env
source ./activate_env/bin/activate
pip install --upgrade pip
pip install rdflib-endpoint[web] rdflib-sqlalchemy
FILES=$(echo ./src/assets/data/*.ttl) 
rdflib-endpoint serve --enable-update $FILES