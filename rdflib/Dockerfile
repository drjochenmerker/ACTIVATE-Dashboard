FROM python:3.13

WORKDIR /app
COPY . .
COPY ./data/backup/* ./data/

RUN pip install --upgrade pip \
    && pip install git+https://github.com/Kejoka/rdflib-endpoint-ttl.git@main#egg=rdflib-endpoint uvicorn fastapi

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]