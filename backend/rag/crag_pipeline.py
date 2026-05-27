import os
import re
import json
import requests
from typing import List, Dict, Any, Tuple, Optional
from dotenv import load_dotenv
from rag.vector_store import VectorStore

load_dotenv()

def call_gemini_llm(model: str, system_instruction: str, user_content: str, json_mode: bool = False) -> str:
    """
    Unified LLM caller that routes requests sequentially to:
    1. Vertex AI (via Application Default Credentials - GCP Credits)
    2. Google AI Studio (via GEMINI_API_KEY / GOOGLE_API_KEY)
    3. Groq API (fallback using Llama-3.3-70b-versatile)
    """
    # 1. Try Google Cloud Vertex AI (utilizes the user's $300 GCP credit account)
    from rag.gcp_auth import get_gcp_credentials
    token, project = get_gcp_credentials()
    if token and project:
        # Vertex AI uses the exact model name for Gemini 2.5
        vertex_model = model
        try:
            url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{project}/locations/us-central1/publishers/google/models/{vertex_model}:generateContent"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": user_content}]
                    }
                ],
                "systemInstruction": {
                    "parts": [{"text": system_instruction}]
                },
                "generationConfig": {
                    "temperature": 0.2 if "flash" in model else 0.3,
                    "responseMimeType": "application/json" if json_mode else "text/plain"
                }
            }
            res = requests.post(url, headers=headers, json=payload, timeout=25)
            if res.status_code == 200:
                data = res.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
            else:
                print(f"[LLM-Vertex] API error: {res.status_code} - {res.text}. Trying AI Studio fallback...")
        except Exception as e:
            print(f"[LLM-Vertex] Call failed: {e}. Trying AI Studio fallback...")

    # 2. Try Google AI Studio (using Developer keys)
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": user_content}]
                    }
                ],
                "systemInstruction": {
                    "parts": [{"text": system_instruction}]
                },
                "generationConfig": {
                    "temperature": 0.2 if "flash" in model else 0.3,
                    "responseMimeType": "application/json" if json_mode else "text/plain"
                }
            }
            res = requests.post(url, json=payload, timeout=25)
            if res.status_code == 200:
                data = res.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
            else:
                print(f"[LLM-Studio] API error: {res.status_code} - {res.text}. Trying Groq fallback...")
        except Exception as e:
            print(f"[LLM-Studio] Call failed: {e}. Trying Groq fallback...")

    # 3. Fallback to Groq API
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        try:
            from groq import Groq
            client = Groq(api_key=groq_key)
            # Map model names for Groq
            model_name = "llama-3.3-70b-versatile"
            messages = [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_content}
            ]
            response_format = {"type": "json_object"} if json_mode else None
            chat_completion = client.chat.completions.create(
                messages=messages,
                model=model_name,
                temperature=0.2 if json_mode else 0.3,
                response_format=response_format
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            print(f"[LLM-Groq] Call failed: {e}")

    raise Exception("No active LLM providers or API keys configured. Set GEMINI_API_KEY or authenticate GCP ADC.")


class CRAGPipeline:
    def __init__(self):
        self.store = VectorStore()
        
    def evaluate_relevance(self, query: str, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        CRAG relevance evaluator. Grades each chunk's relevance to the user's query.
        Returns a list of chunks graded as 'CORRECT' or 'AMBIGUOUS'.
        """
        if not chunks:
            return []
            
        system_instruction = (
            "You are an expert legal document evaluator. Your job is to grade the relevance of a legal text chunk to a user's question.\n"
            "Respond in strict JSON with two fields:\n"
            "1. 'grade': must be exactly 'CORRECT' (highly relevant), 'AMBIGUOUS' (partially relevant context), or 'INCORRECT' (irrelevant).\n"
            "2. 'reason': a brief explanation."
        )
        
        filtered_chunks = []
        
        for chunk in chunks:
            user_content = (
                f"User Question: {query}\n\n"
                f"Legal Text Chunk:\n{chunk['content']}"
            )
            try:
                # Use fast gemini-2.5-flash for evaluation task
                res_txt = call_gemini_llm(
                    model="gemini-2.5-flash",
                    system_instruction=system_instruction,
                    user_content=user_content,
                    json_mode=True
                )
                
                eval_data = json.loads(res_txt)
                grade = eval_data.get("grade", "INCORRECT").upper()
                reason = eval_data.get("reason", "")
                
                print(f"[CRAG Evaluator] Chunk: {chunk['metadata'].get('title')} | Section: {chunk['metadata'].get('section')} | Grade: {grade} | Reason: {reason}")
                
                if grade in ["CORRECT", "AMBIGUOUS"]:
                    chunk["crag_grade"] = grade
                    filtered_chunks.append(chunk)
            except Exception as e:
                # In case of error, assume marginal relevance to be safe
                print(f"[CRAG Evaluator] Failed to evaluate chunk: {e}")
                chunk["crag_grade"] = "AMBIGUOUS"
                filtered_chunks.append(chunk)
                
        return filtered_chunks

    def verify_output(self, query: str, generated_response: str, context_chunks: List[Dict[str, Any]]) -> Tuple[bool, str]:
        """
        Verification Agent (Output Verifier).
        Checks for:
        1. Factual contradictions against the source context chunks.
        2. Citations validity (referencing sections/acts not in the context).
        3. Layout requirements (three headings: Problem, Win Probability, Strategy).
        
        Returns (passed, feedback_reasons).
        """
        context_texts = []
        for idx, chunk in enumerate(context_chunks):
            m = chunk.get("metadata", {})
            context_texts.append(
                f"Document #{idx+1} ({m.get('title')}, Section: {m.get('section')})\n"
                f"Content: {chunk['content']}"
            )
        context_str = "\n\n".join(context_texts) if context_texts else "No source document context available."
        
        system_instruction = (
            "You are a legal output verification auditor. Your job is to check the generated AI legal advice against "
            "the original source document contexts and verify its factual accuracy.\n\n"
            "Audit Checklist:\n"
            "1. Check for Factual Contradictions: Does the advice contain statements or values (e.g. fine amounts, deadlines) "
            "that conflict with the source documents?\n"
            "2. Check for Hallucinated Citations: Does the advice cite specific Section numbers or Acts that are NOT mentioned "
            "in the source documents?\n"
            "3. Check Layout: Does the advice contain three clear sections: '1. Problem Identification', "
            "'2. Win Probability Assessment', and '3. Step-by-Step Strategy'?\n\n"
            "Respond in strict JSON with two fields:\n"
            "- 'passed': true if the advice is accurate and passes all rules, false if it fails any audit check.\n"
            "- 'feedback': a detailed explanation of any contradictions, hallucinated sections, or missing elements."
        )
        
        user_content = (
            f"User Query: {query}\n\n"
            f"=== SOURCE DOCUMENTS ===\n"
            f"{context_str}\n\n"
            f"=== GENERATED AI ADVICE ===\n"
            f"{generated_response}"
        )
        
        try:
            # Use gemini-2.5-flash for auditing
            res_txt = call_gemini_llm(
                model="gemini-2.5-flash",
                system_instruction=system_instruction,
                user_content=user_content,
                json_mode=True
            )
            
            audit_data = json.loads(res_txt)
            passed = audit_data.get("passed", False)
            feedback = audit_data.get("feedback", "")
            
            print(f"[Verification Agent] Audit passed: {passed} | Feedback: {feedback}")
            return passed, feedback
        except Exception as e:
            print(f"[Verification Agent] Auditing error: {e}. Defaulting to True.")
            return True, ""

    def generate_legal_guidance(self, messages: List[Dict[str, str]], category: str) -> str:
        """
        Orchestrates the entire CRAG + Verification pipeline:
        1. Classifies and queries the SQLite VectorStore.
        2. Relevance Evaluates retrieved chunks.
        3. Injects context and calls Gemini 1.5 Pro to generate the legal advice.
        4. Audits the output via the Verification Agent.
        5. Performs a 1-step auto-correction retry if verification fails.
        """
        # 1. Retrieve query
        latest_query = ""
        if messages:
            user_msgs = [m for m in messages if m["role"] == "user"]
            if user_msgs:
                latest_query = user_msgs[-1]["content"]
            else:
                latest_query = messages[-1]["content"]
                
        # 2. Vector Search (using local database)
        raw_chunks = []
        if latest_query:
            try:
                raw_chunks = self.store.search(latest_query, category=category, top_k=5)
            except Exception as e:
                print(f"[CRAG Pipeline] Vector store query failed: {e}")
                
        # 3. CRAG: Filter chunks via Relevance Evaluator
        relevant_chunks = self.evaluate_relevance(latest_query, raw_chunks)
        print(f"[CRAG Pipeline] Retained {len(relevant_chunks)} of {len(raw_chunks)} chunks as relevant.")
        
        # 4. Construct injected prompt
        base_system_prompt = (
            "You are Justice AI, a highly capable legal assistant focused on Indian law (especially traffic challans, consumer disputes, and overcharging).\n"
            "Your goal is to act as the first layer of defense for the user. When a user presents a problem, you must ALWAYS do the following three things systematically:\n"
            "1. Identify the problem clearly.\n"
            "2. Tell the user if they can win the case or not (assess the probability of winning based on legal principles).\n"
            "3. Design a step-by-step strategy on how they need to go ahead.\n\n"
            "Be direct, clear, and professional. Format your response with clear headings for these three parts."
        )
        
        if not relevant_chunks:
            # No context fallback to prevent hallucinations
            context_injection = (
                "\n\n=== LEGAL CONTEXT LIMITATION ===\n"
                "WARNING: No direct relevant legal sections from Indian Acts were retrieved in the database for this specific query.\n"
                "To prevent misinformation or hallucinations, you MUST NOT cite specific section numbers or make up specific fine amounts.\n"
                "Instead, politely explain that your current knowledge base does not contain the exact section details for this query, "
                "give general common-sense legal advice, and ask the user to provide more details or upload an official document (like a challan or bill)."
            )
        else:
            context_segments = []
            for idx, chunk in enumerate(relevant_chunks):
                m = chunk.get("metadata", {})
                source_info = f"Source: {m.get('source', 'Unknown')} | Title: {m.get('title', 'Unknown')}"
                if m.get("act_name"):
                    source_info += f" | Act: {m.get('act_name')}"
                if m.get("section"):
                    source_info += f" | Section: {m.get('section')}"
                    
                context_segments.append(
                    f"--- Reference Document #{idx+1} ({source_info}) ---\n"
                    f"{chunk['content']}"
                )
            context_text = "\n\n".join(context_segments)
            context_injection = f"\n\n=== RELEVANT LEGAL REFERENCE CONTEXT ===\n{context_text}\n============================="
            
        system_instruction = base_system_prompt + context_injection
        
        # Format conversation history
        user_content_parts = []
        for msg in messages:
            user_content_parts.append(f"{msg['role'].upper()}: {msg['content']}")
        conversation_history = "\n".join(user_content_parts)
        
        # 5. Generate Legal Advice (using gemini-2.5-pro for high-quality legal advice)
        print("[CRAG Pipeline] Generating legal advice using gemini-2.5-pro...")
        response_text = call_gemini_llm(
            model="gemini-2.5-pro",
            system_instruction=system_instruction,
            user_content=conversation_history
        )
        
        # 6. Audit output with Verification Agent
        passed, feedback = self.verify_output(latest_query, response_text, relevant_chunks)
        
        # 7. Auto-Correction Retry Loop (1 step)
        if not passed:
            print(f"[CRAG Pipeline] Verification failed. Initiating auto-correction regeneration...")
            retry_instruction = (
                f"{system_instruction}\n\n"
                f"=== CRAG VERIFICATION AUDIT FAILURE ===\n"
                f"Your previous output failed validation checks with the following issues:\n"
                f"{feedback}\n"
                f"You MUST regenerate the guidance and correct these issues. Remain 100% faithful to the source documents. "
                f"Do not hallucinate fake sections or make up facts. Maintain the three required headings."
            )
            
            response_text = call_gemini_llm(
                model="gemini-2.5-pro",
                system_instruction=retry_instruction,
                user_content=conversation_history
            )
            
            # Double check regenerated output
            double_pass, double_feedback = self.verify_output(latest_query, response_text, relevant_chunks)
            if not double_pass:
                print("[CRAG Pipeline] Double check failed. Returning second response with caution notes.")
            else:
                print("[CRAG Pipeline] Auto-correction successful!")
                
        return response_text
