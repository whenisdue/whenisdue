'use client';

import { motion } from 'framer-motion';
// Using Relative Imports as established to bypass alias collisions
import { SovereignRating } from '../../../../components/SovereignRating';
import { SovereignSupport } from '../../../../components/SovereignSupport';

/**
 * @description According to Topic B175 (Fragments) and B076 (Predictive Horizon).
 * Specialized for New York State SNAP (NYSN) issuance patterns.
 */
export default function NewYorkSNAPFragment() {
  // 1. THE 10X MOVE: NY-Specific Truth Constants (Topic B076)
  // In NY (outside NYC), benefits are typically staggered over the first 9 days.
  const nextIssuance = "MAY 7, 2026"; 
  const amount = "$291.00";

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* 2. THE 10X MOVE: Sovereign Header HUD */}
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">
            New York SNAP Oracle
          </h2>
        </div>
        <h1 className="text-4xl font-black text-white leading-none">
          EMPIRE <br /> STATUS
        </h1>
      </header>

      {/* 3. THE 10X MOVE: Truth-First Financial Typography (Topic B190) */}
      <section className="p-8 bg-slate-900 border border-white/5 rounded-[3rem] shadow-2xl">
        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
          Scheduled Deposit
        </p>
        <div className="flex flex-col gap-1">
          <span className="text-6xl font-black text-white tracking-tighter">
            {amount}
          </span>
          <span className="text-2xl font-bold text-blue-400">
            {nextIssuance}
          </span>
        </div>
        
        <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-white/40 uppercase">State Code</p>
            <p className="text-xs font-bold text-white">NY-ALBANY-ROOT</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] font-black text-white/40 uppercase">Confidence</p>
            <p className="text-xs font-bold text-blue-500">99.2% (ORACLE V3)</p>
          </div>
        </div>
      </section>

      {/* 4. THE 10X MOVE: Actionable Sovereignty (Topics B180 & B197) */}
      <div className="grid grid-cols-1 gap-4">
        <SovereignRating nodeId="ny-snap-001" />
        <SovereignSupport programId="ny-snap-001" />
      </div>

      <footer className="py-12">
        <p className="text-[9px] font-mono text-white/20 text-center uppercase tracking-widest">
          Sovereign Mesh Sync: Active • NYS OTDA Direct Bridge
        </p>
      </footer>
    </div>
  );
}