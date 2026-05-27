import os
import sys
import time
from typing import List, Dict, Any, Optional, Callable

# Ensure backend directory is in python path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from scraper.db_manager import DBManager
from rag.embeddings import EmbeddingHelper

def run_embedding_ingestion(db_path: Optional[str] = None, 
                             progress_callback: Optional[Callable[[str], None]] = None) -> Dict[str, Any]:
    """
    Identifies chunks in SQLite without embeddings, generates them in batches,
    and updates SQLite records.
    """
    def log(msg: str):
        print(msg)
        if progress_callback:
            progress_callback(msg)

    db = DBManager(db_path) if db_path else DBManager()
    embedder = EmbeddingHelper()
    
    log("[Ingest] Scanning SQLite database for unindexed chunks...")
    unindexed = db.get_unindexed_chunks()
    
    total = len(unindexed)
    if total == 0:
        log("[Ingest] All chunks are already indexed! Vector embeddings are up to date.")
        return {"status": "SUCCESS", "indexed_count": 0, "message": "All chunks already indexed."}
        
    log(f"[Ingest] Found {total} unindexed chunks. Commencing batch embedding processing...")
    
    batch_size = 20
    indexed_count = 0
    start_time = time.time()
    
    for i in range(0, total, batch_size):
        batch_chunks = unindexed[i : i + batch_size]
        chunk_ids = [c["id"] for c in batch_chunks]
        texts = [c["content"] for c in batch_chunks]
        
        try:
            log(f"[Ingest] Generating embeddings for batch {i//batch_size + 1} ({len(batch_chunks)} chunks)...")
            embeddings = embedder.get_embeddings_batch(texts)
            
            if len(embeddings) != len(batch_chunks):
                log(f"[Ingest] Warning: Embedding count mismatch in batch! Expected {len(batch_chunks)}, got {len(embeddings)}.")
                # Fallback to individual embeddings to salvage batch
                embeddings = []
                for text in texts:
                    embeddings.append(embedder.get_embedding(text))
            
            # Prepare batch save payload
            save_batch = []
            for cid, emb in zip(chunk_ids, embeddings):
                save_batch.append((cid, emb))
                
            db.save_chunk_embeddings_batch(save_batch)
            indexed_count += len(batch_chunks)
            
            pct = (indexed_count / total) * 100
            elapsed = time.time() - start_time
            rate = indexed_count / elapsed if elapsed > 0 else 0
            eta = (total - indexed_count) / rate if rate > 0 else 0
            
            log(f"[Ingest] Progress: {indexed_count}/{total} chunks ({pct:.1f}%) | Speed: {rate:.1f} chunks/sec | ETA: {eta:.1f}s")
            
            # Brief pause to respect API rate limits (only if using cloud providers)
            if embedder.provider != "fallback":
                time.sleep(0.5)
                
        except Exception as e:
            log(f"[Ingest] Error processing batch starting at index {i}: {e}")
            # Try single-item save fallback for this batch
            for chunk in batch_chunks:
                try:
                    emb = embedder.get_embedding(chunk["content"])
                    db.save_chunk_embedding(chunk["id"], emb)
                    indexed_count += 1
                except Exception as ex:
                    log(f"[Ingest] Failed to embed chunk {chunk['id']}: {ex}")

    total_time = time.time() - start_time
    success_msg = f"[Ingest] Embedding sync complete! Indexed {indexed_count} chunks in {total_time:.2f} seconds."
    log(success_msg)
    
    # Log event to database scrap_logs
    db.add_log(
        source=f"Embedder ({embedder.provider})", 
        query="Sync All Chunks", 
        status="SUCCESS", 
        items_scraped=indexed_count, 
        log_message=success_msg
    )
    
    return {
        "status": "SUCCESS",
        "indexed_count": indexed_count,
        "elapsed_seconds": total_time
    }

if __name__ == "__main__":
    run_embedding_ingestion()
