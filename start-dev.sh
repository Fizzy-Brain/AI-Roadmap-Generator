#!/bin/bash

# Configuration
FRONTEND_DIR="/mnt/data/Projects/career-navigator-ai"
BACKEND_DIR="/mnt/data/Projects/CDC-Roadmap-Generator-Backend"

# Kill background processes on exit
trap "kill 0" EXIT

echo "🚀 Starting Career Navigator AI..."

# Start Backend
echo "📡 Starting Backend (FastAPI)..."
cd "$BACKEND_DIR" || exit
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi
python backend.py &

# Start Frontend
echo "💻 Starting Frontend (Vite)..."
cd "$FRONTEND_DIR" || exit
npm run dev &

# Keep script running
wait
