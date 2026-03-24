'use client';

import Link from 'next/link';
import { Landmark } from 'lucide-react';

export default function Header() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group transition-all">
          <div className="bg-blue-600 p-2 rounded-lg text-white group-hover:bg-blue-500 transition-colors">
            <Landmark className="w-5 h-5" />
          </div>
          <span className="text-xl font-black text-white tracking-tighter">WhenIsDue</span>
        </Link>
        
        <Link 
          href="/" 
          className="text-[10px] font-black uppercase text-slate-400 hover:text-white tracking-[0.2em] transition-colors"
        >
          Change State
        </Link>
      </div>
    </nav>
  );
}