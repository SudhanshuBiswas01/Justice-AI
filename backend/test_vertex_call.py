import sys
import os
import requests

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rag.gcp_auth import get_gcp_credentials

token, project = get_gcp_credentials()
print(f"Token: {token[:10] if token else None}..., Project: {project}")

if token and project:
    url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{project}/locations/us-central1/publishers/google/models/gemini-2.5-pro:generateContent"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": "Hello, respond with exactly 'Pro Success'"}]
            }
        ]
    }
    print("Sending request to Vertex AI gemini-2.5-pro...")
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=25)
        print(f"Status Code: {res.status_code}")
        print(f"Response: {res.text}")
    except Exception as e:
        print(f"Error calling Vertex: {e}")
else:
    print("GCP credentials not available.")
