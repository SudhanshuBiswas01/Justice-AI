import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scraper.db_manager import DBManager
from rag.embeddings import EmbeddingHelper

db = DBManager()
stats = db.get_stats()
print("=== Database Statistics ===")
print(f"Total Documents: {stats['total_documents']}")
print(f"Total Chunks: {stats['total_chunks']}")
print(f"Embedded Chunks: {stats['embedded_chunks']}")
print(f"Unembedded Chunks: {stats['unembedded_chunks']}")
print(f"By Category: {stats['by_category']}")

embedder = EmbeddingHelper()
print(f"Embedding Provider: {embedder.provider}")
print(f"Embedding Dimension: {embedder.dimension}")
