import requests
from bs4 import BeautifulSoup
import urllib.parse
from typing import List, Dict, Any, Optional
import random

# Core Central Acts for India Code mock database fallback
MOCK_ACTS = [
    {
        "title": "The Consumer Protection Act, 2019",
        "act_name": "Consumer Protection Act, 2019",
        "year": 2019,
        "category": "consumer_dispute",
        "content": """
        THE CONSUMER PROTECTION ACT, 2019
        [ACT NO. 35 OF 2019]
        An Act to provide for protection of the interests of consumers and for the said purpose, to establish authorities for timely and effective administration and settlement of consumers' disputes and for matters connected therewith or incidental thereto.
        
        Section 2. Definitions:
        (11) "deficiency" means any fault, imperfection, shortcoming or inadequacy in the quality, nature and manner of performance which is required to be maintained by or under any law for the time being in force or has been undertaken to be performed by a person in pursuance of a contract or otherwise in relation to any service and includes—
        (i) any act of negligence or omission or commission by such person which causes loss or injury to the consumer; and
        (ii) deliberate withholding of relevant information by such person to the consumer;
        
        (47) "unfair trade practice" means a trade practice which, for the purpose of promoting the sale, use or supply of any goods or for the provision of any service, adopts any unfair method or unfair or deceptive practice including any of the following practices, namely:—
        (i) making false or misleading representations regarding goods or services;
        (ii) selling goods that do not conform to standards;
        (iii) refusing to withdraw or recall defective goods or services or refusing to refund the consideration paid;
        
        Section 12. Consumer Disputes Redressal Commission:
        Establishment of District, State, and National Consumer Disputes Redressal Commissions.
        District Commissions have jurisdiction to entertain complaints where the value of the goods or services paid as consideration does not exceed one crore rupees (amended subsequently).
        """,
        "section": "Section 2(11), Section 2(47)"
    },
    {
        "title": "The Legal Metrology Act, 2009",
        "act_name": "Legal Metrology Act, 2009",
        "year": 2009,
        "category": "mrp_overcharging",
        "content": """
        THE LEGAL METROLOGY ACT, 2009
        [ACT NO. 1 OF 2010]
        An Act to establish and enforce standards of weights and measures, regulate trade and commerce in weights, measures and other goods which are sold or distributed by weight, measure or number and for matters connected therewith or incidental thereto.
        
        Section 18. Declarations on packaged commodities:
        No person shall manufacture, pack, import, sell, distribute, deliver or otherwise transfer, offer, expose or possess for sale any pre-packaged commodity in standard quantities or number unless such package conforms to all declarations and specifications as may be prescribed.
        
        Section 36. Penalty for selling, etc., of non-standard packages:
        (1) Whoever manufactures, packs, imports, sells, distributes, delivers or otherwise transfers, offers, exposes or possesses for sale any pre-packaged commodity which does not conform to the declarations on the package as provided in Section 18 shall be punished with fine which may extend to twenty-five thousand rupees, for the second offence, with fine which may extend to fifty thousand rupees and for the subsequent offence, with fine which shall not be less than fifty thousand rupees but which may extend to one lakh rupees or with imprisonment for a term which may extend to one year or with both.
        """,
        "section": "Section 18, Section 36"
    },
    {
        "title": "The Motor Vehicles Act, 1988 (Excerpts)",
        "act_name": "Motor Vehicles Act, 1988",
        "year": 1988,
        "category": "traffic_challan",
        "content": """
        THE MOTOR VEHICLES ACT, 1988
        [ACT NO. 59 OF 1988]
        An Act to consolidate and amend the law relating to motor vehicles.
        
        Section 129. Wearing of protective headgear:
        Every person riding or driving a motorcycle of any class or description shall, while in a public place, wear protective headgear conforming to the standards of Bureau of Indian Standards:
        Provided that the provisions of this section shall not apply to a person who is a Sikh, if he is, while driving or riding on the motorcycle, in a public place, wearing a turban.
        
        Section 194D. Penalty for not wearing protective headgear:
        Whoever drives or rides a motor cycle in contravention of the provisions of Section 129 or the rules made thereunder shall be punishable with a fine of one thousand rupees and he shall be disqualified for holding a license for a period of three months.
        
        Section 194. Penalty for driving vehicle exceeding permissible weight:
        Prescribes penalties for overloading motor vehicles.
        """,
        "section": "Section 129, Section 194D"
    }
]

