#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-8000}"
export PYTHONUNBUFFERED=1

exec python3 server.py
