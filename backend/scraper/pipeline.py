import os
import uuid
from typing import List, Dict, Any, Optional
from scraper.db_manager import DBManager
from scraper.pdf_processor import PDFProcessor
from scraper.metadata_extractor import MetadataExtractor
from scraper.chunker import Chunker
from scraper.indian_kanoon import IndianKanoonScraper
from scraper.india_code import IndiaCodeScraper
from scraper.grievance_scraper import GrievanceScraper

class ScraperPipeline:
    def __init__(self, db_path: Optional[str] = None):
        self.db = DBManager(db_path) if db_path else DBManager()
        self.metadata_extractor = MetadataExtractor()
        
        # Initialize scraping drivers
        self.kanoon_scraper = IndianKanoonScraper()
        self.code_scraper = IndiaCodeScraper()
        self.grievance_scraper = GrievanceScraper()

    def run_web_scrape(self, source: str, queries: List[str], max_results: int = 5) -> Dict[str, Any]:
        """
        Runs a web scraping run for a list of queries on a selected source.
        Saves documents, chunks, and logs the execution.
        """
        total_ingested = 0
        log_msgs = []
        
        print(f"[Pipeline] Starting web scrape for source: '{source}' with queries: {queries}")
        
        for query in queries:
            scraped_docs = []
            try:
                if source == "indian_kanoon" or source == "all":
                    docs = self.kanoon_scraper.search(query, limit=max_results)
                    scraped_docs.extend(docs)
                    
                if source == "india_code" or source == "all":
                    docs = self.code_scraper.search(query, limit=max_results)
                    scraped_docs.extend(docs)
                    
                if source == "consumer_grievance" or source == "all":
                    docs = self.grievance_scraper.search(query, limit=max_results)
                    scraped_docs.extend(docs)
            except Exception as e:
                err_msg = f"Failed to scrape from source '{source}' for query '{query}': {str(e)}"
                print(f"[Pipeline] Error: {err_msg}")
                self.db.add_log(source, query, "FAILED", 0, err_msg)
                log_msgs.append(err_msg)
                continue
                
            query_ingested = 0
            for doc in scraped_docs:
                try:
                    title = doc.get("title", f"Scraped Document {doc.get('id')}")
                    raw_content = doc.get("content", "")
                    doc_source = doc.get("source", source)
                    doc_url = doc.get("url", "")
                    
                    # Clean text
                    from scraper.text_cleaner import TextCleaner
                    cleaned_content = TextCleaner.clean_text(raw_content)
                    
                    if not cleaned_content:
                        continue
                        
                    # Extract high-quality metadata (LLM-assisted if Groq active, else heuristics)
                    metadata = self.metadata_extractor.extract_metadata(cleaned_content, title, doc_source)
                    
                    # Manual overrides from scraper-specific results if present
                    if "category" in doc: metadata["category"] = doc["category"]
                    if "doc_type" in doc: metadata["doc_type"] = doc["doc_type"]
                    if "court" in doc and doc["court"]: metadata["court"] = doc["court"]
                    if "act_name" in doc and doc["act_name"]: metadata["act_name"] = doc["act_name"]
                    if "section" in doc and doc["section"]: metadata["section"] = doc["section"]
                    if "year" in doc and doc["year"]: metadata["year"] = doc["year"]
                    
                    metadata["url"] = doc_url
                    
                    # Save main resource
                    resource_id = self.db.save_resource(
                        title=metadata.get("title", title),
                        source=doc_source,
                        category=metadata.get("category", "consumer_dispute"),
                        doc_type=metadata.get("doc_type", "Procedure"),
                        raw_content=raw_content,
                        cleaned_content=cleaned_content,
                        court=metadata.get("court"),
                        act_name=metadata.get("act_name"),
                        section=metadata.get("section"),
                        year=metadata.get("year"),
                        metadata_json=metadata,
                        doc_id=doc.get("id")
                    )
                    
                    # Chunk and save
                    chunks = Chunker.chunk_document(resource_id, cleaned_content, metadata)
                    self.db.clear_chunks(resource_id)
                    self.db.save_chunks_batch(chunks)
                        
                    query_ingested += 1
                    total_ingested += 1
                except Exception as e:
                    print(f"[Pipeline] Failed to process document '{doc.get('title')}': {e}")
                    
            success_msg = f"Successfully crawled {query_ingested} items for query '{query}' from source '{source}'."
            print(f"[Pipeline] {success_msg}")
            self.db.add_log(source, query, "SUCCESS", query_ingested, success_msg)
            log_msgs.append(success_msg)
            
        return {
            "status": "COMPLETED",
            "items_ingested": total_ingested,
            "logs": log_msgs
        }

    def ingest_local_pdf(self, 
                         pdf_path: str, 
                         category: str, 
                         doc_type: str, 
                         act_name: Optional[str] = None, 
                         year: Optional[int] = None, 
                         source: str = "Local Ingestion") -> str:
        """
        Ingests a local PDF file, extracts text, cleans it, extracts metadata, 
        chunks it, and saves both documents and chunks to SQLite.
        """
        print(f"[Pipeline] Ingesting local PDF: {pdf_path}")
        
        # 1. Process PDF
        pdf_data = PDFProcessor.process_pdf(pdf_path)
        
        # 2. Extract metadata and merge manual fields
        title = pdf_data["title"]
        cleaned_content = pdf_data["cleaned_content"]
        
        metadata = self.metadata_extractor.extract_metadata(cleaned_content, title, source)
        
        # Overwrite with specified values
        metadata["category"] = category
        metadata["doc_type"] = doc_type
        if act_name: metadata["act_name"] = act_name
        if year: metadata["year"] = int(year)
        metadata["local_path"] = pdf_path
        
        # 3. Save Resource
        resource_id = self.db.save_resource(
            title=title,
            source=source,
            category=category,
            doc_type=doc_type,
            raw_content=pdf_data["raw_content"],
            cleaned_content=cleaned_content,
            court=metadata.get("court"),
            act_name=metadata.get("act_name") or act_name,
            section=metadata.get("section"),
            year=metadata.get("year") or year,
            metadata_json=metadata
        )
        
        # 4. Chunk & Save Chunks
        chunks = Chunker.chunk_document(resource_id, cleaned_content, metadata)
        self.db.clear_chunks(resource_id)
        self.db.save_chunks_batch(chunks)
            
        print(f"[Pipeline] Ingested local PDF successfully: '{title}' with {len(chunks)} chunks.")
        
        # Log completion
        self.db.add_log("local_pdf", os.path.basename(pdf_path), "SUCCESS", 1, f"Ingested PDF with {len(chunks)} chunks.")
        
        return resource_id

    def scan_and_ingest_workspace_pdfs(self, workspace_root: str) -> Dict[str, Any]:
        """
        Scans the workspace root directory for existing PDF resources and ingests them.
        """
        # Predefined mapping for workspace files
        PDF_MAPPINGS = {
            "THE MOTOR VEHICLES ACT, 1988.pdf": {
                "category": "traffic_challan",
                "doc_type": "Act",
                "act_name": "Motor Vehicles Act, 1988",
                "year": 1988
            },
            "Motor Vehicles (Amendment) Act, 2019.pdf": {
                "category": "traffic_challan",
                "doc_type": "Amendment",
                "act_name": "Motor Vehicles (Amendment) Act, 2019",
                "year": 2019
            },
            "THE CENTRAL MOTOR VEHICLES RULES, 19891.pdf": {
                "category": "traffic_challan",
                "doc_type": "Rule",
                "act_name": "Central Motor Vehicles Rules, 1989",
                "year": 1989
            },
            "TRAFFIC OFFENCE & FINE CHART.pdf": {
                "category": "traffic_challan",
                "doc_type": "Procedure",
                "act_name": "Traffic Offence & Fine Chart",
                "year": 2019
            }
        }
        
        results = []
        ingested_count = 0
        
        print(f"[Pipeline] Scanning workspace root: {workspace_root}")
        
        for file_name, mapping in PDF_MAPPINGS.items():
            # Check in documents/traffic_challan/ folder first
            pdf_path = os.path.join(workspace_root, "documents", "traffic_challan", file_name)
            if not os.path.exists(pdf_path):
                # Fallback to workspace root folder
                pdf_path = os.path.join(workspace_root, file_name)
                
            if os.path.exists(pdf_path):
                try:
                    res_id = self.ingest_local_pdf(
                        pdf_path=pdf_path,
                        category=mapping["category"],
                        doc_type=mapping["doc_type"],
                        act_name=mapping["act_name"],
                        year=mapping["year"],
                        source="Workspace Local Sync"
                    )
                    results.append({"file": file_name, "status": "SUCCESS", "id": res_id})
                    ingested_count += 1
                except Exception as e:
                    err_msg = f"Failed to ingest local file {file_name}: {str(e)}"
                    print(f"[Pipeline] Error: {err_msg}")
                    results.append({"file": file_name, "status": "FAILED", "error": str(e)})
            else:
                print(f"[Pipeline] File not found in workspace: {file_name}")
                results.append({"file": file_name, "status": "FILE_NOT_FOUND"})
                
        return {
            "total_scanned": len(PDF_MAPPINGS),
            "total_ingested": ingested_count,
            "results": results
        }
