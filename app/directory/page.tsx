import Link from 'next/link';
import { prisma } from '@/lib/data-service';

export default async function DirectoryPage() {
  const series = await prisma.series.findMany({
    orderBy: { canonicalName: 'asc' }
  });

  const federal = series.filter(s => s.entityName !== 'State Agency');
  const states = series.filter(s => s.entityName === 'State Agency');

  return (
    <main className="max-w-4xl mx-auto p-12 min-h-screen bg-black text-white">
      <h1 className="text-5xl font-black mb-4 uppercase tracking-tighter italic">Directory.</h1>
      <p className="text-gray-500 mb-16 uppercase text-[10px] tracking-[0.3em] border-b border-gray-900 pb-8">
        2026 Verified Payment Schedules • Autonomous Authority Engine
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <section>
          <h2 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-8">Federal Benefits</h2>
          <div className="space-y-4">
            {federal.map(s => (
              <Link key={s.id} href={`/series/${s.seriesKey}`} className="group block p-6 bg-gray-900/30 border border-gray-800 rounded-2xl hover:border-blue-500 transition-all">
                <h3 className="font-bold text-lg group-hover:text-blue-400">{s.canonicalName}</h3>
                <p className="text-[9px] text-gray-600 uppercase mt-1 tracking-widest">{s.entityName}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-black text-green-500 uppercase tracking-widest mb-8">State Issuance (EBT)</h2>
          <div className="space-y-4">
            {states.map(s => (
              <Link key={s.id} href={`/series/${s.seriesKey}`} className="group block p-6 bg-gray-900/30 border border-gray-800 rounded-2xl hover:border-green-500 transition-all">
                <h3 className="font-bold text-lg group-hover:text-green-400">{s.canonicalName}</h3>
                <p className="text-[9px] text-gray-600 uppercase mt-1 tracking-widest">State-Level Distribution</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}