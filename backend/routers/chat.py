from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
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
    
class ChatResponse(BaseModel):
    response: str

SYSTEM_PROMPT = """You are Justice AI, a highly capable legal assistant focused on Indian law (especially traffic challans, consumer disputes, and overcharging). 
Your goal is to act as the first layer of defense for the user. When a user presents a problem, you must ALWAYS do the following three things systematically:
1. Identify the problem clearly.
2. Tell the user if they can win the case or not (assess the probability of winning based on legal principles).
3. Design a step-by-step strategy on how they need to go ahead.

Be direct, clear, and professional. Format your response with clear headings for these three parts."""

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
        # 1. Extract latest user query to fetch context
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
                
        # 3. Route request through CRAG & Verification Agent pipeline
        from rag.crag_pipeline import CRAGPipeline
        pipeline = CRAGPipeline()
        
        # Convert request messages to format expected by CRAG pipeline
        formatted_messages = []
        for msg in request.messages:
            formatted_messages.append({
                "role": msg.role,
                "content": msg.content
            })
            
        ai_reply = pipeline.generate_legal_guidance(formatted_messages, category)
        return ChatResponse(response=ai_reply)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
