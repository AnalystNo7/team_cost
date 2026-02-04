#!/bin/bash

# Team Cost Calculator - Local Run Script
# Usage: ./scripts/run_local.sh

set -e

echo "=========================================="
echo "  Team Cost Calculator - Local Startup"
echo "=========================================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# Create data directory
mkdir -p data

# Install backend dependencies
echo ""
echo "[1/4] Installing backend dependencies..."
cd backend
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -q -r requirements.txt

# Install frontend dependencies
echo ""
echo "[2/4] Installing frontend dependencies..."
cd ../frontend
npm install --silent

# Start backend
echo ""
echo "[3/4] Starting backend server..."
cd ../backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start frontend
echo ""
echo "[4/4] Starting frontend dev server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "=========================================="
echo "  Application started!"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop all servers"

# Trap to clean up on exit
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# Wait for processes
wait
