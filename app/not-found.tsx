import Link from "next/link";
import { Home, FolderOpen, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-xl p-8 md:p-12 shadow-sm text-center">
        
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-6 h-6" />
        </div>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
          We couldn't find that page.
        </h1>
        
        <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-lg mx-auto">
          The page you are looking for may have moved or the link may be outdated. You can still access the latest benefit and payment schedule information using the options below.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-lg font-bold transition-colors w-full sm:w-auto justify-center shadow-sm">
            <Home className="w-4 h-4" />
            Return to Homepage
          </Link>
          <Link href="/agencies" className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-6 py-3.5 rounded-lg font-bold transition-colors w-full sm:w-auto justify-center">
            <FolderOpen className="w-4 h-4" />
            Browse Program Directory
          </Link>
        </div>

      </div>
    </main>
  );
}