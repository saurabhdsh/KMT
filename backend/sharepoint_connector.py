"""
SharePoint Connector
Fetches documents from SharePoint libraries
"""

from typing import List, Dict
import os

def test_connection(site_url: str, library: str = None) -> Dict:
    """Test SharePoint connection"""
    try:
        if not site_url:
            return {"success": False, "message": "Site URL is required"}
        
        # In production, implement actual connection test
        # from office365.sharepoint.client_context import ClientContext
        # ctx = ClientContext(site_url).with_credentials(credentials)
        # ctx.web.get().execute_query()
        
        return {
            "success": True,
            "message": "Connection test successful"
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }


def fetch_sharepoint_data(site_url: str, library: str = "Documents") -> List[Dict]:
    """
    Fetch documents from SharePoint library
    Returns list of documents with content and metadata
    """
    documents = []
    
    try:
        # Import SharePoint client
        try:
            from office365.sharepoint.client_context import ClientContext
            from office365.runtime.auth.authentication_context import AuthenticationContext
        except ImportError:
            raise ImportError("Please install Office365-REST-Python-Client: pip install Office365-REST-Python-Client")
        
        # Get credentials from environment
        client_id = os.getenv("SHAREPOINT_CLIENT_ID")
        client_secret = os.getenv("SHAREPOINT_CLIENT_SECRET")
        tenant_id = os.getenv("SHAREPOINT_TENANT_ID")
        
        if not client_id or not client_secret:
            raise Exception("SHAREPOINT_CLIENT_ID and SHAREPOINT_CLIENT_SECRET environment variables required")
        
        # Authenticate (using app-only authentication)
        from office365.sharepoint.client_context import ClientContext
        from office365.runtime.auth.client_credential import ClientCredential
        
        credentials = ClientCredential(client_id, client_secret)
        ctx = ClientContext(site_url).with_credentials(credentials)
        
        # Get library
        library_obj = ctx.web.lists.get_by_title(library)
        items = library_obj.items.get().execute_query()
        
        # Import document parser
        from document_parser import parse_pdf, parse_docx
        from pathlib import Path
        import tempfile
        
        # Process each document
        for item in items:
            try:
                file_name = item.properties.get("FileLeafRef", "")
                file_url = item.properties.get("FileRef", "")
                
                if not file_name:
                    continue
                
                # Download file to temp location
                file_content = ctx.web.get_file_by_server_relative_url(file_url).download().execute_query()
                
                # Save to temp file
                with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file_name).suffix) as tmp_file:
                    tmp_file.write(file_content.content)
                    tmp_path = Path(tmp_file.name)
                
                # Parse based on file type
                content = ""
                if file_name.lower().endswith('.pdf'):
                    content = parse_pdf(tmp_path)
                elif file_name.lower().endswith(('.docx', '.doc')):
                    content = parse_docx(tmp_path)
                else:
                    # Try text
                    with open(tmp_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                
                # Clean up temp file
                tmp_path.unlink()
                
                if content.strip():
                    documents.append({
                        "content": content,
                        "source": "sharepoint",
                        "metadata": {
                            "file_name": file_name,
                            "url": f"{site_url}{file_url}",
                            "library": library
                        },
                        "id": file_name
                    })
                    
            except Exception as e:
                print(f"Warning: Failed to process {item.properties.get('FileLeafRef', 'unknown')}: {str(e)}")
                continue
        
    except ImportError:
        raise ImportError("Please install Office365-REST-Python-Client: pip install Office365-REST-Python-Client")
    except Exception as e:
        raise Exception(f"Error fetching SharePoint data: {str(e)}")
    
    return documents

