# Justice AI - Implementation Notes & Blockers

## Overview
This document tracks the major roadblocks ("blockers") encountered during the development and stabilization of the Justice AI backend and how they were systematically resolved.

## Blocker 1: Python Relative Imports and Module Execution
**Issue:**
When running the FastAPI backend via Uvicorn, the server would fail with `ImportError: attempted relative import with no known parent package` or `No module named 'rag'`. 
Additionally, making API calls to `/api/chat` threw an HTTP 500 error returning `{"detail":"attempted relative import beyond top-level package"}`.

**Root Cause:**
The backend was originally designed with a mixture of relative imports (e.g., `from ..rag.gcp_auth import get_gcp_credentials`) and absolute imports (e.g., `from rag.vector_store import VectorStore`). 
- When running `python -m uvicorn backend.main:app` from the root workspace directory, the top-level package was `backend`. Absolute imports like `from rag.vector_store` failed because Python was looking for a top-level `rag` package (which didn't exist in `sys.path` since it was nested under `backend`).
- When running `uvicorn main:app` directly inside the `backend` folder, the relative imports inside `main.py` (`from .routers import chat`) failed because Python treats directly executed scripts as the `__main__` module, stripping their package context.
- When `routers` became the top-level package, doing `from ..rag` inside `routers/chat.py` caused an "attempted relative import beyond top-level package" error.

**How We Tackled It:**
We standardized the backend to run from within the `backend/` directory (`cd backend && uvicorn main:app`) and restructured all imports to be absolute relative to the `backend/` folder:

1. **Removed leading dots in `main.py`**:
   - Changed `from .routers import chat, scraper` to `from routers import chat, scraper`.
2. **Fixed router relative imports**:
   - In `backend/routers/chat.py`, changed `from ..rag.*` to `from rag.*`.
   - In `backend/routers/scraper.py`, changed `from ..scraper.*` to `from scraper.*` and `from ..rag.*` to `from rag.*`.
3. **Fixed RAG pipeline relative imports**:
   - In `backend/rag/vector_store.py` and `backend/rag/ingest_embeddings.py`, changed `from ..scraper.db_manager import DBManager` to `from scraper.db_manager import DBManager`.

By treating `backend/` as the project root (adding it implicitly to `sys.path`), all absolute imports (`from rag.*`, `from scraper.*`, `from routers.*`) now work uniformly whether the server is started via Uvicorn or individual scripts (like `verify_rag.py`) are run directly.

## Blocker 2: Frontend Connection to Backend API
**Issue:**
The Next.js frontend Chat window threw a "Failed to get response from server" error upon submission. 

**Root Cause:**
The frontend was aggressively requesting `http://localhost:8000/api/chat`, but the backend server was either not running or returning 500 Internal Server Errors due to the import issues mentioned above. Additionally, the CORS origins did not account for all local IPv4 address variations.

**How We Tackled It:**
- Fixed the backend's internal crashes (Blocker 1) so it gracefully handles requests.
- Explicitly verified that the FastAPI CORS middleware in `main.py` allowed `http://localhost:3000` and `http://127.0.0.1:3000` to prevent silently failing cross-origin preflight requests.
