import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { Headphones, Gamepad2, MonitorPlay, AlertCircle, ShieldCheck } from "lucide-react";

import CountdownEngine from "@/components/countdown/CountdownEngine";
import NotifyMeForm from "@/components/countdown/NotifyMeForm";

// ISR: Cache this page at the edge, revalidate every 60 seconds
export const revalidate = 60;

export async function generateStaticParams() {
  const jsonPath = path.join(process.cwd(), "data/events.json");
  const raw = await fs.readFile(jsonPath, "utf8");
  const parsed = JSON.parse(raw);
  const gamingEvents = parsed.filter((e: any) => e.category === "gaming");
  
  return gamingEvents.map((evt: any) => ({
    slug: evt.slug,
  }));
}

async function getEvent(slug: string) {
  const jsonPath = path.join(process.cwd(), "data/events.json");
  const raw = await fs.readFile(jsonPath, "utf8");
  const parsed = JSON.parse(raw);
  return parsed.find((e: any) => e.slug === slug && e.category === "gaming");
}

export default async function GamingEventPage({ params }: { params: { slug: string } }) {
  const evt = await getEvent(params.slug);
  if (!evt) notFound();

  // The "Max Compatibility" @graph Schema
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebPage"],
        "@id": `https://whenisdue.com/gaming/${evt.slug}#webpage`,
        "url": `https://whenisdue.com/gaming/${evt.slug}`,
        "name": `${evt.title} – Live Countdown & Updates`,
      },
      {
        "@type": "Article",
        "@id": `https://whenisdue.com/gaming/${evt.slug}#article`,
        "mainEntityOfPage": { "@id": `https://whenisdue.com/gaming/${evt.slug}#webpage` },
        "headline": `${evt.title} Live Coverage`,
        "description": evt.description,
        "datePublished": new Date().toISOString(),
        "publisher": {
          "@type": "Organization",
          "name": "WhenIsDue",
        }
      }
    ]
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }} />

      {/* 1. Leaderboard Ad Placeholder (CLS Safe) */}
      <div className="w-full max-w-[970px] h-[90px] mx-auto bg-zinc-900 border border-zinc-800 rounded-lg mb-8 flex items-center justify-center text-zinc-600 text-xs uppercase tracking-widest">
        Advertisement
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          <header className="border-b border-zinc-800 pb-6">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
              {evt.title}
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              {evt.description}
            </p>
          </header>

          {/* 2. The CLS-Safe Video Frame & Countdown Area */}
          <div className="rounded-2xl border border-zinc-800 bg-black overflow-hidden relative aspect-video flex flex-col items-center justify-center">
            {/* The Client-Side Countdown & Notify Form mount here */}
            <div className="text-center p-8 z-10 w-full">
              <div className="text-purple-500 font-mono text-xl mb-2 uppercase tracking-widest">T-Minus</div>
              
              <CountdownEngine dateISO={evt.dateISO} />
              <NotifyMeForm topicKey={evt.slug} />

            </div>
            
            {/* Background grid for aesthetics */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          </div>

          {/* 3. High-Intent Affiliate Gear Zone (FTC Compliant) */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Gear Up For The Drop</h2>
            </div>
            <p className="text-xs text-zinc-500 mb-6 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Disclosure: We may earn a commission if you buy through these links at no extra cost to you.
            </p>
            
            <div className="grid sm:grid-cols-3 gap-4">
              <a href="#" className="flex flex-col items-center text-center p-4 rounded-xl border border-zinc-800 hover:border-purple-500 hover:bg-zinc-900 transition-colors">
                <Headphones className="w-8 h-8 text-zinc-400 mb-3" />
                <h3 className="text-sm font-bold text-white">Wireless Audio</h3>
                <span className="text-xs text-purple-400 mt-1">Upgrade Headsets →</span>
              </a>
              <a href="#" className="flex flex-col items-center text-center p-4 rounded-xl border border-zinc-800 hover:border-purple-500 hover:bg-zinc-900 transition-colors">
                <Gamepad2 className="w-8 h-8 text-zinc-400 mb-3" />
                <h3 className="text-sm font-bold text-white">Pro Controllers</h3>
                <span className="text-xs text-purple-400 mt-1">Play Like A Pro →</span>
              </a>
              <a href="#" className="flex flex-col items-center text-center p-4 rounded-xl border border-zinc-800 hover:border-purple-500 hover:bg-zinc-900 transition-colors">
                <MonitorPlay className="w-8 h-8 text-zinc-400 mb-3" />
                <h3 className="text-sm font-bold text-white">Capture Cards</h3>
                <span className="text-xs text-purple-400 mt-1">Stream The Reveal →</span>
              </a>
            </div>
          </section>

          {/* Live Blog Area Placeholder */}
          <section className="min-h-[500px] border-t border-zinc-800 pt-8">
            <h2 className="text-2xl font-black text-white mb-6">Live Updates</h2>
            <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-zinc-800 text-zinc-600">
              Live blog feed will initialize 1 hour before broadcast...
            </div>
          </section>
        </div>

        {/* 4. Sidebar: Engagement & Sticky Ads */}
        <aside className="space-y-8">
          
          {/* Hype Meter Widget Mockup */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Hype Meter</h3>
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">How hyped are you for this reveal?</p>
              <div className="flex justify-between items-center text-2xl">
                <button className="hover:scale-110 transition-transform">🥱</button>
                <button className="hover:scale-110 transition-transform">👀</button>
                <button className="hover:scale-110 transition-transform">🔥</button>
                <button className="hover:scale-110 transition-transform">🤯</button>
              </div>
            </div>
          </div>

          {/* Sticky 300x600 Ad (Highest RPM) */}
          <div className="sticky top-24 w-full h-[600px] bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center text-zinc-600 text-xs uppercase tracking-widest hidden lg:flex">
            Sticky Sidebar Ad
          </div>

        </aside>
      </div>
    </main>
  );
}