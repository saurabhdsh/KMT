#!/usr/bin/env python3
"""
Chroma DB Local Server Starter
This script starts Chroma DB server locally for backend development.
"""

import subprocess
import sys
import os
from pathlib import Path

def check_chroma_installed():
    """Check if chromadb is installed"""
    try:
        import chromadb
        return True
    except ImportError:
        return False

def install_chroma():
    """Install chromadb if not installed"""
    print("📦 Installing Chroma DB...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "chromadb"])
        print("✅ Chroma DB installed successfully!")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install Chroma DB")
        return False

def start_chroma_server(data_dir="./chroma-data", host="localhost", port=8000):
    """Start Chroma DB server"""
    data_path = Path(data_dir)
    data_path.mkdir(exist_ok=True)
    
    print(f"🚀 Starting Chroma DB server...")
    print(f"   Host: {host}")
    print(f"   Port: {port}")
    print(f"   Data directory: {data_path.absolute()}")
    print(f"   URL: http://{host}:{port}")
    print("")
    print("Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        # Import and run Chroma server
        from chromadb import Server
        from chromadb.config import Settings
        
        settings = Settings(
            chroma_api_impl="rest",
            chroma_server_host=host,
            chroma_server_http_port=port,
            persist_directory=str(data_path.absolute()),
            anonymized_telemetry=False
        )
        
        server = Server(settings)
        server.start()
        
    except KeyboardInterrupt:
        print("\n\n🛑 Chroma DB server stopped")
    except Exception as e:
        print(f"\n❌ Error starting Chroma DB: {e}")
        print("\nTrying alternative method...")
        
        # Alternative: Use chroma CLI
        try:
            cmd = [
                sys.executable, "-m", "chromadb.cli", "run",
                "--host", host,
                "--port", str(port),
                "--path", str(data_path.absolute())
            ]
            subprocess.run(cmd)
        except Exception as e2:
            print(f"❌ Failed to start Chroma DB: {e2}")
            print("\nPlease install Chroma DB manually:")
            print("  pip install chromadb")
            print("  chroma run --host localhost --port 8000")

def main():
    print("=" * 50)
    print("Chroma DB Local Server")
    print("=" * 50)
    print()
    
    # Check if chromadb is installed
    if not check_chroma_installed():
        print("⚠️  Chroma DB is not installed")
        response = input("Would you like to install it now? (y/n): ").strip().lower()
        if response == 'y':
            if not install_chroma():
                sys.exit(1)
        else:
            print("Please install Chroma DB first:")
            print("  pip install chromadb")
            sys.exit(1)
    
    # Get configuration from environment or use defaults
    host = os.getenv("CHROMA_HOST", "localhost")
    port = int(os.getenv("CHROMA_PORT", "8000"))
    data_dir = os.getenv("CHROMA_DATA_DIR", "./chroma-data")
    
    # Start server
    start_chroma_server(data_dir, host, port)

if __name__ == "__main__":
    main()

