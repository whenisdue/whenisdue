export default function HomePage() {
  // Server Component (no client JS needed)
  // Keep it minimal, fast, and crawlable.
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <header className="space-y-4">
          <p className="text-xs tracking-widest text-white/60">WHENISDUE</p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Find out <span className="text-white/90">when something is due</span>.
          </h1>
          <p className="text-base leading-relaxed text-white/70">
            Simple countdown pages for upcoming events, releases, launches, and seasonal sales.
          </p>
        </header>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-medium text-white/80">Try a page</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a
                className="underline decoration-white/30 underline-offset-4 hover:decoration-white/70"
                href="/gaming/steam-summer-sale-2026"
              >
                Steam Summer Sale 2026
              </a>
              <span className="ml-2 text-white/50">→ example countdown</span>
            </li>
          </ul>

          <div className="mt-5 text-xs text-white/50">
            Tip: Every page is designed to be shareable and indexable.
          </div>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-sm font-medium text-white/80">What you can expect</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium">Fast</p>
              <p className="mt-1 text-sm text-white/60">
                Minimal UI, minimal JavaScript, maximum crawlability.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium">Accurate</p>
              <p className="mt-1 text-sm text-white/60">
                One source of truth per page, with clear timezone behavior.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium">Shareable</p>
              <p className="mt-1 text-sm text-white/60">
                Clean titles + social cards (your OG pipeline already exists).
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium">Expandable</p>
              <p className="mt-1 text-sm text-white/60">
                Easy to add more categories and pages without redesigning everything.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-14 border-t border-white/10 pt-6 text-xs text-white/45">
          <p>
            © {new Date().getFullYear()} WhenIsDue. Built for speed and clarity.
          </p>
        </footer>
      </div>
    </main>
  );
}