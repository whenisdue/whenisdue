"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckMyDate() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ssa' | 'snap'>('ssa');
  
  // SSA State
  const [birthDay, setBirthDay] = useState('');
  
  // SNAP State
  const [snapState, setSnapState] = useState('CA');
  const [caseDigit, setCaseDigit] = useState('');
  const [snapResult, setSnapResult] = useState<string | null>(null);

  // --- SSA ROUTING LOGIC ---
  const handleSSASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const day = parseInt(birthDay, 10);
    if (!day || day < 1 || day > 31) return alert("Enter a valid day (1-31).");

    let targetRoute = '';
    // Rules based on Social Security Administration (SSA) birth day cycles
    if (day >= 1 && day <= 10) targetRoute = '/series/ssdi-cycle-1';
    else if (day >= 11 && day <= 20) targetRoute = '/series/ssdi-cycle-2';
    else targetRoute = '/series/ssdi-cycle-3';

    router.push(targetRoute);
  };

  // --- SNAP DETERMINISTIC LOGIC ---
  const handleSNAPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digit = parseInt(caseDigit, 10);
    if (isNaN(digit) || digit < 0 || digit > 9) return alert("Enter a valid single digit (0-9).");

    let result = '';
    if (snapState === 'CA') {
      // California: Last digit 1-9 = Day 1-9. Digit 0 = Day 10.
      const day = digit === 0 ? 10 : digit;
      result = `The ${day}th of every month. (Includes weekends/holidays)`;
    } else if (snapState === 'NY') {
      // New York (Upstate): Last digit 0-1 = Day 1. Digit 2-9 = Day 2-9.
      const day = (digit === 0 || digit === 1) ? 1 : digit;
      const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
      result = `The ${day}${suffix} of every month. (Includes weekends/holidays)`;
    } else if (snapState === 'PA') {
      // Pennsylvania: Last digit 1-9 = Day 1-9. Digit 0 = Day 10. (Business Days)
      const day = digit === 0 ? 10 : digit;
      result = `The ${day}th BUSINESS DAY of the month. (Skips weekends/holidays)`;
    }

    setSnapResult(result);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl shadow-2xl max-w-md mx-auto mt-12 text-left">
      
      {/* TACTILE PILL TABS */}
      <div className="flex bg-black p-1.5 rounded-2xl mb-8 border border-gray-800 shadow-inner">
        <button 
          onClick={() => { setActiveTab('ssa'); setSnapResult(null); }}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'ssa' 
              ? 'bg-blue-600 text-white shadow-lg scale-[1.02]' 
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          SSA / SSDI
        </button>
        <button 
          onClick={() => setActiveTab('snap')}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'snap' 
              ? 'bg-green-600 text-white shadow-lg scale-[1.02]' 
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          SNAP (EBT)
        </button>
      </div>

      {activeTab === 'ssa' ? (
        <form onSubmit={handleSSASubmit} className="space-y-4 animate-in fade-in duration-300">
          <p className="text-gray-400 text-sm mb-4 font-medium leading-relaxed">
            Enter the day of the month you were born to find your exact 2026 SSA schedule.
          </p>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
              Birth Day (1-31)
            </label>
            <input 
              type="number" min="1" max="31" required 
              value={birthDay} 
              onChange={(e) => setBirthDay(e.target.value)}
              placeholder="e.g., 14"
              className="w-full bg-black border border-gray-700 p-4 rounded-xl text-white focus:border-blue-500 outline-none transition-all font-mono text-center text-xl placeholder:text-gray-700" 
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-50 text-white hover:text-blue-900 py-4 rounded-xl font-black uppercase tracking-widest transition-all mt-2 active:scale-95">
            Open 2026 Vault
          </button>
        </form>
      ) : (
        <form onSubmit={handleSNAPSubmit} className="space-y-4 animate-in fade-in duration-300">
          <p className="text-gray-400 text-sm mb-4 font-medium leading-relaxed">
            Find your exact monthly food stamp deposit day. (Privacy safe: only requires last digit).
          </p>
          <div className="grid grid-cols-2 gap-4">
            
            {/* INTERACTIVE DROPDOWN */}
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">State</label>
              <div className="relative">
                <select 
                  value={snapState} 
                  onChange={(e) => { setSnapState(e.target.value); setSnapResult(null); }}
                  className="w-full bg-black border border-gray-700 p-4 pr-10 rounded-xl text-white focus:border-green-500 outline-none transition-all font-sans appearance-none cursor-pointer"
                >
                  <option value="CA">California</option>
                  <option value="NY">New York (Upstate)</option>
                  <option value="PA">Pennsylvania</option>
                </select>
                {/* Custom Chevron */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                Case # Last Digit
              </label>
              <input 
                type="number" min="0" max="9" required 
                value={caseDigit} 
                onChange={(e) => setCaseDigit(e.target.value)}
                placeholder="e.g., 7"
                className="w-full bg-black border border-gray-700 p-4 rounded-xl text-white focus:border-green-500 outline-none transition-all font-mono text-center text-xl placeholder:text-gray-700" 
              />
            </div>
          </div>
          
          {snapResult ? (
            <div className="bg-green-900/20 border border-green-900/50 p-5 rounded-xl mt-4 animate-in zoom-in-95 duration-200">
              <div className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-2">Your Deposit Day</div>
              <div className="text-base font-bold text-green-100">{snapResult}</div>
              <button 
                type="button" 
                onClick={() => setSnapResult(null)}
                className="text-[9px] font-bold text-green-500/60 uppercase mt-3 hover:text-green-500 transition-colors"
              >
                Reset Calculation
              </button>
            </div>
          ) : (
            <button type="submit" className="w-full bg-green-700 hover:bg-green-100 text-white hover:text-green-900 py-4 rounded-xl font-black uppercase tracking-widest transition-all mt-4 active:scale-95">
              Calculate Day
            </button>
          )}
        </form>
      )}
    </div>
  );
}