# ServiceOps Knowledge Fabric Studio - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [User Guide](#user-guide)
   - [Getting Started](#getting-started)
   - [Installation](#installation)
   - [Configuration](#configuration)
   - [Using the Application](#using-the-application)
   - [Creating Knowledge Fabrics](#creating-knowledge-fabrics)
   - [Chat with Your Fabrics](#chat-with-your-fabrics)
3. [Developer Guide](#developer-guide)
   - [Architecture Overview](#architecture-overview)
   - [Frontend Development](#frontend-development)
   - [Backend Development](#backend-development)
   - [Extending the Application](#extending-the-application)
   - [API Reference](#api-reference)
   - [Testing](#testing)
4. [Troubleshooting](#troubleshooting)
5. [Deployment](#deployment)

---

## Overview

**ServiceOps Knowledge Fabric Studio** is a modern, production-ready application for building and managing knowledge fabrics for Service Operations. It combines:

- **Knowledge Fabric Builder**: Create and manage knowledge fabrics from multiple sources (ServiceNow, SharePoint, file uploads)
- **RAG-Powered Chat**: Interactive chat interface with Retrieval-Augmented Generation over Chroma DB
- **Modern UI**: Dark, SaaS-style dashboard with smooth animations

### Key Technologies

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Python Flask + Chroma DB
- **AI/ML**: OpenAI/Azure OpenAI embeddings, LLM integration
- **Vector Database**: Chroma DB (free, open-source)

---

## User Guide

### Getting Started

This guide will help you set up and start using the ServiceOps Knowledge Fabric Studio.

### Installation

#### Prerequisites

- **Node.js** 16+ and npm (for frontend)
- **Python** 3.8+ (for backend)
- **Docker** (optional, for Chroma DB)

#### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd KMT
```

#### Step 2: Install Frontend Dependencies

```bash
npm install
```

#### Step 3: Install Backend Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Step 4: Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# OpenAI Configuration (Choose one)
OPENAI_API_KEY=sk-your-openai-api-key-here

# OR Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# ServiceNow Configuration (Optional)
SERVICENOW_USERNAME=your-servicenow-username
SERVICENOW_PASSWORD=your-servicenow-password

# SharePoint Configuration (Optional)
SHAREPOINT_CLIENT_ID=your-client-id
SHAREPOINT_CLIENT_SECRET=your-client-secret
SHAREPOINT_TENANT_ID=your-tenant-id
```

#### Step 5: Start Chroma DB

**Option A: Using Docker (Recommended)**

```bash
docker run -d --name chroma-db -p 8000:8000 -v chroma-data:/chroma/chroma chromadb/chroma
```

**Option B: Using Python (Local Development)**

```bash
cd backend
source venv/bin/activate
pip install chromadb
chroma run --host localhost --port 8000
```

**Option C: Using Docker Compose**

```bash
docker-compose -f docker-compose.chroma.yml up -d
```

Verify Chroma DB is running:

```bash
curl http://localhost:8000/api/v1/heartbeat
```

**Note**: If you're using Chroma DB in embedded mode (no server), the `backend/chroma-data/` directory will be automatically created when you first run the backend server.

#### Step 6: Start the Backend Server

```bash
cd backend
source venv/bin/activate
./start-server.sh
```

Or manually:

```bash
python app.py
```

The backend will run on `http://localhost:4000`

**Automatic Directory Creation**: When you start the backend server for the first time, it will automatically create:
- `backend/data/` - For storing fabric metadata, uploads, and feedback
- `backend/chroma-data/` - For Chroma DB vector storage (if using embedded mode)

These directories are in `.gitignore` and won't be in the repository, but will be created automatically on first run.

#### Step 7: Start the Frontend

In a new terminal:

```bash
npm start
```

The frontend will open at `http://localhost:3000`

### Configuration

#### Frontend Configuration

Create a `.env` file in the project root (optional):

```env
REACT_APP_API_BASE_URL=http://localhost:4000
```

If not set, defaults to `http://localhost:4000`.

#### Backend Configuration

All backend configuration is done via the `.env` file in the `backend/` directory.

**Required:**
- At least one embedding/LLM provider (OpenAI or Azure OpenAI)

**Optional:**
- ServiceNow credentials (if using ServiceNow fabrics)
- SharePoint credentials (if using SharePoint fabrics)

### Using the Application

#### Creating Knowledge Fabrics

1. **Navigate to Fabrics Page**
   - Click "Fabrics" in the sidebar
   - Click "Create New Fabric"

2. **Choose Source Type**
   - **ServiceNow**: Connect to ServiceNow instance
   - **SharePoint**: Connect to SharePoint site
   - **Document Upload**: Upload files directly

3. **Configure Fabric**
   - **Name & Description**: Give your fabric a name and description
   - **Domain**: Select domain (Incident Management, Problem Management, etc.)
   - **Chunking Settings**: Configure chunk size (default: 512) and overlap (default: 64)
   - **Embedding Model**: Choose embedding model
     - `text-embedding-3-large` (3072 dimensions) - Recommended
     - `text-embedding-3-small` (1536 dimensions) - Faster, cheaper
     - `azure-openai-embedding-1` (1536 dimensions) - Azure OpenAI
   - **Chroma Collection**: Name for the vector database collection

4. **For ServiceNow Fabrics**
   - **Instance URL**: Your ServiceNow instance (e.g., `dev12345.service-now.com`)
   - **Tables**: Select tables to ingest (e.g., `incident`, `kb_knowledge`)
   - **Test Connection**: Verify credentials before creating

5. **For SharePoint Fabrics**
   - **Site URL**: SharePoint site URL
   - **Library**: Document library name
   - **Test Connection**: Verify credentials

6. **For Document Upload Fabrics**
   - **Upload Files**: Select files to upload (PDF, DOCX, TXT)
   - Files are stored in `backend/data/uploads/{fabric_id}/`

7. **Create & Build**
   - Click "Create Fabric"
   - The system will automatically start building the RAG architecture
   - Monitor progress in the fabric list

#### Fabric Build Process

The build process follows these stages:

1. **Draft** → Fabric created, not started
2. **Ingesting** → Pulling data from sources
3. **Chunking** → Breaking documents into chunks
4. **Vectorizing** → Creating embeddings (this can take time)
5. **GraphBuilding** → Building knowledge graph
6. **Ready** → Fabric ready for chat
7. **Error** → Build failed (check logs)

**Build Time Estimates:**
- ServiceNow: 2-5 minutes (depending on data volume)
- SharePoint: 1-3 minutes
- Document Upload: 1-3 minutes

#### Chat with Your Fabrics

1. **Navigate to Chat Page**
   - Click "Chat" in the sidebar
   - Or click "Go to Chat" from a fabric card

2. **Select Fabric & LLM**
   - **Fabric**: Choose a fabric with "Ready" status
   - **LLM**: Choose LLM model (e.g., `gpt-4`, `gpt-3.5-turbo`)

3. **Start Chatting**
   - Type your question
   - The system will:
     - Generate embedding for your question
     - Query Chroma DB for relevant chunks
     - Build RAG context
     - Generate LLM response with citations

4. **View Sources**
   - Click on source chips below responses
   - View source details in the side panel
   - Click "Open Source" to view original document

5. **Provide Feedback**
   - Use thumbs up/down buttons
   - Add comments to help improve responses

---

## Developer Guide

### Architecture Overview

```
┌─────────────────┐
│   React Frontend │
│   (Port 3000)   │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│  Flask Backend  │
│   (Port 4000)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│Chroma │ │ OpenAI│
│  DB   │ │  API  │
└───────┘ └───────┘
```

#### Frontend Architecture

```
src/
├── api/                    # API client layer
│   ├── axiosClient.ts      # Axios configuration
│   ├── fabricsApi.ts        # Fabric CRUD operations
│   ├── chatApi.ts          # Chat operations
│   └── feedbackApi.ts      # Feedback submission
├── components/             # React components
│   ├── layout/             # Layout components
│   ├── common/             # Reusable UI components
│   └── toast/              # Toast notifications
├── context/                # React Context providers
│   ├── FabricContext.tsx   # Fabric state management
│   └── ChatContext.tsx     # Chat state management
├── pages/                  # Page components
│   ├── Fabrics/            # Fabric management pages
│   └── Chat/               # Chat interface
└── types/                  # TypeScript definitions
```

#### Backend Architecture

```
backend/
├── app.py                  # Flask application & routes
├── rag_pipeline.py         # RAG pipeline implementation
├── embedding_service.py    # Embedding generation
├── llm_service.py          # LLM response generation
├── servicenow_connector.py # ServiceNow integration
├── sharepoint_connector.py # SharePoint integration
├── document_parser.py      # Document parsing (PDF, DOCX)
└── data/                   # Data storage
    ├── fabrics.json        # Fabric metadata
    ├── uploads/            # Uploaded files
    └── feedback.json       # User feedback
```

### Frontend Development

#### Project Structure

The frontend uses React with TypeScript and follows a component-based architecture.

#### Key Components

**1. Fabric Management (`src/pages/Fabrics/`)**

- `FabricsPage.tsx`: Main fabrics page
- `FabricList.tsx`: List of all fabrics
- `ServiceNowWizard.tsx`: ServiceNow fabric creation wizard
- `SharePointWizard.tsx`: SharePoint fabric creation wizard
- `DocumentUploadWizard.tsx`: Document upload wizard
- `FabricDetailDrawer.tsx`: Fabric details panel

**2. Chat Interface (`src/pages/Chat/`)**

- `ChatPage.tsx`: Main chat interface
- `MessageBubble.tsx`: Individual message component
- `SourcePanel.tsx`: Source articles panel

**3. State Management (`src/context/`)**

- `FabricContext.tsx`: Manages fabric state, polling, and updates
- `ChatContext.tsx`: Manages chat state and conversations

#### Adding New Features

**1. Add a New Page**

```typescript
// src/pages/NewPage/NewPage.tsx
import React from 'react';

export const NewPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-100">New Page</h1>
    </div>
  );
};
```

Add route in `src/App.tsx`:

```typescript
import { NewPage } from './pages/NewPage/NewPage';

// In routes
<Route path="/new-page" element={<NewPage />} />
```

**2. Add a New API Endpoint**

```typescript
// src/api/newApi.ts
import axiosClient from './axiosClient';

export const getNewData = async (): Promise<NewData> => {
  const res = await axiosClient.get<NewData>('/api/new-endpoint');
  return res.data;
};
```

**3. Add a New Component**

```typescript
// src/components/common/NewComponent.tsx
import React from 'react';

interface NewComponentProps {
  title: string;
  onAction: () => void;
}

export const NewComponent: React.FC<NewComponentProps> = ({ title, onAction }) => {
  return (
    <div className="card p-4">
      <h3 className="font-semibold text-slate-100">{title}</h3>
      <button onClick={onAction} className="btn-primary mt-4">
        Action
      </button>
    </div>
  );
};
```

#### Styling Guidelines

The app uses Tailwind CSS with a custom dark theme:

- **Backgrounds**: `slate-950` (main), `slate-900` (cards)
- **Text**: `slate-100` (primary), `slate-400` (muted)
- **Brand Color**: `brand-600` (blue)

**Custom Classes** (defined in `src/index.css`):

- `.card`: Card container with dark background
- `.btn-primary`: Primary action button
- `.btn-secondary`: Secondary button

**Example:**

```typescript
<div className="card p-4">
  <h3 className="font-semibold text-slate-100">Title</h3>
  <p className="text-slate-400">Description</p>
  <button className="btn-primary mt-4">Action</button>
</div>
```

### Backend Development

#### Project Structure

The backend uses Flask with a modular structure.

#### Key Modules

**1. RAG Pipeline (`rag_pipeline.py`)**

The core RAG pipeline implementation:

```python
class RAGPipeline:
    def build_rag_architecture(self, fabric_id, collection_name, documents, ...):
        # 1. Create Chroma collection
        # 2. Ingest documents
        # 3. Chunk documents
        # 4. Generate embeddings
        # 5. Store in Chroma DB
        # 6. Build knowledge graph
```

**2. Embedding Service (`embedding_service.py`)**

Handles embedding generation with fallback:

```python
def generate_embedding(text: str, model: str) -> List[float]:
    # Tries: Azure OpenAI → OpenAI → HuggingFace
```

**3. LLM Service (`llm_service.py`)**

Generates LLM responses with RAG context:

```python
def generate_llm_response(user_query, rag_context, llm_model, ...):
    # Builds prompt with RAG context
    # Calls OpenAI/Azure OpenAI
    # Returns response
```

#### Adding New Features

**1. Add a New API Endpoint**

```python
# In app.py
@app.route('/api/new-endpoint', methods=['POST'])
def new_endpoint():
    try:
        data = request.json
        # Process data
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

**2. Add a New Data Source**

Create a new connector file:

```python
# backend/new_source_connector.py
def fetch_new_source_data(config: dict) -> List[Dict]:
    """Fetch data from new source"""
    documents = []
    # Fetch and process data
    for item in data:
        documents.append({
            "content": item.text,
            "source": "new_source",
            "metadata": {
                "id": item.id,
                "title": item.title,
                "link": item.url
            },
            "id": f"new_source-{item.id}"
        })
    return documents
```

Integrate in `app.py`:

```python
# In build_rag_async function
elif fabric["sources"].get("newSource") and fabric["sources"]["newSource"].get("enabled"):
    from new_source_connector import fetch_new_source_data
    documents = fetch_new_source_data(fabric["sources"]["newSource"])
```

**3. Add a New Embedding Model**

Update `embedding_service.py`:

```python
def generate_new_model_embedding(text: str, model: str) -> List[float]:
    """Generate embedding using new model"""
    # Implementation
    return embedding

def generate_embedding(text: str, model: str = "text-embedding-3-large") -> List[float]:
    if "new-model" in model.lower():
        return generate_new_model_embedding(text, model)
    # ... existing logic
```

Update `rag_pipeline.py`:

```python
def get_embedding_dimension(self, model: str) -> int:
    if "new-model" in model.lower():
        return 2048  # Your model's dimension
    # ... existing logic
```

#### Data Storage

**Current Implementation:**
- **Fabrics**: JSON file (`data/fabrics.json`)
- **Uploads**: File system (`data/uploads/{fabric_id}/`)
- **Chroma DB**: Vector storage (`chroma-data/`)
- **Feedback**: JSON file (`data/feedback.json`)

**For Production:**
Replace with proper databases:
- PostgreSQL/MongoDB for metadata
- S3/Blob Storage for files
- Chroma DB server for vectors

### Extending the Application

#### Adding a New Source Type

1. **Create Connector** (`backend/new_source_connector.py`)

```python
def fetch_new_source_data(config: dict) -> List[Dict]:
    # Fetch data
    # Return list of documents with content, metadata, id
    pass

def test_new_source_connection(config: dict) -> Dict:
    # Test connection
    # Return {"success": bool, "message": str}
    pass
```

2. **Add API Endpoint** (`backend/app.py`)

```python
@app.route('/api/connections/newsource/test', methods=['POST'])
def test_new_source():
    # Test connection
    pass
```

3. **Add Frontend Wizard** (`src/pages/Fabrics/NewSourceWizard.tsx`)

```typescript
export const NewSourceWizard: React.FC<WizardProps> = ({ isOpen, onClose }) => {
  // Similar structure to ServiceNowWizard
  // Form fields for configuration
  // Test connection button
  // Create fabric button
};
```

4. **Update Fabric Type** (`src/types/fabric.ts`)

```typescript
export interface FabricSources {
  serviceNow?: {...};
  sharePoint?: {...};
  uploads?: {...};
  newSource?: {
    enabled: boolean;
    // Configuration fields
  };
}
```

5. **Add Route** (`src/App.tsx`)

```typescript
import { NewSourceWizard } from './pages/Fabrics/NewSourceWizard';
// Add to routes
```

#### Adding a New LLM Provider

1. **Update LLM Service** (`backend/llm_service.py`)

```python
def generate_new_llm_response(system_prompt, user_prompt, model, conversation_history):
    # Implementation
    pass

def generate_llm_response(...):
    if "new-llm" in llm_model.lower():
        return generate_new_llm_response(...)
    # ... existing logic
```

2. **Update Frontend** (Add to LLM selector)

```typescript
// In ChatPage.tsx or settings
<select>
  <option>gpt-4</option>
  <option>gpt-3.5-turbo</option>
  <option>new-llm-model</option>
</select>
```

### API Reference

#### Fabric Endpoints

**GET `/api/fabrics`**
- Get all fabrics
- Returns: `{ [fabricId]: Fabric }`

**GET `/api/fabrics/:id`**
- Get fabric by ID
- Returns: `Fabric`

**POST `/api/fabrics`**
- Create new fabric
- Body: `Fabric` (without id, createdAt, updatedAt)
- Returns: `Fabric`

**POST `/api/fabrics/:id/build`**
- Trigger RAG build
- Returns: `{ status: string, message: string, estimatedTime: string }`

**POST `/api/fabrics/:id/upload`**
- Upload documents
- Content-Type: `multipart/form-data`
- Body: `files: File[]`, `fabricId: string`
- Returns: `{ success: boolean }`

**DELETE `/api/fabrics/:id`**
- Delete fabric
- Returns: `{ success: boolean }`

#### Chat Endpoints

**POST `/api/chat`**
- Send chat message
- Body:
```json
{
  "fabricId": "string",
  "llmId": "string",
  "messages": [ChatMessage],
  "conversationId": "string" (optional)
}
```
- Returns: `{ messages: ChatMessage[], conversationId: string }`

#### Connection Testing

**POST `/api/connections/servicenow/test`**
- Test ServiceNow connection
- Body: `{ instanceUrl: string, tables: string[] }`
- Returns: `{ success: boolean, message: string }`

**POST `/api/connections/sharepoint/test`**
- Test SharePoint connection
- Body: `{ siteUrl: string, library: string }`
- Returns: `{ success: boolean, message: string }`

**GET `/api/connections/servicenow/check-credentials`**
- Check if ServiceNow credentials are configured
- Returns: `{ configured: boolean, message: string }`

### Testing

#### Frontend Testing

```bash
npm test
```

#### Backend Testing

```bash
cd backend
source venv/bin/activate
python -m pytest tests/
```

#### Manual Testing

**Test Fabric Creation:**
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
    "embeddingModel": "text-embedding-3-large",
    "chromaCollection": "test-collection"
  }'
```

**Test Chat:**
```bash
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "fabricId": "fabric-id",
    "llmId": "gpt-4",
    "messages": [{
      "id": "msg-1",
      "role": "user",
      "content": "What are the recent incidents?",
      "createdAt": "2024-01-01T00:00:00Z"
    }]
  }'
```

---

## Troubleshooting

### Common Issues

#### 1. Chroma DB Connection Error

**Error**: `Connection refused` or `Cannot connect to Chroma DB`

**Solution**:
```bash
# Check if Chroma DB is running
curl http://localhost:8000/api/v1/heartbeat

# If not running, start it
docker start chroma-db
# OR
chroma run --host localhost --port 8000
```

#### 2. Embedding Dimension Mismatch

**Error**: `Collection expecting embedding with dimension of 1536, got 3072`

**Solution**:
- The collection was created with a different embedding model
- Delete the collection or use a different collection name
- The system will automatically recreate it with the correct dimension

#### 3. ServiceNow Connection Failed

**Error**: `Authentication failed` or `Connection failed`

**Solution**:
- Verify credentials in `.env` file
- Check that user has `rest_api_explorer` role
- Verify instance URL format: `dev12345.service-now.com` (without https://)
- Test connection using: `python backend/test_servicenow_connection.py`

#### 4. OpenAI API Key Error

**Error**: `API key not configured` or `Authentication failed`

**Solution**:
- Check `.env` file has `OPENAI_API_KEY` set
- Verify API key is valid and has credits
- For Azure OpenAI, check `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_API_KEY`

#### 5. Frontend Can't Connect to Backend

**Error**: `Network Error` or `Failed to fetch`

**Solution**:
- Verify backend is running on `http://localhost:4000`
- Check `REACT_APP_API_BASE_URL` in frontend `.env`
- Check CORS settings in backend (should allow `http://localhost:3000`)

#### 6. Build Stuck at "Vectorizing"

**Solution**:
- This is normal for large datasets
- Check backend logs for progress
- Embedding generation can take time (shows progress every 10 chunks)
- Status updates every 5 seconds

#### 7. Fabric Shows "Error" Status

**Solution**:
- Check backend logs for error details
- Common causes:
  - Missing API keys
  - Connection failures
  - Invalid configuration
- Fix the issue and rebuild the fabric

### Debugging Tips

**1. Check Backend Logs**
```bash
cd backend
source venv/bin/activate
python app.py
# Watch console for errors
```

**2. Check Frontend Console**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

**3. Test Individual Components**

**Test ServiceNow Connection:**
```bash
cd backend
source venv/bin/activate
python test_servicenow_connection.py
```

**Test Chroma DB:**
```bash
curl http://localhost:8000/api/v1/heartbeat
```

**Test Embedding Generation:**
```python
from embedding_service import generate_embedding
embedding = generate_embedding("test text", "text-embedding-3-large")
print(f"Dimension: {len(embedding)}")
```

---

## Deployment

### Production Deployment

#### Frontend Deployment

**Build for Production:**
```bash
npm run build
```

**Deploy to Static Hosting:**
- Upload `build/` directory to hosting service
- Configure environment variables
- Set up reverse proxy if needed

**Example with Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /path/to/build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Backend Deployment

**Using Gunicorn:**
```bash
cd backend
source venv/bin/activate
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:4000 app:app
```

**Using Docker:**
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:4000", "app:app"]
```

**Environment Variables:**
- Set all required environment variables
- Use secrets management (AWS Secrets Manager, Azure Key Vault, etc.)
- Never commit `.env` files

#### Chroma DB Deployment

**Option 1: Docker Container**
```bash
docker run -d \
  --name chroma-db \
  -p 8000:8000 \
  -v chroma-data:/chroma/chroma \
  chromadb/chroma
```

**Option 2: Chroma Server**
```bash
chroma run --host 0.0.0.0 --port 8000
```

**Option 3: Managed Service**
- Deploy Chroma DB to cloud (AWS, Azure, GCP)
- Update connection string in backend

### Security Considerations

1. **API Keys**: Store in environment variables, never in code
2. **CORS**: Configure properly for production domains
3. **Authentication**: Add authentication/authorization
4. **HTTPS**: Use HTTPS in production
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **Input Validation**: Validate all user inputs
7. **Error Handling**: Don't expose sensitive error messages

### Monitoring

**Recommended Monitoring:**
- Application logs (backend and frontend)
- API response times
- Error rates
- Chroma DB performance
- Embedding generation times
- LLM API usage and costs

**Tools:**
- Application Insights (Azure)
- CloudWatch (AWS)
- Prometheus + Grafana
- Sentry (error tracking)

---

## Additional Resources

- **Chroma DB Documentation**: https://docs.trychroma.com/
- **OpenAI API Documentation**: https://platform.openai.com/docs
- **React Documentation**: https://react.dev/
- **Flask Documentation**: https://flask.palletsprojects.com/
- **Tailwind CSS Documentation**: https://tailwindcss.com/docs

---

## Support

For issues, questions, or contributions:
- Check the troubleshooting section
- Review backend logs
- Check GitHub issues (if applicable)
- Contact the development team

---

**Last Updated**: November 2024
**Version**: 1.0.0

