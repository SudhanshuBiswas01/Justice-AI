import google.auth
import google.auth.transport.requests
from typing import Tuple, Optional

def get_gcp_credentials() -> Tuple[Optional[str], Optional[str]]:
    """
    Loads Google Cloud Application Default Credentials (ADC).
    Returns (access_token, project_id) if available, otherwise (None, None).
    """
    try:
        credentials, project_id = google.auth.default(
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        auth_req = google.auth.transport.requests.Request()
        credentials.refresh(auth_req)
        
        # Fallback to quota_project_id if default project_id is None
        proj_id = project_id or getattr(credentials, 'quota_project_id', None)
        return credentials.token, proj_id
    except Exception as e:
        # Silently fail if not authenticated (will fallback to local embeddings)
        return None, None
