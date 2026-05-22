export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div>
          <p className="text-sm font-semibold text-zinc-300">Justice AI V0.5</p>
          <p className="mt-1 text-xs text-zinc-600">
            Built with AI, RAG, OCR &amp; ML
          </p>
        </div>
        <p className="text-xs text-zinc-600">
          Law-backed guidance for consumer &amp; traffic disputes in India
        </p>
      </div>
    </footer>
  );
}
