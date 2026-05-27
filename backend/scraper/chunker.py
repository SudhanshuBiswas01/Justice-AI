import uuid
from typing import List, Dict, Any

class Chunker:
    @staticmethod
    def split_text(text: str, chunk_size: int = 800, chunk_overlap: int = 150) -> List[str]:
        """
        Splits text into overlapping chunks, attempting to respect paragraph and sentence boundaries.
        """
        if not text:
            return []

        # If the text is smaller than chunk_size, return it in a single chunk
        if len(text) <= chunk_size:
            return [text]

        # Let's split by paragraph first
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = []
        current_length = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # If a single paragraph is larger than chunk_size, split it by sentence
            if len(para) > chunk_size:
                # If we have accumulated text, save it first
                if current_chunk:
                    chunks.append("\n\n".join(current_chunk))
                    current_chunk = []
                    current_length = 0
                
                # Split paragraph by sentences (simple period boundary search)
                # Regex matches periods, question marks, or exclamation marks followed by whitespace or end of string
                import re
                sentences = re.split(r'(?<=[.!?])\s+', para)
                
                for sentence in sentences:
                    sentence = sentence.strip()
                    if not sentence:
                        continue
                        
                    # If a single sentence is larger than chunk_size, split by characters
                    if len(sentence) > chunk_size:
                        # Append characters directly
                        words = sentence.split(" ")
                        temp_chunk = []
                        temp_len = 0
                        for word in words:
                            if temp_len + len(word) + 1 > chunk_size:
                                chunks.append(" ".join(temp_chunk))
                                # Keep overlap words
                                overlap_words = temp_chunk[-min(len(temp_chunk), 5):] if temp_chunk else []
                                temp_chunk = list(overlap_words) + [word]
                                temp_len = sum(len(w) + 1 for w in temp_chunk)
                            else:
                                temp_chunk.append(word)
                                temp_len += len(word) + 1
                        if temp_chunk:
                            chunks.append(" ".join(temp_chunk))
                    else:
                        # Standard sentence accumulator
                        if current_length + len(sentence) + 2 > chunk_size:
                            chunks.append(" ".join(current_chunk))
                            # Handle overlap
                            overlap_str = " ".join(current_chunk)
                            overlap_chars = overlap_str[-chunk_overlap:] if len(overlap_str) > chunk_overlap else overlap_str
                            current_chunk = [overlap_chars, sentence]
                            current_length = sum(len(x) + 1 for x in current_chunk)
                        else:
                            current_chunk.append(sentence)
                            current_length += len(sentence) + 1
            else:
                # Paragraph accumulator
                if current_length + len(para) + 2 > chunk_size:
                    chunks.append("\n\n".join(current_chunk))
                    # Handle overlap (character-based overlap for continuity)
                    overlap_str = "\n\n".join(current_chunk)
                    overlap_chars = overlap_str[-chunk_overlap:] if len(overlap_str) > chunk_overlap else overlap_str
                    current_chunk = [overlap_chars, para]
                    current_length = sum(len(x) + 2 for x in current_chunk)
                else:
                    current_chunk.append(para)
                    current_length += len(para) + 2

        if current_chunk:
            chunks.append("\n\n".join(current_chunk))

        # Final pass to ensure no chunk is purely whitespace
        return [c.strip() for c in chunks if c.strip()]

    @classmethod
    def chunk_document(cls, 
                       resource_id: str, 
                       cleaned_content: str, 
                       document_metadata: Dict[str, Any], 
                       chunk_size: int = 800, 
                       chunk_overlap: int = 150) -> List[Dict[str, Any]]:
        """
        Chunks a document and attaches parent document metadata to each chunk.
        """
        text_chunks = cls.split_text(cleaned_content, chunk_size, chunk_overlap)
        
        chunks = []
        for idx, text in enumerate(text_chunks):
            # Create a unique, deterministic UUID for the chunk
            chunk_uuid = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{resource_id}:chunk:{idx}"))
            
            # Form self-contained chunk metadata for future vector indices
            chunk_metadata = {
                "source": document_metadata.get("source", "unknown"),
                "category": document_metadata.get("category", "general"),
                "doc_type": document_metadata.get("doc_type", "document"),
                "title": document_metadata.get("title", ""),
                "act_name": document_metadata.get("act_name"),
                "section": document_metadata.get("section"),
                "year": document_metadata.get("year")
            }
            
            chunks.append({
                "id": chunk_uuid,
                "resource_id": resource_id,
                "chunk_index": idx,
                "content": text,
                "metadata_json": chunk_metadata
            })
            
        return chunks
