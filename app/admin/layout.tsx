import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Admin Top Navigation */}
      <header className="bg-slate-900 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span className="text-lg font-bold tracking-wide">DATA COMMAND CENTER</span>
          </div>
          <nav className="flex gap-6 text-sm font-medium text-slate-300">
            <Link href="/admin" className="hover:text-white transition-colors text-white">Dashboard</Link>
            <Link href="/" className="hover:text-white transition-colors" target="_blank">View Live Site ↗</Link>
          </nav>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}