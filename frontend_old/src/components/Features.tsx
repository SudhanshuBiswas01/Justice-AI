const features = [
  {
    title: "OCR Document Analysis",
    description: "Extract text from challans, bills, and screenshots automatically.",
    tag: "OCR",
  },
  {
    title: "RAG-based Legal Retrieval",
    description: "Category-specific laws, case snippets, and SOPs from vector search.",
    tag: "RAG",
  },
  {
    title: "ML Validation",
    description: "Optional classifiers flag suspicious challans and dispute types.",
    tag: "ML",
  },
  {
    title: "Complaint Generation",
    description: "Draft emails, grievance text, and lite legal notices in one click.",
    tag: "Draft",
  },
  {
    title: "Step-by-step Legal Guidance",
    description: "Clear actions, law references, and confidence-aware disclaimers.",
    tag: "Guide",
  },
];

export function Features() {
  return (
    <section id="features" className="relative px-6 py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for real disputes
          </h2>
          <p className="mt-3 text-zinc-500">
            Deterministic pipeline — OCR, optional ML, RAG, then LLM reasoning.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="glass-card group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="inline-block rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs font-mono font-medium text-cyan-400">
                {feature.tag}
              </span>
              <h3 className="mt-4 text-base font-semibold text-zinc-100">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
