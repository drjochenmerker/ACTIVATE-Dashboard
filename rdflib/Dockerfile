FROM python:3.13

WORKDIR /app
COPY . .

# Debug: Check what was actually COPY-ed
RUN echo "=== Checking COPY-ed files ===" && \
    ls -la ./data/ 2>&1 || echo "data/ not found" && \
    ls -la ./data/backup/ 2>&1 || echo "data/backup not found" && \
    find ./data/backup -name "*.ttl" -type f 2>/dev/null | wc -l || echo "Cannot count TTL files"
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