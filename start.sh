#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🏠  Home Office Tracker"
echo "──────────────────────────────────────"

# ── Backend ──────────────────────────────
echo "▶  Starting backend..."
cd "$SCRIPT_DIR/backend"

#if ! python3 -c "import uvicorn" 2>/dev/null; then
#  echo "   Installing Python dependencies..."
#  python3 -m pip install -r requirements.txt -q
#fi

python3 -m uvicorn main:app --reload --port 8000 --log-level warning &
BACKEND_PID=$!
echo "   Backend running  →  http://localhost:8000  (PID $BACKEND_PID)"

# ── Frontend ─────────────────────────────
echo "▶  Starting frontend..."
cd "$SCRIPT_DIR/frontend"

if [ ! -d "node_modules" ]; then
  echo "   Installing Node dependencies (first run, may take a moment)..."
  npm install
fi

npm run dev --silent &
FRONTEND_PID=$!
echo "   Frontend running →  http://localhost:5173  (PID $FRONTEND_PID)"

# ── Open browser ──────────────────────────
echo "⏳  Waiting for services to start..."
sleep 5

URL="http://localhost:5173"
if command -v xdg-open &>/dev/null; then
  xdg-open "$URL" &>/dev/null &
elif command -v open &>/dev/null; then
  open "$URL"
fi

echo "──────────────────────────────────────"
echo "✓  App is live at $URL"
echo "   Edit backend/work_hours.csv directly — changes appear within 3 s"
echo "   Press Ctrl+C to stop all services."
echo "──────────────────────────────────────"

cleanup() {
  echo ""
  echo "Stopping services..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  echo "Goodbye."
}
trap cleanup INT TERM EXIT
wait