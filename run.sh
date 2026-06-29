#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Source .env if exists
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

export SENSOR_MODE="${SENSOR_MODE:-simulated}"
export DATABASE_URL="${DATABASE_URL:-sqlite:///./agripulse.db}"
export OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://localhost:11434}"
export OLLAMA_MODEL="${OLLAMA_MODEL:-llama3.1:8b}"

echo "==> Installing Python dependencies..."
pip install -q -r backend/requirements.txt

echo "==> Starting AgriPulse FMIS..."
echo "    Sensor mode: $SENSOR_MODE"
echo "    Ollama: $OLLAMA_BASE_URL ($OLLAMA_MODEL)"
echo "    Database: $DATABASE_URL"
echo ""

exec uvicorn backend.main:app \
    --host "${HOST:-0.0.0.0}" \
    --port "${PORT:-8000}" \
    --reload \
    --log-level info
