import os
import sqlite3
import json
import shutil

# Paths
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_ROOT = os.path.dirname(BACKEND_DIR)
DB_PATH = os.path.join(BACKEND_DIR, "data", "legal_resources.db")
DOCS_DIR = os.path.join(WORKSPACE_ROOT, "documents")

CATEGORIES = ["traffic_challan", "mrp_overcharging", "consumer_dispute", "refund", "grievance_system"]

def main():
    print("=== Organizing Legal Documents for RAG ===")
    
    # 1. Create directory structure
    for cat in CATEGORIES:
        path = os.path.join(DOCS_DIR, cat)
        os.makedirs(path, exist_ok=True)
        print(f"Created/Verified folder: documents/{cat}/")

    # 2. Move existing local PDFs in the root to documents/traffic_challan/
    pdf_files = [
        "THE MOTOR VEHICLES ACT, 1988.pdf",
        "Motor Vehicles (Amendment) Act, 2019.pdf",
        "THE CENTRAL MOTOR VEHICLES RULES, 19891.pdf",
        "TRAFFIC OFFENCE & FINE CHART.pdf"
    ]
    
    traffic_challan_dir = os.path.join(DOCS_DIR, "traffic_challan")
    for pdf in pdf_files:
        src_path = os.path.join(WORKSPACE_ROOT, pdf)
        dest_path = os.path.join(traffic_challan_dir, pdf)
        
        if os.path.exists(src_path):
            try:
                # Copy or move
                shutil.move(src_path, dest_path)
                print(f"Moved: {pdf} -> documents/traffic_challan/{pdf}")
            except Exception as e:
                print(f"Error moving {pdf}: {e}")
        elif os.path.exists(dest_path):
            print(f"Already in place: documents/traffic_challan/{pdf}")
        else:
            print(f"File not found: {pdf}")

    # 3. Connect to SQLite database and dump text files for scraped resources
    if os.path.exists(DB_PATH):
        print("\nExporting database resources to documents folder...")
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Update PDF path references in database first
        for pdf in pdf_files:
            new_local_path = os.path.join(traffic_challan_dir, pdf)
            # Find resources that are PDFs
            cursor.execute("SELECT id, title, metadata_json FROM legal_resources WHERE title LIKE ?", (f"%{pdf.replace('.pdf', '')}%",))
            row = cursor.fetchone()
            if row:
                try:
                    meta = json.loads(row["metadata_json"])
                    meta["local_path"] = new_local_path
                    cursor.execute(
                        "UPDATE legal_resources SET metadata_json = ? WHERE id = ?",
                        (json.dumps(meta), row["id"])
                    )
                    print(f"Updated DB path reference for: {pdf}")
                except Exception as e:
                    print(f"Failed to update metadata for {pdf}: {e}")
        
        # Read and export all documents
        cursor.execute("SELECT id, title, category, doc_type, cleaned_content, source, metadata_json FROM legal_resources")
        rows = cursor.fetchall()
        
        for row in rows:
            # We don't need to write text files for PDFs since they exist as PDFs,
            # but we can write them as text files too so RAG can read them directly as text!
            # Let's write txt files for all documents to make RAG ingestion simple and unified.
            title_clean = "".join([c if c.isalnum() or c in " _-" else "_" for c in row["title"]]).strip()
            # Truncate title if too long
            title_clean = title_clean[:60]
            
            file_name = f"{title_clean}.txt"
            cat_dir = os.path.join(DOCS_DIR, row["category"])
            file_path = os.path.join(cat_dir, file_name)
            
            try:
                # Write cleaned content
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(f"TITLE: {row['title']}\n")
                    f.write(f"SOURCE: {row['source']}\n")
                    f.write(f"CATEGORY: {row['category']}\n")
                    f.write(f"TYPE: {row['doc_type']}\n")
                    f.write("="*60 + "\n\n")
                    f.write(row["cleaned_content"])
                
                print(f"Exported text file: documents/{row['category']}/{file_name}")
            except Exception as e:
                print(f"Error exporting text file for {row['title']}: {e}")
                
        conn.commit()
        conn.close()
        print("\nAll database resources successfully synced and exported to files!")
    else:
        print("\nDatabase not found. Make sure pipeline has been run first.")

if __name__ == "__main__":
    main()
