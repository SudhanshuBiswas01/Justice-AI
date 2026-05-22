import os
import sys
import pandas as pd
from datasets import Dataset
from langchain_groq import ChatGroq
from langchain_community.embeddings import OpenAIEmbeddings

# Ragas evaluation modules
from ragas import evaluate
from ragas.metrics.collections import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall,
)

# Dynamically import legal dataset
try:
    from question import create_evaluation_dataset as create_legal_dataset
except ImportError:
    try:
        from backend.test.question import create_evaluation_dataset as create_legal_dataset
    except ImportError:
        create_legal_dataset = None

def create_evaluation_dataset() -> Dataset:
    """
    Simulates the output of a RAG pipeline. 
    In a real scenario, you would load this from your pipeline's logs or a CSV.
    """
    data = {
        "question": [
            "What is the main advantage of using LangGraph?",
            "How does a vector database work?"
        ],
        "answer": [
            "LangGraph allows you to build stateful, multi-actor applications with LLMs.",
            "It stores data as mathematical vectors, enabling similarity search."
        ],
        "contexts": [
            ["LangGraph is an extension of LangChain designed for stateful, cyclic workflows.", 
             "It uses a graph-based state machine for multi-agent orchestration."],
            ["Vector databases index high-dimensional vectors.", 
             "They use distance metrics like cosine similarity to find nearest neighbors."]
        ],
        "ground_truth": [
            "LangGraph enables the creation of stateful, multi-agent LLM applications using graph structures.",
            "A vector database stores high-dimensional embeddings and retrieves them using mathematical similarity metrics."
        ]
    }
    
    # Ragas requires a HuggingFace Dataset object
    return Dataset.from_dict(data)

def run_evaluation(eval_dataset: Dataset = None):
    """
    Configures the LLM evaluator and runs the Ragas scoring metrics.
    """
    if eval_dataset is None:
        print("Loading test dataset...")
        eval_dataset = create_evaluation_dataset()

    # Initialize the LLM that will act as the "Judge"
    # Groq is highly efficient for running these multiple evaluation calls
    print("Initializing Groq LLM for evaluation...")
    evaluator_llm = ChatGroq(
        temperature=0, 
        model_name="llama3-70b-8192", # Use a large reasoning model for judging
        api_key=os.environ.get("GROQ_API_KEY")
    )
    
    # Initialize embeddings (used for semantic similarity checks in evaluation)
    evaluator_embeddings = OpenAIEmbeddings(
        api_key=os.environ.get("OPENAI_API_KEY")
    )

    # Define the metrics to score the RAG pipeline
    metrics = [
        faithfulness,      # Is the answer derived ONLY from the context? (Hallucination check)
        answer_relevancy,  # Does the answer actually address the user's question?
        context_precision, # Did the retriever rank the relevant contexts at the top?
        context_recall,    # Did the retriever find all the context needed for the ground truth?
    ]

    print("Running evaluation metrics (this may take a moment depending on dataset size)...")
    
    # Execute the evaluation
    results = evaluate(
        dataset=eval_dataset,
        metrics=metrics,
        llm=evaluator_llm,
        embeddings=evaluator_embeddings,
        raise_exceptions=False
    )

    return results

def select_category_dataset(legal_dataset):
    print("\n--- Select Legal Question Category ---")
    print("1. Constitution Questions (5 questions)")
    print("2. Consumer Protection Questions (5 questions)")
    print("3. Hybrid Questions (5 questions)")
    
    choice = input("\nEnter choice (1-3): ").strip()
    if choice == "1":
        indices = list(range(0, 5))
        category = "Constitution"
    elif choice == "2":
        indices = list(range(5, 10))
        category = "Consumer Protection"
    elif choice == "3":
        indices = list(range(10, 15))
        category = "Hybrid"
    else:
        print("Invalid choice, returning empty dataset.")
        return None, None
        
    return legal_dataset.select(indices), category

def select_individual_questions(legal_dataset):
    print("\n--- Select Specific Questions ---")
    questions = legal_dataset["question"]
    for idx, q in enumerate(questions):
        print(f"{idx + 1}. {q}")
        
    user_input = input("\nEnter question numbers to evaluate (comma-separated, e.g. 1, 3, 5): ").strip()
    try:
        selected_nums = [int(n.strip()) for n in user_input.split(",") if n.strip()]
        indices = [num - 1 for num in selected_nums if 1 <= num <= len(questions)]
        if not indices:
            print("No valid question numbers selected.")
            return None
        return legal_dataset.select(indices)
    except ValueError:
        print("Invalid input format. Please enter numbers separated by commas.")
        return None

