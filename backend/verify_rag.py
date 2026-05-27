import os
import sys

# Ensure the backend directory is in the python path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from rag.ingest_embeddings import run_embedding_ingestion
from rag.vector_store import VectorStore
from scraper.db_manager import DBManager

def main():
    print("=== Justice AI RAG Infrastructure Verification ===")
    
    db = DBManager()
    
    # 1. Check current DB statistics before indexing
    stats_before = db.get_stats()
    print("\n[Test] Statistics before indexing:")
    print(f" - Total Chunks: {stats_before['total_chunks']}")
    print(f" - Indexed Chunks: {stats_before['embedded_chunks']}")
    print(f" - Pending Chunks: {stats_before['unembedded_chunks']}")
    
    # Force re-indexing of all chunks
    print("[Test] Clearing existing embeddings to force re-indexing with optimized stop-words...")
    with db.get_connection() as conn:
        conn.execute("UPDATE resource_chunks SET embedding = NULL")
        conn.commit()
    
    # 2. Run embedding sync for all pending chunks
    print("\n[Test] Launching embedding synchronization pipeline...")
    sync_res = run_embedding_ingestion()
    elapsed = sync_res.get('elapsed_seconds', 0.0)
    print(f"Sync complete. Indexed {sync_res['indexed_count']} chunks in {elapsed:.2f} seconds.")
    
    # 3. Check current DB statistics after indexing
    stats_after = db.get_stats()
    print("\n[Test] Statistics after indexing:")
    print(f" - Total Chunks: {stats_after['total_chunks']}")
    print(f" - Indexed Chunks: {stats_after['embedded_chunks']}")
    print(f" - Pending Chunks: {stats_after['unembedded_chunks']}")
    
    # Verify that we have indexed everything
    if stats_after['unembedded_chunks'] > 0:
        print("[Warning] Some chunks failed to index.")
        
    # 4. Test Semantic Search Query
    print("\n[Test] Running semantic search query: 'what is the penalty for not wearing helmet?' in 'traffic_challan' category...")
    store = VectorStore()
    results = store.search(
        query="what is the penalty for not wearing helmet?",
        category="traffic_challan",
        top_k=3
    )
    
    print(f"Retrieved {len(results)} chunks:")
    for i, res in enumerate(results):
        meta = res["metadata"]
        print(f"\nResult #{i+1} (Score: {res['score']:.4f})")
        print(f" - Document: {meta.get('title')}")
        print(f" - Act: {meta.get('act_name')} | Section: {meta.get('section')} | Year: {meta.get('year')}")
        print(f" - Content snippet: {res['content'][:150]}...")

    # Validate that we retrieved the correct helmet fine sections
    has_helmet_act = any("129" in str(res["metadata"].get("section")) or "194D" in str(res["metadata"].get("section")) for res in results)
    
    # 5. Test Chat Context Injection Logic
    print("\n[Test] Simulating Chat Router Injection...")
    test_msg = "I got a ticket of 1000 for helmet, is it correct?"
    
    # Let's import chat logic components
    from routers.chat import SYSTEM_PROMPT
    
    # Mimic chat category detection and retrieval
    category = "traffic_challan"
    chunks = store.search(test_msg, category=category, top_k=2)
    
    context_segments = []
    for idx, chunk in enumerate(chunks):
        m = chunk["metadata"]
        context_segments.append(
            f"--- Reference Document #{idx+1} ({m.get('title')}, Section: {m.get('section')}) ---\n"
            f"{chunk['content'][:300]}..."
        )
    context_text = "\n\n".join(context_segments)
    
    augmented_prompt = SYSTEM_PROMPT
    if context_text:
        augmented_prompt += f"\n\n=== LEGAL CONTEXT RETRIEVED ===\n{context_text}\n============================"
        
    print("Augmented SYSTEM_PROMPT context preview:")
    print("-" * 50)
    # Print the end of the prompt where context is injected
    print(augmented_prompt[-600:])
    print("-" * 50)
    
    if len(results) > 0 and has_helmet_act:
        print("\n[Success] RAG Infrastructure successfully verified! Semantic search matches correct Acts.")
        sys.exit(0)
    else:
        print("\n[Failure] RAG Infrastructure verification failed. Matches were incorrect.")
        sys.exit(1)

if __name__ == "__main__":
    main()
