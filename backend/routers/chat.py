from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
from groq import Groq
import os
import requests
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Load API keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

# Initialize Groq client if key exists
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

class Citation(BaseModel):
    ref: int
    title: str
    act_name: str
    section: str
    source: str

class ChatResponse(BaseModel):
    response: str
    source_type: str = "corpus"          # "corpus" | "web_fallback" | "greeting"
    citations: List[Citation] = []


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    from rag.gcp_auth import get_gcp_credentials
    gcp_token, gcp_proj = get_gcp_credentials()

    if not gcp_token and not GEMINI_API_KEY and not groq_client:
        raise HTTPException(
            status_code=500,
            detail="Server API credentials not configured. Please set GEMINI_API_KEY, GROQ_API_KEY, or authenticate Google Cloud ADC."
        )

    try:
        # 1. Extract latest user query to detect category
        latest_query = ""
        if request.messages:
            user_msgs = [m for m in request.messages if m.role == "user"]
            if user_msgs:
                latest_query = user_msgs[-1].content
            else:
                latest_query = request.messages[-1].content

        # 2. Heuristically detect category to filter search
        category = "all"
        if latest_query:
            query_lower = latest_query.lower()
            if any(w in query_lower for w in ["challan", "traffic", "helmet", "speeding", "license", "fine", "parivahan"]):
                category = "traffic_challan"
            elif any(w in query_lower for w in ["mrp", "overcharg", "retail price", "metrology"]):
                category = "mrp_overcharging"
            elif any(w in query_lower for w in ["refund", "e-commerce", "cancel", "booking", "wallet"]):
                category = "refund"
            elif any(w in query_lower for w in ["grievance", "complaint", "daakhil", "nch", "consumer court"]):
                category = "consumer_dispute"

        # 3. Route through CRAG pipeline
        from rag.crag_pipeline import CRAGPipeline
        pipeline = CRAGPipeline()

        formatted_messages = [{"role": m.role, "content": m.content} for m in request.messages]
        result = pipeline.generate_legal_guidance(formatted_messages, category)

        # result is now a dict: {answer, source_type, citations}
        return ChatResponse(
            response=result["answer"],
            source_type=result.get("source_type", "corpus"),
            citations=[Citation(**c) for c in result.get("citations", [])],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
