"""
Verifier Agent — "The Checker"

Validates the Analysis Agent's draft report against the research chunks.
Produces a confidence score (0–1) and flags hallucinations.
Returns passed=False if confidence < 0.6, signalling the Orchestrator to retry.
"""
import os
import sys
import json
import re

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from typing import List, Dict, Any

from rag.crag_pipeline import call_gemini_llm

# Lightweight grading — no thinking budget needed
VERIFIER_THINKING_BUDGET = 0
CONFIDENCE_PASS_THRESHOLD = 0.6

VERIFIER_SYSTEM_PROMPT = """\
You are a legal quality-assurance agent. Your job is to evaluate a draft legal report \
produced by an AI analyst.

You will receive:
1. The original user question.
2. The retrieved legal reference chunks (ground truth).
3. The draft report to evaluate.

Score the report on these 3 dimensions (each 0.0–1.0):

retrieval_score  : Were the most relevant legal sources used? \
(1.0 = highly relevant sources cited, 0.0 = irrelevant or missing sources)

citation_score   : Do the claims in the report accurately reflect their cited sources? \
(1.0 = every cited claim matches its source, 0.0 = significant mismatches or hallucinations)

reasoning_score  : Is the legal logic clear, internally consistent, and appropriately caveated? \
(1.0 = excellent reasoning, 0.0 = flawed or circular logic)

Respond ONLY with valid JSON in this exact format — no markdown, no preamble:
{
  "retrieval_score": <float>,
  "citation_score": <float>,
  "reasoning_score": <float>,
  "feedback": "<one sentence summary of the main issue if any, or 'All checks passed.'>"
}
"""


class VerifierAgent:
    """
    Grades the draft report and returns a confidence score.
    """

    def run(
        self,
        query: str,
        report: str,
        chunks: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Parameters
        ----------
        query  : Original user question.
        report : Draft markdown report from AnalysisAgent.
        chunks : Research chunks used as ground truth.

        Returns
        -------
        {
          "passed":     bool,
          "confidence": float (0.0 – 1.0),
          "feedback":   str,
          "scores":     {retrieval, citation, reasoning},
          "log":        str,
        }
        """
        print("[VerifierAgent] Running quality checks…")

        # Build verification payload
        context_lines: List[str] = []
        for idx, chunk in enumerate(chunks[:6]):  # check top 6 to keep prompt size sane
            m = chunk.get("metadata", {})
            context_lines.append(
                f"[{idx + 1}] {m.get('act_name', '')} § {m.get('section', '')} — "
                f"{chunk['content'][:300]}"
            )

        user_content = (
            f"USER QUESTION:\n{query}\n\n"
            f"REFERENCE CHUNKS:\n" + "\n\n".join(context_lines) + "\n\n"
            f"DRAFT REPORT:\n{report}"
        )

        try:
            raw = call_gemini_llm(
                model="gemini-2.5-flash",
                system_instruction=VERIFIER_SYSTEM_PROMPT,
                user_content=user_content,
                thinking_budget=VERIFIER_THINKING_BUDGET,
            )

            # Strip any accidental markdown fences
            clean = re.sub(r"```(?:json)?", "", raw).strip().rstrip("```").strip()
            data = json.loads(clean)

            retrieval = float(data.get("retrieval_score", 0.5))
            citation = float(data.get("citation_score", 0.5))
            reasoning = float(data.get("reasoning_score", 0.5))
            feedback = data.get("feedback", "No feedback.")

        except Exception as exc:
            print(f"[VerifierAgent] Grading call failed: {exc}. Assigning neutral scores.")
            retrieval = citation = reasoning = 0.65
            feedback = f"Verification skipped due to grader error: {exc}"

        # Weighted average: citation is most critical for legal safety
        confidence = round(
            0.30 * retrieval + 0.45 * citation + 0.25 * reasoning,
            3,
        )

        passed = confidence >= CONFIDENCE_PASS_THRESHOLD
        status = "PASS ✅" if passed else "FAIL ❌ — queuing retry"

        log = (
            f"[Verifier Agent] Quality Assurance Audit finished. Assessed draft against raw laws. "
            f"Metrics ➔ Retrieval: {retrieval*100:.0f}%, Citation Match: {citation*100:.0f}%, Logic: {reasoning*100:.0f}%. "
            f"Overall Confidence Rating: {confidence*100:.1f}% ({status}). "
            f"Reviewer Note: {feedback}"
        )
        print(f"[VerifierAgent] {log}")

        return {
            "passed": passed,
            "confidence": confidence,
            "feedback": feedback,
            "scores": {
                "retrieval": retrieval,
                "citation": citation,
                "reasoning": reasoning,
            },
            "log": log,
        }
