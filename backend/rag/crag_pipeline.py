import os
import re
import json
import requests
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from rag.vector_store import VectorStore

load_dotenv()

# ── Thinking budget constants ─────────────────────────────────────────────────
# For the FINAL answer we allow up to 2 000 tokens of reasoning (≈ ~1 s extra).
# For lightweight/internal calls (grading, classification) we keep it at 0
# to avoid unnecessary latency.
THINKING_BUDGET_ANSWER = 2000   # tokens; 0 = disabled
THINKING_BUDGET_INTERNAL = 0    # always disabled for utility calls


def call_gemini_llm(
    model: str,
    system_instruction: str,
    user_content: str,
    stream: bool = False,
    thinking_budget: int = THINKING_BUDGET_INTERNAL,
):
    """
    Unified LLM caller. Routes to:
    1. Vertex AI (GCP ADC)
    2. Google AI Studio (GEMINI_API_KEY)
    3. Groq API (fallback – no native thinking support)

    thinking_budget controls how many tokens Gemini may use for internal
    reasoning before producing the visible answer:
      • 0 = disabled → fastest, best for classification / grading
      • >0 = enabled → better legal reasoning for final answers

    When stream=True, returns a requests.Response in streaming mode.
    When stream=False, returns the full response text as a string.
    """
    from rag.gcp_auth import get_gcp_credentials
    import time

    generation_config: Dict[str, Any] = {
        "temperature": 0.3,
        "thinkingConfig": {"thinkingBudget": thinking_budget},
    }

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
                "Content-Type": "application/json",
            }
            payload = {
                "contents": [{"role": "user", "parts": [{"text": user_content}]}],
                "systemInstruction": {"parts": [{"text": system_instruction}]},
                "generationConfig": generation_config,
            }

            for call_retry in range(3):
                try:
                    if stream:
                        res = requests.post(url, headers=headers, json=payload, timeout=30, stream=True)
                        if res.status_code == 200:
                            return res
                        elif res.status_code == 401 and attempt == 0:
                            break
                    else:
                        res = requests.post(url, headers=headers, json=payload, timeout=15)
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
                "generationConfig": generation_config,
            }
            if stream:
                res = requests.post(url, json=payload, timeout=30, stream=True)
                if res.status_code == 200:
                    return res
            else:
                res = requests.post(url, json=payload, timeout=15)
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
                    {"role": "user", "content": user_content},
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.3,
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            print(f"[LLM-Groq] Failed: {e}")

    raise Exception("No active LLM providers configured.")


# ── Score threshold: skip LLM-based reranking, trust cosine similarity ─────────
RELEVANCE_SCORE_THRESHOLD = 0.65

