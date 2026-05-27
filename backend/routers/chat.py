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
    if not GEMINI_API_KEY and not groq_client:
        raise HTTPException(
            status_code=500, 
            detail="Server API keys not configured. Please set GEMINI_API_KEY or GROQ_API_KEY."
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
                
        # 3. Retrieve relevant legal context from SQLite VectorStore
        context_text = ""
        retrieved_chunks = []
        if latest_query:
            try:
                from rag.vector_store import VectorStore
                store = VectorStore()
                retrieved_chunks = store.search(latest_query, category=category, top_k=4)
                
                if retrieved_chunks:
                    context_segments = []
                    for idx, chunk in enumerate(retrieved_chunks):
                        meta = chunk.get("metadata", {})
                        source_info = f"Source: {meta.get('source', 'Unknown')} | Title: {meta.get('title', 'Unknown')}"
                        if meta.get("act_name"):
                            source_info += f" | Act: {meta.get('act_name')}"
                        if meta.get("section"):
                            source_info += f" | Section: {meta.get('section')}"
                            
                        context_segments.append(
                            f"--- Reference Document #{idx+1} ({source_info}) ---\n"
                            f"{chunk['content']}"
                        )
                    context_text = "\n\n".join(context_segments)
            except Exception as e:
                print(f"[RAG Retrieval Error] {e}")

        # 4. Construct System Prompt with injected context
        system_prompt = SYSTEM_PROMPT
        if context_text:
            system_prompt += (
                f"\n\n=== RELEVANT LEGAL REFERENCE CONTEXT ===\n"
                f"You MUST use this official context to retrieve exact fines, sections, rules, and procedures:\n\n"
                f"{context_text}\n"
                f"========================================"
            )

        # 5. Call LLM (Prefer Gemini if API key is present, fallback to Groq)
        if GEMINI_API_KEY:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
                
                # Map roles for Gemini
                gemini_contents = []
                for msg in request.messages:
                    role = "user" if msg.role == "user" else "model"
                    gemini_contents.append({
                        "role": role,
                        "parts": [{"text": msg.content}]
                    })
                
                payload = {
                    "contents": gemini_contents,
                    "systemInstruction": {
                        "parts": [{"text": system_prompt}]
                    },
                    "generationConfig": {
                        "temperature": 0.3,
                        "maxOutputTokens": 2048
                    }
                }
                
                response = requests.post(url, json=payload, timeout=25)
                if response.status_code == 200:
                    data = response.json()
                    ai_reply = data["candidates"][0]["content"]["parts"][0]["text"]
                    return ChatResponse(response=ai_reply)
                else:
                    print(f"[RAG LLM] Gemini API error ({response.status_code}): {response.text}. Falling back to Groq.")
            except Exception as e:
                print(f"[RAG LLM] Gemini API failed: {e}. Falling back to Groq.")

        # Fallback to Groq if Gemini is not configured or fails
        if not groq_client:
            raise HTTPException(
                status_code=500, 
                detail="Gemini call failed/unconfigured, and Groq API key is missing."
            )
            
        llm_messages = [{"role": "system", "content": system_prompt}]
        for msg in request.messages:
            llm_messages.append({"role": msg.role, "content": msg.content})
            
        chat_completion = groq_client.chat.completions.create(
            messages=llm_messages,
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=2048,
        )
        
        return ChatResponse(response=chat_completion.choices[0].message.content)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
