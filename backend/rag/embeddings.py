import os
import re
import json
import hashlib
import requests
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

class EmbeddingHelper:
    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        
        # Cache credentials to prevent slow token fetches on every batch
        self.gcp_token = None
        self.gcp_project = None
        self._load_gcp_credentials()
        
        if self.gcp_token and self.gcp_project:
            self.provider = "vertex"
            self.dimension = 768
            print(f"[Embeddings] Initialized Vertex AI embedding provider (GCP Project: {self.gcp_project}, Dimension: 768).")
        elif self.gemini_key:
            self.provider = "gemini"
            self.dimension = 768
            print("[Embeddings] Initialized Gemini API embedding provider (Dimension: 768).")
        elif self.openai_key:
            self.provider = "openai"
            self.dimension = 1536
            print("[Embeddings] Initialized OpenAI API embedding provider (Dimension: 1536).")
        else:
            self.provider = "fallback"
            self.dimension = 384
            print("[Embeddings] No API keys or GCP credentials detected. Initialized offline Token-Hashing fallback (Dimension: 384).")

    def _load_gcp_credentials(self, force=False):
        if not self.gcp_token or force:
            try:
                from rag.gcp_auth import get_gcp_credentials
                self.gcp_token, self.gcp_project = get_gcp_credentials()
            except Exception as e:
                print(f"[Embeddings] Failed to load GCP credentials: {e}")

    def get_embedding(self, text: str) -> List[float]:
        """Generates embedding vector for a single string."""
        if not text:
            return [0.0] * self.dimension
            
        if self.provider == "vertex":
            for attempt in range(2):
                try:
                    self._load_gcp_credentials()
                    if self.gcp_token and self.gcp_project:
                        url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{self.gcp_project}/locations/us-central1/publishers/google/models/text-embedding-004:predict"
                        headers = {
                            "Authorization": f"Bearer {self.gcp_token}",
                            "Content-Type": "application/json"
                        }
                        payload = {
                            "instances": [{"content": text}]
                        }
                        res = requests.post(url, headers=headers, json=payload, timeout=10)
                        if res.status_code == 200:
                            data = res.json()
                            return data["predictions"][0]["embeddings"]["values"]
                        elif res.status_code == 401:
                            print("[Embeddings] Token expired (401). Refreshing credentials...")
                            self._load_gcp_credentials(force=True)
                            continue
                        else:
                            print(f"[Embeddings] Vertex AI API error: {res.status_code} - {res.text}. Falling back to token-hashing.")
                            break
                    else:
                        print("[Embeddings] GCP credentials not available. Falling back to token-hashing.")
                        break
                except Exception as e:
                    print(f"[Embeddings] Vertex AI API failed: {e}. Falling back to token-hashing.")
                    break
                
        elif self.provider == "gemini":
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={self.gemini_key}"
                payload = {
                    "model": "models/text-embedding-004",
                    "content": {
                        "parts": [{"text": text}]
                    }
                }
                res = requests.post(url, json=payload, timeout=10)
                if res.status_code == 200:
                    data = res.json()
                    return data["embedding"]["values"]
                else:
                    print(f"[Embeddings] Gemini API error: {res.status_code} - {res.text}. Falling back to token-hashing.")
            except Exception as e:
                print(f"[Embeddings] Gemini API failed: {e}. Falling back to token-hashing.")
                
        elif self.provider == "openai":
            try:
                url = "https://api.openai.com/v1/embeddings"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.openai_key}"
                }
                payload = {
                    "input": text,
                    "model": "text-embedding-3-small"
                }
                res = requests.post(url, headers=headers, json=payload, timeout=10)
                if res.status_code == 200:
                    data = res.json()
                    return data["data"][0]["embedding"]
                else:
                    print(f"[Embeddings] OpenAI API error: {res.status_code} - {res.text}. Falling back to token-hashing.")
            except Exception as e:
                print(f"[Embeddings] OpenAI API failed: {e}. Falling back to token-hashing.")

        # FALLBACK: Deterministic Bag-of-Words Token Hashing
        return self._get_fallback_embedding(text)

    def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generates embeddings for a batch of strings, optimized for APIs."""
        if not texts:
            return []
            
        if self.provider == "vertex":
            for attempt in range(2):
                try:
                    self._load_gcp_credentials()
                    if self.gcp_token and self.gcp_project:
                        url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{self.gcp_project}/locations/us-central1/publishers/google/models/text-embedding-004:predict"
                        headers = {
                            "Authorization": f"Bearer {self.gcp_token}",
                            "Content-Type": "application/json"
                        }
                        payload = {
                            "instances": [{"content": t} for t in texts]
                        }
                        res = requests.post(url, headers=headers, json=payload, timeout=20)
                        if res.status_code == 200:
                            data = res.json()
                            return [pred["embeddings"]["values"] for pred in data["predictions"]]
                        elif res.status_code == 401:
                            print("[Embeddings] Token expired (401). Refreshing credentials...")
                            self._load_gcp_credentials(force=True)
                            continue
                        else:
                            print(f"[Embeddings] Vertex Batch API error: {res.status_code}. Using fallback.")
                            break
                    else:
                        print("[Embeddings] GCP credentials not available. Using fallback.")
                        break
                except Exception as e:
                    print(f"[Embeddings] Vertex Batch API failed: {e}. Using fallback.")
                    break
                
        elif self.provider == "gemini" and self.gemini_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key={self.gemini_key}"
                requests_payload = []
                for text in texts:
                    requests_payload.append({
                        "model": "models/text-embedding-004",
                        "content": {
                            "parts": [{"text": text}]
                        }
                    })
                
                payload = {"requests": requests_payload}
                res = requests.post(url, json=payload, timeout=20)
                if res.status_code == 200:
                    data = res.json()
                    return [emb["values"] for emb in data["embeddings"]]
                else:
                    print(f"[Embeddings] Gemini Batch API error: {res.status_code}. Using fallback.")
            except Exception as e:
                print(f"[Embeddings] Gemini Batch API failed: {e}. Using fallback.")
                
        elif self.provider == "openai" and self.openai_key:
            try:
                url = "https://api.openai.com/v1/embeddings"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.openai_key}"
                }
                payload = {
                    "input": texts,
                    "model": "text-embedding-3-small"
                }
                res = requests.post(url, headers=headers, json=payload, timeout=20)
                if res.status_code == 200:
                    data = res.json()
                    # Results are returned sorted by input index
                    return [item["embedding"] for item in data["data"]]
                else:
                    print(f"[Embeddings] OpenAI Batch API error: {res.status_code}. Using fallback.")
            except Exception as e:
                print(f"[Embeddings] OpenAI Batch API failed: {e}. Using fallback.")

        # Fallback for all items in batch
        return [self._get_fallback_embedding(t) for t in texts]

    def _get_fallback_embedding(self, text: str) -> List[float]:
        """
        Deterministic word-token hashing model. 
        Creates a normalized bag-of-words frequency vector in 384 dimensions,
        filtering out common English stop words to ensure high quality matches.
        """
        dimension = 384
        vector = [0.0] * dimension
        
        STOP_WORDS = {
            "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", 
            "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", 
            "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", 
            "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", 
            "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", 
            "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", 
            "with", "about", "against", "between", "into", "through", "during", "before", "after", 
            "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", 
            "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", 
            "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", 
            "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", 
            "should", "now", "shall", "hereby", "thereof", "would", "their", "about", "underneath"
        }
        
        # Simple Query Expansion / Synonym mapping for local fallback
        text_expanded = text.lower()
        if "helmet" in text_expanded:
            text_expanded += " protective headgear security safety helmet"
        if "mrp" in text_expanded:
            text_expanded += " maximum retail price overcharge commodities packaging"
        if "challan" in text_expanded:
            text_expanded += " fine ticket penalty violation offence speed"
        if "refund" in text_expanded:
            text_expanded += " return cancel cancellation merchant transaction dispute chargeback"
            
        # Tokenize (lowercase words)
        words = re.findall(r"\b\w{2,}\b", text_expanded)
        words = [w for w in words if w not in STOP_WORDS]
        
        if not words:
            return vector
            
        for word in words:
            # Deterministic hash mapping to a bucket in range [0, 383]
            h = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16)
            bucket = h % dimension
            # Add frequency weight (simple term frequency)
            vector[bucket] += 1.0
            
        # L2 Normalization (unit length)
        square_sum = sum(x * x for x in vector)
        magnitude = square_sum ** 0.5
        
        if magnitude > 0.0:
            vector = [x / magnitude for x in vector]
            
        return vector
