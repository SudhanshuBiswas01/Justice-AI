"""
Analysis Agent — "The Lawyer"

Takes the user's question + research chunks from ResearchAgent,
drafts a structured legal report, and returns it with citations.
"""
import os
import sys

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from typing import List, Dict, Any

from rag.crag_pipeline import call_gemini_llm

# Allow deep reasoning for the Analysis Agent — this is the "heavy" call.
ANALYSIS_THINKING_BUDGET = 5000

ANALYSIS_SYSTEM_PROMPT = """\
You are Justice AI — an expert Indian legal analyst tasked with producing a thorough, \
cited legal research report.

You will receive:
1. The user's legal question / situation.
2. A numbered list of retrieved legal sections, acts, and case excerpts from the corpus.

Your report MUST follow this exact structure in markdown:

## 📋 Issue Summary
A concise 2–3 sentence description of the legal problem.

## ⚖️ Win Probability Assessment
Honestly assess the user's chances. Use terms like High / Medium / Low and explain why based on the law.

## 🔍 Applicable Law & References
List each relevant legal provision with its section number and act name. Cite using [1], [2], etc. \
matching the reference numbers provided.

## 📝 Step-by-Step Action Plan
A numbered list of concrete, actionable steps the user should take.

## ⚠️ Important Caveats
List any limitations, disclaimers, or situations where the user should consult a licensed advocate.

RULES:
- Every factual legal claim MUST be tied to a numbered reference [N].
- Do NOT invent section numbers, fine amounts, or case names.
- If a point cannot be sourced from the provided references, say so explicitly.
- Be concise but thorough — target 400–600 words for the full report.
"""


class AnalysisAgent:
    """
    Drafts a structured legal research report from research chunks.
    """

    def run(
        self,
        query: str,
        chunks: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Parameters
        ----------
        query  : The user's legal question.
        chunks : Research results from ResearchAgent (content + metadata + score).

        Returns
        -------
        {
          "report":    str   — full markdown report,
          "citations": list  — [{ref, title, act_name, section, source}],
          "log":       str   — agent log line,
        }
        """
        print(f"[AnalysisAgent] Drafting report from {len(chunks)} chunks…")

        # Build numbered reference context and citation list
        segments: List[str] = []
        citations: List[Dict[str, Any]] = []

        if chunks:
            for idx, chunk in enumerate(chunks):
                m = chunk.get("metadata", {})
                info = f"Source: {m.get('source', 'Unknown')} | Title: {m.get('title', 'Unknown')}"
                if m.get("act_name"):
                    info += f" | Act: {m['act_name']}"
                if m.get("section"):
                    info += f" | Section: {m['section']}"
                segments.append(f"--- Reference [{idx + 1}] ({info}) ---\n{chunk['content']}")
                citations.append(
                    {
                        "ref": idx + 1,
                        "title": m.get("title", "Unknown"),
                        "act_name": m.get("act_name", ""),
                        "section": m.get("section", ""),
                        "source": m.get("source", ""),
                    }
                )
            context_block = (
                "\n\n=== RETRIEVED LEGAL REFERENCES ===\n"
                + "\n\n".join(segments)
                + "\n==================================="
            )
            source_type = "corpus"
        else:
            context_block = (
                "\n\n=== NO CORPUS MATCH ===\n"
                "WARNING: No directly relevant legal sections were found in the database.\n"
                "Answer from general Indian legal knowledge. "
                "Do NOT cite section numbers you are not certain about.\n"
                "========================="
            )
            source_type = "web_fallback"

        system_instruction = ANALYSIS_SYSTEM_PROMPT + context_block
        user_content = f"USER QUESTION:\n{query}"

        report = call_gemini_llm(
            model="gemini-2.5-flash",
            system_instruction=system_instruction,
            user_content=user_content,
            thinking_budget=ANALYSIS_THINKING_BUDGET,
        )

        log = f"[Analysis] Report drafted ({len(report.split())} words, {len(citations)} citations, source={source_type})."
        print(f"[AnalysisAgent] {log}")

        return {
            "report": report,
            "citations": citations,
            "source_type": source_type,
            "log": log,
        }
