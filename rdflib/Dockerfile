FROM python:3.13

WORKDIR /app
COPY . .

# Copy TTL files to a bundled location (will be restored if volume is empty)
RUN mkdir -p /app/data_bundled/backup && \
    if [ -d ./data/backup ]; then \
      cp -r ./data/backup /app/data_bundled/; \
    fi && \
    sed -i 's/\r$//' /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

RUN pip install --upgrade pip \
    && pip install git+https://github.com/Kejoka/rdflib-endpoint-ttl.git@main#egg=rdflib-endpoint \
    && pip install fastapi uvicorn rdflib httpx jose "python-jose[cryptography]"

EXPOSE 8000
CMD ["/app/entrypoint.sh"]