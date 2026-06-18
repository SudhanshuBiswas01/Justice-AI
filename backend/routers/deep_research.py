"""
Deep Research Router — POST /api/deep-research

Accepts a conversation and returns a fully structured legal research report
produced by the 4-agent pipeline (Orchestrator → Research → Analysis → Verifier).
The existing /api/chat endpoint is completely untouched.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


# ── Request / Response models ─────────────────────────────────────────────────

class Message(BaseModel):
    role: str
    content: str


class DeepResearchRequest(BaseModel):
    messages: List[Message]
    category: Optional[str] = ""  # optional override; auto-detected if blank


class Citation(BaseModel):
    ref: int
    title: str
    act_name: str
    section: str
    source: str


class DeepResearchResponse(BaseModel):
    report: str
    citations: List[Citation] = []
    confidence: float = 0.0          # 0.0 – 1.0
    passes: int = 1                  # how many Research→Analyze→Verify loops ran
    source_type: str = "corpus"      # "corpus" | "web_fallback"
    agent_log: List[str] = []        # chronological log from all 4 agents


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/deep-research", response_model=DeepResearchResponse)
async def deep_research_endpoint(request: DeepResearchRequest):
    """
    Run the 4-agent Deep Research pipeline and return a structured legal report.
    """
    try:
        from agents.orchestrator_agent import OrchestratorAgent
        orchestrator = OrchestratorAgent()

        formatted_messages = [
            {"role": m.role, "content": m.content}
            for m in request.messages
        ]

        result = orchestrator.run(
            messages=formatted_messages,
            category=request.category or "",
        )

        return DeepResearchResponse(
            report=result["report"],
            citations=[Citation(**c) for c in result.get("citations", [])],
            confidence=result.get("confidence", 0.0),
            passes=result.get("passes", 1),
            source_type=result.get("source_type", "corpus"),
            agent_log=result.get("agent_log", []),
        )

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
