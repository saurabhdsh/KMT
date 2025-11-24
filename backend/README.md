# Backend Setup Guide

## Chroma DB Local Setup (No Docker)

### Quick Start

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start Chroma DB server:**
   ```bash
   python start-chroma.py
   ```

   Or manually:
   ```bash
   chroma run --host localhost --port 8000 --path ./chroma-data
   ```

### Manual Setup

1. **Install Chroma DB:**
   ```bash
   pip install chromadb
   ```

2. **Start the server:**
   ```bash
   chroma run --host localhost --port 8000
   ```

   With persistent storage:
   ```bash
   mkdir -p chroma-data
   chroma run --host localhost --port 8000 --path ./chroma-data
   ```

3. **Verify it's running:**
   ```bash
   curl http://localhost:8000/api/v1/heartbeat
   ```

### Environment Variables

Create a `.env` file in the backend directory:

```env
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_DATA_DIR=./chroma-data
```

### Using Chroma DB in Your Backend

#### Python Example

```python
import chromadb
from chromadb.config import Settings

# Connect to local Chroma DB
client = chromadb.Client(Settings(
    chroma_api_impl="rest",
    chroma_server_host="localhost",
    chroma_server_http_port=8000
))

# Or use persistent client (no server needed)
# client = chromadb.PersistentClient(path="./chroma-data")

# Create or get collection
collection = client.get_or_create_collection(
    name="knowledge-fabric-collection",
    metadata={"hnsw:space": "cosine"}
)

# Add documents with embeddings
collection.add(
    documents=["Your document text here..."],
    embeddings=[[0.1, 0.2, 0.3, ...]],  # Your embedding vectors
    ids=["doc-1"],
    metadatas=[{"source": "servicenow", "fabric_id": "fabric-123"}]
)

# Query similar documents
results = collection.query(
    query_embeddings=[[0.1, 0.2, 0.3, ...]],  # Query embedding
    n_results=5
)
```

### Troubleshooting

**Port already in use:**
```bash
# Find process using port 8000
lsof -i :8000

# Use different port
chroma run --host localhost --port 8001
```

**Chroma not found:**
```bash
# Make sure chromadb is installed
pip install chromadb

# Verify installation
python -c "import chromadb; print(chromadb.__version__)"
```

**Connection refused:**
- Make sure Chroma server is running
- Check host and port settings
- Verify firewall isn't blocking the port

### Next Steps

1. Start Chroma DB: `python start-chroma.py`
2. Update your backend to connect to `http://localhost:8000`
3. Implement collection creation during fabric build
4. Implement query logic for RAG during chat

