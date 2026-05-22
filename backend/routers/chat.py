from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

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
    if not client:
        raise HTTPException(status_code=500, detail="Groq API key not configured on server.")
        
    try:
        # Construct the messages array for the LLM
        llm_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Add the conversation history
        for msg in request.messages:
            llm_messages.append({"role": msg.role, "content": msg.content})
            
        chat_completion = client.chat.completions.create(
            messages=llm_messages,
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=2048,
        )
        
        return ChatResponse(response=chat_completion.choices[0].message.content)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
