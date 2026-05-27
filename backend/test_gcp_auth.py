import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("Testing GCP Auth...")
try:
    from rag.gcp_auth import get_gcp_credentials
    print("Calling get_gcp_credentials()...")
    token, project = get_gcp_credentials()
    token_snippet = token[:15] if token else None
    print(f"Result: Token={token_snippet}..., Project={project}")
except Exception as e:
    print(f"Error occurred: {e}")
