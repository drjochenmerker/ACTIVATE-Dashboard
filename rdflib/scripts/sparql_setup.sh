#!/bin/bash

if [ -z "$(find ./rdflib/data -maxdepth 1 -name '*.ttl' -print -quit)" ]; then
  cp -n ./rdflib/data/backup/* ./rdflib/data/
fi
python3.13 -m venv ./activate_env
source ./activate_env/bin/activate
pip install --upgrade pip
pip install git+https://github.com/Kejoka/rdflib-endpoint-ttl.git@main#egg=rdflib-endpoint uvicorn fastapi
cd rdflib
python main.py