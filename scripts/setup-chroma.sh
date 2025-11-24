#!/bin/bash

# Chroma DB Setup Script
# This script helps you set up Chroma DB for the ServiceOps Knowledge Fabric Studio

set -e

echo "🚀 Setting up Chroma DB for ServiceOps Knowledge Fabric Studio"
echo ""

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo "✅ Docker is installed"
    
    # Check if Chroma container already exists
    if docker ps -a | grep -q chroma-db; then
        echo "⚠️  Chroma DB container already exists"
        read -p "Do you want to remove and recreate it? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🛑 Stopping and removing existing container..."
            docker stop chroma-db 2>/dev/null || true
            docker rm chroma-db 2>/dev/null || true
        else
            echo "Starting existing container..."
            docker start chroma-db
            echo "✅ Chroma DB is running at http://localhost:8000"
            exit 0
        fi
    fi
    
    echo "🐳 Starting Chroma DB with Docker..."
    docker run -d \
      --name chroma-db \
      -p 8000:8000 \
      -v chroma-data:/chroma/chroma \
      --restart unless-stopped \
      chromadb/chroma
    
    echo "⏳ Waiting for Chroma DB to start..."
    sleep 5
    
    # Verify it's running
    if curl -s http://localhost:8000/api/v1/heartbeat > /dev/null; then
        echo "✅ Chroma DB is running successfully!"
        echo "📍 URL: http://localhost:8000"
        echo ""
        echo "You can verify with:"
        echo "  curl http://localhost:8000/api/v1/heartbeat"
    else
        echo "❌ Chroma DB failed to start. Check logs with:"
        echo "  docker logs chroma-db"
        exit 1
    fi

elif command -v python3 &> /dev/null || command -v python &> /dev/null; then
    echo "✅ Python is installed"
    echo "📦 Installing Chroma DB..."
    
    if command -v pip3 &> /dev/null; then
        pip3 install chromadb
        PYTHON_CMD=python3
    else
        pip install chromadb
        PYTHON_CMD=python
    fi
    
    echo "🚀 Starting Chroma DB server..."
    echo "   (Press Ctrl+C to stop)"
    echo ""
    
    # Create data directory
    mkdir -p ./chroma-data
    
    # Start Chroma server
    chroma run --host localhost --port 8000 --path ./chroma-data
    
else
    echo "❌ Neither Docker nor Python is installed"
    echo ""
    echo "Please install one of the following:"
    echo "  1. Docker: https://docs.docker.com/get-docker/"
    echo "  2. Python: https://www.python.org/downloads/"
    exit 1
fi

