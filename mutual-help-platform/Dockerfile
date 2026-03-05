FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 \
    PORT=8000 \
    DB_PATH=/data/app.db

WORKDIR /app

RUN useradd -m -u 10001 appuser && mkdir -p /data && chown -R appuser:appuser /data /app

COPY --chown=appuser:appuser server.py ./
COPY --chown=appuser:appuser static ./static
COPY --chown=appuser:appuser quality_rules.json ./quality_rules.json

USER appuser

EXPOSE 8000

CMD ["python3", "server.py"]
