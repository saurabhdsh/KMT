# ServiceOps Knowledge Fabric Studio

A modern, production-quality React + TypeScript single-page application for building and managing knowledge fabrics for Service Operations, with integrated chat capabilities powered by RAG (Retrieval-Augmented Generation) over Chroma DB and Knowledge Graphs.

## Features

- **Knowledge Fabric Builder**: Create and manage knowledge fabrics that orchestrate data ingestion from ServiceNow, SharePoint, and file uploads
- **Chat on Fabric**: Interactive chat interface with RAG-powered responses over your knowledge fabrics
- **Modern UI**: Dark, SaaS-style dashboard with smooth animations and responsive design

## Tech Stack

- **React** 18.2.0 + **TypeScript** 5.3.3
- **react-router-dom** 6.21.1 for routing
- **Tailwind CSS** 3.4.0 for styling
- **Axios** 1.6.2 for API calls
- **react-markdown** 9.0.1 for rendering assistant responses
- **@heroicons/react** 2.1.1 for icons
- **React Context + Hooks** for state management (no Redux)

## Installation & Setup

### Prerequisites

- Node.js 16+ and npm

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
REACT_APP_API_BASE_URL=http://localhost:4000
```

If not set, the app defaults to `http://localhost:4000`.

### Run Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`.

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
  api/                    # API client layer
    axiosClient.ts        # Axios instance configuration
    fabricsApi.ts         # Fabric CRUD operations
    chatApi.ts           # Chat message sending
    feedbackApi.ts       # User feedback submission
  components/
    layout/              # App layout components
      AppLayout.tsx
      Sidebar.tsx
      Header.tsx
    common/              # Reusable UI components
      StatusChip.tsx
      Stepper.tsx
      LoadingSpinner.tsx
      EmptyState.tsx
    toast/               # Toast notification system
      ToastProvider.tsx
  context/               # React Context providers
    FabricContext.tsx    # Fabric state management
    ChatContext.tsx      # Chat state management
  pages/
    Fabrics/             # Knowledge Fabric Builder
      FabricsPage.tsx
      FabricList.tsx
      FabricWizard.tsx
      FabricDetailDrawer.tsx
    Chat/                # Chat interface
      ChatPage.tsx
      MessageBubble.tsx
      SourcePanel.tsx
  types/                 # TypeScript type definitions
    fabric.ts
    chat.ts
  App.tsx               # Main app component with routing
  index.tsx             # Entry point
  index.css             # Global styles with Tailwind
```

## API Endpoints

The application expects the following REST API endpoints to be implemented by the backend:

### Fabrics

- `GET /api/fabrics` - Get all fabrics
- `GET /api/fabrics/:id` - Get fabric by ID
- `POST /api/fabrics` - Create a new fabric
  ```json
  {
    "name": "string",
    "description": "string",
    "domain": "string",
    "sources": {
      "serviceNow": { "enabled": boolean, "instanceUrl": "string", "tables": ["string"] },
      "sharePoint": { "enabled": boolean, "siteUrl": "string", "library": "string" },
      "uploads": { "fileNames": ["string"] }
    },
    "chunkSize": number,
    "chunkOverlap": number,
    "embeddingModel": "string",
    "chromaCollection": "string"
  }
  ```
- `POST /api/fabrics/:id/build` - Trigger RAG architecture build pipeline
  - This endpoint initiates the complete RAG pipeline:
    1. **Ingest** - Extract text from source (ServiceNow tables, SharePoint documents, or uploaded files)
    2. **Chunk** - Split documents into smaller pieces with configurable size and overlap
    3. **Vectorize** - Generate embeddings using specified model (Azure OpenAI, OpenAI, etc.)
    4. **Store** - Save vectorized chunks in Chroma DB collection
    5. **Build Knowledge Graph** - Extract entities and relationships from documents
    6. **Ready** - Mark fabric as ready for RAG-powered chat
  - See `backend/README_RAG.md` for complete implementation guide
- `POST /api/fabrics/:id/upload` - Upload documents for document-based fabric
  - Content-Type: `multipart/form-data`
  - Body: `files` (File[]) and `fabricId` (string)
  - Returns: `{ success: boolean, message?: string }`

### Chat

- `POST /api/chat` - Send chat message with RAG integration
  - Backend RAG-powered chat pipeline:
    1. Generate embedding for user message using fabric's embedding model
    2. Query Chroma DB collection for top N similar chunks (cosine similarity)
    3. Optionally query Knowledge Graph for related entities/relationships
    4. Build RAG context from retrieved chunks and graph nodes
    5. Construct prompt: System context + Retrieved chunks + User question
    6. Call LLM (specified by llmId) with RAG-enhanced prompt
    7. Extract source articles from retrieved chunks metadata
    8. Return LLM response with source citations
  - See `backend/README_RAG.md` for complete implementation guide
  ```json
  {
    "fabricId": "string",
    "llmId": "string",
    "messages": [
      {
        "id": "string",
        "role": "user" | "assistant" | "system",
        "content": "string",
        "createdAt": "ISO string",
        "sources": [{
          "id": "string",
          "title": "string",
          "snippet": "string",
          "link": "string"
        }]
      }
    ],
    "temperature": number,
    "maxTokens": number
  }
  ```
  Returns:
  ```json
  {
    "messages": [ChatMessage[]],
    "conversationId": "string"
  }
  ```

### Feedback

- `POST /api/feedback` - Submit user feedback
  ```json
  {
    "messageId": "string",
    "fabricId": "string",
    "llmId": "string",
    "rating": "up" | "down",
    "comments": "string",
    "conversationId": "string",
    "timestamp": "ISO string"
  }
  ```

### Connection Testing

- `POST /api/connections/servicenow/test` - Test ServiceNow connection
  ```json
  {
    "instanceUrl": "string",
    "tables": ["string"]
  }
  ```
  Returns:
  ```json
  {
    "success": boolean,
    "message": "string"
  }
  ```

- `POST /api/connections/sharepoint/test` - Test SharePoint connection
  ```json
  {
    "siteUrl": "string",
    "library": "string"
  }
  ```
  Returns:
  ```json
  {
    "success": boolean,
    "message": "string"
  }
  ```

## Chroma DB Setup

This application uses **Chroma DB** as the vector database for storing embeddings. Chroma is:
- **Free and open source**
- **Easy to set up** - can run locally or as a service
- **Perfect for RAG** - designed specifically for vector embeddings
- **No complex pricing** - completely free to use

### Quick Setup (Choose One)

**Option 1: Docker (Recommended - Easiest)**
```bash
# Using the provided script
./scripts/setup-chroma.sh

