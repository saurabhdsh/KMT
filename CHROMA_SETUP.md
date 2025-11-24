# Chroma DB Setup Guide

This guide will help you set up Chroma DB for the ServiceOps Knowledge Fabric Studio backend.

## Quick Start (Recommended)

### Option 1: Docker (Easiest - Recommended)

```bash
# Pull and run Chroma DB in a container
docker run -d \
  --name chroma-db \
  -p 8000:8000 \
  -v chroma-data:/chroma/chroma \
  chromadb/chroma

# Verify it's running
curl http://localhost:8000/api/v1/heartbeat
```

**That's it!** Chroma DB is now running on `http://localhost:8000`

### Option 2: Python (Local Development)

```bash
# Install Chroma DB
pip install chromadb

# Run Chroma server
chroma run --host localhost --port 8000
```

### Option 3: Python with Persistent Storage

```bash
# Install Chroma DB
pip install chromadb

# Create a directory for data
mkdir -p ./chroma-data

# Run with persistent storage
chroma run --host localhost --port 8000 --path ./chroma-data
```

## Backend Integration

### Python Backend Example

```python
import chromadb
from chromadb.config import Settings

# Connect to Chroma DB
client = chromadb.Client(Settings(
    chroma_api_impl="rest",
    chroma_server_host="localhost",
    chroma_server_http_port=8000
))

# Or for local file-based (no server needed)
# client = chromadb.PersistentClient(path="./chroma-data")

# Create or get a collection
collection = client.get_or_create_collection(
    name="knowledge-fabric-collection",
    metadata={"hnsw:space": "cosine"}  # Use cosine similarity for embeddings
)

# Add documents with embeddings
collection.add(
    documents=["Document text here..."],
    embeddings=[[0.1, 0.2, 0.3, ...]],  # Your embedding vectors
    ids=["doc-1"],
    metadatas=[{"source": "servicenow", "table": "incident"}]
)

# Query similar documents
results = collection.query(
    query_embeddings=[[0.1, 0.2, 0.3, ...]],  # Query embedding
    n_results=5  # Top 5 similar documents
)
```

### Node.js/TypeScript Backend Example

```typescript
import { ChromaClient } from 'chromadb';

// Connect to Chroma DB
const client = new ChromaClient({
  path: "http://localhost:8000"
});

// Create or get a collection
const collection = await client.getOrCreateCollection({
  name: "knowledge-fabric-collection",
  metadata: { "hnsw:space": "cosine" }
});

// Add documents
await collection.add({
  ids: ["doc-1"],
  documents: ["Document text here..."],
  embeddings: [[0.1, 0.2, 0.3, ...]],
  metadatas: [{ source: "servicenow", table: "incident" }]
});

// Query similar documents
const results = await collection.query({
  queryEmbeddings: [[0.1, 0.2, 0.3, ...]],
  nResults: 5
});
```

## Environment Variables

Add to your backend `.env` file:

```env
# Chroma DB Configuration
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_URL=http://localhost:8000

# Or for Chroma Cloud
# CHROMA_URL=https://your-instance.chroma.cloud
# CHROMA_API_KEY=your-api-key
```

## Docker Compose (Production Ready)

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  chroma:
    image: chromadb/chroma:latest
    container_name: chroma-db
    ports:
      - "8000:8000"
    volumes:
      - chroma-data:/chroma/chroma
    environment:
      - IS_PERSISTENT=TRUE
      - ANONYMIZED_TELEMETRY=FALSE
    restart: unless-stopped

volumes:
  chroma-data:
```

Run with:
```bash
docker-compose up -d
```

## Verify Installation

```bash
# Check if Chroma is running
curl http://localhost:8000/api/v1/heartbeat

# Expected response: {"nanosecond heartbeat": <timestamp>}
```

## For Your Backend API

Your backend should:

1. **During Fabric Build:**
   - Create a Chroma collection for each fabric
   - Chunk documents
   - Generate embeddings
   - Store in Chroma: `collection.add(documents, embeddings, ids, metadatas)`

2. **During Chat (RAG):**
   - Generate embedding for user query
   - Query Chroma: `collection.query(query_embeddings, n_results=5)`
   - Retrieve relevant chunks
   - Build context and call LLM

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process or use different port
chroma run --host localhost --port 8001
```

### Docker Issues
```bash
# Check if container is running
docker ps | grep chroma

# View logs
docker logs chroma-db

# Restart container
docker restart chroma-db
```

### Connection Issues
- Ensure Chroma is running: `curl http://localhost:8000/api/v1/heartbeat`
- Check firewall settings
- Verify host and port in your backend config

## Next Steps

1. Start Chroma DB using one of the methods above
2. Update your backend to connect to Chroma
3. Implement collection creation during fabric build
4. Implement query logic for RAG during chat

## Resources

- [Chroma DB Documentation](https://docs.trychroma.com/)
- [Chroma Python Client](https://github.com/chroma-core/chroma)
- [Chroma Docker Image](https://hub.docker.com/r/chromadb/chroma)

