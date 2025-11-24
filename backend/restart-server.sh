#!/bin/bash

# Restart Backend Server Script

cd "$(dirname "$0")"

echo "🛑 Stopping backend server..."

# Kill any process using port 4000
if lsof -ti:4000 > /dev/null 2>&1; then
    echo "   Killing process on port 4000..."
    lsof -ti:4000 | xargs kill -9 2>/dev/null
fi

# Kill any running backend processes
pkill -9 -f "python.*app.py" 2>/dev/null
pkill -9 -f "flask" 2>/dev/null

# Wait a moment for processes to stop
sleep 2

echo "✅ Server stopped"
echo ""
echo "🚀 Starting backend server..."
echo ""

# Activate venv and start server
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "❌ Virtual environment not found"
    echo "   Run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your API keys"
    echo ""
fi

# Start server
python app.py

