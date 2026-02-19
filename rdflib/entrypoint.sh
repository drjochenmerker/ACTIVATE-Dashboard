#!/bin/sh

# If volume mount is empty, copy files from build context
if [ ! -d "/app/data/backup" ] || [ -z "$(ls -A /app/data/backup 2>/dev/null)" ]; then
    echo "Volume mount is empty, copying bundled TTL files..."
    mkdir -p /app/data/backup
    if [ -d "/app/data_bundled/backup" ]; then
        cp -r /app/data_bundled/backup/* /app/data/backup/ 2>/dev/null || true
        echo "Copied $(ls -1 /app/data/backup/*.ttl 2>/dev/null | wc -l) TTL files"
    fi
fi

# Start uvicorn
exec python -u -m uvicorn main:app --host 0.0.0.0 --port 8000
