"use client";

import React, { useState, useEffect } from 'react';

const SLANG_PHRASES = [
  "Chime hit Florida! 🌴",
  "Mine hit 15 minutes ago NE Ohio",
  "Just hit TX Bancorp",
  "Anybody hit yet? Still waiting...",
  "Got mines 8hrs ago",
  "SoFi shows pending 👀",
  "CashApp dropped in CA!"
];

export default function LiveSocialProof() {
  const [currentUpdate, setCurrentUpdate] = useState(SLANG_PHRASES[0]);
  const [hitCount, setHitCount] = useState(14);

  // Simulate a live feed of Reddit sentiment
  useEffect(() => {
    const interval = setInterval(() => {
      const randomPhrase = SLANG_PHRASES[Math.floor(Math.random() * SLANG_PHRASES.length)];
      setCurrentUpdate(randomPhrase);
      if (randomPhrase.includes("hit") || randomPhrase.includes("dropped")) {
        setHitCount(prev => prev + 1);
      }
    }, 4500); // Cycles every 4.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 mb-8">
      <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">
            Live Crowd Confirmations
          </h4>
        </div>
        <div className="text-[10px] text-gray-500 font-mono">
          {hitCount} USERS REPORTED "HIT"
        </div>
      </div>
      
      <div className="flex items-start gap-3 animate-in fade-in duration-500" key={currentUpdate}>
        <div className="text-gray-600">💬</div>
        <div className="text-sm text-gray-300 font-medium italic">
          "{currentUpdate}"
        </div>
      </div>
    </div>
  );
}