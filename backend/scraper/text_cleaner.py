import re

class TextCleaner:
    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""

        # 1. Normalize line endings
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        # 2. Remove common PDF header/footer artifacts
        # Match lines like "Page 1 of 12", "Page 1", "[Page 1]", "Page | 1", etc.
        page_num_patterns = [
            r"(?i)^\s*page\s+\d+\s+of\s+\d+\s*$",
            r"(?i)^\s*page\s+\d+\s*$",
            r"^\s*\[\s*page\s+\d+\s*\]\s*$",
            r"^\s*\d+\s*of\s*\d+\s*$",
            r"^\s*-\s*\d+\s*-\s*$",
            r"^\s*\|\s*\d+\s*\|\s*$"
        ]
        
        lines = text.split("\n")
        cleaned_lines = []
        
        for line in lines:
            # Check if line matches any page number pattern
            is_page_num = False
            for pattern in page_num_patterns:
                if re.match(pattern, line.strip()):
                    is_page_num = True
                    break
            
            if is_page_num:
                continue  # skip page numbers
                
            # Strip trailing/leading spaces on the line
            cleaned_lines.append(line.rstrip())

        # Reconstruct text
        text = "\n".join(cleaned_lines)

        # 3. Clean up hyphenation at line breaks (e.g., "estab-\nlishment" -> "establishment")
        # Handle word wrap hyphens safely
        text = re.sub(r"(\w+)-\n(\w+)", r"\1\2", text)

        # 4. Standardize multiple newlines (reduce 3+ newlines to 2 newlines)
        text = re.sub(r"\n{3,}", "\n\n", text)

        # 5. Clean up multiple horizontal spaces (replace multiple spaces/tabs with a single space)
        # But preserve single newlines
        lines = text.split("\n")
        processed_lines = []
        for line in lines:
            line_clean = re.sub(r"[ \t]+", " ", line).strip()
            # Retain non-empty lines, or empty lines that serve as paragraph breaks
            processed_lines.append(line_clean)
            
        text = "\n".join(processed_lines)
        text = re.sub(r"\n{3,}", "\n\n", text) # Re-ensure no triple newlines
        
        return text.strip()
