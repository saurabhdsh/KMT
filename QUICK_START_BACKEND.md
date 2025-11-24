# Quick Start: Real Backend

## 🚀 Get the Real Backend Running in 3 Steps

### Step 1: Configure API Keys

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add at minimum:
```env
OPENAI_API_KEY=sk-your-actual-key-here
```

Or for Azure OpenAI:
```env
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com
AZURE_OPENAI_API_KEY=your-key-here
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

### Step 2: Install Dependencies

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Step 3: Start the Server

```bash
./start-server.sh
```

The server will start on `http://localhost:4000`

## ✅ What Works Now

- **Real Document Parsing** - PDF and DOCX files are actually parsed
- **Real Embeddings** - Uses OpenAI/Azure OpenAI to generate embeddings
- **Real Chroma DB Storage** - Vectors stored in Chroma DB
- **Real RAG Pipeline** - Complete pipeline: Ingest → Chunk → Vectorize → Store → Graph
- **Real LLM Responses** - Chat uses actual LLM with RAG context

## 🧪 Test It

1. Start the backend: `cd backend && ./start-server.sh`
2. Start the frontend: `npm start` (in project root)
3. Create a fabric - it will use REAL RAG pipeline!
4. Chat with the fabric - it will use REAL LLM!

## 📝 Notes

- **Minimum requirement**: `OPENAI_API_KEY` in `.env`
- **ServiceNow/SharePoint**: Optional, only needed if using those sources
- **Chroma DB**: Automatically created in `./chroma-data`
- **Data persistence**: Fabrics stored in `./data/fabrics.json`

---

**That's it!** Your backend is now running with REAL RAG implementation! 🎉

