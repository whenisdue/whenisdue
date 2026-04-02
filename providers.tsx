'use client';

import React, { useEffect, useState } from 'react';

/**
 * @description According to Topic B177: Sovereign Variable Engine (SVE).
 * Manages zero-CLS theme switching and enforces Truth-First Typography (B190).
 */
export function SovereignProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'high-contrast' | 'lite'>('high-contrast');

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'lite') {
      root.style.setProperty('--sov-bg', '#ffffff');
      root.style.setProperty('--sov-accent', '#059669');
    } else {
      root.style.setProperty('--sov-bg', '#020617'); // slate-950
      root.style.setProperty('--sov-accent', '#10b981'); // emerald-500
    }
  }, [mode]);

  return (
    <div className="min-h-screen bg-[var(--sov-bg)] transition-colors duration-500">
      {children}
    </div>
  );
}