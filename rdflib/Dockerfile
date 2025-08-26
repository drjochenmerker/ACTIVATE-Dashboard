FROM python:3.13

WORKDIR /app
COPY . .
COPY ./data/backup/* ./data/
COPY ./data/*.ttl ./data/

RUN pip install --upgrade pip \
    && pip install git+https://github.com/Kejoka/rdflib-endpoint-ttl.git@main#egg=rdflib-endpoint \
    && pip install fastapi uvicorn rdflib httpx jose "python-jose[cryptography]"

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]