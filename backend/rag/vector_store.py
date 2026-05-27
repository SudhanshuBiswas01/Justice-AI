from typing import List, Dict, Any, Optional
from rag.embeddings import EmbeddingHelper
from scraper.db_manager import DBManager

class VectorStore:
    def __init__(self, db_path: Optional[str] = None):
        self.db = DBManager(db_path) if db_path else DBManager()
        self.embedder = EmbeddingHelper()

    def search(self, 
               query: str, 
               category: Optional[str] = None, 
               top_k: int = 4) -> List[Dict[str, Any]]:
        """
        Performs semantic search.
        Generates query embedding, queries SQLite for candidate vectors,
        computes cosine similarity, and returns the top_k closest chunks.
        """
        if not query:
            return []

        # 1. Generate query embedding vector
        query_vector = self.embedder.get_embedding(query)
        
        # 2. Get candidate chunks matching the category filter from SQLite
        # If category is "all", it searches all categories
        candidates = self.db.get_chunks_with_embeddings_by_category(category)
        
        if not candidates:
            print(f"[VectorStore] No indexed chunks found for search in category: '{category}'")
            return []

        # 3. Compute cosine similarity (simple dot product since both are L2 normalized)
        scored_candidates = []
        for cand in candidates:
            cand_vector = cand.get("embedding")
            
            # Match dimensions
            if not cand_vector or len(cand_vector) != len(query_vector):
                continue  # Skip mismatched dimensions
                
            # Dot product calculation
            score = sum(q * c for q, c in zip(query_vector, cand_vector))
            
            scored_candidates.append({
                "chunk_id": cand["id"],
                "content": cand["content"],
                "score": score,
                "metadata": cand["metadata_json"],
                "category": cand.get("category")
            })

        # 4. Sort by score in descending order
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)

        # 5. Return top_k results
        return scored_candidates[:top_k]
