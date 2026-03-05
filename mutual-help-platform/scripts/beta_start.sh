#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"
RUN_SMOKE="${RUN_SMOKE:-0}"

echo "[beta] preflight: python syntax check"
PYTHONPYCACHEPREFIX="${ROOT_DIR}/__pycache__" python3 -m py_compile \
  server.py \
  scripts/smoke_test.py \
  scripts/seed_demo.py

echo "[beta] preflight: quality_rules.json check"
python3 - <<'PY'
import json
from pathlib import Path
p = Path("quality_rules.json")
if not p.exists():
    raise SystemExit("quality_rules.json missing")
data = json.loads(p.read_text(encoding="utf-8"))
required = [
    "base_score", "length_max_chars", "length_max_bonus",
    "valid_link_bonus_per", "valid_link_bonus_cap",
    "invalid_link_penalty_per", "duplicate_link_penalty",
    "short_content_threshold", "short_content_penalty",
    "similarity_penalty_rules",
]
for k in required:
    if k not in data:
        raise SystemExit(f"quality_rules missing key: {k}")
print("quality rules valid")
PY

if [[ "${RUN_SMOKE}" == "1" ]]; then
  echo "[beta] preflight: start temp server for smoke test"
  HOST=127.0.0.1 PORT=18000 PYTHONUNBUFFERED=1 python3 server.py >/tmp/mutual_help_beta_smoke.log 2>&1 &
  PID=$!
  trap 'kill ${PID} >/dev/null 2>&1 || true' EXIT
  sleep 1
  python3 scripts/smoke_test.py http://127.0.0.1:18000
  kill ${PID} >/dev/null 2>&1 || true
  trap - EXIT
  echo "[beta] smoke test passed"
fi

echo "[beta] starting service on ${HOST}:${PORT}"
HOST="${HOST}" PORT="${PORT}" ./scripts/start_prod.sh
