import React from 'react';
import { getSeriesWithOccurrences } from '@/lib/data-service';
import SubscribeButton from '@/components/SubscribeButton';
import GhostMonthBanner from '@/components/GhostMonthBanner';
import ACHTooltip from '@/components/ACHTooltip';
import LiveSocialProof from '@/components/LiveSocialProof';
import AdUnit from '@/components/AdUnit'; // Injected the AdsbyGoogle Fortress
import type { Occurrence } from '@prisma/client';

// STAMPEDE DEFENSE: Cache this page for 24 hours at the Edge.
// Vercel will serve stale HTML to the stampede while fetching new data in the background.
export const revalidate = 86400;

// Next.js 15: params MUST be a Promise
export default async function SeriesPage({ params }: { params: Promise<{ seriesKey: string }> }) {
  // Await the params to unlock the actual seriesKey string
  const resolvedParams = await params;
  const seriesKey = resolvedParams.seriesKey;

  const data = await getSeriesWithOccurrences(seriesKey);

  if (!data) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-black text-white p-10 text-center">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-2 text-red-500">Authority Missing</h1>
          <p className="text-gray-500 font-mono text-xs uppercase">No record for: {seriesKey}</p>
        </div>
      </main>
    );
  }

  // Determine if this series is SNAP-related based on the URL key
  const isSNAP = seriesKey.toLowerCase().includes('snap');

  return (
    <main className="max-w-4xl mx-auto p-8 font-sans bg-black min-h-screen text-white text-left">
      <header className="mb-8 border-b border-gray-800 pb-10">
        <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">{data.canonicalName}</h1>
        <p className="text-gray-500 mb-8 uppercase text-[10px] tracking-[0.2em]">Issuer: {data.entityName}</p>
        
        {/* 1. THE UTILITY ANSWER / TRUST ZONE */}
        <div className="bg-blue-600 p-10 rounded-3xl shadow-2xl text-center">
          <h2 className="text-2xl font-black mb-2 uppercase italic tracking-tight text-white">Push Protocol Active</h2>
          <p className="text-blue-100 text-sm mb-8 opacity-80">Millisecond-accurate alerts for {data.seriesKey} verification.</p>
          <SubscribeButton />
        </div>
      </header>

      {/* 2. THE HIGH-RPM AD UNIT (Placed right after the primary utility/answer) */}
      <AdUnit slot="1234567890" />

      <section>
        <h2 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-6 mt-8">Verified History</h2>
        
        {/* The Live Social Proof Widget */}
        <LiveSocialProof />

        {/* 3. THE DETAILED TABLE (Engagement Zone) */}
        <div className="border border-gray-800 rounded-2xl overflow-hidden bg-gray-900/40 backdrop-blur-xl mb-12">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-gray-800 text-gray-500 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="p-6">Date</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 font-mono text-sm">
              {data.occurrences.map((occ: Occurrence) => {
                const payDate = new Date(occ.date);
                
                // Heuristic: If payment is pushed back to the 26th-31st and it's not OPM, it's paying for the next month.
                const isGhostMonthCandidate = payDate.getDate() >= 26 && !seriesKey.includes('opm');
                const nextMonthDate = new Date(payDate);
                nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
                
                const scheduledMonth = isGhostMonthCandidate 
                  ? nextMonthDate.toLocaleString('default', { month: 'long' }) 
                  : payDate.toLocaleString('default', { month: 'long' });

                return (
                  <React.Fragment key={occ.id}>
                    {/* The Primary Data Row */}
                    <tr className="hover:bg-white/5 transition-all">
                      <td className="p-6 text-blue-400">
                        {payDate.toISOString().split('T')[0]}
                      </td>
                      <td className="p-6">
                        <span className="px-3 py-1 text-[9px] font-black rounded-full bg-green-500 text-black uppercase">
                          {occ.status}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <a href={occ.verificationProof || '#'} target="_blank" className="text-[10px] font-bold text-gray-500 hover:text-white underline uppercase">
                          Source
                        </a>
                      </td>
                    </tr>
                    
                    {/* The Injected UI Data Row */}
                    <tr className="bg-black/20">
                      <td colSpan={3} className="px-6 pb-6 pt-2 border-t-0">
                        {!isSNAP && (
                          <GhostMonthBanner 
                            scheduledMonth={scheduledMonth} 
                            actualPayDate={payDate} 
                          />
                        )}
                        <ACHTooltip 
                          officialDate={payDate} 
                          isSNAP={isSNAP} 
                        />
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. THE MID-SCROLL AD UNIT */}
      <AdUnit slot="0987654321" />

      {/* 5. SAFE SPACING GAP (150px) BEFORE AFFILIATE CTA */}
      <div className="h-[150px]" />

      {/* 6. AFFILIATE CTA (Conversion Zone) */}
      <section className="bg-gray-900 p-8 rounded-3xl border border-gray-800 text-center mb-12">
        <h3 className="text-xl font-bold mb-4">Want your payment up to 2 days early?</h3>
        <button className="bg-white text-black px-8 py-4 rounded-xl font-bold hover:bg-blue-500 hover:text-white transition-all">
          Open a Chime Account
        </button>
      </section>

    </main>
  );
}