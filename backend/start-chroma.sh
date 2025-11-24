#!/bin/bash

# Simple script for Chroma DB local development

echo "🚀 Chroma DB Local Setup"
echo ""

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "✅ Using virtual environment"
    source venv/bin/activate
else
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "📦 Installing Chroma DB..."
    pip install chromadb
fi

# Check if chromadb is installed
if ! python -c "import chromadb" 2>/dev/null; then
    echo "📦 Installing Chroma DB..."
    pip install chromadb
fi

# Create data directory
mkdir -p ./chroma-data

echo ""
echo "✅ Chroma DB is ready for local development!"
echo ""
echo "📍 Data directory: $(pwd)/chroma-data"
echo ""
echo "💡 For local development, use PersistentClient (no server needed):"
echo ""
echo "   from chromadb import PersistentClient"
echo "   client = PersistentClient(path='./chroma-data')"
echo ""
echo "💡 Example usage in your backend:"
echo ""
echo "   import chromadb"
echo "   client = chromadb.PersistentClient(path='./chroma-data')"
echo "   collection = client.get_or_create_collection('my-fabric')"
echo "   collection.add(documents=[...], embeddings=[...], ids=[...])"
echo ""
echo "✅ Ready to use! No server needed for local development."
echo ""

