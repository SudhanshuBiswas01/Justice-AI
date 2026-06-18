"""
Orchestrator Agent — "The Manager"

Coordinates the Research → Analysis → Verify loop.
Retries up to MAX_PASSES times if the Verifier rejects the report.
Returns a fully structured DeepResearchResult dict.
"""
import os
import sys

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from typing import List, Dict, Any

from agents.research_agent import ResearchAgent
from agents.analysis_agent import AnalysisAgent
from agents.verifier_agent import VerifierAgent

MAX_PASSES = 2  # Maximum Research→Analyze→Verify loops


def _detect_category(query: str) -> str:
    """Replicates the heuristic used in chat.py so the two sessions stay in sync."""
    q = query.lower()
    if any(w in q for w in ["challan", "traffic", "helmet", "speeding", "license", "fine", "parivahan"]):
        return "traffic_challan"
    if any(w in q for w in ["mrp", "overcharg", "retail price", "metrology"]):
        return "mrp_overcharging"
    if any(w in q for w in ["refund", "e-commerce", "cancel", "booking", "wallet"]):
        return "refund"
    if any(w in q for w in ["grievance", "complaint", "daakhil", "nch", "consumer court"]):
        return "consumer_dispute"
    return "all"


class OrchestratorAgent:
    """
    Manages the 4-agent Deep Research pipeline.
    """

    def __init__(self):
        self.research = ResearchAgent()
        self.analysis = AnalysisAgent()
        self.verifier = VerifierAgent()

    def run(
        self,
        messages: List[Dict[str, str]],
        category: str = "",
    ) -> Dict[str, Any]:
        """
        Parameters
        ----------
        messages : Full conversation history [{"role": "user"|"assistant", "content": str}].
        category : Optional pre-detected category; auto-detected if empty.

        Returns
        -------
        {
          "report":      str,
          "citations":   list[dict],
          "confidence":  float,
          "passes":      int,
          "source_type": str,
          "agent_log":   list[str],
        }
        """
        # Extract the latest user query
        user_msgs = [m for m in messages if m.get("role") == "user"]
        if not user_msgs:
            return {
                "report": "No user question provided.",
                "citations": [],
                "confidence": 0.0,
                "passes": 0,
                "source_type": "web_fallback",
                "agent_log": ["[Orchestrator] No user message found."],
            }

        query = user_msgs[-1]["content"]
        detected_category = category or _detect_category(query)
        agent_log: List[str] = [
            f"[Orchestrator] Starting Deep Research for query: '{query[:80]}…' (category={detected_category})"
        ]
        print(f"[OrchestratorAgent] {agent_log[0]}")

        report = ""
        citations: List[Dict] = []
        source_type = "web_fallback"
        confidence = 0.0
        passes = 0
        chunks: List[Dict] = []

        for pass_num in range(1, MAX_PASSES + 1):
            passes = pass_num
            agent_log.append(f"[Orchestrator] Pass {pass_num}/{MAX_PASSES} starting…")

            # ── Step 1: Research ────────────────────────────────────────────
            research_result = self.research.run(query, category=detected_category)
            chunks = research_result["chunks"]
            agent_log.append(research_result["log"])

            # ── Step 2: Analysis ────────────────────────────────────────────
            analysis_result = self.analysis.run(query, chunks)
            report = analysis_result["report"]
            citations = analysis_result["citations"]
            source_type = analysis_result["source_type"]
            agent_log.append(analysis_result["log"])

            # ── Step 3: Verify ──────────────────────────────────────────────
            verify_result = self.verifier.run(query, report, chunks)
            confidence = verify_result["confidence"]
            agent_log.append(verify_result["log"])

            if verify_result["passed"]:
                agent_log.append(
                    f"[Orchestrator] ✅ Passed verification on pass {pass_num} "
                    f"(confidence={confidence:.2f}). Delivering report."
                )
                break
            else:
                if pass_num < MAX_PASSES:
                    agent_log.append(
                        f"[Orchestrator] ⚠️ Verification failed (confidence={confidence:.2f}). "
                        f"Retrying with extended context…"
                    )
                else:
                    agent_log.append(
                        f"[Orchestrator] ⚠️ Max passes reached. Delivering best-effort report "
                        f"(confidence={confidence:.2f}). Disclaimer applied."
                    )

        # Attach low-confidence disclaimer to the report if needed
        if confidence < 0.6:
            disclaimer = (
                "\n\n---\n> ⚠️ **Low Confidence Notice**: This report could not be fully "
                "verified against the legal corpus. The analysis is based on general legal "
                "knowledge. **Please consult a qualified lawyer before taking action.**"
            )
            report += disclaimer

        agent_log.append(f"[Orchestrator] Complete. passes={passes}, confidence={confidence:.2f}, source={source_type}")

        return {
            "report": report,
            "citations": citations,
            "confidence": confidence,
            "passes": passes,
            "source_type": source_type,
            "agent_log": agent_log,
        }
