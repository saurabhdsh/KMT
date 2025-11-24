"""
ServiceNow Connector
Fetches data from ServiceNow tables
"""

from typing import List, Dict, Optional
import os
import re


def normalize_instance_url(instance_url: str) -> str:
    """
    Normalize ServiceNow instance URL to format expected by pysnow.
    pysnow expects just the instance name (e.g., 'dev278383'), not the full hostname.
    The library automatically appends '.service-now.com'.
    Examples:
    - https://dev278383.service-now.com -> dev278383
    - http://dev278383.service-now.com -> dev278383
    - dev278383.service-now.com -> dev278383
    - dev278383 -> dev278383
    - https://dev278383.service-now.com/login.do?... -> dev278383
    """
    if not instance_url:
        return instance_url
    
    # Remove protocol if present
    instance_url = re.sub(r'^https?://', '', instance_url)
    
    # Remove path and query parameters (everything after the first / or ?)
    # Extract just the hostname
    instance_url = instance_url.split('/')[0]  # Get everything before first /
    instance_url = instance_url.split('?')[0]   # Get everything before first ?
    
    # Remove trailing slash
    instance_url = instance_url.rstrip('/')
    
    # Extract just the instance name (remove .service-now.com if present)
    # pysnow automatically appends .service-now.com, so we only need the instance name
    if '.service-now.com' in instance_url:
        instance_url = instance_url.replace('.service-now.com', '')
    
    return instance_url


def test_connection(instance_url: str, tables: List[str] = None) -> Dict:
    """Test ServiceNow connection"""
    try:
        if not instance_url:
            return {"success": False, "message": "Instance URL is required"}
        
        # Get credentials from environment
        username = os.getenv("SERVICENOW_USERNAME")
        password = os.getenv("SERVICENOW_PASSWORD")
        
        if not username or not password:
            return {
                "success": False,
                "message": "SERVICENOW_USERNAME and SERVICENOW_PASSWORD environment variables are not set. Please set them in your .env file first."
            }
        
        # Try to import pysnow and test actual connection
        try:
            import pysnow
        except ImportError:
            return {
                "success": False,
                "message": "pysnow library is not installed. Please install it: pip install pysnow"
            }
        
        # Test actual connection
        try:
            # Normalize instance URL (remove protocol if present)
            normalized_instance = normalize_instance_url(instance_url)
            
            # Validate instance format (after normalization, should be just the instance name)
            if not normalized_instance:
                return {
                    "success": False,
                    "message": f"Invalid instance URL format. Expected format: 'dev12345.service-now.com' or 'dev12345', but got: '{instance_url}'. Please check your instance URL."
                }
            
            # Validate that it looks like a valid instance name (alphanumeric and hyphens)
            if not re.match(r'^[a-zA-Z0-9_-]+$', normalized_instance):
                return {
                    "success": False,
                    "message": f"Invalid instance name format. Instance name should contain only letters, numbers, hyphens, and underscores. Got: '{normalized_instance}' (from '{instance_url}')"
                }
            
            client = pysnow.Client(
                instance=normalized_instance,
                user=username,
                password=password
            )
            
            # Try to query a table to verify connection
            if tables and len(tables) > 0:
                test_table = tables[0].strip()
            else:
                test_table = "incident"
            
            resource = client.resource(api_path=f'/table/{test_table}')
            
            # Try to get records - this will fail if authentication is wrong
            try:
                response = resource.get(limit=1)
                
                # Try to get records - this is where JSON parsing happens
                records = list(response.all())
                
                # If we get here, connection is successful
                return {
                    "success": True,
                    "message": f"Connection test successful. Found {len(records)} record(s) in {test_table} table."
                }
            except (ValueError, TypeError) as parse_error:
                # JSON parsing error - usually means HTML response (authentication failed)
                error_msg = str(parse_error)
                if "Expecting value" in error_msg or "JSON" in error_msg or "char 0" in error_msg:
                    return {
                        "success": False,
                        "message": "Authentication failed. The ServiceNow API returned an HTML page instead of JSON.\n\nCommon causes:\n1. Incorrect username or password\n2. User account is locked, disabled, or expired\n3. User doesn't have API access (requires 'rest_api_explorer' role)\n4. Instance URL format is incorrect\n\nTroubleshooting steps:\n- Verify credentials in your .env file\n- Log into ServiceNow web UI with the same credentials to confirm they work\n- Check that the user has the 'rest_api_explorer' role assigned\n- Verify instance URL format: 'dev12345.service-now.com' (without https://)"
                    }
                else:
                    raise parse_error
            except Exception as parse_error:
                # Other errors
                error_msg = str(parse_error)
                # Check for common error patterns
                if "401" in error_msg or "Unauthorized" in error_msg:
                    return {
                        "success": False,
                        "message": "Authentication failed (401 Unauthorized). Please verify your ServiceNow username and password are correct."
                    }
                elif "403" in error_msg or "Forbidden" in error_msg:
                    return {
                        "success": False,
                        "message": "Access forbidden (403). The user may not have API access. Please ensure the user has the 'rest_api_explorer' role in ServiceNow."
                    }
                elif "404" in error_msg or "Not Found" in error_msg:
                    return {
                        "success": False,
                        "message": f"Table not found (404). The table '{test_table}' may not exist or the user doesn't have access to it."
                    }
                else:
                    raise parse_error
                    
        except Exception as conn_error:
            error_msg = str(conn_error)
            # Provide more helpful error messages
            if "Expecting value" in error_msg:
                return {
                    "success": False,
                    "message": "Authentication failed. Please verify your ServiceNow username and password are correct and the user has API access."
                }
            elif "HTTPSConnectionPool" in error_msg or "Connection" in error_msg:
                return {
                    "success": False,
                    "message": f"Could not connect to ServiceNow instance. Please verify the instance URL is correct: {instance_url}"
                }
            else:
                return {
                    "success": False,
                    "message": f"Connection failed: {error_msg}"
                }
        
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }


