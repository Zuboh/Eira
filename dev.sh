#!/usr/bin/env bash
# Avvia backend (FastAPI, :8000) + frontend (Vite, :5173) insieme.
# Uso: ./dev.sh
set -euo pipefail
cd "$(dirname "$0")"

for port in 8000 5173; do
  pid=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pid" ]; then
    echo "Porta $port occupata (pid $pid), la libero..."
    kill "$pid"
  fi
done

trap 'echo "Arresto..."; kill 0' EXIT INT TERM

(cd backend && uv run fastapi dev --port 8000) &
(cd frontend && npm run dev -- --port 5173) &

echo "Backend:  http://localhost:8000/docs"
echo "Frontend: http://localhost:5173"
wait
