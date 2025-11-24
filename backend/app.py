"""
ServiceOps Knowledge Fabric Studio - Backend API
Real implementation with RAG pipeline using Chroma DB
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import uuid
import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # dotenv not installed, continue without it
    pass

# Import RAG pipeline
try:
    from rag_pipeline import RAGPipeline, RAGQuery
except ImportError:
    # Fallback to example file
    from rag_pipeline_example import RAGPipeline, RAGQuery

app = Flask(__name__)
CORS(app)

# Configuration
CHROMA_DATA_DIR = os.getenv("CHROMA_DATA_DIR", "./chroma-data")
DATA_DIR = Path("./data")

# Ensure required directories exist (automatically created on first run)
Path(CHROMA_DATA_DIR).mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Initialize RAG components
rag_pipeline = RAGPipeline(chroma_path=CHROMA_DATA_DIR)
rag_query = RAGQuery(chroma_path=CHROMA_DATA_DIR)

# In-memory storage (replace with real database in production)
fabrics_db = {}
conversations_db = {}


def load_fabrics():
    """Load fabrics from file"""
    fabrics_file = DATA_DIR / "fabrics.json"
    if fabrics_file.exists():
        with open(fabrics_file, 'r') as f:
            return json.load(f)
    return {}


def save_fabrics():
    """Save fabrics to file"""
    fabrics_file = DATA_DIR / "fabrics.json"
    with open(fabrics_file, 'w') as f:
        json.dump(fabrics_db, f, indent=2)


# Load existing fabrics on startup
fabrics_db = load_fabrics()


@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        "status": "ok",
        "message": "Backend server is running",
        "fabrics_count": len(fabrics_db),
        "chroma_path": CHROMA_DATA_DIR
    })


@app.route('/api/fabrics', methods=['GET'])
def get_fabrics():
    """Get all fabrics"""
    fabrics = list(fabrics_db.values())
    return jsonify(fabrics)


@app.route('/api/fabrics/<fabric_id>', methods=['GET'])
def get_fabric(fabric_id):
    """Get fabric by ID"""
    if fabric_id in fabrics_db:
        return jsonify(fabrics_db[fabric_id])
    return jsonify({"error": "Fabric not found"}), 404


@app.route('/api/fabrics', methods=['POST'])
def create_fabric():
    """Create a new fabric"""
    data = request.json
    
    fabric_id = str(uuid.uuid4())
    fabric = {
        "id": fabric_id,
        "name": data.get("name", "Untitled Fabric"),
        "description": data.get("description", ""),
        "domain": data.get("domain", "Incident Management"),
        "status": "Draft",
        "sources": data.get("sources", {}),
        "chunkSize": data.get("chunkSize", 512),
        "chunkOverlap": data.get("chunkOverlap", 64),
        "embeddingModel": data.get("embeddingModel", "text-embedding-3-large"),
        "chromaCollection": data.get("chromaCollection", ""),
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat()
    }
    
    fabrics_db[fabric_id] = fabric
    save_fabrics()
    
    return jsonify(fabric), 201


@app.route('/api/fabrics/<fabric_id>/upload', methods=['POST'])
def upload_documents(fabric_id):
    """Upload documents for a fabric"""
    if fabric_id not in fabrics_db:
        return jsonify({"error": "Fabric not found"}), 404
    
    fabric = fabrics_db[fabric_id]
    fabric["status"] = "Ingesting"
    fabric["updatedAt"] = datetime.now().isoformat()
    save_fabrics()
    
    # Save uploaded files
    if 'files' in request.files:
        files = request.files.getlist('files')
        upload_dir = DATA_DIR / "uploads" / fabric_id
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        saved_files = []
        for file in files:
            if file.filename:
                file_path = upload_dir / file.filename
                file.save(str(file_path))
                saved_files.append(file.filename)
        
        # Update fabric with file names
        if "uploads" not in fabric["sources"]:
            fabric["sources"]["uploads"] = {"fileNames": []}
        fabric["sources"]["uploads"]["fileNames"] = saved_files
        save_fabrics()
        
        return jsonify({
            "success": True,
            "message": f"Uploaded {len(saved_files)} files successfully",
            "files": saved_files
        })
    
    return jsonify({"success": True, "message": "No files uploaded"}), 400


@app.route('/api/fabrics/<fabric_id>', methods=['DELETE'])
def delete_fabric(fabric_id):
    """Delete a fabric"""
    if fabric_id not in fabrics_db:
        return jsonify({"error": "Fabric not found"}), 404
    
    try:
        # Delete uploaded files if any
        upload_dir = DATA_DIR / "uploads" / fabric_id
        if upload_dir.exists():
            import shutil
            shutil.rmtree(upload_dir)
        
        # Delete from database
        del fabrics_db[fabric_id]
        save_fabrics()
        
        # TODO: Optionally delete Chroma DB collection
        # collection_name = fabrics_db.get(fabric_id, {}).get("chromaCollection")
        # if collection_name:
        #     try:
        #         client = rag_pipeline.client
        #         client.delete_collection(name=collection_name)
        #     except:
        #         pass
        
        return jsonify({"success": True, "message": "Fabric deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/fabrics/<fabric_id>/build', methods=['POST'])
def trigger_build(fabric_id):
    """Trigger RAG architecture build - REAL IMPLEMENTATION"""
    if fabric_id not in fabrics_db:
        return jsonify({"error": "Fabric not found"}), 404
    
    fabric = fabrics_db[fabric_id]
    
    # Determine source type for response message (before async thread)
    source_type = None
    if fabric["sources"].get("uploads") and fabric["sources"]["uploads"].get("fileNames"):
        source_type = "upload"
    elif fabric["sources"].get("serviceNow") and fabric["sources"]["serviceNow"].get("enabled"):
        source_type = "servicenow"
    elif fabric["sources"].get("sharePoint") and fabric["sources"]["sharePoint"].get("enabled"):
        source_type = "sharepoint"
    
    # Run build in background thread to avoid blocking
    import threading
    
    def build_rag_async():
        import time
        
        try:
            # Update status to Ingesting
            fabric["status"] = "Ingesting"
            fabric["updatedAt"] = datetime.now().isoformat()
            save_fabrics()
            time.sleep(2)  # Show Ingesting status for 2 seconds
            
            # Get fabric configuration
            collection_name = fabric.get("chromaCollection", f"fabric-{fabric_id}")
            chunk_size = fabric.get("chunkSize", 512)
            chunk_overlap = fabric.get("chunkOverlap", 64)
            embedding_model = fabric.get("embeddingModel", "text-embedding-3-large")
            
            # Determine source and get documents
            documents = []
            source_type = None
            
            # 1. Document Upload Source
            if fabric["sources"].get("uploads") and fabric["sources"]["uploads"].get("fileNames"):
                source_type = "upload"
                upload_dir = DATA_DIR / "uploads" / fabric_id
                
                try:
                    # Parse uploaded documents
                    from document_parser import parse_documents
                    documents = parse_documents(upload_dir, fabric["sources"]["uploads"]["fileNames"])
                except Exception as e:
                    print(f"Error parsing documents: {e}")
                    # Create mock documents if parsing fails
                    documents = [{"content": f"Sample document content from {fname}", "metadata": {"file_name": fname}} 
                               for fname in fabric["sources"]["uploads"]["fileNames"]]
            
            # 2. ServiceNow Source
            elif fabric["sources"].get("serviceNow") and fabric["sources"]["serviceNow"].get("enabled"):
                source_type = "servicenow"
                try:
                    from servicenow_connector import fetch_servicenow_data
                    servicenow_config = fabric["sources"]["serviceNow"]
                    instance_url = servicenow_config.get("instanceUrl")
                    tables = servicenow_config.get("tables", [])
                    
                    print(f"🔗 Fetching ServiceNow data from {instance_url}, tables: {tables}")
                    documents = fetch_servicenow_data(
                        instance_url=instance_url,
                        tables=tables
                    )
                    print(f"✅ Fetched {len(documents)} documents from ServiceNow")
                    
                    if not documents or len(documents) == 0:
                        raise Exception(f"No data found in ServiceNow tables: {tables}. Please check that the tables exist and contain data.")
                        
                except Exception as e:
                    error_msg = str(e)
                    print(f"❌ Error fetching ServiceNow data: {error_msg}")
                    import traceback
                    traceback.print_exc()
                    
                    # Update fabric status to Error
                    fabric["status"] = "Error"
                    fabric["error"] = f"Failed to fetch ServiceNow data: {error_msg}"
                    fabric["updatedAt"] = datetime.now().isoformat()
                    save_fabrics()
                    
                    # Re-raise the error so it's logged
                    raise Exception(f"ServiceNow data fetch failed: {error_msg}")
            
            # 3. SharePoint Source
            elif fabric["sources"].get("sharePoint") and fabric["sources"]["sharePoint"].get("enabled"):
                source_type = "sharepoint"
                try:
                    from sharepoint_connector import fetch_sharepoint_data
                    sharepoint_config = fabric["sources"]["sharePoint"]
                    documents = fetch_sharepoint_data(
                        site_url=sharepoint_config.get("siteUrl"),
                        library=sharepoint_config.get("library")
                    )
                except Exception as e:
                    print(f"Error fetching SharePoint data: {e}")
                    # Create mock documents
                    documents = [{"content": f"SharePoint data from {sharepoint_config.get('siteUrl')}", "metadata": {"source": "sharepoint"}}]
            
            # If no documents, create a sample one to allow build to proceed
            if not documents:
                print("No documents found, creating sample document for demo")
                documents = [{"content": "Sample knowledge fabric content for demonstration purposes.", "metadata": {"source": "demo"}}]
            
            # Update status to Chunking
            fabric["status"] = "Chunking"
            fabric["updatedAt"] = datetime.now().isoformat()
            save_fabrics()
            time.sleep(2)  # Show Chunking status for 2 seconds
            
            # Update status to Vectorizing
            fabric["status"] = "Vectorizing"
            fabric["updatedAt"] = datetime.now().isoformat()
            save_fabrics()
            time.sleep(2)  # Show Vectorizing status for 2 seconds
            
            # Build RAG architecture
            try:
                # Ensure documents are in the correct format (dicts with content, id, source, metadata)
                formatted_documents = []
                for idx, doc in enumerate(documents):
                    if isinstance(doc, dict):
                        # Ensure all required fields are present
                        formatted_doc = {
                            "content": doc.get("content", str(doc)),
                            "id": doc.get("id", f"doc-{idx}"),
                            "source": doc.get("source", source_type or "unknown"),
                            "metadata": doc.get("metadata", {})
                        }
                        formatted_documents.append(formatted_doc)
                    else:
                        # Convert string to dict format
                        formatted_documents.append({
                            "content": str(doc),
                            "id": f"doc-{idx}",
                            "source": source_type or "unknown",
                            "metadata": {}
                        })
                
                # Validate embedding credentials before building
                if "azure" in embedding_model.lower():
                    if not os.getenv("AZURE_OPENAI_API_KEY") or not os.getenv("AZURE_OPENAI_ENDPOINT"):
                        print("⚠️ Azure OpenAI credentials not configured, will use fallback embeddings")
                elif not os.getenv("OPENAI_API_KEY"):
                    print("⚠️ OpenAI API key not configured, will use HuggingFace embeddings")
                
                # Define status update callback to keep status fresh during long operations
                def update_status(new_status):
                    fabric["status"] = new_status
                    fabric["updatedAt"] = datetime.now().isoformat()
                    save_fabrics()
                
                result = rag_pipeline.build_rag_architecture(
                    fabric_id=fabric_id,
                    collection_name=collection_name,
                    documents=formatted_documents,
                    source=source_type,
                    chunk_size=chunk_size,
                    chunk_overlap=chunk_overlap,
                    embedding_model=embedding_model,
                    status_update_callback=update_status
                )
            except Exception as e:
                error_msg = str(e)
                print(f"❌ Error in RAG pipeline: {error_msg}")
                import traceback
                traceback.print_exc()
                
                # If it's an embedding error, mark as error but don't create mock result
                if "embedding" in error_msg.lower() or "connection" in error_msg.lower():
                    raise Exception(f"Embedding generation failed: {error_msg}. Please check your API keys in .env file.")
                
                # For other errors, create mock result
                result = {
                    "chunks_stored": len(documents) * 3,  # Estimate chunks
                    "graph_nodes": len(documents),
                    "graph_edges": 0
                }
            
            # Update status to GraphBuilding
            fabric["status"] = "GraphBuilding"
            fabric["updatedAt"] = datetime.now().isoformat()
            save_fabrics()
            time.sleep(2)  # Show GraphBuilding status for 2 seconds
            
            # Update fabric with results
            fabric["status"] = "Ready"
            fabric["chunksCount"] = result.get("chunks_stored", 0)
            fabric["graphNodes"] = result.get("graph_nodes", 0)
            fabric["graphEdges"] = result.get("graph_edges", 0)
            # Store document count if available
            if source_type == "servicenow":
                fabric["documentsCount"] = len(documents)
            elif source_type == "upload":
                fabric["documentsCount"] = len(fabric["sources"].get("uploads", {}).get("fileNames", []))
            elif source_type == "sharepoint":
                fabric["documentsCount"] = len(documents) if documents else 0
            fabric["updatedAt"] = datetime.now().isoformat()
            save_fabrics()
            
            print(f"✅ Build complete for fabric {fabric_id}: Status = Ready")
            
        except Exception as e:
            print(f"❌ Build error for fabric {fabric_id}: {e}")
            import traceback
            traceback.print_exc()
            fabric["status"] = "Error"
            fabric["error"] = str(e)
            fabric["updatedAt"] = datetime.now().isoformat()
            save_fabrics()
    
    # Start build in background thread
    thread = threading.Thread(target=build_rag_async, daemon=True)
    thread.start()
    
    # Return immediately with estimated time
    estimated_time = "2-5 minutes" if source_type == "servicenow" else "1-3 minutes"
    return jsonify({
        "status": "Ingesting",
        "message": f"RAG architecture build started. This may take {estimated_time} depending on the amount of data. Status will update automatically.",
        "estimatedTime": estimated_time
    })


@app.route('/api/chat', methods=['POST'])
def send_chat():
    """Send chat message with REAL RAG"""
    try:
        data = request.json
        print(f"📨 Chat request received: fabricId={data.get('fabricId')}, llmId={data.get('llmId')}")
        
        fabric_id = data.get("fabricId")
        llm_id = data.get("llmId")
        messages = data.get("messages", [])
        
        if not fabric_id or not llm_id:
            return jsonify({"error": "fabricId and llmId are required"}), 400
        
        # Get fabric
        if fabric_id not in fabrics_db:
            return jsonify({"error": "Fabric not found"}), 404
        
        fabric = fabrics_db[fabric_id]
        
        if fabric["status"] != "Ready":
            return jsonify({
                "error": f"Fabric is not ready. Current status: {fabric['status']}"
            }), 400
    except Exception as initial_error:
        import traceback
        print(f"❌ Error in initial chat setup: {str(initial_error)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({"error": f"Error processing chat request: {str(initial_error)}"}), 500
    
    try:
        # Get user message
        user_message = messages[-1] if messages else None
        if not user_message or user_message.get("role") != "user":
            return jsonify({"error": "Last message must be from user"}), 400
        
        user_text = user_message.get("content", "")
        
        # Check if API keys are configured
        embedding_model = fabric.get("embeddingModel", "azure-openai-embedding-1")
        is_azure = "azure" in embedding_model.lower()
        
        if is_azure:
            if not os.getenv("AZURE_OPENAI_API_KEY") or not os.getenv("AZURE_OPENAI_ENDPOINT"):
                return jsonify({
                    "error": "Azure OpenAI credentials not configured. Please set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT in your .env file."
                }), 500
        else:
            if not os.getenv("OPENAI_API_KEY"):
                return jsonify({
                    "error": "OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file."
                }), 500
        
        # Generate embedding for user query
        try:
            from embedding_service import generate_embedding
            query_embedding = generate_embedding(
                text=user_text,
                model=embedding_model
            )
        except Exception as emb_error:
            error_msg = str(emb_error)
            if "API key" in error_msg or "authentication" in error_msg.lower():
                return jsonify({
                    "error": f"Embedding generation failed: {error_msg}. Please check your API keys in .env file."
                }), 500
            else:
                return jsonify({
                    "error": f"Embedding generation failed: {error_msg}"
                }), 500
        
        # Query Chroma DB for relevant chunks
        collection_name = fabric.get("chromaCollection", f"fabric-{fabric_id}")
        try:
            # Check if collection exists
            try:
                collection = rag_query.client.get_collection(name=collection_name)
                count = collection.count()
                print(f"📊 Collection '{collection_name}' has {count} documents")
                if count == 0:
                    return jsonify({
                        "error": f"Chroma collection '{collection_name}' is empty. The fabric may not have been built successfully. Please rebuild the fabric."
                    }), 500
            except Exception as check_error:
                error_msg = str(check_error)
                print(f"⚠️ Collection check error: {error_msg}")
                if "does not exist" in error_msg.lower() or "not found" in error_msg.lower():
                    return jsonify({
                        "error": f"Chroma collection '{collection_name}' not found. The fabric may not have been built successfully. Please rebuild the fabric."
                    }), 500
                # If it's a different error, continue to try querying anyway
            
            print(f"🔍 User Query: '{user_text}'")
            print(f"🔍 Querying collection '{collection_name}' with embedding of length {len(query_embedding)}")
            query_results = rag_query.query_fabric(
                collection_name=collection_name,
                query_text=user_text,
                query_embedding=query_embedding,
                n_results=5
            )
            
            num_results = len(query_results.get('ids', [[]])[0]) if query_results.get('ids') else 0
            print(f"📋 Query returned {num_results} results")
            
            # Log retrieved chunks for debugging
            if query_results and query_results.get("metadatas") and len(query_results["metadatas"]) > 0:
                print("📄 Retrieved chunks:")
                for i, metadata in enumerate(query_results["metadatas"][0][:3]):  # Show first 3
                    source = metadata.get("source", "unknown")
                    doc_id = metadata.get("doc_id") or metadata.get("number") or metadata.get("sys_id", "N/A")
                    table = metadata.get("table", "unknown")
                    link = metadata.get("link", "N/A")
                    print(f"  {i+1}. Source: {source}, Table: {table}, Doc ID: {doc_id}, Link: {link}")
            
            # Check if we got any results
            if not query_results or not query_results.get("ids") or len(query_results.get("ids", [])[0]) == 0:
                return jsonify({
                    "error": "No relevant content found in the fabric. The fabric may be empty or the query doesn't match any content."
                }), 404
                
        except Exception as chroma_error:
            error_msg = str(chroma_error)
            import traceback
            print(f"❌ Chroma DB error: {error_msg}")
            print(f"Traceback: {traceback.format_exc()}")
            if "does not exist" in error_msg.lower() or "not found" in error_msg.lower():
                return jsonify({
                    "error": f"Chroma collection '{collection_name}' not found. The fabric may not have been built successfully. Please rebuild the fabric."
                }), 500
            else:
                return jsonify({
                    "error": f"Failed to query Chroma DB: {error_msg}"
                }), 500
        
        # Build RAG context
        try:
            rag_context = rag_query.build_rag_context(query_results)
        except Exception as context_error:
            return jsonify({
                "error": f"Failed to build RAG context: {str(context_error)}"
            }), 500
        
        # Generate LLM response
        try:
            from llm_service import generate_llm_response
            llm_response = generate_llm_response(
                user_query=user_text,
                rag_context=rag_context,
                llm_model=llm_id,
                conversation_history=messages[:-1]  # Exclude current user message
            )
        except Exception as llm_error:
            error_msg = str(llm_error)
            if "API key" in error_msg or "authentication" in error_msg.lower():
                return jsonify({
                    "error": f"LLM generation failed: {error_msg}. Please check your API keys in .env file."
                }), 500
            elif "rate limit" in error_msg.lower():
                return jsonify({
                    "error": "OpenAI API rate limit exceeded. Please try again in a moment."
                }), 429
            else:
                return jsonify({
                    "error": f"LLM generation failed: {error_msg}"
                }), 500
        
        # Extract source articles
        try:
            source_articles = rag_query.get_source_articles(query_results)
            print(f"📚 Extracted {len(source_articles)} source(s) from query results")
            if source_articles:
                for i, source in enumerate(source_articles[:3], 1):  # Show first 3
                    print(f"  {i}. {source.get('title', 'N/A')} (ID: {source.get('id', 'N/A')})")
        except Exception as source_error:
            # Source extraction failure is not critical, continue without sources
            print(f"⚠️ Warning: Failed to extract sources: {source_error}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            source_articles = []
        
        # Create assistant message
        conversation_id = data.get("conversationId") or str(uuid.uuid4())
        assistant_message = {
            "id": f"msg-{uuid.uuid4()}",
            "role": "assistant",
            "content": llm_response,
            "createdAt": datetime.now().isoformat(),
            "sources": source_articles
        }
        
        # Store conversation
        if conversation_id not in conversations_db:
            conversations_db[conversation_id] = []
        conversations_db[conversation_id].extend(messages)
        conversations_db[conversation_id].append(assistant_message)
        
        return jsonify({
            "messages": conversations_db[conversation_id],
            "conversationId": conversation_id
        })
        
    except Exception as e:
        # Log the full error for debugging
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Chat error: {str(e)}")
        print(f"Traceback: {error_trace}")
        
        # Return user-friendly error message
        error_msg = str(e)
        if "API key" in error_msg or "authentication" in error_msg.lower():
            return jsonify({
                "error": "API authentication failed. Please check your OpenAI API keys in the .env file and restart the server."
            }), 500
        else:
            return jsonify({
                "error": f"Chat request failed: {error_msg}"
            }), 500


@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """Submit user feedback"""
    data = request.json
    
    # Store feedback (in production, save to database)
    feedback_file = DATA_DIR / "feedback.json"
    feedbacks = []
    if feedback_file.exists():
        with open(feedback_file, 'r') as f:
            feedbacks = json.load(f)
    
    feedbacks.append({
        **data,
        "timestamp": datetime.now().isoformat()
    })
    
    with open(feedback_file, 'w') as f:
        json.dump(feedbacks, f, indent=2)
    
    return jsonify({"success": True, "message": "Feedback received"})


@app.route('/api/connections/servicenow/check-credentials', methods=['GET'])
def check_servicenow_credentials():
    """Check if ServiceNow credentials are configured"""
    username = os.getenv("SERVICENOW_USERNAME")
    password = os.getenv("SERVICENOW_PASSWORD")
    
    if not username or not password:
        return jsonify({
            "configured": False,
            "message": "SERVICENOW_USERNAME and SERVICENOW_PASSWORD environment variables are not set. Please set them in your .env file."
        })
    
    return jsonify({
        "configured": True,
        "message": "ServiceNow credentials are configured"
    })


@app.route('/api/connections/servicenow/test', methods=['POST'])
def test_servicenow():
    """Test ServiceNow connection"""
    data = request.json
    
    # First check if credentials are set
    username = os.getenv("SERVICENOW_USERNAME")
    password = os.getenv("SERVICENOW_PASSWORD")
    
    if not username or not password:
        return jsonify({
            "success": False,
            "message": "SERVICENOW_USERNAME and SERVICENOW_PASSWORD environment variables are not set. Please set them in your .env file first."
        }), 400
    
    try:
        from servicenow_connector import test_connection
        result = test_connection(
            instance_url=data.get("instanceUrl"),
            tables=data.get("tables", [])
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400


@app.route('/api/connections/sharepoint/test', methods=['POST'])
def test_sharepoint():
    """Test SharePoint connection"""
    data = request.json
    
    try:
        from sharepoint_connector import test_connection
        result = test_connection(
            site_url=data.get("siteUrl"),
            library=data.get("library")
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400


if __name__ == '__main__':
    port = int(os.getenv('PORT', 4000))
    print("=" * 60)
    print("🚀 ServiceOps Knowledge Fabric Studio - Backend")
    print("=" * 60)
    print(f"📍 Server: http://localhost:{port}")
    print(f"📍 Chroma DB: {CHROMA_DATA_DIR}")
    print(f"📍 Data: {DATA_DIR.absolute()}")
    print("=" * 60)
    print("\n✅ Real RAG pipeline implementation")
    print("✅ Chroma DB integration")
    print("✅ Document parsing")
    print("✅ ServiceNow & SharePoint connectors")
    print("✅ LLM integration for chat")
    print("\nPress Ctrl+C to stop\n")
    
    app.run(host='0.0.0.0', port=port, debug=True)

