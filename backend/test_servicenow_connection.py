#!/usr/bin/env python3
"""
Test script to debug ServiceNow connection issues
Run this to verify your ServiceNow credentials and connection
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file (not .env.example)
# load_dotenv() by default loads from .env file
env_file = Path('.env')
if not env_file.exists():
    print("⚠️  Warning: .env file not found!")
    print("   Please create .env file from .env.example template:")
    print("   cp .env.example .env")
    print("   Then edit .env with your actual credentials")
    print()
    print("   Note: .env.example is just a template - credentials are loaded from .env")
    print()

load_dotenv()  # Loads from .env file (not .env.example)

def test_servicenow_connection():
    """Test ServiceNow connection with detailed error reporting"""
    
    # Get credentials
    username = os.getenv("SERVICENOW_USERNAME", "")
    password = os.getenv("SERVICENOW_PASSWORD", "")
    
    print("=" * 60)
    print("ServiceNow Connection Test")
    print("=" * 60)
    print()
    print("Note: Instance URL should be provided when testing.")
    print("This script will prompt you for it, or you can set SERVICENOW_INSTANCE_URL in .env")
    print()
    
    # Get instance URL from env or prompt
    instance_url = os.getenv("SERVICENOW_INSTANCE_URL", "")
    if not instance_url:
        instance_url = input("Enter ServiceNow instance URL (e.g., dev12345.service-now.com): ").strip()
        if not instance_url:
            print("❌ Instance URL is required")
            return False
    
    if not username:
        print("❌ SERVICENOW_USERNAME not set in .env file")
        print("   Please add SERVICENOW_USERNAME=your-username to your .env file")
        return False
    
    if not password:
        print("❌ SERVICENOW_PASSWORD not set in .env file")
        print("   Please add SERVICENOW_PASSWORD=your-password to your .env file")
        return False
    
    print(f"✓ Instance URL: {instance_url}")
    print(f"✓ Username: {username}")
    print(f"✓ Password: {'*' * len(password)} (hidden)")
    print()
    
    # Normalize instance URL
    import re
    # Remove protocol if present
    normalized_instance = re.sub(r'^https?://', '', instance_url)
    # Remove path and query parameters (everything after the first / or ?)
    normalized_instance = normalized_instance.split('/')[0]  # Get everything before first /
    normalized_instance = normalized_instance.split('?')[0]   # Get everything before first ?
    # Remove trailing slash
    normalized_instance = normalized_instance.rstrip('/')
    # Extract just the instance name (pysnow automatically appends .service-now.com)
    if '.service-now.com' in normalized_instance:
        normalized_instance = normalized_instance.replace('.service-now.com', '')
    
    print(f"Normalized instance name: {normalized_instance}")
    print("(pysnow will automatically append .service-now.com)")
    print()
    
    # Try to import pysnow
    try:
        import pysnow
        print("✓ pysnow library imported successfully")
    except ImportError:
        print("❌ pysnow library not installed")
        print("   Run: pip install pysnow")
        return False
    
    # Try to create client
    try:
        print("Attempting to create ServiceNow client...")
        client = pysnow.Client(
            instance=normalized_instance,
            user=username,
            password=password
        )
        print("✓ Client created successfully")
    except Exception as e:
        print(f"❌ Failed to create client: {e}")
        return False
    
    # Try to query a table
    try:
        print("Attempting to query 'incident' table...")
        resource = client.resource(api_path='/table/incident')
        response = resource.get(limit=1)
        records = list(response.all())
        print(f"✓ Connection successful! Retrieved {len(records)} record(s)")
        print()
        
        # Ask if user wants to create mock test incidents
        create_mock = input("Would you like to create some mock test incidents? (y/n): ").strip().lower()
        if create_mock == 'y':
            create_mock_incidents(client, normalized_instance)
        
        return True
    except ValueError as e:
        error_msg = str(e)
        if "Expecting value" in error_msg or "char 0" in error_msg:
            print("❌ Authentication failed - JSON parsing error")
            print()
            print("This usually means:")
            print("1. Incorrect username or password")
            print("2. User account is locked, disabled, or expired")
            print("3. User doesn't have API access (requires 'rest_api_explorer' role)")
            print("4. Instance URL is incorrect")
            print()
            print("Troubleshooting:")
            print("- Try logging into ServiceNow web UI with the same credentials")
            print("- Check that the user has the 'rest_api_explorer' role")
            print("- Verify the instance URL format: dev12345.service-now.com")
            return False
        else:
            print(f"❌ Unexpected error: {e}")
            return False
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        error_msg = str(e)
        if "401" in error_msg or "Unauthorized" in error_msg:
            print("   → Authentication failed (401 Unauthorized)")
        elif "403" in error_msg or "Forbidden" in error_msg:
            print("   → Access forbidden (403) - user may not have API access")
        elif "404" in error_msg:
            print("   → Resource not found (404)")
        return False


def create_mock_incidents(client, instance_name):
    """Create mock test incidents in ServiceNow"""
    print()
    print("=" * 60)
    print("Creating Mock Test Incidents")
    print("=" * 60)
    print()
    
    try:
        resource = client.resource(api_path='/table/incident')
        
        # Mock incident templates
        mock_incidents = [
            {
                "short_description": "Network connectivity issue affecting multiple users",
                "description": "Users in the Finance department are experiencing intermittent network connectivity issues. The problem started this morning around 9 AM. Multiple users have reported being unable to access shared drives and email servers.",
                "urgency": "2",
                "impact": "2",
                "category": "Network",
                "subcategory": "Connectivity"
            },
            {
                "short_description": "Printer not responding in Marketing department",
                "description": "The HP LaserJet printer in the Marketing department (Room 205) is not responding to print jobs. The printer shows an error message 'Paper Jam' but there is no paper jam visible. Users are unable to print documents.",
                "urgency": "3",
                "impact": "3",
                "category": "Hardware",
                "subcategory": "Printer"
            },
            {
                "short_description": "Email delivery delays reported by IT team",
                "description": "IT team members have reported that emails are taking longer than usual to be delivered. Some emails are delayed by 15-30 minutes. This is affecting time-sensitive communications with external clients.",
                "urgency": "2",
                "impact": "2",
                "category": "Software",
                "subcategory": "Email"
            },
            {
                "short_description": "Application access denied for new employee",
                "description": "New employee John Smith (Employee ID: 12345) is unable to access the CRM application. He receives an 'Access Denied' error when trying to log in. His account was created yesterday and he should have access to this application.",
                "urgency": "3",
                "impact": "3",
                "category": "Access",
                "subcategory": "Application Access"
            },
            {
                "short_description": "Slow performance on database server",
                "description": "The production database server (DB-PROD-01) is experiencing slow query performance. Response times have increased from 2-3 seconds to 15-20 seconds for complex queries. This is affecting multiple business applications that depend on this database.",
                "urgency": "1",
                "impact": "1",
                "category": "Infrastructure",
                "subcategory": "Database"
            }
        ]
        
        created_count = 0
        failed_count = 0
        
        for i, incident_data in enumerate(mock_incidents, 1):
            try:
                print(f"Creating incident {i}/{len(mock_incidents)}: {incident_data['short_description'][:50]}...")
                result = resource.create(payload=incident_data)
                incident_number = result.get('number', 'N/A')
                print(f"  ✓ Created incident: {incident_number}")
                created_count += 1
            except Exception as e:
                print(f"  ✗ Failed to create incident: {str(e)}")
                failed_count += 1
        
        print()
        print("=" * 60)
        print(f"Mock Incident Creation Summary")
        print("=" * 60)
        print(f"✓ Successfully created: {created_count} incident(s)")
        if failed_count > 0:
            print(f"✗ Failed to create: {failed_count} incident(s)")
        print()
        print(f"You can view these incidents in ServiceNow:")
        print(f"https://{instance_name}.service-now.com/nav_to.do?uri=%2Fincident_list.do")
        print()
        
    except Exception as e:
        print(f"❌ Error creating mock incidents: {e}")
        print("   Make sure the user has 'itil' role or 'incident_manager' role to create incidents")


if __name__ == "__main__":
    success = test_servicenow_connection()
    sys.exit(0 if success else 1)