# Or manually
docker run -d --name chroma-db -p 8000:8000 -v chroma-data:/chroma/chroma chromadb/chroma

# Or using docker-compose
docker-compose -f docker-compose.chroma.yml up -d
```

**Option 2: Python (Local Development)**
```bash
pip install chromadb
chroma run --host localhost --port 8000
```

**Option 3: Check Status**
```bash
./scripts/check-chroma.sh
```

### Detailed Setup Guide

See [CHROMA_SETUP.md](./CHROMA_SETUP.md) for:
- Complete setup instructions
- Backend integration examples (Python & Node.js)
- Docker Compose configuration
- Troubleshooting guide

### Backend Integration

Your backend should connect to Chroma DB to:
- Store vectorized chunks during fabric build
- Query similar chunks during chat (RAG retrieval)
- Build knowledge graphs

**Connection URL:** `http://localhost:8000` (default)

### Backend Integration Points

### API Layer (`src/api/`)

All API calls are centralized in the `src/api/` directory. To integrate with your backend:

1. Update `axiosClient.ts` to add authentication headers/interceptors
2. Ensure all endpoints match the expected request/response formats
3. Handle errors appropriately (the app will show toast notifications)

### Fabric Build Pipeline

The fabric build process follows these stages:
1. **Draft** - Fabric created but not started
2. **Ingesting** - Pulling data from sources
3. **Chunking** - Breaking documents into chunks
4. **Vectorizing** - Creating embeddings
5. **GraphBuilding** - Building knowledge graph
6. **Ready** - Fabric ready for chat
7. **Error** - Build failed

**TODO**: Implement WebSocket or polling mechanism to update fabric status in real-time. Currently, status is refreshed when the fabric list is reloaded.

### File Uploads

The wizard currently only stores filenames in the fabric configuration. **TODO**: Implement actual file upload pipeline to backend storage.

### Real-time Status Updates

**TODO**: Add WebSocket connection or polling mechanism to update fabric build progress in real-time without manual refresh.

## Development Notes

- **No Mock Data**: The application does not use any hardcoded mock data. All data comes from API calls.
- **Loading States**: All components show appropriate loading spinners while fetching data.
- **Empty States**: Empty states are shown when no data is available, with CTAs to create new items.
- **Error Handling**: Errors are caught and displayed via toast notifications.

## Styling

The app uses Tailwind CSS with a custom dark theme:
- Background: `slate-950` (main), `slate-900` (cards)
- Primary brand color: `brand-600` (blue)
- Text: `slate-100` (primary), `slate-400` (muted)

Custom utility classes are defined in `src/index.css`:
- `.card` - Card styling
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is proprietary software for ServiceOps Knowledge Fabric Studio.

