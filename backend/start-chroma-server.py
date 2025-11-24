#!/usr/bin/env python3
"""
Start Chroma DB Server
Simple script to start Chroma DB REST API server
"""

import os
import sys
from pathlib import Path

# Try to activate venv if it exists
venv_activate = Path(__file__).parent / "venv" / "bin" / "activate_this.py"
if venv_activate.exists():
    exec(open(venv_activate).read(), {'__file__': str(venv_activate)})

try:
    import chromadb
    from chromadb.config import Settings
    import uvicorn
    from fastapi import FastAPI
except ImportError as e:
    print(f"❌ Missing dependency: {e}")
    print("\nInstalling required packages...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "fastapi", "uvicorn"])
    import chromadb
    from chromadb.config import Settings
    import uvicorn
    from fastapi import FastAPI

def main():
    host = os.getenv("CHROMA_HOST", "localhost")
    port = int(os.getenv("CHROMA_PORT", "8000"))
    data_dir = Path(os.getenv("CHROMA_DATA_DIR", "./chroma-data"))
    data_dir.mkdir(exist_ok=True)
    
    print("=" * 60)
    print("🚀 Starting Chroma DB Server")
    print("=" * 60)
    print(f"📍 URL: http://{host}:{port}")
    print(f"📍 Data: {data_dir.absolute()}")
    print("")
    print("Press Ctrl+C to stop the server")
    print("=" * 60)
    print()
    
    try:
        # For Chroma DB 1.3+, we can use PersistentClient for local
        # But for REST API, we need to use the HTTP server
        # The simplest way is to use chromadb's built-in server via uvicorn
        
        # Create a simple FastAPI app that Chroma can use
        app = FastAPI(title="Chroma DB Server")
        
        # Initialize Chroma with REST API settings
        settings = Settings(
            chroma_api_impl="rest",
            chroma_server_host=host,
            chroma_server_http_port=port,
            persist_directory=str(data_dir.absolute()),
            anonymized_telemetry=False
        )
        
        # Start the server
        print(f"✅ Server starting on http://{host}:{port}")
        print()
        
        uvicorn.run(
            "chromadb.server.fastapi:app",
            host=host,
            port=port,
            log_level="info"
        )
        
    except KeyboardInterrupt:
        print("\n\n🛑 Chroma DB server stopped")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        print("\n💡 Alternative: Use PersistentClient (no server needed)")
        print("   This works for local development without a server:")
        print("   from chromadb import PersistentClient")
        print("   client = PersistentClient(path='./chroma-data')")

if __name__ == "__main__":
    main()

