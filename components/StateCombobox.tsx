'use client';

import { useState, useRef, useEffect, useMemo, useId } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, MapPin, Search, AlertCircle } from 'lucide-react';
import { STATE_REGISTRY } from "@/lib/states-data";

const allStates = Object.values(STATE_REGISTRY).sort((a, b) => 
  a.name.localeCompare(b.name)
);

export default function StateCombobox() {
  const router = useRouter();
  const baseId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredStates = useMemo(() => 
    allStates.filter(s => s.name.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  useEffect(() => {
    setActiveIndex(filteredStates.length > 0 ? 0 : -1);
  }, [filteredStates]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (stateName: string, stateSlug: string) => {
    setQuery(stateName);
    setSelectedSlug(stateSlug);
    setIsOpen(false);
  };

  const handleSubmit = () => {
    if (selectedSlug) router.push(`/states/${selectedSlug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setIsOpen(true);
      return;
    }
    switch (e.key) {
      case 'Escape': setIsOpen(false); break;
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev < filteredStates.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && filteredStates[activeIndex]) {
          handleSelect(filteredStates[activeIndex].name, filteredStates[activeIndex].slug);
        }
        break;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl mx-auto items-stretch" ref={containerRef}>
      <div className="relative flex-grow">
        <div className={`relative bg-white border-4 rounded-[1.25rem] transition-all shadow-xl flex items-center px-5 h-full ${isOpen ? 'border-blue-600 ring-8 ring-blue-600/5' : 'border-slate-200'}`}>
          <MapPin className={`w-5 h-5 shrink-0 transition-colors ${isOpen ? 'text-blue-600' : 'text-slate-400'}`} />
          <input
            type="text"
            className="w-full bg-transparent py-5 px-4 font-black text-lg text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="Type your state..."
            aria-label="Select your state"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={`${baseId}-listbox`}
            aria-activedescendant={activeIndex >= 0 ? `${baseId}-opt-${activeIndex}` : undefined}
            value={query}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => { 
              setQuery(e.target.value); 
              setSelectedSlug(null);
              setIsOpen(true); 
            }}
            role="combobox"
          />
          <button 
            type="button" 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-1" 
            tabIndex={-1}
            aria-label={isOpen ? "Close state list" : "Open state list"}
          >
            <ChevronDown className={`w-6 h-6 text-slate-900 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isOpen && (
          <ul
            id={`${baseId}-listbox`}
            role="listbox"
            className="absolute top-full left-0 right-0 mt-2 bg-white border-4 border-slate-200 rounded-[1.5rem] shadow-2xl z-50 max-h-64 overflow-y-auto p-2 space-y-1"
          >
            {filteredStates.length > 0 ? (
              filteredStates.map((s, index) => (
                <li
                  key={s.slug}
                  id={`${baseId}-opt-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onClick={() => handleSelect(s.name, s.slug)}
                  className={`w-full text-left p-4 rounded-xl font-black text-lg cursor-pointer transition-all flex items-center justify-between ${
                    index === activeIndex ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {s.name}
                  <Search className={`w-4 h-4 transition-opacity ${index === activeIndex ? 'opacity-100' : 'opacity-0'}`} />
                </li>
              ))
            ) : (
              <li className="p-6 text-center space-y-2" role="presentation">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-400 text-sm italic">No states found.</p>
              </li>
            )}
          </ul>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedSlug}
        className={`w-full md:w-auto px-10 py-5 rounded-[1.25rem] font-black text-xl transition-all shadow-xl whitespace-nowrap border-4 ${
          selectedSlug 
          ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-500 hover:border-blue-500 active:scale-95' 
          : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-40'
        }`}
      >
        See my date
      </button>
    </div>
  );
}