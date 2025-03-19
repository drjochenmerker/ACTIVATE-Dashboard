#!/bin/bash

python3.13 -m venv ./activate_env
source ./activate_env/bin/activate
pip install --upgrade pip
pip install rdflib-endpoint[web]
cd rdflib
python main.py