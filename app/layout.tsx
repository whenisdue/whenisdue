import Link from "next/link";
// Inside your Footer component in layout.tsx or a separate component
<footer className="bg-white border-t border-slate-200 py-16 px-6">
  <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-12">
    <div className="max-w-xs">
      <p className="text-sm font-black text-slate-900 mb-4">WhenIsDue.</p>
      <p className="text-xs text-slate-400 font-medium leading-relaxed">
        Providing audit-grade benefit issuance monitoring across 50 US states. 
        Independent and not affiliated with any government agency.
      </p>
    </div>
    
    <div className="grid grid-cols-2 gap-12">
      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Compliance</h4>
        <nav className="flex flex-col gap-3">
          <Link href="/privacy" className="text-xs font-bold text-slate-400 hover:text-blue-600">Privacy Policy</Link>
          <Link href="/terms" className="text-xs font-bold text-slate-400 hover:text-blue-600">Terms of Service</Link>
          <Link href="/about" className="text-xs font-bold text-slate-400 hover:text-blue-600">About the Engine</Link>
        </nav>
      </div>
      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Support</h4>
        <p className="text-xs font-bold text-slate-400">admin@whenisdue.com</p>
      </div>
    </div>
  </div>
</footer>