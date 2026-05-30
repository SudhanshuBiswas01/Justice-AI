import os
import re
import json
import requests
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from rag.vector_store import VectorStore

load_dotenv()

def call_gemini_llm(model: str, system_instruction: str, user_content: str, stream: bool = False):
    """
    Unified LLM caller. Routes to:
    1. Vertex AI (GCP ADC)
    2. Google AI Studio (GEMINI_API_KEY)
    3. Groq API (fallback)

    When stream=True, returns a requests.Response in streaming mode (Vertex/Gemini only).
    When stream=False, returns the full response text as a string.
    """
    from rag.gcp_auth import get_gcp_credentials
    import time

    for attempt in range(2):
        token, project = get_gcp_credentials(force=(attempt > 0))
        if token and project:
            url = (
                f"https://us-central1-aiplatform.googleapis.com/v1/projects/{project}"
                f"/locations/us-central1/publishers/google/models/{model}:streamGenerateContent"
                if stream else
                f"https://us-central1-aiplatform.googleapis.com/v1/projects/{project}"
                f"/locations/us-central1/publishers/google/models/{model}:generateContent"
            )
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            payload = {
                "contents": [{"role": "user", "parts": [{"text": user_content}]}],
                "systemInstruction": {"parts": [{"text": system_instruction}]},
                "generationConfig": {
                    "temperature": 0.3,
                }
            }

            for call_retry in range(3):
                try:
                    if stream:
                        res = requests.post(url, headers=headers, json=payload, timeout=60, stream=True)
                        if res.status_code == 200:
                            return res  # Caller handles streaming
                        elif res.status_code == 401 and attempt == 0:
                            break  # Refresh token
                    else:
                        res = requests.post(url, headers=headers, json=payload, timeout=30)
                        if res.status_code == 200:
                            data = res.json()
                            return data["candidates"][0]["content"]["parts"][0]["text"]
                        elif res.status_code == 401 and attempt == 0:
                            print("[LLM-Vertex] Token expired (401). Refreshing...")
                            break
                        elif res.status_code in [429, 503] and call_retry < 2:
                            time.sleep(2)
                            continue
                        else:
                            print(f"[LLM-Vertex] API error {res.status_code}. Trying fallback...")
                            break
                except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                    if call_retry < 2:
                        time.sleep(2)
                        continue
                    print(f"[LLM-Vertex] Request failed: {e}. Trying fallback...")
                    break
            else:
                continue
            break
        else:
            break

    # 2. Google AI Studio fallback
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key:
        try:
            endpoint = "streamGenerateContent" if stream else "generateContent"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:{endpoint}?key={gemini_key}"
            payload = {
                "contents": [{"role": "user", "parts": [{"text": user_content}]}],
                "systemInstruction": {"parts": [{"text": system_instruction}]},
                "generationConfig": {"temperature": 0.3}
            }
            if stream:
                res = requests.post(url, json=payload, timeout=60, stream=True)
                if res.status_code == 200:
                    return res
            else:
                res = requests.post(url, json=payload, timeout=25)
                if res.status_code == 200:
                    return res.json()["candidates"][0]["content"]["parts"][0]["text"]
                print(f"[LLM-Studio] API error {res.status_code}. Trying Groq...")
        except Exception as e:
            print(f"[LLM-Studio] Failed: {e}. Trying Groq...")

    # 3. Groq fallback (no native streaming in this path, returns full text)
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        try:
            from groq import Groq
            client = Groq(api_key=groq_key)
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_content}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.3,
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            print(f"[LLM-Groq] Failed: {e}")

    raise Exception("No active LLM providers configured.")


# ── Score threshold: skip LLM-based reranking, trust cosine similarity ──
RELEVANCE_SCORE_THRESHOLD = 0.65

BASE_SYSTEM_PROMPT = (
    "You are Justice AI, a highly capable legal assistant focused on Indian law "
    "(especially traffic challans, consumer disputes, and overcharging).\n"
    "Your goal is to act as the first layer of defense for the user. "
    "When a user presents a problem, you must ALWAYS do the following three things systematically:\n"
    "1. Identify the problem clearly.\n"
    "2. Tell the user if they can win the case or not (assess the probability of winning based on legal principles).\n"
    "3. Design a step-by-step strategy on how they need to go ahead.\n\n"
    "Be direct, clear, and professional. Format your response with clear headings for these three parts."
)

GREETING_WORDS = {"hi", "hello", "hey", "hola", "greetings", "good morning", "good afternoon", "good evening"}


