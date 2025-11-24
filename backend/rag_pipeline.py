"""
RAG Pipeline Implementation Example
This shows how to implement the RAG architecture for Knowledge Fabrics
"""

import chromadb
from chromadb import PersistentClient
from typing import List, Dict, Any
import os

class RAGPipeline:
    """
    RAG Pipeline for Knowledge Fabric
    Handles: Ingestion → Chunking → Vectorization → Storage → Knowledge Graph
    """
    
    def __init__(self, chroma_path: str = "./chroma-data"):
        """Initialize Chroma DB client"""
        self.client = PersistentClient(path=chroma_path)
        self.collections = {}
    
    def get_embedding_dimension(self, model: str) -> int:
        """Get the embedding dimension for a given model"""
        model_lower = model.lower()
        
        # OpenAI models
        if "text-embedding-3-large" in model_lower:
            return 3072
        elif "text-embedding-3-small" in model_lower or "text-embedding-ada-002" in model_lower:
            return 1536
        # Azure OpenAI typically uses 1536
        elif "azure" in model_lower:
            return 1536
        # HuggingFace models vary, but all-MiniLM-L6-v2 is 384
        elif "all-minilm-l6-v2" in model_lower:
            return 384
        else:
            # Default to 1536 for unknown models
            return 1536
    
    def create_fabric_collection(self, fabric_id: str, collection_name: str, embedding_dimension: int = None):
        """
        Create a Chroma collection for a fabric
        If collection exists, check if we need to delete and recreate it for dimension compatibility
        """
        # Check if collection already exists
        collection_exists = False
        try:
            existing_collection = self.client.get_collection(name=collection_name)
            collection_exists = True
            print(f"⚠️ Collection '{collection_name}' already exists")
        except Exception:
            # Collection doesn't exist, we'll create it
            pass
        
        # If collection exists and we have a specific dimension, we need to delete and recreate
        # because Chroma collections have fixed dimensions set by the first embedding
        if collection_exists and embedding_dimension is not None:
            print(f"🗑️  Deleting existing collection '{collection_name}' to recreate with dimension {embedding_dimension}")
            try:
                self.client.delete_collection(name=collection_name)
                print(f"✅ Collection deleted successfully")
            except Exception as e:
                print(f"⚠️ Warning: Could not delete collection: {e}")
                raise ValueError(
                    f"Cannot recreate collection '{collection_name}' with new embedding dimension. "
                    f"Please manually delete the collection or use a different collection name."
                )
        
        # Create the collection (Chroma will infer dimension from first embedding)
        # We store the expected dimension in metadata for reference
        try:
            collection = self.client.create_collection(
                name=collection_name,
                metadata={
                    "fabric_id": fabric_id,
                    "embedding_dimension": str(embedding_dimension) if embedding_dimension else "unknown",
                    "hnsw:space": "cosine"
                }
            )
            print(f"✅ Created collection '{collection_name}' (will use dimension {embedding_dimension} from first embedding)")
        except Exception as e:
            # Collection might have been created between check and create, try to get it
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                collection = self.client.get_collection(name=collection_name)
                print(f"⚠️ Collection already exists, using existing collection")
            else:
                raise
        
        self.collections[fabric_id] = collection
        return collection
    
    def ingest_documents(self, fabric_id: str, documents: List[Dict], source: str = "upload"):
        """
        Step 1: Document Ingestion
        - Parse documents (PDF, DOCX, etc.)
        - Extract text content
        - Preserve metadata from ServiceNow, SharePoint, etc.
        """
        # Documents are already in dict format with content, id, source, metadata
        # Just ensure they're properly formatted
        parsed_docs = []
        for doc in documents:
            if isinstance(doc, dict):
                # Preserve all metadata from original document
                parsed_docs.append({
                    "content": doc.get("content", ""),
                    "id": doc.get("id", f"doc-{len(parsed_docs)}"),
                    "source": doc.get("source", source),
                    "metadata": doc.get("metadata", {})
                })
            else:
                # Fallback for string documents
                parsed_docs.append({
                    "content": str(doc),
                    "id": f"doc-{len(parsed_docs)}",
                    "source": source,
                    "metadata": {}
                })
        
        return parsed_docs
    
    def chunk_documents(self, documents: List[Dict], chunk_size: int = 512, chunk_overlap: int = 64):
        """
        Step 2: Text Chunking
        - Split documents into smaller chunks
        - Maintain overlap for context
        """
        chunks = []
        chunk_ids = []
        metadatas = []
        
        for idx, doc in enumerate(documents):
            text = doc["content"]
            # Prioritize ServiceNow identifiers: number > sys_id > id > fallback
            metadata = doc.get("metadata", {})
            doc_id = (
                metadata.get("number") or  # ServiceNow incident number (e.g., INC0012345)
                metadata.get("sys_id") or  # ServiceNow sys_id
                doc.get("id") or           # Document ID (e.g., "incident-abc123")
                f"doc-{idx}"               # Fallback
            )
            
            # Simple chunking (use tiktoken or similar for token-based chunking)
            words = text.split()
            for i in range(0, len(words), chunk_size - chunk_overlap):
                chunk = " ".join(words[i:i + chunk_size])
                chunk_id = f"{doc_id}-chunk-{len(chunks)}"
                
                chunks.append(chunk)
                chunk_ids.append(chunk_id)
                metadatas.append({
                    "source": doc.get("source", "unknown"),
                    "doc_id": doc_id,
                    "chunk_index": len(chunks) - 1,
                    **metadata  # Include all original metadata (number, sys_id, link, table, etc.)
                })
        
        return chunks, chunk_ids, metadatas
    
    def generate_embeddings(self, chunks: List[str], embedding_model: str = "text-embedding-3-large", 
                           progress_callback=None):
        """
        Step 3: Vectorization
        - Generate embeddings for each chunk
        - Use the specified embedding model
        """
        from embedding_service import generate_embedding
        
        embeddings = []
        total_chunks = len(chunks)
        
        for idx, chunk in enumerate(chunks):
            try:
                embedding = generate_embedding(chunk, embedding_model)
                embeddings.append(embedding)
                
                # Progress update every 10 chunks or at the end
                if progress_callback and (idx % 10 == 0 or idx == total_chunks - 1):
                    progress_callback(idx + 1, total_chunks)
                    
            except Exception as e:
                # Fallback to dummy embedding if service fails
                print(f"Warning: Embedding generation failed for chunk {idx + 1}/{total_chunks}: {str(e)}")
                # Use a reasonable default dimension (1536 is common)
                dummy_embedding = [0.0] * 1536
                embeddings.append(dummy_embedding)
        
        return embeddings
    
    def store_in_chroma(self, fabric_id: str, chunks: List[str], embeddings: List[List[float]], 
                       chunk_ids: List[str], metadatas: List[Dict]):
        """
        Step 4: Store in Chroma DB
        - Store vectorized chunks in Chroma collection
        """
        collection = self.collections.get(fabric_id)
        if not collection:
            raise ValueError(f"Collection for fabric {fabric_id} not found")
        
        # Validate embedding dimensions before storing
        if embeddings:
            expected_dim = len(embeddings[0])
            for i, emb in enumerate(embeddings):
                if len(emb) != expected_dim:
                    raise ValueError(f"Embedding dimension mismatch: chunk {i} has dimension {len(emb)}, expected {expected_dim}")
        
        try:
            collection.add(
                documents=chunks,
                embeddings=embeddings,
                ids=chunk_ids,
                metadatas=metadatas
            )
        except Exception as e:
            error_msg = str(e)
            if "dimension" in error_msg.lower():
                # Dimension mismatch - collection was created with different dimension
                raise ValueError(
                    f"Embedding dimension mismatch. The collection '{collection.name}' was created with a different embedding dimension. "
                    f"Please delete the collection or use a different collection name. "
                    f"Current embeddings have dimension {len(embeddings[0]) if embeddings else 'unknown'}. "
                    f"Error: {error_msg}"
                )
            else:
                raise
        
        return len(chunks)
    
    def build_knowledge_graph(self, fabric_id: str, chunks: List[str], metadatas: List[Dict]):
        """
        Step 5: Build Knowledge Graph
        - Extract entities and relationships
        - Build graph structure
        - Store graph nodes and edges
        """
        # TODO: Implement knowledge graph building
        # Options:
        # - Use LLM to extract entities/relationships
        # - Use NER (Named Entity Recognition)
        # - Use relationship extraction models
        # - Store in graph database (Neo4j, etc.) or as metadata in Chroma
        
        graph_nodes = []
        graph_edges = []
        
        # Placeholder - implement actual graph building
        for chunk, metadata in zip(chunks, metadatas):
            # Extract entities and relationships from chunk
            # Store as graph nodes and edges
            pass
        
        return graph_nodes, graph_edges
    
    def build_rag_architecture(self, fabric_id: str, collection_name: str, 
                               documents: List[Dict], source: str,
                               chunk_size: int = 512, chunk_overlap: int = 64,
                               embedding_model: str = "text-embedding-3-large",
                               status_update_callback=None):
        """
        Complete RAG Pipeline
        Orchestrates all steps: Ingest → Chunk → Vectorize → Store → Graph
        """
        print(f"🚀 Starting RAG pipeline for fabric {fabric_id}")
        
        # Step 1: Create collection with correct embedding dimension
        print("📦 Creating Chroma collection...")
        embedding_dim = self.get_embedding_dimension(embedding_model)
        print(f"   Using embedding dimension: {embedding_dim} for model: {embedding_model}")
        collection = self.create_fabric_collection(fabric_id, collection_name, embedding_dimension=embedding_dim)
        
        # Step 2: Ingest documents (documents are already in dict format, just ensure they're properly formatted)
        print("📄 Ingesting documents...")
        # Documents are already in the correct format, no need to parse
        parsed_docs = documents
        
        # Step 3: Chunk documents
        print(f"✂️  Chunking documents (size: {chunk_size}, overlap: {chunk_overlap})...")
        chunks, chunk_ids, metadatas = self.chunk_documents(parsed_docs, chunk_size, chunk_overlap)
        
        # Step 4: Generate embeddings
        print(f"🔢 Generating embeddings ({embedding_model})...")
        print(f"   Processing {len(chunks)} chunks...")
        
        # Progress callback for embedding generation with status updates
        import time as time_module
        last_status_update = time_module.time()
        
        def embedding_progress(current, total):
            nonlocal last_status_update
            if current % 10 == 0 or current == total:
                progress_pct = int(current/total*100)
                print(f"   Progress: {current}/{total} chunks embedded ({progress_pct}%)")
                # Update status every 5 seconds to show it's still working
                current_time = time_module.time()
                if status_update_callback and (current_time - last_status_update) >= 5:
                    status_update_callback("Vectorizing")
                    last_status_update = current_time
        
        embeddings = self.generate_embeddings(chunks, embedding_model, progress_callback=embedding_progress)
        
        # Step 5: Store in Chroma
        print("💾 Storing in Chroma DB...")
        stored_count = self.store_in_chroma(fabric_id, chunks, embeddings, chunk_ids, metadatas)
        
        # Step 6: Build knowledge graph
        print("🕸️  Building knowledge graph...")
        graph_nodes, graph_edges = self.build_knowledge_graph(fabric_id, chunks, metadatas)
        
        print(f"✅ RAG architecture complete!")
        print(f"   - Chunks stored: {stored_count}")
        print(f"   - Graph nodes: {len(graph_nodes)}")
        print(f"   - Graph edges: {len(graph_edges)}")
        
        return {
            "chunks_stored": stored_count,
            "graph_nodes": len(graph_nodes),
            "graph_edges": len(graph_edges),
            "collection_name": collection_name
        }


