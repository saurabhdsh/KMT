#!/bin/bash

# Simple Chroma DB Server - Using PersistentClient (No server needed for local dev)

cd "$(dirname "$0")"

echo "🚀 Starting Chroma DB (Local Mode)"
echo ""

# Activate venv
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "❌ Virtual environment not found. Please run setup first."
    exit 1
fi

# Create data directory
mkdir -p ./chroma-data

echo "✅ Chroma DB is ready!"
echo ""
echo "📍 Data directory: $(pwd)/chroma-data"
echo ""
echo "💡 For local development, use PersistentClient (no server needed):"
echo ""
echo "   from chromadb import PersistentClient"
echo "   client = PersistentClient(path='./chroma-data')"
echo ""
echo "💡 For REST API server, use the Python script:"
echo "   python start-chroma-server.py"
echo ""

# Option: Start a simple test
python3 << 'EOF'
from chromadb import PersistentClient
import os

data_dir = "./chroma-data"
client = PersistentClient(path=data_dir)

# Test connection
print("✅ Chroma DB PersistentClient initialized successfully!")
print(f"📍 Data stored in: {os.path.abspath(data_dir)}")
print("")
print("You can now use this client in your backend code.")
print("Press Ctrl+C to exit this test.")
print("")

# Keep running
try:
    import time
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n👋 Exiting...")
EOF

