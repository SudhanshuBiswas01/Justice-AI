from datasets import Dataset

def create_evaluation_dataset() -> Dataset:
    """
    Legal AI Agent RAG Evaluation Dataset
    Constitution of India + Consumer Protection Act
    """

    data = {
        "question": [

            # Constitution Questions
            "What does Article 14 of the Constitution of India guarantee?",
            "Explain Article 21 and the rights protected under it.",
            "Can the government impose restrictions on freedom of speech?",
            "A person is arrested without being informed of the reason. Which constitutional rights may be violated?",
            "Compare Article 19 and Article 21.",

            # Consumer Protection Questions
            "Who is considered a consumer under the Consumer Protection Act 2019?",
            "What is meant by deficiency in service?",
            "Amazon delivered a defective laptop. What legal remedies are available?",
            "Are online shopping transactions covered under consumer protection law?",
            "What powers does the Central Consumer Protection Authority (CCPA) have?",

            # Hybrid Questions
            "Can the right to safe products be connected to Article 21?",
            "How do constitutional values influence consumer protection laws?",
            "Unsafe medicines caused deaths. Which constitutional rights and consumer law provisions apply?",
            "Can consumer regulations restrict business freedom under Article 19(1)(g)?",
            "Misleading healthcare advertisements: which laws and constitutional concerns arise?"
        ],

        "answer": [

            # Simulated RAG outputs

            "Article 14 guarantees equality before law and equal protection of laws.",
            "Article 21 protects life and personal liberty.",
            "Yes. Reasonable restrictions can be imposed under Article 19(2).",
            "Article 21 and Article 22 may be violated.",
            "Article 19 protects freedoms while Article 21 protects life and liberty.",

            "A consumer is a person who buys goods or hires services for consideration.",
            "Deficiency in service means shortcomings in service quality or performance.",
            "The buyer may seek replacement, refund, repair, or file a complaint.",
            "Yes. E-commerce transactions are covered under the Consumer Protection Act.",
            "CCPA can investigate violations, recall products, and penalize misleading advertisements.",

            "Yes. Unsafe products can implicate the right to life under Article 21.",
            "Consumer laws reflect constitutional principles such as justice and fairness.",
            "Article 21 and Consumer Protection Act provisions on product liability may apply.",
            "Yes, subject to reasonable restrictions balancing consumer rights and trade freedom.",
            "Consumer Protection Act provisions on misleading advertisements and Article 21 concerns may arise."
        ],

        "contexts": [

            [
                "Article 14 guarantees equality before the law and equal protection of laws."
            ],

            [
                "Article 21 protects life and personal liberty."
            ],

            [
                "Article 19(1)(a) guarantees freedom of speech.",
                "Article 19(2) permits reasonable restrictions."
            ],

            [
                "Article 21 protects liberty.",
                "Article 22 provides protections during arrest and detention."
            ],

            [
                "Article 19 protects freedoms.",
                "Article 21 protects life and liberty."
            ],

            [
                "Consumer Protection Act 2019 defines consumer under Section 2(7)."
            ],

            [
                "Deficiency in service refers to shortcomings in service quality, nature, or manner."
            ],

            [
                "Consumers can seek refund, repair, replacement, or compensation."
            ],

            [
                "Consumer Protection Act 2019 covers e-commerce transactions."
            ],

            [
                "CCPA has investigative, recall, and enforcement powers."
            ],

            [
                "Unsafe products affecting health may connect to Article 21."
            ],

            [
                "Consumer laws embody constitutional values of justice and fairness."
            ],

            [
                "Product liability provisions apply under consumer law.",
                "Article 21 protects life."
            ],

            [
                "Article 19(1)(g) grants freedom of trade.",
                "Regulation may be imposed in public interest."
            ],

            [
                "Misleading advertisements are regulated by the Consumer Protection Act.",
                "Public health concerns may implicate Article 21."
            ]
        ],

        "ground_truth": [

            "Article 14 guarantees equality before law and equal protection of laws.",
            "Article 21 protects life and personal liberty.",
            "Freedom of speech can be reasonably restricted under Article 19(2).",
            "Article 21 and Article 22 protections may apply in unlawful detention cases.",
            "Article 19 concerns freedoms while Article 21 concerns life and personal liberty.",

            "A consumer buys goods or services for consideration under Section 2(7).",
            "Deficiency in service means shortcomings or inadequacies in service performance.",
            "Consumers may pursue refund, replacement, repair, compensation, or complaint mechanisms.",
            "Yes, online transactions fall under consumer protection law and e-commerce rules.",
            "CCPA can investigate, order recalls, impose penalties, and act against misleading advertisements.",

            "Unsafe products may engage Article 21 protections concerning life and safety.",
            "Consumer protection laws are influenced by constitutional values including justice and fairness.",
            "Article 21 and consumer law product liability provisions may both apply.",
            "Consumer regulation may affect Article 19(1)(g) but can be justified through reasonable regulation.",
            "Consumer law provisions on misleading advertisements and constitutional public health concerns may apply."
        ]
    }

    return Dataset.from_dict(data)