#!/usr/bin/env python3
"""
Simple Chroma DB Server Starter
Starts Chroma DB server using the Python API
"""

import sys
import os
from pathlib import Path

# Add venv to path if it exists
venv_path = Path(__file__).parent / "venv"
if venv_path.exists():
    venv_site_packages = venv_path / "lib" / "python3.13" / "site-packages"
    if not venv_site_packages.exists():
        # Try to find the actual Python version
        for py_dir in (venv_path / "lib").glob("python*"):
            venv_site_packages = py_dir / "site-packages"
            if venv_site_packages.exists():
                break
    if venv_site_packages.exists():
        sys.path.insert(0, str(venv_site_packages))

try:
    import chromadb
    from chromadb.config import Settings
    import uvicorn
except ImportError as e:
    print(f"❌ Error: {e}")
    print("\nPlease make sure Chroma DB is installed:")
    print("  source venv/bin/activate")
    print("  pip install chromadb")
    sys.exit(1)

def main():
    # Configuration
    host = os.getenv("CHROMA_HOST", "localhost")
    port = int(os.getenv("CHROMA_PORT", "8000"))
    data_dir = Path(os.getenv("CHROMA_DATA_DIR", "./chroma-data"))
    data_dir.mkdir(exist_ok=True)
    
    print("=" * 50)
    print("🚀 Starting Chroma DB Server")
    print("=" * 50)
    print(f"📍 Host: {host}")
    print(f"📍 Port: {port}")
    print(f"📍 Data: {data_dir.absolute()}")
    print(f"📍 URL: http://{host}:{port}")
    print("")
    print("Press Ctrl+C to stop")
    print("=" * 50)
    print()
    
    try:
        # Start Chroma server using uvicorn
        # Chroma DB 1.3+ uses FastAPI/uvicorn internally
        from chromadb.server.fastapi import FastAPI
        
        app = FastAPI()
        
        # Configure settings
        settings = Settings(
            chroma_api_impl="rest",
            chroma_server_host=host,
            chroma_server_http_port=port,
            persist_directory=str(data_dir.absolute()),
            anonymized_telemetry=False
        )
        
        # Start server
        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level="info"
        )
        
    except KeyboardInterrupt:
        print("\n\n🛑 Chroma DB server stopped")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nTrying alternative method...")
        
        # Alternative: Use chromadb's built-in server
        try:
            import subprocess
            cmd = [
                sys.executable,
                "-c",
                f"""
import chromadb
from chromadb.config import Settings
import uvicorn
from chromadb.server.fastapi import FastAPI

settings = Settings(
    chroma_api_impl="rest",
    chroma_server_host="{host}",
    chroma_server_http_port={port},
    persist_directory="{data_dir.absolute()}",
    anonymized_telemetry=False
)

app = FastAPI()
uvicorn.run(app, host="{host}", port={port})
"""
            ]
            subprocess.run(cmd)
        except Exception as e2:
            print(f"❌ Failed: {e2}")
            print("\nPlease check Chroma DB documentation or use Docker instead.")

if __name__ == "__main__":
    main()

