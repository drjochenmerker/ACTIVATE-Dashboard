#!/bin/bash

python -m venv ./activate_env
source ./activate_env/bin/activate
pip install --upgrade pip
pip install rdflib-endpoint[web] rdflib-sqlalchemy
cd rdflib
python main.py