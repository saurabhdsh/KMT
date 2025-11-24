#!/usr/bin/env python3
"""
Start Chroma DB REST API Server
Fixed version that works with Chroma DB 1.3.5+
"""

import os
import sys
from pathlib import Path

# Activate venv if it exists
venv_python = Path(__file__).parent / "venv" / "bin" / "python"
if venv_python.exists():
    # Use venv python
    if sys.executable != str(venv_python):
        os.execv(str(venv_python), [str(venv_python)] + sys.argv)

try:
    import chromadb
    from chromadb.config import Settings
except ImportError:
    print("❌ Chroma DB not installed. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "chromadb"])
    import chromadb
    from chromadb.config import Settings

def main():
    host = os.getenv("CHROMA_HOST", "localhost")
    port = int(os.getenv("CHROMA_PORT", "8000"))
    data_dir = Path(os.getenv("CHROMA_DATA_DIR", "./chroma-data"))
    data_dir.mkdir(exist_ok=True)
    
    print("=" * 60)
    print("🚀 Starting Chroma DB REST API Server")
    print("=" * 60)
    print(f"📍 URL: http://{host}:{port}")
    print(f"📍 Data: {data_dir.absolute()}")
    print("")
    print("Press Ctrl+C to stop")
    print("=" * 60)
    print()
    
    try:
        # For Chroma DB 1.3+, the easiest way is to use the CLI via subprocess
        # or use PersistentClient for local (no server)
        
        # Option 1: Try to use chromadb's server directly
        import subprocess
        
        # Check if we can import the server module
        try:
            from chromadb.server.fastapi import create_app
            import uvicorn
            
            app = create_app()
            print(f"✅ Starting server on http://{host}:{port}")
            uvicorn.run(app, host=host, port=port, log_level="info")
            
        except ImportError:
            # Fallback: Use PersistentClient (no REST API, but works locally)
            print("⚠️  REST API server dependencies not fully available")
            print("💡 Using PersistentClient mode (local only, no REST API)")
            print()
            
            from chromadb import PersistentClient
            
            client = PersistentClient(path=str(data_dir.absolute()))
            print(f"✅ Chroma DB PersistentClient ready!")
            print(f"📍 Data: {data_dir.absolute()}")
            print()
            print("Use in your code:")
            print("  from chromadb import PersistentClient")
            print(f"  client = PersistentClient(path='{data_dir.absolute()}')")
            print()
            print("Press Ctrl+C to exit...")
            
            import time
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\n🛑 Stopped")
        
    except KeyboardInterrupt:
        print("\n\n🛑 Chroma DB stopped")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

