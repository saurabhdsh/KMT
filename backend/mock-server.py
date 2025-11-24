#!/usr/bin/env python3
"""
Simple Mock Backend Server for Development
Provides mock API endpoints so frontend can work without real backend
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import uuid
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# In-memory storage (replace with real database)
fabrics_db = {}
conversations_db = {}

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
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat()
    }
    
    fabrics_db[fabric_id] = fabric
    return jsonify(fabric), 201

@app.route('/api/fabrics/<fabric_id>/upload', methods=['POST'])
def upload_documents(fabric_id):
    """Upload documents for a fabric"""
    if fabric_id not in fabrics_db:
        return jsonify({"error": "Fabric not found"}), 404
    
    # Update fabric status
    fabrics_db[fabric_id]["status"] = "Ingesting"
    fabrics_db[fabric_id]["updatedAt"] = datetime.now().isoformat()
    
    return jsonify({
        "success": True,
        "message": "Documents uploaded successfully"
    })

@app.route('/api/fabrics/<fabric_id>/build', methods=['POST'])
def trigger_build(fabric_id):
    """Trigger RAG architecture build"""
    if fabric_id not in fabrics_db:
        return jsonify({"error": "Fabric not found"}), 404
    
    # Simulate build process - update status
    fabric = fabrics_db[fabric_id]
    
    # In a real implementation, this would trigger async RAG pipeline
    # For now, we'll simulate the status progression
    status_sequence = ["Ingesting", "Chunking", "Vectorizing", "GraphBuilding", "Ready"]
    current_status = fabric.get("status", "Draft")
    
    try:
        current_index = status_sequence.index(current_status)
        if current_index < len(status_sequence) - 1:
            fabric["status"] = status_sequence[current_index + 1]
        else:
            fabric["status"] = "Ready"
    except ValueError:
        fabric["status"] = "Ingesting"
    
    fabric["updatedAt"] = datetime.now().isoformat()
    
    return jsonify({
        "status": fabric["status"],
        "message": f"Build started. Status: {fabric['status']}"
    })

@app.route('/api/chat', methods=['POST'])
def send_chat():
    """Send chat message with RAG"""
    data = request.json
    
    # Mock RAG response
    conversation_id = data.get("conversationId") or str(uuid.uuid4())
    
    # Get fabric to check if it's ready
    fabric_id = data.get("fabricId")
    if fabric_id and fabric_id in fabrics_db:
        fabric = fabrics_db[fabric_id]
        if fabric["status"] != "Ready":
            return jsonify({
                "error": "Fabric is not ready. Please wait for build to complete."
            }), 400
    
    # Mock assistant response
    user_message = data.get("messages", [])[-1] if data.get("messages") else None
    user_text = user_message.get("content", "") if user_message else ""
    
    assistant_message = {
        "id": f"msg-{uuid.uuid4()}",
        "role": "assistant",
        "content": f"This is a mock response to: '{user_text}'. In production, this would use RAG to query Chroma DB and generate a response using the selected LLM.",
        "createdAt": datetime.now().isoformat(),
        "sources": [
            {
                "id": "doc-1",
                "title": "Sample Knowledge Article",
                "snippet": "This is a sample snippet from the knowledge base...",
                "link": "#doc-1"
            }
        ]
    }
    
    # Store conversation
    if conversation_id not in conversations_db:
        conversations_db[conversation_id] = []
    
    conversations_db[conversation_id].extend(data.get("messages", []))
    conversations_db[conversation_id].append(assistant_message)
    
    return jsonify({
        "messages": conversations_db[conversation_id],
        "conversationId": conversation_id
    })

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """Submit user feedback"""
    data = request.json
    # In production, store feedback in database
    return jsonify({"success": True, "message": "Feedback received"})

@app.route('/api/connections/servicenow/test', methods=['POST'])
def test_servicenow():
    """Test ServiceNow connection"""
    data = request.json
    # Mock connection test
    return jsonify({
        "success": True,
        "message": "Connection test successful (mock)"
    })

@app.route('/api/connections/sharepoint/test', methods=['POST'])
def test_sharepoint():
    """Test SharePoint connection"""
    data = request.json
    # Mock connection test
    return jsonify({
        "success": True,
        "message": "Connection test successful (mock)"
    })

@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        "status": "ok",
        "message": "Mock backend server is running",
        "fabrics_count": len(fabrics_db)
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 4000))
    print(f"🚀 Starting mock backend server on http://localhost:{port}")
    print(f"📝 This is a development mock server")
    print(f"✅ Frontend can connect to: http://localhost:{port}")
    print(f"\nPress Ctrl+C to stop\n")
    app.run(host='0.0.0.0', port=port, debug=True)

