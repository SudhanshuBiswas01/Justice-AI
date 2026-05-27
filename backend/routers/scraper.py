from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from scraper.pipeline import ScraperPipeline
from scraper.db_manager import DBManager

router = APIRouter(prefix="/scraper", tags=["scraper"])

# Determine parent folder of backend directory (workspace root)
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKSPACE_ROOT = os.path.dirname(BACKEND_DIR)

pipeline = ScraperPipeline()
db = DBManager()

# Input validation schemas
class ScrapeRequest(BaseModel):
    source: str  # "indian_kanoon", "india_code", "consumer_grievance", "all"
    queries: List[str]
    max_results: Optional[int] = 5

class ResourceUpdate(BaseModel):
    title: str
    category: str
    doc_type: str
    court: Optional[str] = None
    act_name: Optional[str] = None
    section: Optional[str] = None
    year: Optional[int] = None
    cleaned_content: str
    metadata_json: Dict[str, Any]

# Trigger scrap in background
def bg_scrape_task(source: str, queries: List[str], max_results: int):
    try:
        pipeline.run_web_scrape(source, queries, max_results)
    except Exception as e:
        print(f"Background scrape failed: {e}")

@router.post("/scrape")
async def trigger_scrape(request: ScrapeRequest, background_tasks: BackgroundTasks):
    """Triggers web scraping in the background."""
    background_tasks.add_task(
        bg_scrape_task, 
        request.source, 
        request.queries, 
        request.max_results
    )
    return {
        "status": "ACCEPTED",
        "message": f"Web scraping job launched in the background for source '{request.source}'."
    }

# Sync and ingest local files in background or synchronously
def bg_ingest_task():
    try:
        pipeline.scan_and_ingest_workspace_pdfs(WORKSPACE_ROOT)
    except Exception as e:
        print(f"Background local sync failed: {e}")

@router.post("/ingest-local")
async def ingest_local_files(background_tasks: BackgroundTasks, async_mode: bool = False):
    """
    Scans the workspace root folder and ingests matching legal PDFs.
    Can be run synchronously or asynchronously.
    """
    if async_mode:
        background_tasks.add_task(bg_ingest_task)
        return {
            "status": "ACCEPTED",
            "message": "Local PDF scanning and ingestion task started in the background."
        }
    else:
        try:
            results = pipeline.scan_and_ingest_workspace_pdfs(WORKSPACE_ROOT)
            return {
                "status": "SUCCESS",
                "message": "Local PDF scanning and ingestion completed.",
                "details": results
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Local PDF ingestion failed: {str(e)}")

@router.get("/resources")
def list_resources(
    category: Optional[str] = None,
    source: Optional[str] = None,
    doc_type: Optional[str] = None,
    query: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Lists scraped resources with filters and search query support."""
    try:
        resources = db.list_resources(
            category=category,
            source=source,
            doc_type=doc_type,
            query=query,
            limit=limit,
            offset=offset
        )
        total = db.count_resources(category=category, source=source, doc_type=doc_type)
        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "resources": resources
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/resources/{resource_id}")
def get_resource(resource_id: str):
    """Gets details, clean text, and full metadata of a specific resource."""
    res = db.get_resource(resource_id)
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Also fetch its chunks for review
    chunks = db.list_chunks(resource_id)
    res["chunks"] = chunks
    return res

@router.put("/resources/{resource_id}")
def update_resource(resource_id: str, payload: ResourceUpdate):
    """Updates a resource's text or metadata tags (for manual curation)."""
    res = db.get_resource(resource_id)
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    try:
        # Merge manual edits back to DB
        db.save_resource(
            title=payload.title,
            source=res["source"],
            category=payload.category,
            doc_type=payload.doc_type,
            raw_content=res["raw_content"],  # Keep original raw text intact
            cleaned_content=payload.cleaned_content,
            court=payload.court,
            act_name=payload.act_name,
            section=payload.section,
            year=payload.year,
            metadata_json=payload.metadata_json,
            doc_id=resource_id
        )
        
        # Re-chunk since cleaned content could have changed
        from scraper.chunker import Chunker
        chunks = Chunker.chunk_document(resource_id, payload.cleaned_content, payload.metadata_json)
        db.clear_chunks(resource_id)
        for chunk in chunks:
            db.save_chunk(
                chunk_id=chunk["id"],
                resource_id=chunk["resource_id"],
                chunk_index=chunk["chunk_index"],
                content=chunk["content"],
                metadata_json=chunk["metadata_json"]
            )
            
        return {
            "status": "SUCCESS",
            "message": "Resource and RAG chunks successfully updated."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/resources/{resource_id}")
def delete_resource(resource_id: str):
    """Deletes a resource and its associated vector-embed chunks from the database."""
    deleted = db.delete_resource(resource_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Resource not found")
    return {
        "status": "SUCCESS",
        "message": "Resource and RAG chunks deleted successfully."
    }

@router.get("/logs")
def get_logs(limit: int = Query(50, ge=1, le=100)):
    """Fetches list of scraper execution logs."""
    try:
        logs = db.list_logs(limit=limit)
        return {"logs": logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_stats():
    """Returns database size, chunk volumes, and distributions for UI dashboard charts."""
    try:
        return db.get_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
