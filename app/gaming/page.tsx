import Link from "next/link";
import fs from "node:fs/promises";
import path from "node:path";
import { Gamepad2, AlertTriangle, ExternalLink, Info, Clock } from "lucide-react";

export const metadata = {
  title: "Gaming & Tech Calendar | WhenIsDue",
  description: "Track confirmed gaming showcases, esports finals, and hardware release dates. View predictions for Nintendo Directs and Steam Sales.",
};

async function loadGamingEvents() {
  try {
    const jsonPath = path.join(process.cwd(), "data/events.json");
    const raw = await fs.readFile(jsonPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Isolate only the gaming vertical
    return parsed.filter((evt: any) => evt.category === "gaming");
  } catch (e) {
    console.error("Gaming Hub Loader Error:", e);
    return [];
  }
}

export default async function GamingHubPage() {
  const allEvents = await loadGamingEvents();
  
  // The Strict AdSense/SEO Split
  const confirmed = allEvents.filter((e) => e.statusLabel === "CONFIRMED" || e.statusLabel === "ANNOUNCED");
  const expected = allEvents.filter((e) => e.statusLabel === "EXPECTED" || e.statusLabel === "RUMOR");

  // Dynamic FAQ Schema for Question-Based Keywords
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is Gamescom 2026 open to the public?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Gamescom includes both industry trade days and public visitor days at the Koelnmesse convention center in Cologne."
        }
      },
      {
        "@type": "Question",
        "name": "When does Gamescom 2026 start?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Opening Night Live takes place on August 25, 2026, followed by the main expo from August 26-30, 2026."
        }
      }
    ]
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero Section */}
      <header className="mb-12 border-b border-gray-800 pb-8">
        <div className="inline-flex items-center justify-center rounded-xl bg-purple-500/10 p-3 text-purple-400 mb-6">
          <Gamepad2 className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          Gaming & Tech <span className="text-purple-500">Hype Calendar.</span>
        </h1>
        <p className="mt-4 text-lg text-gray-400 max-w-2xl leading-relaxed">
          The master timeline for major showcases, hardware reveals, and global esports finals. Set your countdowns.
        </p>
      </header>

      {/* Legal & Affiliate Disclosure (FTC Compliant) */}
      <div className="mb-10 rounded-lg border border-gray-800 bg-zinc-900/50 p-4 flex items-start gap-3 text-sm text-gray-400">
        <Info className="h-5 w-5 shrink-0 text-gray-500" />
        <p>
          <strong>Disclosure:</strong> We may earn a commission if you purchase hardware or games through links on our site, at no extra cost to you. 
          This helps support our independent tracking engine.
        </p>
      </div>

      <div className="grid gap-12 md:grid-cols-2">
        {/* DOOR 2A: CONFIRMED EVENTS (Event Schema Eligible) */}
        <section>
          <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-2">
            <h2 className="text-xl font-bold uppercase tracking-widest text-emerald-400">Confirmed Events</h2>
          </div>
          <div className="space-y-4">
            {confirmed.map((evt) => (
              <Link key={evt.eventId} href={`/${evt.canonicalSlug}`} className="block group">
                <div className="rounded-2xl border border-gray-800 bg-zinc-950 p-5 transition-all hover:border-emerald-500/50 hover:bg-zinc-900">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{evt.title}</h3>
                    <span className="shrink-0 rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400">
                      {evt.statusLabel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{evt.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {evt.dateISO ? new Date(evt.dateISO).toLocaleDateString() : 'TBA'}</span>
                    <span className="flex items-center gap-1 group-hover:text-emerald-500 transition-colors">View Hub <ExternalLink className="h-3 w-3" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* DOOR 2B: SPECULATION & LEAKS (AdSense Safe) */}
        <section>
          <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-2">
            <h2 className="text-xl font-bold uppercase tracking-widest text-amber-400">Predictions & Rumors</h2>
          </div>
          
          {/* AdSense Safe Disclaimer */}
          <div className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2 text-xs text-amber-200/70">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
            <p>The dates below are predictions based on historical patterns or unverified industry leaks. They are not officially confirmed.</p>
          </div>

          <div className="space-y-4">
            {expected.map((evt) => (
              <Link key={evt.eventId} href={`/${evt.canonicalSlug}`} className="block group">
                <div className="rounded-2xl border border-gray-800 bg-zinc-950 p-5 transition-all hover:border-amber-500/50 hover:bg-zinc-900">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">{evt.title}</h3>
                    <span className="shrink-0 rounded bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-500">
                      {evt.statusLabel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{evt.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {evt.dateLine || "Window Pending"}</span>
                    <span className="flex items-center gap-1 group-hover:text-amber-500 transition-colors">View Prediction <ExternalLink className="h-3 w-3" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}