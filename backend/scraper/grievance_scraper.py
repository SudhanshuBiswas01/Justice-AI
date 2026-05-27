import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional
import re

# Seed database of templates and procedures
SEED_TEMPLATES = [
    {
        "title": "Complaint Template: Wrong Traffic Challan Grievance",
        "category": "traffic_challan",
        "doc_type": "Complaint Template",
        "act_name": "Motor Vehicles Act, 1988",
        "section": "Section 129, Section 194D",
        "year": 1988,
        "content": """
        COMPLAINT DRAFT TEMPLATE: WRONG TRAFFIC CHALLAN GRIEVANCE
        
        To,
        The Commissioner of Traffic Police,
        [City Name] Traffic Police Department,
        [City, State]
        
        Subject: Grievance against Wrong Traffic Challan No. [CHALLAN_NUMBER] for Vehicle No. [VEHICLE_NUMBER]
        
        Respected Sir/Madam,
        
        I am writing to register a formal grievance regarding the traffic e-challan issued under Challan No: [CHALLAN_NUMBER] on Date: [DATE] at Time: [TIME] for the alleged offence of [OFFENCE_NAME, e.g., Riding without Helmet / Red Light Jumping] under Section [SECTION, e.g., 194D] of the Motor Vehicles Act, 1988.
        
        I state that the challan issued is erroneous due to the following reasons:
        1. [REASON 1: e.g., The camera photograph attached to the challan clearly shows that I was wearing a standard ISI-marked helmet with the strap secured.]
        2. [REASON 2: e.g., The vehicle in the photo is not my vehicle. The license plate was misread by the automated OCR camera system.]
        3. [REASON 3: e.g., The traffic signal was green, and I crossed the line before it turned amber, as shown by the sequence of photos.]
        
        I have attached the following evidence for your perusal:
        - High-resolution copy of the official e-challan screenshot.
        - [ADDITIONAL EVIDENCE: e.g., Dashcam footage / Clear photo of my vehicle's license plate / Receipt of my ISI helmet].
        
        Therefore, I request you to review the visual evidence and cancel/quash the erroneous Challan No. [CHALLAN_NUMBER] in your records.
        
        Yours faithfully,
        
        [User Name]
        [Mobile Number]
        [Address]
        """,
        "source": "Justice AI Template Library"
    },
    {
        "title": "Legal Notice Template: Overcharging Above MRP",
        "category": "mrp_overcharging",
        "doc_type": "Complaint Template",
        "act_name": "Legal Metrology Act, 2009",
        "section": "Section 18, Section 36",
        "year": 2009,
        "content": """
        LEGAL NOTICE TEMPLATE: OVERCHARGING ABOVE MAXIMUM RETAIL PRICE (MRP)
        
        Date: [DATE]
        
        To,
        The Manager / Proprietor,
        [Merchant / Store Name],
        [Store Address]
        
        Subject: Legal Notice for charging price in excess of Maximum Retail Price (MRP) - Unfair Trade Practice and Violation of Legal Metrology Act, 2009.
        
        Dear Sir/Madam,
        
        Under instruction from and on behalf of my client [USER_NAME], resident of [USER_ADDRESS], I hereby serve you with this legal notice:
        
        1. That on [DATE] at around [TIME], my client visited your establishment located at [STORE_LOCATION] and purchased a packaged commodity, namely [PRODUCT_NAME, e.g., Packaged Water Bottle / Soft Drink].
        2. That the Maximum Retail Price (MRP) clearly printed on the outer cover/packaging of the said product by the manufacturer was Rs. [MRP_PRICE] (inclusive of all taxes).
        3. That your billing counter charged my client Rs. [CHARGED_PRICE] for the said product, which exceeds the printed MRP by Rs. [DIFFERENCE]. A copy of the Retail Invoice No: [INVOICE_NUMBER] is attached as proof.
        4. That charging any price in excess of the MRP declared on the package is a direct violation of Section 18 of the Legal Metrology Act, 2009, and constitutes an offence punishable under Section 36 of the Act.
        5. That this action also constitutes "deficiency of service" and an "unfair trade practice" under Section 2(47) of the Consumer Protection Act, 2019.
        
        Therefore, I hereby call upon you to:
        a) Refund the excess amount of Rs. [DIFFERENCE] to my client within 15 days of receipt of this notice.
        b) Pay my client Rs. [COMPENSATION, e.g., 5,000] towards mental harassment and Rs. [LITIGATION_COST, e.g., 3,000] towards the cost of this legal notice.
        
        Failing which, my client shall be constrained to initiate formal consumer dispute proceedings against your establishment before the District Consumer Disputes Redressal Commission at your cost and risk.
        
        Yours sincerely,
        
        [Advocate Name / Sender Name]
        """,
        "source": "Justice AI Template Library"
    },
    {
        "title": "Procedure: How to File a Dispute on e-Daakhil Portal",
        "category": "grievance_system",
        "doc_type": "Procedure",
        "act_name": "Consumer Protection Act, 2019",
        "section": "Section 12",
        "year": 2019,
        "content": """
        PROCEDURE: STEP-BY-STEP GUIDE FOR FILING CONSUMER COMPLAINT ON E-DAAKHIL
        
        The e-Daakhil portal (edaakhil.nic.in) allows consumers to file complaints online before the Consumer Commissions (District, State, and National) without visiting the commission offices physically.
        
        Step 1: Registration
        1. Go to www.edaakhil.nic.in
        2. Click on "Registration" and select "Complainant/Representative".
        3. Fill in your name, email, mobile number, and upload an ID proof (Aadhaar, PAN, Voter ID).
        4. Activate your account using the activation link sent to your email.
        
        Step 2: Preparing the Documents
        Before logging in, prepare these documents in PDF format:
        1. Index of Documents (First page listing all items).
        2. Main Complaint Petition (stating facts, dispute reasons, and prayer/relief sought). Must be signed by the complainant.
        3. Copy of Invoice/Bill showing purchase.
        4. Proof of payment (bank statement, UPI receipt, credit card bill).
        5. Written communication with the merchant (emails, support tickets, legal notice).
        6. Affidavit stating the facts mentioned are true.
        
        Step 3: Filing the Complaint
        1. Login to your e-Daakhil account.
        2. Click on "File a New Case" -> "District Commission" (or appropriate commission based on jurisdiction).
        3. Select the State and District.
        4. Enter Complainant Details (name, contact, address).
        5. Enter Opponent/Respondent Details (name of company/merchant, registered office address).
        6. Enter Case Details (Claim amount, brief description, transaction date).
        7. Upload the prepared PDF documents under their respective tabs.
        
        Step 4: Fee Payment
        1. Pay the consumer court fee online using the integrated payment gateway (Bharat Kosh).
        2. The fee depends on the claim value (No fee for claims up to Rs. 5 Lakhs!).
        
        Step 5: Submission & Verification
        1. Verify all entries using the "Preview" button.
        2. Click "Submit" to complete the filing.
        3. You will receive a unique reference number. The commission will review and approve/admit the case within 21 days.
        """,
        "source": "National Consumer Commission Portal"
    }
]

