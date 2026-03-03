#!/usr/bin/env bash
set -euo pipefail
# Wrapper to run the real script located in ./scripts/control-green.sh
# Allows running ./control-green.sh from the project root like the server user did.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="$SCRIPT_DIR/scripts/control-green.sh"

if [ -x "$TARGET" ]; then
  exec "$TARGET" "$@"
elif [ -f "$TARGET" ]; then
  exec bash "$TARGET" "$@"
else
  echo "No existe $TARGET. Asegúrate de que el repositorio contiene scripts/control-green.sh" >&2
  exit 2
fi
