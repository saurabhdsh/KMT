# Quick Start Chroma DB

## ✅ Fixed! Use This Method:

### Option 1: Local Development (No Server - Recommended)

For local backend development, you don't need a REST API server. Use PersistentClient:

```python
from chromadb import PersistentClient

# Connect to local Chroma DB
client = PersistentClient(path="./chroma-data")

# Create collection
collection = client.get_or_create_collection("my-collection")

# Add documents
collection.add(
    documents=["Document text..."],
    embeddings=[[0.1, 0.2, ...]],
    ids=["doc-1"]
)

# Query
results = collection.query(
    query_embeddings=[[0.1, 0.2, ...]],
    n_results=5
)
```

**No server needed!** Data is stored in `./chroma-data` directory.

### Option 2: REST API Server

If you need a REST API server, run:

```bash
cd backend
source venv/bin/activate
python start-chroma-server-fixed.py
```

This will start a server on `http://localhost:8000`

### Option 3: Simple Test

```bash
cd backend
./start-chroma-simple.sh
```

---

**For most local development, Option 1 (PersistentClient) is the easiest!**
