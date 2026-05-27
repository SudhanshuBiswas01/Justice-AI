import os
import sys

# Ensure the backend directory is in the python path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from scraper.pipeline import ScraperPipeline
from scraper.db_manager import DBManager

def main():
    print("=== Justice AI Scraper Pipeline Verification ===")
    
    # Initialize pipeline
    # This will create backend/data/legal_resources.db
    pipeline = ScraperPipeline()
    db = DBManager()
    
    # 1. Clear database for clean test
    print("[Test] Cleaning tables...")
    with db.get_connection() as conn:
        conn.execute("DELETE FROM legal_resources")
        conn.execute("DELETE FROM resource_chunks")
        conn.execute("DELETE FROM scrap_logs")
        conn.commit()
        
    print("[Test] Database initialized and cleared.")
    
    # 2. Ingest Workspace PDFs
    # Parent directory is workspace root
    workspace_root = os.path.dirname(BACKEND_DIR)
    print(f"[Test] Scanning workspace root: {workspace_root}")
    
    # Let's see if files exist
    files = [
        "THE MOTOR VEHICLES ACT, 1988.pdf",
        "Motor Vehicles (Amendment) Act, 2019.pdf",
        "THE CENTRAL MOTOR VEHICLES RULES, 19891.pdf",
        "TRAFFIC OFFENCE & FINE CHART.pdf"
    ]
    for f in files:
        path = os.path.join(workspace_root, "documents", "traffic_challan", f)
        if not os.path.exists(path):
            path = os.path.join(workspace_root, f)
        print(f" - {f}: {'Found' if os.path.exists(path) else 'NOT FOUND'}")
        
    print("[Test] Starting workspace PDF ingestion...")
    sync_results = pipeline.scan_and_ingest_workspace_pdfs(workspace_root)
    print(f"Ingested {sync_results['total_ingested']} of {sync_results['total_scanned']} PDFs.")
    for res in sync_results["results"]:
        print(f" - {res['file']}: {res['status']} {f'(ID: {res.get('id')})' if res.get('id') else ''}")
        
    # 3. Test Web Scraper (Indian Kanoon & India Code & Grievances)
    print("\n[Test] Testing online search and crawling...")
    crawl_results = pipeline.run_web_scrape(
        source="all", 
        queries=["MRP overcharging", "traffic challan helmet"], 
        max_results=1
    )
    print(f"Crawl completed. Status: {crawl_results['status']}")
    print(f"Ingested {crawl_results['items_ingested']} web resources.")
    for l in crawl_results["logs"]:
        print(f" - Log: {l}")
        
    # 4. Read Database Stats
    stats = db.get_stats()
    print("\n=== VERIFICATION STATS ===")
    print(f"Total Legal Documents: {stats['total_documents']}")
    print(f"Total RAG Chunks:      {stats['total_chunks']}")
    print("\nDocuments by Category:")
    for cat, count in stats["by_category"].items():
        print(f" - {cat}: {count}")
    print("\nDocuments by Source:")
    for src, count in stats["by_source"].items():
        print(f" - {src}: {count}")
    print("\nDocuments by Type:")
    for dtype, count in stats["by_doc_type"].items():
        print(f" - {dtype}: {count}")
        
    # Check if we have documents and chunks
    if stats["total_documents"] > 0 and stats["total_chunks"] > 0:
        print("\n[Success] Pipeline components verified! Database is healthy and loaded.")
        sys.exit(0)
    else:
        print("\n[Failure] Pipeline verification failed. Database is empty.")
        sys.exit(1)

if __name__ == "__main__":
    main()