def fetch_servicenow_data(instance_url: str, tables: List[str] = None) -> List[Dict]:
    """
    Fetch data from ServiceNow tables
    Returns list of documents with content and metadata
    """
    documents = []
    
    if not tables:
        tables = ["incident", "kb_knowledge"]
    
    try:
        # Import ServiceNow client
        try:
            import pysnow
        except ImportError:
            raise ImportError("Please install pysnow: pip install pysnow")
        
        # Get credentials from environment
        username = os.getenv("SERVICENOW_USERNAME")
        password = os.getenv("SERVICENOW_PASSWORD")
        
        if not username or not password:
            raise Exception("SERVICENOW_USERNAME and SERVICENOW_PASSWORD environment variables required")
        
        # Normalize instance URL (remove protocol if present)
        normalized_instance = normalize_instance_url(instance_url)
        
        # Create client
        client = pysnow.Client(
            instance=normalized_instance,
            user=username,
            password=password
        )
        
        # Fetch data from each table
        for table in tables:
            try:
                resource = client.resource(api_path=f'/table/{table}')
                response = resource.get(limit=100)  # Limit to 100 records per table
                
                # Convert generator to list to catch JSON parsing errors early
                try:
                    records = list(response.all())
                except Exception as parse_error:
                    error_msg = str(parse_error)
                    if "Expecting value" in error_msg or "JSON" in error_msg:
                        raise Exception(f"Failed to parse response from table {table}. This usually means authentication failed or the user doesn't have access to this table. Please check your credentials and table permissions.")
                    else:
                        raise
                
                for record in records:
                    # Extract text from record
                    text_parts = []
                    
                    # Common fields to extract
                    if 'short_description' in record:
                        text_parts.append(record['short_description'])
                    if 'description' in record:
                        text_parts.append(record['description'])
                    if 'text' in record:
                        text_parts.append(record['text'])
                    if 'question' in record:
                        text_parts.append(record['question'])
                    if 'answer' in record:
                        text_parts.append(record['answer'])
                    
                    text = " ".join(text_parts)
                    
                    if text.strip():
                        # Ensure link uses proper URL format (with https://)
                        link_url = instance_url
                        if not link_url.startswith(('http://', 'https://')):
                            link_url = f"https://{link_url}"
                        
                        # Build ServiceNow link - use both nav_to format and direct format
                        sys_id = record.get("sys_id")
                        incident_number = record.get("number")
                        
                        # Primary link: Direct table link (more reliable)
                        if sys_id:
                            direct_link = f"{link_url}/{table}.do?sys_id={sys_id}"
                            # Also create nav_to link as fallback
                            nav_link = f"{link_url}/nav_to.do?uri=%2F{table}.do%3Fsys_id%3D{sys_id}"
                            # Use direct link as primary, nav_to as fallback
                            primary_link = direct_link
                        else:
                            # If no sys_id, try to search by number
                            primary_link = f"{link_url}/{table}_list.do?sysparm_query=number={incident_number}" if incident_number else link_url
                            nav_link = primary_link
                        
                        documents.append({
                            "content": text,
                            "source": "servicenow",
                            "metadata": {
                                "table": table,
                                "sys_id": sys_id,
                                "number": incident_number,
                                "short_description": record.get("short_description"),  # Add for better titles
                                "link": primary_link,
                                "nav_link": nav_link  # Store both for flexibility
                            },
                            "id": f"{table}-{sys_id or incident_number or ''}"
                        })
                        
            except Exception as e:
                print(f"Warning: Failed to fetch from table {table}: {str(e)}")
                continue
        
    except ImportError:
        raise ImportError("Please install pysnow: pip install pysnow")
    except Exception as e:
        raise Exception(f"Error fetching ServiceNow data: {str(e)}")
    
    return documents

