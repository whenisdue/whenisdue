'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, MapPin } from 'lucide-react';

const states = [
  { name: "California", slug: "california" },
  { name: "Florida", slug: "florida" },
  { name: "Georgia", slug: "georgia" },
  { name: "New York", slug: "new-york" },
  { name: "Texas", slug: "texas" },
].sort((a, b) => a.name.localeCompare(b.name));

export default function StateSelector() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border-4 border-slate-200 rounded-[2rem] p-6 flex justify-between items-center hover:border-blue-600 transition-all shadow-xl group"
      >
        <div className="flex items-center gap-4">
          <MapPin className="w-6 h-6 text-slate-300 group-hover:text-blue-600 transition-colors" />
          <span className="font-black text-lg text-slate-900 leading-none">Select your state...</span>
        </div>
        <ChevronDown className={`w-6 h-6 text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-4 bg-white border-4 border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="max-h-72 overflow-y-auto p-4 space-y-2">
            {states.map((s) => (
              <button
                key={s.slug}
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/states/${s.slug}`);
                }}
                className="w-full text-left p-5 rounded-2xl hover:bg-blue-50 hover:text-blue-700 font-black text-xl text-slate-600 transition-all"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}