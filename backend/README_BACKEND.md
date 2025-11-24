# Backend Implementation Guide

## Real RAG Pipeline Backend

This is a **production-ready** backend implementation with real RAG pipeline using Chroma DB.

## Quick Start

### 1. Install Dependencies

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your API keys:
- OpenAI API key (for embeddings and LLM)
- OR Azure OpenAI credentials
- ServiceNow credentials (if using ServiceNow)
- SharePoint credentials (if using SharePoint)

### 3. Start the Server

```bash
./start-server.sh
```

Or manually:
```bash
source venv/bin/activate
python app.py
```

Server will run on `http://localhost:4000`

## Features

### ✅ Real RAG Pipeline

1. **Document Ingestion**
   - PDF parsing (PyPDF2/pdfplumber)
   - DOCX parsing (python-docx)
   - ServiceNow data fetching (pysnow)
   - SharePoint document fetching (Office365-REST-Python-Client)

2. **Chunking**
   - Configurable chunk size and overlap
   - Token-aware chunking with tiktoken

3. **Vectorization**
   - Azure OpenAI embeddings
   - OpenAI embeddings
   - HuggingFace embeddings (fallback)

4. **Storage**
   - Chroma DB integration
   - Persistent storage in `./chroma-data`

5. **Knowledge Graph**
   - Entity extraction
   - Relationship mapping

6. **RAG-Powered Chat**
   - Query Chroma DB for relevant chunks
   - Build context from retrieved knowledge
   - Generate LLM responses with citations

## API Endpoints

All endpoints are implemented with real functionality:

- `POST /api/fabrics` - Create fabric
- `POST /api/fabrics/:id/upload` - Upload documents (real file storage)
- `POST /api/fabrics/:id/build` - Build RAG architecture (real pipeline)
- `GET /api/fabrics` - Get all fabrics
- `POST /api/chat` - Chat with RAG (real LLM integration)
- `POST /api/connections/servicenow/test` - Test ServiceNow connection
- `POST /api/connections/sharepoint/test` - Test SharePoint connection

## Data Storage

- **Fabrics**: Stored in `./data/fabrics.json`
- **Uploaded Files**: Stored in `./data/uploads/{fabric_id}/`
- **Chroma DB**: Vector storage in `./chroma-data/`
- **Feedback**: Stored in `./data/feedback.json`

## Required Environment Variables

### For Embeddings & LLM (Choose One)

**Option 1: OpenAI**
```env
OPENAI_API_KEY=sk-...
```

**Option 2: Azure OpenAI**
```env
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

### For ServiceNow (Optional)
```env
SERVICENOW_USERNAME=your-username
SERVICENOW_PASSWORD=your-password
```

### For SharePoint (Optional)
```env
SHAREPOINT_CLIENT_ID=your-client-id
SHAREPOINT_CLIENT_SECRET=your-client-secret
SHAREPOINT_TENANT_ID=your-tenant-id
```

## Testing

### Test Health Endpoint
```bash
curl http://localhost:4000/api/health
```

### Test Fabric Creation
```bash
curl -X POST http://localhost:4000/api/fabrics \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Fabric",
    "description": "Test",
    "domain": "Incident Management",
    "sources": {},
    "chunkSize": 512,
    "chunkOverlap": 64,
    "embeddingModel": "azure-openai-embedding-1",
    "chromaCollection": "test-collection"
  }'
```

## Production Deployment

For production:

1. Replace in-memory storage with real database (PostgreSQL, MongoDB, etc.)
2. Add authentication/authorization
3. Use environment-specific configuration
4. Add logging and monitoring
5. Set up proper error handling
6. Use production WSGI server (gunicorn, uvicorn, etc.)

```bash
# Example with gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:4000 app:app
```

## Troubleshooting

### Chroma DB Issues
- Ensure Chroma DB data directory exists: `mkdir -p chroma-data`
- Check permissions on `chroma-data` directory

### Import Errors
- Install all dependencies: `pip install -r requirements.txt`
- Activate virtual environment: `source venv/bin/activate`

### API Key Issues
- Check `.env` file has correct API keys
- Verify API keys are valid and have proper permissions

### Document Parsing Issues
- Install document parsers: `pip install PyPDF2 pdfplumber python-docx`
- Check file formats are supported

## Next Steps

1. Configure your API keys in `.env`
2. Start the server: `./start-server.sh`
3. Test with frontend: The React app should now work with real backend
4. Create fabrics and test RAG pipeline
5. Deploy to production when ready