class CRAGPipeline:
    def __init__(self):
        self.store = VectorStore()

    def _is_greeting(self, text: str) -> bool:
        clean = re.sub(r'[^\w\s]', '', text.lower().strip())
        words = clean.split()
        return clean in GREETING_WORDS or (
            len(words) <= 4 and any(w in clean for w in ["hi", "hello", "hey", "name is", "i am"])
        )

    def _build_context_injection(self, chunks: List[Dict[str, Any]], is_greeting: bool, query: str) -> str:
        if is_greeting:
            return (
                "\n\n=== CONVERSATIONAL GREETING MODE ===\n"
                "The user is simply greeting you or introducing themselves. "
                "Do not output legal sections or the three-part layout structure.\n"
                "Politely welcome them, introduce yourself as Justice AI, and ask them to describe "
                "their consumer, traffic challan, or overcharging legal problem."
            )

        # Filter by score threshold — no LLM call needed
        relevant = [c for c in chunks if c.get("score", 0) >= RELEVANCE_SCORE_THRESHOLD]
        print(f"[CRAG] {len(relevant)}/{len(chunks)} chunks passed score threshold ({RELEVANCE_SCORE_THRESHOLD})")

        if not relevant:
            return (
                "\n\n=== LEGAL CONTEXT LIMITATION ===\n"
                "WARNING: No sufficiently relevant legal sections were found for this query.\n"
                "Do NOT cite specific section numbers or make up fine amounts.\n"
                "Give general common-sense legal advice and ask the user for more details."
            )

        segments = []
        for idx, chunk in enumerate(relevant):
            m = chunk.get("metadata", {})
            info = f"Source: {m.get('source', 'Unknown')} | Title: {m.get('title', 'Unknown')}"
            if m.get("act_name"):
                info += f" | Act: {m['act_name']}"
            if m.get("section"):
                info += f" | Section: {m['section']}"
            segments.append(f"--- Reference #{idx+1} ({info}) ---\n{chunk['content']}")

        return f"\n\n=== RELEVANT LEGAL REFERENCE CONTEXT ===\n" + "\n\n".join(segments) + "\n============================="

    def generate_legal_guidance(self, messages: List[Dict[str, str]], category: str) -> str:
        """
        Optimized single-pass pipeline:
        1. Vector search (score-threshold filtered, no LLM grading)
        2. Single LLM call with injected context
        No evaluate_relevance(), no verify_output() — ~7x faster.
        """
        latest_query = ""
        if messages:
            user_msgs = [m for m in messages if m["role"] == "user"]
            latest_query = user_msgs[-1]["content"] if user_msgs else messages[-1]["content"]

        is_greeting = self._is_greeting(latest_query)

        # 1. Vector search
        raw_chunks = []
        if latest_query and not is_greeting:
            try:
                raw_chunks = self.store.search(latest_query, category=category, top_k=5)
            except Exception as e:
                print(f"[CRAG] Vector search failed: {e}")

        # 2. Build context
        context_injection = self._build_context_injection(raw_chunks, is_greeting, latest_query)
        system_instruction = BASE_SYSTEM_PROMPT + context_injection

        # 3. Format conversation history
        conversation_history = "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in messages
        )

        # 4. Single LLM call
        print(f"[CRAG] Generating response (category={category}, greeting={is_greeting})...")
        return call_gemini_llm(
            model="gemini-2.5-flash",
            system_instruction=system_instruction,
            user_content=conversation_history
        )

    def generate_legal_guidance_stream(self, messages: List[Dict[str, str]], category: str):
        """
        Streaming version. Yields text chunks as they arrive from the LLM.
        """
        latest_query = ""
        if messages:
            user_msgs = [m for m in messages if m["role"] == "user"]
            latest_query = user_msgs[-1]["content"] if user_msgs else messages[-1]["content"]

        is_greeting = self._is_greeting(latest_query)

        raw_chunks = []
        if latest_query and not is_greeting:
            try:
                raw_chunks = self.store.search(latest_query, category=category, top_k=5)
            except Exception as e:
                print(f"[CRAG] Vector search failed: {e}")

        context_injection = self._build_context_injection(raw_chunks, is_greeting, latest_query)
        system_instruction = BASE_SYSTEM_PROMPT + context_injection
        conversation_history = "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in messages
        )

        print(f"[CRAG] Streaming response (category={category}, greeting={is_greeting})...")
        response = call_gemini_llm(
            model="gemini-2.5-flash",
            system_instruction=system_instruction,
            user_content=conversation_history,
            stream=True
        )

        if isinstance(response, str):
            # Groq fallback returned a full string — yield it as one chunk
            yield response
            return

        # Parse the streaming JSON array response from Gemini/Vertex
        buffer = ""
        for raw_chunk in response.iter_content(chunk_size=None, decode_unicode=True):
            if not raw_chunk:
                continue
            buffer += raw_chunk
            # Gemini streams a JSON array: [{"candidates": ...}, ...]
            # Each chunk may contain partial JSON — extract complete text parts
            for match in re.finditer(r'"text":\s*"((?:[^"\\]|\\.)*)"', buffer):
                text = match.group(1)
                # Unescape JSON string sequences
                text = text.replace("\\n", "\n").replace("\\t", "\t").replace('\\"', '"').replace("\\\\", "\\")
                if text:
                    yield text
            # Keep only the unparsed tail in the buffer
            last_match = None
            for last_match in re.finditer(r'"text":\s*"((?:[^"\\]|\\.)*)"', buffer):
                pass
            if last_match:
                buffer = buffer[last_match.end():]
