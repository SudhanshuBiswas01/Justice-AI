export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-16 text-center">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none absolute top-1/4 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px] animate-pulse-glow" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-[280px] w-[280px] rounded-full bg-violet-500/15 blur-[100px] animate-float" />

      <div className="relative z-10 mx-auto max-w-4xl">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-widest text-cyan-300/90 uppercase backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          Justice AI V1.0
        </p>

        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          <span className="text-gradient">Justice AI</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
          AI-powered legal assistance platform helping users resolve traffic
          challans, MRP overcharging, and refund disputes through law-backed
          guidance.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="/auth"
            className="group relative inline-flex h-12 min-w-[160px] items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 px-8 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/40"
          >
            Get Started
          </a>
          <a
            href="#features"
            className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-8 text-sm font-semibold text-zinc-200 backdrop-blur-md transition-all duration-300 hover:border-cyan-400/40 hover:bg-white/10 hover:text-white"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}
