'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * @description Sovereign Issuance Predictor (B200.1)
 * The "OpenClaw" wedge for WhenIsDue.
 */
export default function IssuancePredictor() {
  const [digit, setDigit] = useState('');
  const [prediction, setPrediction] = useState<any>(null);
  const [isComputing, setIsComputing] = useState(false);

  const handlePredict = async () => {
    if (!digit) return;
    
    setIsComputing(true);
    // Mimicking the "Oracle Computation" delay for dramatic effect
    await new Promise(r => setTimeout(r, 800));

    // Mock logic for NY/CA launch
    // In Phase 2, this will hit our Prisma /api/predict endpoint
    setPrediction({
      date: 'April 14, 2026',
      state: 'NY',
      reason: 'NYC Cycle 3 (Standard Distribution)',
      confidence: 0.99,
      status: 'On Time',
    });
    setIsComputing(false);
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-black border border-zinc-800 rounded-3xl shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.3em]">
          Oracle Ingress // B200.1
        </h3>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-900" />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-[10px] text-zinc-500 mb-3 uppercase font-bold tracking-wider">
            Case Number Last Digit
          </label>
          <input
            type="text"
            maxLength={2}
            value={digit}
            onChange={(e) => setDigit(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-zinc-950 border border-zinc-800 p-5 text-4xl font-mono text-white rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-center tracking-tighter"
            placeholder="00"
          />
        </div>

        <button
          onClick={handlePredict}
          disabled={isComputing || !digit}
          className="w-full py-5 bg-white hover:bg-emerald-400 text-black font-black uppercase text-sm tracking-tighter rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isComputing ? 'Computing Truth...' : 'Find My Deposit Date'}
        </button>
      </div>

      <AnimatePresence>
        {prediction && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-8 pt-8 border-t border-zinc-900">
              <div className="text-center mb-8">
                <p className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest mb-2">
                  Expected Arrival
                </p>
                <h2 className="text-5xl font-black text-white tracking-tighter italic">
                  {prediction.date}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  <p className="text-[9px] text-zinc-500 uppercase mb-1">Logic Basis</p>
                  <p className="text-xs text-zinc-200 font-mono">{prediction.reason}</p>
                </div>
                <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  <p className="text-[9px] text-zinc-500 uppercase mb-1">Confidence</p>
                  <p className="text-xs text-emerald-400 font-mono">High (99%)</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}