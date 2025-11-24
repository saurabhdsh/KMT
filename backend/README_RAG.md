# RAG Architecture Implementation Guide

This guide explains how to implement the complete RAG (Retrieval-Augmented Generation) architecture for all three Knowledge Fabric creation options.

## Overview

All three fabric creation methods (Document Upload, ServiceNow, SharePoint) follow the same RAG pipeline:

1. **Document Ingestion** - Extract text from sources
2. **Chunking** - Split into smaller pieces with overlap
3. **Vectorization** - Generate embeddings
4. **Storage** - Store in Chroma DB
5. **Knowledge Graph** - Extract entities and relationships
6. **Ready** - Fabric ready for RAG-powered chat

## Implementation Steps

### 1. Document Upload Fabric

**Backend Endpoint:** `POST /api/fabrics/:id/upload`

```python
from rag_pipeline_example import RAGPipeline

# Initialize pipeline
pipeline = RAGPipeline(chroma_path="./chroma-data")

# Build RAG architecture
result = pipeline.build_rag_architecture(
    fabric_id=fabric_id,
    collection_name=payload["chromaCollection"],
    documents=uploaded_documents,  # Parsed from PDF/DOCX
    source="upload",
    chunk_size=payload["chunkSize"],
    chunk_overlap=payload["chunkOverlap"],
    embedding_model=payload["embeddingModel"]
)
```

**Document Parsing:**
- PDF: Use `PyPDF2` or `pdfplumber`
- DOCX: Use `python-docx`
- Extract text, metadata, and structure

### 2. ServiceNow Fabric

**Backend Endpoint:** `POST /api/fabrics/:id/build`

```python
# Connect to ServiceNow
import pysnow

client = pysnow.Client(
    instance=payload["sources"]["serviceNow"]["instanceUrl"],
    user=username,
    password=password
)

# Fetch data from tables
tables = payload["sources"]["serviceNow"]["tables"]
documents = []

for table in tables:
    resource = client.resource(api_path=f'/table/{table}')
    response = resource.get()
    
    for record in response.all():
        # Extract text from ServiceNow record
        text = f"{record.get('short_description', '')} {record.get('description', '')}"
        documents.append({
            "content": text,
            "source": "servicenow",
            "metadata": {
                "table": table,
                "sys_id": record.get("sys_id"),
                "number": record.get("number"),
                "link": f"{instance_url}/nav_to.do?uri={table}.do?sys_id={record.get('sys_id')}"
            }
        })

# Build RAG architecture
pipeline.build_rag_architecture(
    fabric_id=fabric_id,
    collection_name=payload["chromaCollection"],
    documents=[doc["content"] for doc in documents],
    source="servicenow",
    chunk_size=payload["chunkSize"],
    chunk_overlap=payload["chunkOverlap"],
    embedding_model=payload["embeddingModel"]
)
```

### 3. SharePoint Fabric

**Backend Endpoint:** `POST /api/fabrics/:id/build`

```python
# Connect to SharePoint
from office365.sharepoint.client_context import ClientContext
from office365.runtime.auth.authentication_context import AuthenticationContext

site_url = payload["sources"]["sharePoint"]["siteUrl"]
library = payload["sources"]["sharePoint"]["library"]

# Authenticate and connect
ctx = ClientContext(site_url).with_credentials(credentials)

# Get documents from library
library_obj = ctx.web.lists.get_by_title(library)
items = library_obj.items.get().execute_query()

documents = []
for item in items:
    # Download and parse document
    file_content = item.file.read()
    
    # Parse based on file type
    if item.properties["File_x0020_Type"] == "pdf":
        text = parse_pdf(file_content)
    elif item.properties["File_x0020_Type"] == "docx":
        text = parse_docx(file_content)
    
    documents.append({
        "content": text,
        "source": "sharepoint",
        "metadata": {
            "file_name": item.properties["FileLeafRef"],
            "url": item.properties["FileRef"],
            "library": library
        }
    })

# Build RAG architecture
pipeline.build_rag_architecture(
    fabric_id=fabric_id,
    collection_name=payload["chromaCollection"],
    documents=[doc["content"] for doc in documents],
    source="sharepoint",
    chunk_size=payload["chunkSize"],
    chunk_overlap=payload["chunkOverlap"],
    embedding_model=payload["embeddingModel"]
)
```

