#!/bin/bash

# Start Real Backend Server

cd "$(dirname "$0")"

echo "🚀 Starting ServiceOps Knowledge Fabric Studio Backend"
echo ""

# Activate venv
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your API keys and credentials"
    echo ""
fi

# Check if Chroma DB data directory exists
mkdir -p chroma-data
mkdir -p data

echo "✅ Starting backend server..."
echo "📍 Server will run on http://localhost:4000"
echo "📍 Chroma DB data: $(pwd)/chroma-data"
echo ""
echo "Press Ctrl+C to stop"
echo ""

python app.py

