import sqlite3
import json
import os
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime

# Default database path inside the backend directory
DEFAULT_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
DEFAULT_DB_PATH = os.path.join(DEFAULT_DB_DIR, "legal_resources.db")

class DBManager:
    def __init__(self, db_path: str = DEFAULT_DB_PATH):
        self.db_path = db_path
        # Ensure database directory exists
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.init_db()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Access columns by name
        return conn

    def init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # 1. Create legal_resources table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS legal_resources (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    source TEXT NOT NULL,
                    category TEXT NOT NULL,
                    doc_type TEXT NOT NULL,
                    court TEXT,
                    act_name TEXT,
                    section TEXT,
                    year INTEGER,
                    raw_content TEXT,
                    cleaned_content TEXT,
                    metadata_json TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 2. Create resource_chunks table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS resource_chunks (
                    id TEXT PRIMARY KEY,
                    resource_id TEXT NOT NULL,
                    chunk_index INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    metadata_json TEXT NOT NULL,
                    FOREIGN KEY(resource_id) REFERENCES legal_resources(id) ON DELETE CASCADE
                )
            """)

            # 3. Create scrap_logs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS scrap_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source TEXT,
                    query TEXT,
                    status TEXT,
                    items_scraped INTEGER,
                    log_message TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Enable FTS5 (Full Text Search) for fast searches if supported
            try:
                cursor.execute("""
                    CREATE VIRTUAL TABLE IF NOT EXISTS legal_resources_fts USING fts5(
                        id UNINDEXED,
                        title,
                        cleaned_content,
                        category UNINDEXED,
                        source UNINDEXED,
                        content='legal_resources',
                        content_rowid='rowid'
                    )
                """)
                
                # Triggers to keep FTS table in sync
                cursor.execute("""
                    CREATE TRIGGER IF NOT EXISTS legal_resources_ai AFTER INSERT ON legal_resources BEGIN
                        INSERT INTO legal_resources_fts(rowid, id, title, cleaned_content, category, source)
                        VALUES (new.rowid, new.id, new.title, new.cleaned_content, new.category, new.source);
                    END;
                """)
                cursor.execute("""
                    CREATE TRIGGER IF NOT EXISTS legal_resources_ad AFTER DELETE ON legal_resources BEGIN
                        INSERT INTO legal_resources_fts(legal_resources_fts, rowid, id, title, cleaned_content, category, source)
                        VALUES('delete', old.rowid, old.id, old.title, old.cleaned_content, old.category, old.source);
                    END;
                """)
                cursor.execute("""
                    CREATE TRIGGER IF NOT EXISTS legal_resources_au AFTER UPDATE ON legal_resources BEGIN
                        INSERT INTO legal_resources_fts(legal_resources_fts, rowid, id, title, cleaned_content, category, source)
                        VALUES('delete', old.rowid, old.id, old.title, old.cleaned_content, old.category, old.source);
                        INSERT INTO legal_resources_fts(rowid, id, title, cleaned_content, category, source)
                        VALUES (new.rowid, new.id, new.title, new.cleaned_content, new.category, new.source);
                    END;
                """)
            except sqlite3.OperationalError as e:
                # If FTS5 is not compiled/available, fallback gracefully (FTS is nice-to-have, not strict blocker)
                print(f"Warning: FTS5 setup skipped due to error: {e}")

            conn.commit()

    def save_resource(self, 
                      title: str, 
                      source: str, 
                      category: str, 
                      doc_type: str, 
                      raw_content: str, 
                      cleaned_content: str, 
                      court: Optional[str] = None, 
                      act_name: Optional[str] = None, 
                      section: Optional[str] = None, 
                      year: Optional[int] = None, 
                      metadata_json: Optional[Dict[str, Any]] = None,
                      doc_id: Optional[str] = None) -> str:
        
        if not doc_id:
            # Generate deterministic UUID based on title & source or unique uuid
            doc_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{source}:{title}"))
            
        metadata_str = json.dumps(metadata_json or {})
        now = datetime.utcnow().isoformat()

        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Check if document already exists
            cursor.execute("SELECT id FROM legal_resources WHERE id = ?", (doc_id,))
            exists = cursor.fetchone()

            if exists:
                cursor.execute("""
                    UPDATE legal_resources
                    SET title = ?, source = ?, category = ?, doc_type = ?, 
                        court = ?, act_name = ?, section = ?, year = ?, 
                        raw_content = ?, cleaned_content = ?, metadata_json = ?, 
                        updated_at = ?
                    WHERE id = ?
                """, (title, source, category, doc_type, court, act_name, section, year, 
                      raw_content, cleaned_content, metadata_str, now, doc_id))
            else:
                cursor.execute("""
                    INSERT INTO legal_resources (id, title, source, category, doc_type, 
                                                court, act_name, section, year, 
                                                raw_content, cleaned_content, metadata_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (doc_id, title, source, category, doc_type, court, act_name, section, year, 
                      raw_content, cleaned_content, metadata_str))
            
            # If FTS trigger wasn't run (FTS manual insert if triggers not working or FTS table exists)
            try:
                # To ensure FTS stays up to date manually in case triggers aren't firing or fallback needed
                cursor.execute("SELECT rowid FROM legal_resources WHERE id = ?", (doc_id,))
                rowid = cursor.fetchone()[0]
                cursor.execute("DELETE FROM legal_resources_fts WHERE id = ?", (doc_id,))
                cursor.execute("""
                    INSERT INTO legal_resources_fts (rowid, id, title, cleaned_content, category, source)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (rowid, doc_id, title, cleaned_content, category, source))
            except Exception:
                pass

            conn.commit()
        return doc_id

    def delete_resource(self, resource_id: str) -> bool:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Also clean up chunks first
            cursor.execute("DELETE FROM resource_chunks WHERE resource_id = ?", (resource_id,))
            # Clean up FTS
            try:
                cursor.execute("DELETE FROM legal_resources_fts WHERE id = ?", (resource_id,))
            except Exception:
                pass
            cursor.execute("DELETE FROM legal_resources WHERE id = ?", (resource_id,))
            conn.commit()
            return cursor.rowcount > 0

    def get_resource(self, resource_id: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM legal_resources WHERE id = ?", (resource_id,))
            row = cursor.fetchone()
            if not row:
                return None
            
            res = dict(row)
            res["metadata_json"] = json.loads(res["metadata_json"]) if res["metadata_json"] else {}
            return res

    def save_chunk(self, chunk_id: str, resource_id: str, chunk_index: int, content: str, metadata_json: Dict[str, Any]):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            metadata_str = json.dumps(metadata_json)
            
            cursor.execute("SELECT id FROM resource_chunks WHERE id = ?", (chunk_id,))
            if cursor.fetchone():
                cursor.execute("""
                    UPDATE resource_chunks
                    SET resource_id = ?, chunk_index = ?, content = ?, metadata_json = ?
                    WHERE id = ?
                """, (resource_id, chunk_index, content, metadata_str, chunk_id))
            else:
                cursor.execute("""
                    INSERT INTO resource_chunks (id, resource_id, chunk_index, content, metadata_json)
                    VALUES (?, ?, ?, ?, ?)
                """, (chunk_id, resource_id, chunk_index, content, metadata_str))
            conn.commit()

    def save_chunks_batch(self, chunks: List[Dict[str, Any]]):
        if not chunks:
            return
        with self.get_connection() as conn:
            cursor = conn.cursor()
            for chunk in chunks:
                metadata_str = json.dumps(chunk["metadata_json"])
                cursor.execute("""
                    INSERT INTO resource_chunks (id, resource_id, chunk_index, content, metadata_json)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        resource_id=excluded.resource_id,
                        chunk_index=excluded.chunk_index,
                        content=excluded.content,
                        metadata_json=excluded.metadata_json
                """, (chunk["id"], chunk["resource_id"], chunk["chunk_index"], chunk["content"], metadata_str))
            conn.commit()

    def clear_chunks(self, resource_id: str):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM resource_chunks WHERE resource_id = ?", (resource_id,))
            conn.commit()

    def list_chunks(self, resource_id: str) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM resource_chunks WHERE resource_id = ? ORDER BY chunk_index ASC", (resource_id,))
            rows = cursor.fetchall()
            
            chunks = []
            for r in rows:
                c = dict(r)
                c["metadata_json"] = json.loads(c["metadata_json"]) if c["metadata_json"] else {}
                chunks.append(c)
            return chunks

    def list_resources(self, 
                       category: Optional[str] = None, 
                       source: Optional[str] = None, 
                       doc_type: Optional[str] = None, 
                       query: Optional[str] = None, 
                       limit: int = 50, 
                       offset: int = 0) -> List[Dict[str, Any]]:
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            params = []
            where_clauses = []
            
            if category:
                where_clauses.append("category = ?")
                params.append(category)
            if source:
                where_clauses.append("source = ?")
                params.append(source)
            if doc_type:
                where_clauses.append("doc_type = ?")
                params.append(doc_type)
                
            if query:
                # Try FTS search if query is provided and table is populated
                try:
                    # FTS search query
                    where_clauses.append("rowid IN (SELECT rowid FROM legal_resources_fts WHERE legal_resources_fts MATCH ?)")
                    params.append(query)
                except sqlite3.OperationalError:
                    # Fallback standard LIKE
                    where_clauses.append("(title LIKE ? OR cleaned_content LIKE ?)")
                    params.extend([f"%{query}%", f"%{query}%"])
            
            where_str = ""
            if where_clauses:
                where_str = "WHERE " + " AND ".join(where_clauses)
                
            sql = f"""
                SELECT id, title, source, category, doc_type, court, act_name, section, year, created_at
                FROM legal_resources
                {where_str}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            """
            
            params.extend([limit, offset])
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            
            return [dict(r) for r in rows]

    def count_resources(self, 
                        category: Optional[str] = None, 
                        source: Optional[str] = None, 
                        doc_type: Optional[str] = None) -> int:
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            params = []
            where_clauses = []
            
            if category:
                where_clauses.append("category = ?")
                params.append(category)
            if source:
                where_clauses.append("source = ?")
                params.append(source)
            if doc_type:
                where_clauses.append("doc_type = ?")
                params.append(doc_type)
                
            where_str = ""
            if where_clauses:
                where_str = "WHERE " + " AND ".join(where_clauses)
                
            sql = f"SELECT COUNT(*) FROM legal_resources {where_str}"
            cursor.execute(sql, params)
            return cursor.fetchone()[0]

    def add_log(self, source: str, query: str, status: str, items_scraped: int, log_message: str):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO scrap_logs (source, query, status, items_scraped, log_message)
                VALUES (?, ?, ?, ?, ?)
            """, (source, query, status, items_scraped, log_message))
            conn.commit()

    def list_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM scrap_logs ORDER BY timestamp DESC LIMIT ?", (limit,))
            return [dict(r) for r in cursor.fetchall()]

    def get_stats(self) -> Dict[str, Any]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("SELECT COUNT(*) FROM legal_resources")
            total_docs = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM resource_chunks")
            total_chunks = cursor.fetchone()[0]
            
            cursor.execute("SELECT category, COUNT(*) as count FROM legal_resources GROUP BY category")
            by_category = {row["category"]: row["count"] for row in cursor.fetchall()}
            
            cursor.execute("SELECT source, COUNT(*) as count FROM legal_resources GROUP BY source")
            by_source = {row["source"]: row["count"] for row in cursor.fetchall()}
            
            cursor.execute("SELECT doc_type, COUNT(*) as count FROM legal_resources GROUP BY doc_type")
            by_doc_type = {row["doc_type"]: row["count"] for row in cursor.fetchall()}
            
            return {
                "total_documents": total_docs,
                "total_chunks": total_chunks,
                "by_category": by_category,
                "by_source": by_source,
                "by_doc_type": by_doc_type
            }