class GrievanceScraper:
    def __init__(self):
        self.templates = SEED_TEMPLATES

    def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Searches the grievance database for relevant procedures and templates.
        """
        print(f"[Grievance Scraper] Searching for query: '{query}'")
        query_lower = query.lower()
        results = []
        
        for item in self.templates:
            # Check matches in title, content, or category
            if any(w in item["title"].lower() or w in item["content"].lower() or w in item["category"].lower() for w in query_lower.split()):
                doc_id = f"grievance_{abs(hash(item['title']))}"
                results.append({
                    "id": doc_id,
                    "title": item["title"],
                    "content": item["content"].strip(),
                    "url": "https://edaakhil.nic.in/procedures" if item["doc_type"] == "Procedure" else "https://justiceai.org/templates",
                    "court": "Consumer Forum" if "consumer" in item["title"].lower() else None,
                    "act_name": item["act_name"],
                    "section": item["section"],
                    "year": item["year"],
                    "category": item["category"],
                    "doc_type": item["doc_type"]
                })
                
        # If no match, return all templates
        if not results:
            for item in self.templates[:limit]:
                doc_id = f"grievance_{abs(hash(item['title']))}"
                results.append({
                    "id": doc_id,
                    "title": item["title"],
                    "content": item["content"].strip(),
                    "url": "https://edaakhil.nic.in/procedures" if item["doc_type"] == "Procedure" else "https://justiceai.org/templates",
                    "court": "Consumer Forum" if "consumer" in item["title"].lower() else None,
                    "act_name": item["act_name"],
                    "section": item["section"],
                    "year": item["year"],
                    "category": item["category"],
                    "doc_type": item["doc_type"]
                })
                
        return results
