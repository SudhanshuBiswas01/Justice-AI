const categories = [
  {
    icon: "🚦",
    title: "Traffic Challan",
    description:
      "Dispute wrong fines and challans with Motor Vehicles Act–backed guidance and step-by-step actions.",
  },
  {
    icon: "💸",
    title: "MRP Overcharging",
    description:
      "Fight billing above MRP using Legal Metrology rules, consumer rights, and complaint templates.",
  },
  {
    icon: "🛒",
    title: "Refund Dispute",
    description:
      "Resolve e-commerce and refund issues with Consumer Protection Act context and escalation paths.",
  },
  {
    icon: "⚖️",
    title: "+N Future Categories",
    description:
      "Plug-in workflows for new dispute types — same RAG + OCR + ML pipeline, dynamically loaded.",
  },
];

export function CategoryCards() {
  return (
    <section id="categories" className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Choose your dispute category
          </h2>
          <p className="mt-3 text-zinc-500">
            Each category loads a dedicated legal workflow — RAG, prompts, and
            optional ML.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <button
              key={cat.title}
              type="button"
              className="glass-card group relative flex flex-col rounded-3xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
            >
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-3xl transition-transform duration-300 group-hover:scale-110">
                {cat.icon}
              </span>
              <h3 className="text-lg font-semibold text-zinc-100">
                {cat.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 group-hover:text-zinc-400">
                {cat.description}
              </p>
              <span className="mt-6 text-xs font-medium tracking-wide text-cyan-400/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Select workflow →
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
