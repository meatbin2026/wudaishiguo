#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup_db_file>"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DB="${ROOT_DIR}/app.db"
BACKUP_FILE="$1"

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

if [[ "${CONFIRM_RESTORE:-}" != "YES" ]]; then
  echo "Set CONFIRM_RESTORE=YES to run restore."
  echo "Example: CONFIRM_RESTORE=YES $0 ${BACKUP_FILE}"
  exit 1
fi

cp "${BACKUP_FILE}" "${TARGET_DB}"
echo "Database restored from ${BACKUP_FILE} to ${TARGET_DB}"
