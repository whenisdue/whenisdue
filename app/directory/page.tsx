import Link from 'next/link';
import { prisma } from '@/lib/prisma';

// Force Next.js to dynamically render the directory so it's always up to date
export const dynamic = 'force-dynamic';

export default async function DirectoryPage() {
  // 1. Fetch all active series from our new schema
  const series = await prisma.eventSeries.findMany({
    where: { isActive: true },
    orderBy: { title: 'asc' }
  });

  // 2. Group them by our new Category Enum
  const federal = series.filter(s => s.category === 'FEDERAL');
  const gaming = series.filter(s => s.category === 'GAMING');
  const shopping = series.filter(s => s.category === 'SHOPPING');
  const tech = series.filter(s => s.category === 'TECH');

  return (
    <main className="max-w-4xl mx-auto p-6 md:p-12 min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30 pt-24 pb-20">
      <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tighter italic">Directory.</h1>
      <p className="text-zinc-500 mb-16 uppercase text-[10px] tracking-[0.3em] border-b border-zinc-900 pb-8">
        Verified Payment Schedules • Autonomous Authority Engine
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* FEDERAL HUB */}
        {federal.length > 0 && (
          <section>
            <h2 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-6">Federal & Benefits</h2>
            <ul className="space-y-4">
              {federal.map(s => (
                <li key={s.id}>
                  <Link href={`/federal/${s.slugBase}`} className="text-zinc-300 hover:text-white transition font-medium">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* GAMING HUB */}
        {gaming.length > 0 && (
          <section>
            <h2 className="text-xs font-black text-purple-500 uppercase tracking-widest mb-6">Gaming</h2>
            <ul className="space-y-4">
              {gaming.map(s => (
                <li key={s.id}>
                  <Link href={`/gaming/${s.slugBase}`} className="text-zinc-300 hover:text-white transition font-medium">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* SHOPPING HUB */}
        {shopping.length > 0 && (
          <section>
            <h2 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-6">Shopping</h2>
            <ul className="space-y-4">
              {shopping.map(s => (
                <li key={s.id}>
                  <Link href={`/shopping/${s.slugBase}`} className="text-zinc-300 hover:text-white transition font-medium">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* TECH HUB */}
        {tech.length > 0 && (
          <section>
            <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6">Tech</h2>
            <ul className="space-y-4">
              {tech.map(s => (
                <li key={s.id}>
                  <Link href={`/tech/${s.slugBase}`} className="text-zinc-300 hover:text-white transition font-medium">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}