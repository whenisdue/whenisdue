"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Info, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

type EventRow = {
  id: string;
  identifierMatch: string;
  depositDate: Date;
};

type IdentifierUiConfig = {
  prompt: string;
  helperText: string;
  placeholder?: string;
  uiMode: "keypad" | "text";
  inputMode?: "text" | "numeric";
  validationType?: "numeric" | "alpha" | "none";
  maxLength?: number;
};

const getIdentifierConfig = (kind: string): IdentifierUiConfig => {
  const k = kind.toUpperCase();
  
  if (k.includes("CASE") && k.includes("LAST_TWO")) {
    return { prompt: "What are the last 2 digits of your case number?", helperText: "Enter the two digits below.", uiMode: "text", inputMode: "numeric", validationType: "numeric", maxLength: 2, placeholder: "e.g. 42" };
  }
  if (k.includes("CASE") || k.includes("EDG")) {
    return { prompt: "What is the last digit of your case number?", helperText: "Tap the single digit below.", uiMode: "keypad", validationType: "numeric" };
  }
  if (k.includes("SSN_LAST_TWO")) {
    return { prompt: "What are the last 2 digits of your SSN?", helperText: "Enter the two digits below.", uiMode: "text", inputMode: "numeric", validationType: "numeric", maxLength: 2, placeholder: "e.g. 89" };
  }
  if (k.includes("SSN")) {
    return { prompt: "What is the last digit of your SSN?", helperText: "Tap the single digit below.", uiMode: "keypad", validationType: "numeric" };
  }
  if (k.includes("LAST_NAME") || k.includes("ALPHA")) {
    return { prompt: "What is the first letter of your last name?", helperText: "Enter a single letter.", uiMode: "text", inputMode: "text", validationType: "alpha", maxLength: 1, placeholder: "e.g. M" };
  }
  if (k.includes("BIRTH")) {
    return { prompt: "What day of the month were you born?", helperText: "Enter a number between 1 and 31.", uiMode: "text", inputMode: "numeric", validationType: "numeric", maxLength: 2, placeholder: "e.g. 14" };
  }
  
  return { prompt: "Enter your case identifier", helperText: "Type your detail below to find your date.", uiMode: "text", inputMode: "text", validationType: "none", placeholder: "Enter identifier..." };
};

const checkMatch = (rangeStr: string, input: string) => {
  if (!input) return false;
  const cleanInput = input.trim().toUpperCase();
  const parts = rangeStr.split("-").map(p => p.trim().toUpperCase());
  
  if (parts.length === 2) {
    const [min, max] = parts;
    let formattedInput = cleanInput;
    if (!isNaN(Number(cleanInput)) && min.length > cleanInput.length) {
      formattedInput = cleanInput.padStart(min.length, '0');
    }
    return formattedInput >= min && formattedInput <= max;
  }
  return cleanInput === parts[0];
};

export default function IdentifierAnswerWidget({ events, identifierKind }: { events: EventRow[], identifierKind: string }) {
  const [input, setInput] = useState("");
  const [showFull, setShowFull] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);

  const uiConfig = useMemo(() => getIdentifierConfig(identifierKind), [identifierKind]);
  const matchedEvent = useMemo(() => events.find(e => checkMatch(e.identifierMatch, input)), [input, events]);
  
  const isInputComplete = uiConfig.maxLength ? input.length === uiConfig.maxLength : input.length > 0;
  const isNoMatch = input.length > 0 && isInputComplete && !matchedEvent;

  // Auto-scroll to answer when a match is found
  useEffect(() => {
    if (matchedEvent && answerRef.current) {
      setTimeout(() => {
        answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100); // Tiny delay to let the fade-in animation start
    }
  }, [matchedEvent]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (uiConfig.validationType === "numeric") {
      val = val.replace(/\D/g, ''); 
    } else if (uiConfig.validationType === "alpha") {
      val = val.replace(/[^a-zA-Z]/g, '').toUpperCase(); 
    }
    setInput(val);
  };

  return (
    <div className="w-full">
      <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-xl shadow-slate-200/50 mb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-900 mb-1">
            {uiConfig.prompt}
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{uiConfig.helperText}</p>
        </div>

        {uiConfig.uiMode === "keypad" ? (
          <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const isSelected = input === num.toString();
              return (
                <button
                  key={num}
                  onClick={() => setInput(num.toString())}
                  className={`py-4 rounded-2xl text-2xl font-black transition-all ${
                    isSelected 
                      ? "bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-600 ring-offset-2" 
                      : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 active:scale-95"
                  }`}
                >
                  {num}
                </button>
              );
            })}
            <div className="col-start-2">
              <button
                onClick={() => setInput("0")}
                className={`w-full py-4 rounded-2xl text-2xl font-black transition-all ${
                  input === "0" 
                    ? "bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-600 ring-offset-2" 
                    : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 active:scale-95"
                }`}
              >
                0
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-sm mx-auto">
            <input
              type="text"
              inputMode={uiConfig.inputMode}
              maxLength={uiConfig.maxLength}
              value={input}
              onChange={handleInputChange}
              placeholder={uiConfig.placeholder}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-2xl font-black text-slate-900 placeholder-slate-300 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 transition-all text-center"
            />
          </div>
        )}

        {/* ANSWER CARD (Now with a ref attached for scrolling) */}
        {matchedEvent && (
          <div ref={answerRef} className="mt-8 bg-blue-50 border border-blue-100 rounded-3xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300 text-center shadow-inner">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Matched Entry:</span>
              <span className="bg-white px-3 py-1 rounded-lg text-sm font-black text-blue-700 shadow-sm border border-blue-100">{input}</span>
            </div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">
              Expected Payment Date
            </span>
            <div className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">
              {format(new Date(matchedEvent.depositDate), "MMMM d, yyyy")}
            </div>
            <div className="inline-flex items-start gap-2 text-xs font-medium text-emerald-700 bg-emerald-100/50 px-4 py-2.5 rounded-xl border border-emerald-200/50 text-left">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <p>This date is already adjusted for weekends and bank holidays.</p>
            </div>
          </div>
        )}

        {isNoMatch && (
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 animate-in fade-in duration-300 flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-black text-amber-900 mb-1">No matching date found</h4>
              <p className="text-sm text-amber-700 font-medium">We couldn't find a schedule for "{input}". Please double-check your entry and try again.</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <button 
          onClick={() => setShowFull(!showFull)}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors bg-slate-50 hover:bg-slate-100 px-5 py-3 rounded-full border border-slate-200"
        >
          {showFull ? "Hide full schedule" : "Show full schedule"}
          {showFull ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFull && (
          <div className="mt-8 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 max-w-2xl mx-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-5 text-xs font-black uppercase text-slate-500 tracking-widest">Identifier Group</th>
                  <th className="p-5 text-xs font-black uppercase text-slate-500 tracking-widest text-right">Deposit Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((event) => {
                  const isMatch = input && checkMatch(event.identifierMatch, input);
                  return (
                    <tr 
                      key={event.id} 
                      className={`transition-colors ${
                        isMatch ? 'bg-blue-50/60' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className={`p-5 text-sm border-l-4 ${isMatch ? 'font-black text-blue-900 border-blue-600' : 'font-bold text-slate-600 border-transparent'}`}>
                        {event.identifierMatch}
                      </td>
                      <td className={`p-5 text-right text-sm ${isMatch ? 'font-black text-blue-900' : 'font-bold text-slate-900'}`}>
                        {format(new Date(event.depositDate), "MMMM d, yyyy")}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}