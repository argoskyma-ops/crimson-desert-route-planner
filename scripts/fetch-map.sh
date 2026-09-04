#!/usr/bin/env bash
# Fetch the PowerPyx full-world-map JPEG for Pywel into data/map/source.jpg.
# Idempotent: skips the download if the file already exists.
# See SOURCE.md for provenance, license note, and how to re-create data/map/.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_URL="https://www.powerpyx.com/wp-content/uploads/crimson-desert-full-world-map.jpg"
OUT_DIR="${REPO_ROOT}/data/map"
OUT_FILE="${OUT_DIR}/source.jpg"
EXPECTED_W=5178
EXPECTED_H=5240

mkdir -p "${OUT_DIR}"

if [[ -f "${OUT_FILE}" ]]; then
  echo "fetch-map.sh: ${OUT_FILE} already exists, skipping download"
else
  echo "fetch-map.sh: downloading ${SRC_URL}"
  curl -sL -A "Mozilla/5.0" -o "${OUT_FILE}" "${SRC_URL}"
fi

set +e
DIMENSIONS="$("${REPO_ROOT}/.venv/bin/python" -c "
from PIL import Image
im = Image.open('${OUT_FILE}')
w, h = im.size
print(f'{w}x{h}')
if (w, h) != (${EXPECTED_W}, ${EXPECTED_H}):
    raise SystemExit(1)
")"
STATUS=$?
set -e

if [[ ${STATUS} -ne 0 ]]; then
  echo "fetch-map.sh: ${OUT_FILE} is not ${EXPECTED_W}x${EXPECTED_H} (got '${DIMENSIONS}')" >&2
  exit 1
fi

echo "fetch-map.sh: ${OUT_FILE} is ${DIMENSIONS}"
