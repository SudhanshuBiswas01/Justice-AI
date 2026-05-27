import google.auth
import google.auth.transport.requests
from typing import Tuple, Optional

_cached_credentials = None
_cached_project_id = None

def get_gcp_credentials(force: bool = False) -> Tuple[Optional[str], Optional[str]]:
    """
    Loads Google Cloud Application Default Credentials (ADC) with caching.
    Returns (access_token, project_id) if available, otherwise (None, None).
    """
    global _cached_credentials, _cached_project_id
    try:
        if _cached_credentials is None:
            _cached_credentials, _cached_project_id = google.auth.default(
                scopes=['https://www.googleapis.com/auth/cloud-platform']
            )
            
        # Refresh token only if it's invalid/expired or forced (e.g., after a 401 error)
        if force or not _cached_credentials.valid:
            auth_req = google.auth.transport.requests.Request()
            _cached_credentials.refresh(auth_req)
            
        # Fallback to quota_project_id if default project_id is None
        proj_id = _cached_project_id or getattr(_cached_credentials, 'quota_project_id', None)
        return _cached_credentials.token, proj_id
    except Exception as e:
        # Silently fail if not authenticated (will fallback to local embeddings)
        return None, None