BASE_SYSTEM_PROMPT = (
    "You are Justice AI — an Indian legal assistant for traffic challans, consumer disputes, and overcharging.\n"
    "For every problem: (1) Identify the issue, (2) Assess win probability, (3) Give a clear action plan.\n"
    "Be concise, direct, and use plain language. Keep responses under 250 words unless the case is complex."
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

    def _build_context_injection(
        self, chunks: List[Dict[str, Any]], is_greeting: bool, query: str
    ) -> tuple[str, str, list]:
        """
        Returns (context_injection_text, source_type, citations).

        source_type: "greeting" | "corpus" | "web_fallback"
        citations:   list of dicts with keys: title, act_name, section, source
        """
        if is_greeting:
            return (
                "\n\n=== CONVERSATIONAL GREETING MODE ===\n"
                "The user is simply greeting you or introducing themselves. "
                "Do not output legal sections or the three-part layout structure.\n"
                "Politely welcome them, introduce yourself as Justice AI, and ask them to describe "
                "their consumer, traffic challan, or overcharging legal problem.",
                "greeting",
                [],
            )

        # Filter by score threshold — no LLM call needed
        relevant = [c for c in chunks if c.get("score", 0) >= RELEVANCE_SCORE_THRESHOLD]
        print(f"[CRAG] {len(relevant)}/{len(chunks)} chunks passed score threshold ({RELEVANCE_SCORE_THRESHOLD})")

        if not relevant:
            return (
                "\n\n=== LEGAL CONTEXT LIMITATION ===\n"
                "WARNING: No sufficiently relevant legal sections were found in the corpus for this query.\n"
                "You are answering from your general legal knowledge — NOT from the curated Indian law corpus.\n"
                "Do NOT cite specific section numbers or make up fine amounts.\n"
                "Give general common-sense legal advice and ask the user for more details.",
                "web_fallback",
                [],
            )

        # Build context segments and extract citations
        segments = []
        citations = []
        for idx, chunk in enumerate(relevant):
            m = chunk.get("metadata", {})
            info = f"Source: {m.get('source', 'Unknown')} | Title: {m.get('title', 'Unknown')}"
            if m.get("act_name"):
                info += f" | Act: {m['act_name']}"
            if m.get("section"):
                info += f" | Section: {m['section']}"
            segments.append(f"--- Reference #{idx+1} ({info}) ---\n{chunk['content']}")
            citations.append({
                "ref": idx + 1,
                "title": m.get("title", "Unknown"),
                "act_name": m.get("act_name", ""),
                "section": m.get("section", ""),
                "source": m.get("source", ""),
            })

        context_text = (
            "\n\n=== RELEVANT LEGAL REFERENCE CONTEXT ===\n"
            + "\n\n".join(segments)
            + "\n============================="
        )
        return context_text, "corpus", citations

    def generate_legal_guidance(
        self, messages: List[Dict[str, str]], category: str
    ) -> Dict[str, Any]:
        """
        Optimized single-pass pipeline:
        1. Vector search (score-threshold filtered, no LLM grading)
        2. Single LLM call with injected context

        Returns a dict:
          {
            "answer":      str,
            "source_type": "corpus" | "web_fallback" | "greeting",
            "citations":   [{"ref": int, "title": str, "act_name": str, "section": str, "source": str}]
          }
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
                raw_chunks = self.store.search(latest_query, category=category, top_k=3)
            except Exception as e:
                print(f"[CRAG] Vector search failed: {e}")

        # 2. Build context
        context_injection, source_type, citations = self._build_context_injection(
            raw_chunks, is_greeting, latest_query
        )
        system_instruction = BASE_SYSTEM_PROMPT + context_injection

        # 3. Format conversation history
        conversation_history = "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in messages
        )

        # 4. Single LLM call — use thinking only for non-trivial corpus/fallback answers
        thinking_budget = (
            THINKING_BUDGET_INTERNAL  # 0 — no overhead for greetings
            if is_greeting
            else THINKING_BUDGET_ANSWER  # allow reasoning for legal answers
        )
        print(f"[CRAG] Generating response (category={category}, source={source_type}, thinking={thinking_budget})...")

        answer = call_gemini_llm(
            model="gemini-2.5-flash",
            system_instruction=system_instruction,
            user_content=conversation_history,
            thinking_budget=thinking_budget,
        )
        return {"answer": answer, "source_type": source_type, "citations": citations}

    def generate_legal_guidance_stream(self, messages: List[Dict[str, str]], category: str):
        """
        Streaming version. Yields text chunks as they arrive from the LLM.
        Also yields a special JSON sentinel at the end carrying metadata:
          {"__meta__": {"source_type": ..., "citations": [...]}}
        """
        latest_query = ""
        if messages:
            user_msgs = [m for m in messages if m["role"] == "user"]
            latest_query = user_msgs[-1]["content"] if user_msgs else messages[-1]["content"]

        is_greeting = self._is_greeting(latest_query)

        raw_chunks = []
        if latest_query and not is_greeting:
            try:
                raw_chunks = self.store.search(latest_query, category=category, top_k=3)
            except Exception as e:
                print(f"[CRAG] Vector search failed: {e}")

        context_injection, source_type, citations = self._build_context_injection(
            raw_chunks, is_greeting, latest_query
        )
        system_instruction = BASE_SYSTEM_PROMPT + context_injection
        conversation_history = "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in messages
        )

        thinking_budget = THINKING_BUDGET_INTERNAL if is_greeting else THINKING_BUDGET_ANSWER
        print(f"[CRAG] Streaming response (category={category}, source={source_type}, thinking={thinking_budget})...")

        response = call_gemini_llm(
            model="gemini-2.5-flash",
            system_instruction=system_instruction,
            user_content=conversation_history,
            stream=True,
            thinking_budget=thinking_budget,
        )

        if isinstance(response, str):
            # Groq fallback returned a full string — yield it as one chunk
            yield response
        else:
            # Parse the streaming JSON array response from Gemini/Vertex
            buffer = ""
            for raw_chunk in response.iter_content(chunk_size=None, decode_unicode=True):
                if not raw_chunk:
                    continue
                buffer += raw_chunk
                for match in re.finditer(r'"text":\s*"((?:[^"\\]|\\.)*)"', buffer):
                    text = match.group(1)
                    text = (
                        text.replace("\\n", "\n")
                            .replace("\\t", "\t")
                            .replace('\\"', '"')
                            .replace("\\\\", "\\")
                    )
                    if text:
                        yield text
                last_match = None
                for last_match in re.finditer(r'"text":\s*"((?:[^"\\]|\\.)*)"', buffer):
                    pass
                if last_match:
                    buffer = buffer[last_match.end():]

        # Always yield metadata sentinel at the end so callers can surface it
        yield json.dumps({"__meta__": {"source_type": source_type, "citations": citations}})