## Chat RAG Integration

**Backend Endpoint:** `POST /api/chat`

```python
from rag_pipeline_example import RAGQuery

# Initialize query handler
rag_query = RAGQuery(chroma_path="./chroma-data")

# Get fabric's collection name
fabric = get_fabric(payload["fabricId"])
collection_name = fabric["chromaCollection"]

# Generate embedding for user message
user_embedding = generate_embedding(
    text=user_message,
    model=fabric["embeddingModel"]
)

# Query Chroma DB for relevant chunks
query_results = rag_query.query_fabric(
    collection_name=collection_name,
    query_text=user_message,
    query_embedding=user_embedding,
    n_results=5
)

# Build RAG context
rag_context = rag_query.build_rag_context(query_results)

# Generate LLM response with RAG context
llm_response = rag_query.generate_response(
    user_query=user_message,
    rag_context=rag_context,
    llm_model=payload["llmId"]
)

# Extract source articles
source_articles = rag_query.get_source_articles(query_results)

# Return response
return {
    "messages": [
        {
            "id": "msg-123",
            "role": "assistant",
            "content": llm_response,
            "sources": source_articles,
            "createdAt": datetime.now().isoformat()
        }
    ],
    "conversationId": conversation_id
}
```

## Required Python Packages

```bash
pip install chromadb
pip install openai  # For embeddings and LLM
pip install azure-openai  # For Azure OpenAI
pip install sentence-transformers  # Alternative embeddings
pip install PyPDF2 pdfplumber  # PDF parsing
pip install python-docx  # DOCX parsing
pip install pysnow  # ServiceNow API
pip install Office365-REST-Python-Client  # SharePoint API
pip install tiktoken  # Token counting for chunking
```

## Environment Variables

```env
# Chroma DB
CHROMA_DATA_DIR=./chroma-data

# OpenAI (for embeddings and LLM)
OPENAI_API_KEY=your-key-here

# Azure OpenAI (alternative)
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com
AZURE_OPENAI_API_KEY=your-key-here
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# ServiceNow
SERVICENOW_USERNAME=your-username
SERVICENOW_PASSWORD=your-password

# SharePoint
SHAREPOINT_CLIENT_ID=your-client-id
SHAREPOINT_CLIENT_SECRET=your-client-secret
SHAREPOINT_TENANT_ID=your-tenant-id
```

## Status Updates

During the build process, update fabric status:

1. `"Ingesting"` - Fetching documents from source
2. `"Chunking"` - Splitting documents into chunks
3. `"Vectorizing"` - Generating embeddings
4. `"GraphBuilding"` - Building knowledge graph
5. `"Ready"` - RAG architecture complete

Use WebSocket or polling to update frontend in real-time.

## Testing

Test the RAG pipeline:

```python
from rag_pipeline_example import RAGPipeline, RAGQuery

# Build a test fabric
pipeline = RAGPipeline()
result = pipeline.build_rag_architecture(
    fabric_id="test-123",
    collection_name="test-collection",
    documents=["Sample knowledge base text..."],
    source="upload"
)

# Query the fabric
rag_query = RAGQuery()
results = rag_query.query_fabric(
    collection_name="test-collection",
    query_text="What is the knowledge base about?",
    query_embedding=[0.1] * 1536,  # Use real embedding
    n_results=3
)

print(f"Found {len(results['ids'][0])} relevant chunks")
```

## Next Steps

1. Implement document parsers for PDF/DOCX
2. Integrate embedding generation (OpenAI/Azure)
3. Implement ServiceNow and SharePoint connectors
4. Build knowledge graph extraction
5. Integrate LLM for chat responses
6. Add real-time status updates

See `rag_pipeline_example.py` for complete implementation template.

