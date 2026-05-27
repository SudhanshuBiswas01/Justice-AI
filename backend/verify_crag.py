import os
import sys

# Ensure the backend directory is in the python path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from rag.crag_pipeline import CRAGPipeline

def main():
    # Reconfigure stdout to use UTF-8 to prevent encoding errors on Windows when printing Rupee symbol (₹)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        
    print("=== Justice AI CRAG & Verification Agent Testing ===")
    
    pipeline = CRAGPipeline()
    
    # Test Case 1: Relevant Legal Query (Should pass relevance check and get fine details)
    print("\n--- Test Case 1: Valid Helmet Fine Query ---")
    messages_helmet = [{"role": "user", "content": "What is the penalty for not wearing helmet?"}]
    response_helmet = pipeline.generate_legal_guidance(messages_helmet, category="traffic_challan")
    
    print("\n[AI Response - Helmet Query]:")
    print("-" * 60)
    print(response_helmet)
    print("-" * 60)
    
    assert "129" in response_helmet or "194D" in response_helmet or "headgear" in response_helmet.lower()
    print("[Success] Test Case 1 completed. Output verified.")
    
    # Test Case 2: Irrelevant / Out-of-bounds Query (Should fail relevance and trigger disclaimer fallback)
    print("\n--- Test Case 2: Out-of-Bounds spaceship query ---")
    messages_mars = [{"role": "user", "content": "What is the penalty for driving a spaceship on Mars without a pilot license?"}]
    response_mars = pipeline.generate_legal_guidance(messages_mars, category="traffic_challan")
    
    print("\n[AI Response - Mars Spaceship Query]:")
    print("-" * 60)
    print(response_mars)
    print("-" * 60)
    
    # Verification checks
    assert "Mars" in response_mars or "spaceships" in response_mars or "does not cover" in response_mars.lower()
    print("[Success] Test Case 2 completed. Output disclaimer verified (prevented hallucination).")
    
    # Test Case 3: Output Verifier Auto-Correction Mock
    print("\n--- Test Case 3: Simulating Verification & Correction ---")
    # Let's mock a query and check if verify_output detects the hallucinated details
    query_mock = "what is the fine for not wearing a helmet?"
    context_mock = [
        {
            "content": "Section 194D: Penalty for not wearing protective headgear. Whoever drives a motorcycle without wearing a protective headgear conforming to standards shall be punishable with a fine of one thousand rupees.",
            "metadata": {"title": "Motor Vehicles Act, 1988", "section": "Section 194D"}
        }
    ]
    
    bad_advice = (
        "1. Problem Identification: You were caught riding a two-wheeler without a helmet.\n"
        "2. Win Probability Assessment: High probability of having to pay since it is mandatory.\n"
        "3. Step-by-Step Strategy:\n"
        "- Pay the fine of ten thousand rupees (Rs. 10,000) under Section 999A of the Spaceship Act."
    )
    
    passed, feedback = pipeline.verify_output(query_mock, bad_advice, context_mock)
    print(f"Audited bad advice -> Passed: {passed} | Feedback: {feedback}")
    assert passed is False
    assert "10,000" in feedback or "999A" in feedback or "Spaceship" in feedback or "fine" in feedback.lower()
    print("[Success] Test Case 3 completed. Verification agent successfully caught the mock hallucinations.")
    
    print("\n=== ALL CRAG PIPELINE TESTS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    main()