def create_custom_dataset():
    print("\n--- Create Custom Evaluation ---")
    question = input("Enter Question: ").strip()
    answer = input("Enter Simulated Answer: ").strip()
    
    contexts = []
    print("Enter Context paragraphs (press Enter on empty line when done):")
    while True:
        ctx = input(f"Context paragraph {len(contexts) + 1}: ").strip()
        if not ctx:
            break
        contexts.append(ctx)
        
    if not contexts:
        contexts = [""]
        
    ground_truth = input("Enter Ground Truth (expected correct answer): ").strip()
    
    custom_data = {
        "question": [question],
        "answer": [answer],
        "contexts": [contexts],
        "ground_truth": [ground_truth]
    }
    return Dataset.from_dict(custom_data)

def main_interactive():
    groq_key = os.environ.get("GROQ_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")
    
    if not groq_key:
        print("WARNING: GROQ_API_KEY environment variable is not set. Evaluations might fail.")
    if not openai_key:
        print("WARNING: OPENAI_API_KEY environment variable is not set. Evaluations might fail.")
        
    while True:
        print("\n" + "="*50)
        print("       RAG Evaluation Interactive CLI Menu")
        print("="*50)
        print("1. Run default mock evaluation (2 LangGraph questions)")
        print("2. Run full legal evaluation dataset (15 questions)")
        print("3. Run specific category of legal questions (Constitution / Consumer / Hybrid)")
        print("4. Run specific questions selected by number")
        print("5. Run a custom evaluation on the fly")
        print("6. Exit")
        print("="*50)
        
        choice = input("Enter choice (1-6): ").strip()
        
        if choice == "6":
            print("Exiting interactive test runner. Goodbye!")
            break
            
        eval_dataset = None
        dataset_name = ""
        
        if choice == "1":
            print("\nLoading default mock dataset...")
            eval_dataset = create_evaluation_dataset()
            dataset_name = "Default Mock Dataset"
        elif choice == "2":
            if create_legal_dataset is None:
                print("\nError: Could not import question.py dataset.")
                continue
            print("\nLoading full legal evaluation dataset...")
            eval_dataset = create_legal_dataset()
            dataset_name = "Full Legal Dataset"
        elif choice == "3":
            if create_legal_dataset is None:
                print("\nError: Could not import question.py dataset.")
                continue
            legal_dataset = create_legal_dataset()
            eval_dataset, category = select_category_dataset(legal_dataset)
            if eval_dataset is None:
                continue
            dataset_name = f"Legal Dataset ({category} Category)"
        elif choice == "4":
            if create_legal_dataset is None:
                print("\nError: Could not import question.py dataset.")
                continue
            legal_dataset = create_legal_dataset()
            eval_dataset = select_individual_questions(legal_dataset)
            if eval_dataset is None:
                continue
            dataset_name = "Selected Legal Questions"
        elif choice == "5":
            eval_dataset = create_custom_dataset()
            dataset_name = "Custom User Input"
        else:
            print("\nInvalid selection. Please choose a number from 1 to 6.")
            continue
            
        print(f"\nRunning evaluation on '{dataset_name}' with {len(eval_dataset)} items...")
        
        try:
            results = run_evaluation(eval_dataset)
            
            print("\n=== RAG Evaluation Scores ===")
            
            results_df = results.to_pandas()
            
            print("\nAggregate Metrics:")
            for metric_name, score in results.items():
                print(f"- {metric_name.replace('_', ' ').title()}: {score:.4f}")
                
            print("\nDetailed Itemized Scores:")
            cols_to_print = ['question']
            for m in ['faithfulness', 'answer_relevancy', 'context_precision', 'context_recall']:
                if m in results_df.columns:
                    cols_to_print.append(m)
            print(results_df[cols_to_print])
            
        except Exception as e:
            print(f"\nAn error occurred during evaluation: {e}")
            print("Please ensure your API keys (GROQ_API_KEY and OPENAI_API_KEY) are valid.")

if __name__ == "__main__":
    main_interactive()