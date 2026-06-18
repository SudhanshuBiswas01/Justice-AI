"""
Research Agent — "The Librarian"

Searches the legal vector corpus for relevant chunks, ranks them,
and returns a list of ResearchResult objects for the Analysis Agent.
"""
import os
import sys

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from typing import List, Dict, Any, Optional
from rag.vector_store import VectorStore

# More permissive threshold than the normal chat (0.65) so Deep Research
# casts a wider net and gathers more legal evidence.
RESEARCH_SCORE_THRESHOLD = 0.55
RESEARCH_TOP_K = 8


class ResearchAgent:
    """
    Searches the legal corpus and returns ranked, filtered chunks.
    """

    def __init__(self):
        self.store = VectorStore()

    def run(
        self,
        query: str,
        category: str = "all",
    ) -> Dict[str, Any]:
        """
        Parameters
        ----------
        query    : The user's legal question.
        category : Legal category filter (e.g. 'traffic_challan', 'all').

        Returns
        -------
        {
          "chunks":    list of dicts {content, metadata, score},
          "found":     int   — number of chunks above threshold,
          "log":       str   — human-readable summary for agent_log,
        }
        """
        print(f"[ResearchAgent] Searching corpus (category={category}, top_k={RESEARCH_TOP_K})…")

        try:
            raw = self.store.search(query, category=category, top_k=RESEARCH_TOP_K)
        except Exception as exc:
            print(f"[ResearchAgent] Vector search failed: {exc}")
            raw = []

        # Filter by score threshold
        chunks = [c for c in raw if c.get("score", 0) >= RESEARCH_SCORE_THRESHOLD]
        print(f"[ResearchAgent] {len(chunks)}/{len(raw)} chunks passed threshold ({RESEARCH_SCORE_THRESHOLD})")

        log = (
            f"[Research] Found {len(chunks)} relevant legal sources "
            f"(score ≥ {RESEARCH_SCORE_THRESHOLD}) from corpus."
        )

        return {
            "chunks": chunks,
            "found": len(chunks),
            "log": log,
        }