class IndiaCodeScraper:
    def __init__(self):
        self.base_url = "https://www.indiacode.nic.in"
        self.search_url = "https://www.indiacode.nic.in/handle/123456789/1362/simple-search"

    def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Searches India Code for a specific Act.
        Falls back to mock Acts if the search fails.
        """
        print(f"[India Code] Searching for query: '{query}'")
        
        try:
            params = {
                'query': query,
                'submit': 'Go'
            }
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            response = requests.get(self.search_url, params=params, headers=headers, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                results = []
                
                # Search results table on India Code typically has links
                # Let's search for table rows in the search result
                table = soup.find('table', class_='table')
                if table:
                    rows = table.find_all('tr')[1:] # Skip header row
                    for row in rows[:limit]:
                        cols = row.find_all('td')
                        if len(cols) >= 3:
                            title_col = cols[1]
                            link_tag = title_col.find('a')
                            
                            if link_tag and link_tag.get('href'):
                                act_url = self.base_url + link_tag.get('href')
                                title = link_tag.get_text().strip()
                                
                                # Fetch act details (or just return basic info if PDF-only)
                                act_data = self.fetch_act_details(act_url, title)
                                if act_data:
                                    results.append(act_data)
                                    
                if results:
                    return results
                else:
                    print("[India Code] No results found on portal search. Falling back to mock acts.")
            else:
                print(f"[India Code] Search returned status code: {response.status_code}. Falling back to mock acts.")
        except Exception as e:
            print(f"[India Code] Real scraping encountered an error: {e}. Falling back to mock acts.")

        # FALLBACK: Return matched mock act
        print("[India Code] Returning matching mock Acts...")
        query_lower = query.lower()
        results = []
        
        for item in MOCK_ACTS:
            if any(w in item["title"].lower() or w in item["content"].lower() for w in query_lower.split()):
                doc_id = f"mock_code_{abs(hash(item['title']))}"
                results.append({
                    "id": doc_id,
                    "title": item["title"],
                    "content": item["content"].strip(),
                    "url": f"https://www.indiacode.nic.in/handle/123456789/{doc_id}",
                    "court": None,
                    "act_name": item["act_name"],
                    "section": item["section"],
                    "year": item["year"],
                    "category": item["category"],
                    "doc_type": "Act"
                })
                
        # If no match, return all
        if not results:
            for item in MOCK_ACTS[:limit]:
                doc_id = f"mock_code_{abs(hash(item['title']))}"
                results.append({
                    "id": doc_id,
                    "title": item["title"],
                    "content": item["content"].strip(),
                    "url": f"https://www.indiacode.nic.in/handle/123456789/{doc_id}",
                    "court": None,
                    "act_name": item["act_name"],
                    "section": item["section"],
                    "year": item["year"],
                    "category": item["category"],
                    "doc_type": "Act"
                })
                
        return results

    def fetch_act_details(self, act_url: str, title: str) -> Optional[Dict[str, Any]]:
        """Fetches the details/text of an act page from India Code."""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            response = requests.get(act_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # In India Code, text is often in metadata tables or pdf files.
                # We can extract description, date, and tables of contents
                content_divs = []
                meta_table = soup.find('table', class_='table')
                if meta_table:
                    content_divs.append(meta_table.get_text())
                    
                # Look for PDF links in case we want to mention them
                pdf_links = []
                for a in soup.find_all('a', href=True):
                    if a['href'].endswith('.pdf'):
                        pdf_links.append(self.base_url + a['href'])
                        
                content_str = f"Official Act: {title}.\n"
                if pdf_links:
                    content_str += f"Download PDFs: {', '.join(pdf_links)}\n\n"
                if content_divs:
                    content_str += "\n".join(content_divs)
                else:
                    content_str += "Please download the PDF to view the full text of the Act."
                    
                doc_id = act_url.split('/')[-1]
                
                return {
                    "id": f"code_{doc_id}",
                    "title": title,
                    "content": content_str.strip(),
                    "url": act_url
                }
            return None
        except Exception as e:
            print(f"[India Code] Error fetching Act details from {act_url}: {e}")
            return None
