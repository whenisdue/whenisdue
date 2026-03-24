'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-6">
      <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
        <Link 
          href="/" 
          className="flex items-center gap-2.5 group outline-none focus-visible:ring-2 ring-blue-500 rounded-lg"
          aria-label="WhenIsDue Home"
        >
          <div className="bg-blue-600 p-1.5 rounded-lg text-white group-hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-lg font-black text-white tracking-tighter">WhenIsDue</span>
        </Link>
        
        {!isHome && (
          <Link 
            href="/" 
            className="text-[10px] font-black uppercase text-slate-400 hover:text-white tracking-[0.2em] transition-colors px-3 py-1 border border-white/5 rounded-full"
          >
            Change State
          </Link>
        )}
      </div>
    </nav>
  );
}