class RAGQuery:
    """
    RAG Query Handler
    Handles querying the RAG architecture for chat responses
    """
    
    def __init__(self, chroma_path: str = "./chroma-data"):
        self.client = PersistentClient(path=chroma_path)
    
    def query_fabric(self, collection_name: str, query_text: str, 
                    query_embedding: List[float], n_results: int = 5):
        """
        Query a fabric's collection for relevant chunks
        """
        collection = self.client.get_collection(name=collection_name)
        
        # Query similar chunks
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        
        return results
    
    def build_rag_context(self, query_results: Dict, knowledge_graph_nodes: List = None):
        """
        Build context from retrieved chunks and knowledge graph
        """
        # Combine retrieved chunks
        context_chunks = []
        for i in range(len(query_results.get("ids", [])[0])):
            chunk_text = query_results["documents"][0][i]
            metadata = query_results["metadatas"][0][i]
            distance = query_results["distances"][0][i] if "distances" in query_results else None
            
            context_chunks.append({
                "text": chunk_text,
                "metadata": metadata,
                "similarity": 1 - distance if distance else None
            })
        
        # Add knowledge graph context if available
        if knowledge_graph_nodes:
            # Include related graph nodes
            pass
        
        return context_chunks
    
    def generate_response(self, user_query: str, rag_context: List[Dict], llm_model: str):
        """
        Generate LLM response using RAG context
        """
        from llm_service import generate_llm_response
        
        try:
            return generate_llm_response(
                user_query=user_query,
                rag_context=rag_context,
                llm_model=llm_model
            )
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    def get_source_articles(self, query_results: Dict) -> List[Dict]:
        """
        Extract source articles from query results
        """
        sources = []
        seen_docs = set()
        
        try:
            # Check if query_results has the expected structure
            if not query_results or "ids" not in query_results:
                return sources
            
            ids = query_results.get("ids", [])
            if not ids or len(ids) == 0:
                return sources
            
            metadatas = query_results.get("metadatas", [[]])
            documents = query_results.get("documents", [[]])
            
            # Ensure we have matching arrays
            num_results = len(ids[0]) if ids else 0
            
            for i in range(num_results):
                try:
                    metadata = metadatas[0][i] if metadatas and len(metadatas) > 0 and i < len(metadatas[0]) else {}
                    # Prioritize ServiceNow identifiers: number > sys_id > doc_id > id
                    doc_id = (
                        metadata.get("number") or      # ServiceNow incident number (e.g., INC0012345)
                        metadata.get("sys_id") or      # ServiceNow sys_id
                        metadata.get("doc_id") or      # Document ID from chunking
                        metadata.get("id") or          # Fallback to id
                        f"doc-{i}"                     # Last resort
                    )
                    
                    if doc_id and doc_id not in seen_docs:
                        seen_docs.add(doc_id)
                        doc_text = documents[0][i] if documents and len(documents) > 0 and i < len(documents[0]) else ""
                        snippet = (doc_text[:200] + "...") if doc_text else "No preview available"
                        
                        # Build title from metadata, prioritizing ServiceNow fields
                        title = (
                            metadata.get("short_description") or  # ServiceNow short_description
                            metadata.get("title") or              # Generic title
                            metadata.get("number") or              # Incident number
                            str(doc_id)                            # Fallback
                        )
                        
                        # Get link, try nav_link as fallback
                        link = metadata.get("link") or metadata.get("nav_link") or f"#doc-{doc_id}"
                        
                        sources.append({
                            "id": str(doc_id),
                            "title": title,
                            "snippet": snippet,
                            "link": link,
                            "table": metadata.get("table"),  # Store table for reference
                            "sys_id": metadata.get("sys_id")  # Store sys_id for reference
                        })
                except (IndexError, KeyError) as e:
                    # Skip this result if there's an issue
                    continue
        except Exception as e:
            # If anything goes wrong, return empty list rather than failing
            print(f"Warning: Error extracting source articles: {e}")
            return sources
        
        return sources


# Example usage
if __name__ == "__main__":
    # Initialize pipeline
    pipeline = RAGPipeline(chroma_path="./chroma-data")
    
    # Build RAG architecture for a fabric
    fabric_id = "fabric-123"
    result = pipeline.build_rag_architecture(
        fabric_id=fabric_id,
        collection_name="test-collection",
        documents=["Sample document text here..."],
        source="upload",
        chunk_size=512,
        chunk_overlap=64,
        embedding_model="azure-openai-embedding-1"
    )
    
    print(f"\n✅ Fabric {fabric_id} RAG architecture built!")
    print(result)

