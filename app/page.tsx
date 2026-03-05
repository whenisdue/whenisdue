import Link from "next/link";
import fs from "node:fs/promises";
import path from "node:path";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhenIsDue | Payment Schedules & Official Announcements",
  description: "Track official federal payment dates, COLA announcements, and high-impact schedules with verified, authoritative countdowns.",
};

async function loadEvents() {
  try {
    // FIXED: Using process.cwd() ensures it works on Vercel and local
    const jsonPath = path.join(process.cwd(), "data/events.json");
    const raw = await fs.readFile(jsonPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Home Loader Error:", e);
    return [];
  }
}

export default async function Home() {
  const events = await loadEvents();
  
  // Logic to separate confirmed vs expected for the dashboard
  const confirmed = events.filter((e: any) => e.statusLabel === "CONFIRMED");
  const expected = events.filter((e: any) => e.statusLabel === "EXPECTED");

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-12">
  {/* FIXED: Changed text-slate-900 to text-white for maximum E-E-A-T visibility */}
  <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
    Verified Authority. <span className="text-slate-400 text-3xl block mt-1">When Is Due?</span>
  </h1>
  <p className="mt-4 text-lg text-slate-400 max-w-2xl leading-relaxed">
    Authoritative tracking of federal payment schedules, COLA shifts, and high-impact announcements.
  </p>
</header>

      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-4">Confirmed Schedules</h2>
          <div className="space-y-3">
            {confirmed.slice(0, 5).map((evt: any) => (
              <Link key={evt.eventId} href={`/${evt.category}/${evt.slug}`} className="block p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors bg-white shadow-sm">
                <h3 className="font-semibold text-slate-900">{evt.eventName || evt.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{evt.dateLine || "View Schedule"}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-4">Projected & Expected</h2>
          <div className="space-y-3">
            {expected.slice(0, 5).map((evt: any) => (
              <Link key={evt.eventId} href={`/${evt.category}/${evt.slug}`} className="block p-4 rounded-xl border border-slate-200 hover:border-amber-300 transition-colors bg-white shadow-sm">
                <h3 className="font-semibold text-slate-900">{evt.eventName || evt.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{evt.dateLine || "View Projection"}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <footer className="mt-16 pt-8 border-t border-gray-800 flex justify-between items-center">
        {/* FIXED: Changed text-slate-900 to text-blue-400 for high visibility */}
        <Link href="/federal" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
          View Federal Hub →
        </Link>
        {/* FIXED: Adjusted text to gray-500 to match the dark theme aesthetic */}
        <span className="text-xs text-gray-500">© 2026 WhenIsDue Authority</span>
      </footer>
    </main>
  );
}