#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="${ROOT_DIR}/app.db"
BACKUP_DIR="${ROOT_DIR}/backups"
TS="$(date +%Y%m%d_%H%M%S)"

if [[ ! -f "${DB_PATH}" ]]; then
  echo "Database not found: ${DB_PATH}"
  exit 1
fi

mkdir -p "${BACKUP_DIR}"
cp "${DB_PATH}" "${BACKUP_DIR}/app_${TS}.db"

# Keep last 20 backups only
ls -1t "${BACKUP_DIR}"/app_*.db 2>/dev/null | tail -n +21 | xargs -I {} rm -f {}

echo "Backup created: ${BACKUP_DIR}/app_${TS}.db"
