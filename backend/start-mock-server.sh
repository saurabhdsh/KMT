#!/bin/bash

# Start Mock Backend Server for Development

cd "$(dirname "$0")"

echo "🚀 Starting Mock Backend Server"
echo ""

# Activate venv
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "❌ Virtual environment not found"
    exit 1
fi

# Check if Flask is installed
if ! python -c "import flask" 2>/dev/null; then
    echo "📦 Installing Flask..."
    pip install flask flask-cors
fi

# Start server
echo "✅ Mock server starting on http://localhost:4000"
echo "   This provides mock API endpoints for frontend development"
echo ""
echo "Press Ctrl+C to stop"
echo ""

python mock-server.py

