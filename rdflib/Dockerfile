FROM python:3.13

WORKDIR /app
COPY . .

RUN sh -c \
    'if [ -d ./data/backup ]; then cp -r ./data/backup/* ./data/ 2>/dev/null || true; fi \
    && if find ./data -name "*.ttl" -type f 2>/dev/null | grep -q . ; then cp ./data/*.ttl ./data/ 2>/dev/null || true; fi'

RUN pip install --upgrade pip \
    && pip install git+https://github.com/Kejoka/rdflib-endpoint-ttl.git@main#egg=rdflib-endpoint \
    && pip install fastapi uvicorn rdflib httpx jose "python-jose[cryptography]"

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]