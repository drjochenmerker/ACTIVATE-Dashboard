FROM python:3.13

WORKDIR /app
COPY . .

# Preserve TTL files in a fallback location (won't be overwritten by volume mount)
RUN mkdir -p /app/data_backup && \
    if [ -d ./data/backup ]; then \
      cp -r ./data/backup/* /app/data_backup/ 2>/dev/null || true; \
    fi

RUN pip install --upgrade pip \
    && pip install git+https://github.com/Kejoka/rdflib-endpoint-ttl.git@main#egg=rdflib-endpoint \
    && pip install fastapi uvicorn rdflib httpx jose "python-jose[cryptography]"

EXPOSE 8000
CMD ["python", "-u", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]