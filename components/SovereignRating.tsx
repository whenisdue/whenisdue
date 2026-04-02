'use client';

import { useState } from 'react';

/**
 * @description According to Topic B180: Sovereign Reputation Weighting (SRW).
 * Captures weighted feedback to refine the Confidence Engine's US-State logic.
 */
export function SovereignRating({ nodeId }: { nodeId: string }) {
  const [rating, setRating] = useState(0);
  // Mock weight for now (Topic B180.1: Default is 1.0x for New Users)
  const userWeight = 1.0;

  const handleRating = (value: number) => {
    setRating(value);
    console.log(`[B180] Attestation received for ${nodeId}: ${value} stars with weight ${userWeight}x`);
  };

  return (
    <div className="flex flex-col gap-2 p-6 bg-slate-900/50 border border-white/5 rounded-[2rem]">
      <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
        Attest Accuracy
      </span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRating(star)}
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
              rating >= star ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            <span className="text-xs font-black">{star}</span>
          </button>
        ))}
      </div>
      <p className="text-[9px] font-mono text-white/20 italic">
        Weight: {userWeight.toFixed(1)}x Authority Applied
      </p>
    </div>
  );
}