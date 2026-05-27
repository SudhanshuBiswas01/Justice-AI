export function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#030308]/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="/" className="text-lg font-bold tracking-tight">
          <span className="text-gradient">Justice AI</span>
        </a>
        <div className="hidden items-center gap-8 text-sm text-zinc-500 sm:flex">
          <a href="/#categories" className="transition-colors hover:text-cyan-400">
            Categories
          </a>
          <a href="/#features" className="transition-colors hover:text-cyan-400">
            Features
          </a>
          <a href="/admin/scraper" className="transition-colors hover:text-cyan-400">
            Admin Scraper
          </a>
        </div>
        <a
          href="/chat"
          className="rounded-xl bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-cyan-400/30"
        >
          Get Started
        </a>
      </nav>
    </header>
  );
}
