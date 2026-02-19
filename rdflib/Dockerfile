FROM python:3.13

WORKDIR /app
COPY . .

RUN mkdir -p ./data/backup && \
    if [ -d ./data/backup ] && [ "$(ls -A ./data/backup/)" ]; then \
      echo "Found TTL files in backup directory"; \
    else \
      echo "Warning: No TTL files found in data/backup directory"; \
    fi

RUN pip install --upgrade pip \
    && pip install git+https://github.com/Kejoka/rdflib-endpoint-ttl.git@main#egg=rdflib-endpoint \
    && pip install fastapi uvicorn rdflib httpx jose "python-jose[cryptography]"

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]