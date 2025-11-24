#!/bin/bash

# Quick script to check if Chroma DB is running

echo "🔍 Checking Chroma DB status..."

if curl -s http://localhost:8000/api/v1/heartbeat > /dev/null 2>&1; then
    echo "✅ Chroma DB is running at http://localhost:8000"
    echo ""
    echo "Heartbeat response:"
    curl -s http://localhost:8000/api/v1/heartbeat | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/api/v1/heartbeat
    exit 0
else
    echo "❌ Chroma DB is not running"
    echo ""
    echo "To start Chroma DB:"
    echo "  Docker: docker run -d --name chroma-db -p 8000:8000 chromadb/chroma"
    echo "  Python: chroma run --host localhost --port 8000"
    echo "  Or use: ./scripts/setup-chroma.sh"
    exit 1
fi

