'use client';

import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="space-y-4">
            <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">WhenIsDue</h4>
            <p className="text-slate-500 text-sm leading-relaxed">
              Providing unimpeachable accuracy for benefit schedules and deadline tracking since 2026.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Platform</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/about" className="text-slate-500 text-sm hover:text-blue-600 font-bold transition-colors">About the Protocol</Link>
              <Link href="/transparency" className="text-slate-500 text-sm hover:text-blue-600 font-bold transition-colors">Data Transparency</Link>
              <Link href="/verification" className="text-slate-500 text-sm hover:text-blue-600 font-bold transition-colors">How We Verify</Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Legal</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/privacy" className="text-slate-500 text-sm hover:text-blue-600 font-bold transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-slate-500 text-sm hover:text-blue-600 font-bold transition-colors">Terms of Service</Link>
            </nav>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            © {year} WHENISDUE. Not affiliated with any government agency.
          </p>
        </div>
      </div>
    </footer>
  );
}