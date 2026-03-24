'use client';

import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-slate-200 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
             <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">WhenIsDue Platform</h4>
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            Unimpeachable 2026 Accuracy • © {year}
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-4">
          <Link href="/about" className="text-slate-400 text-[10px] hover:text-blue-600 font-black uppercase tracking-widest transition-colors">About</Link>
          <Link href="/privacy" className="text-slate-400 text-[10px] hover:text-blue-600 font-black uppercase tracking-widest transition-colors">Privacy</Link>
          <Link href="/terms" className="text-slate-400 text-[10px] hover:text-blue-600 font-black uppercase tracking-widest transition-colors">Terms</Link>
        </nav>

        <p className="text-slate-300 text-[9px] font-bold uppercase tracking-[0.2em] max-w-[200px] md:text-right leading-loose">
          Not affiliated with any government agency.
        </p>
      </div>
    </footer>
  );
}