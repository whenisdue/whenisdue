"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitEventRequest, getFreshTtf, type ActionState } from "@/actions/request-event";
import { X, CheckCircle2, AlertCircle } from "lucide-react";

const initialState: ActionState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest py-3 rounded-lg transition-colors disabled:opacity-50"
    >
      {pending ? "Submitting..." : "Submit Request"}
    </button>
  );
}

export default function RequestEventModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [state, formAction] = useActionState(submitEventRequest, initialState);
  const [ttfToken, setTtfToken] = useState("");

  // Get a fresh Time-to-Fill token every time the modal opens
  useEffect(() => {
    if (isOpen && !state.ok) {
      getFreshTtf().then(setTtfToken);
    }
  }, [isOpen, state.ok]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-zinc-800 p-6 md:p-8 rounded-2xl w-full max-w-md relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-black text-white mb-2 tracking-tight">Request an Event</h2>
        
        {state.ok ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{state.message}</h3>
            <p className="text-sm text-zinc-400 mb-6">Our moderation team will review this shortly.</p>
            <button onClick={onClose} className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-6 py-2 rounded-lg transition-colors">
              Close
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-400 mb-6">Know about an upcoming date we missed? Let us know below.</p>
            
            {state.formErrors && state.formErrors.length > 0 && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="text-sm text-red-400">{state.formErrors[0]}</span>
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="ttf" value={ttfToken} />
              
              {/* Invisible Honeypot (Screen readers ignore, CSS hides, Bots fill it) */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="company_fax">Company Fax</label>
                <input id="company_fax" name="company_fax" tabIndex={-1} autoComplete="off" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Event Title *</label>
                <input 
                  name="title" 
                  defaultValue={state.fields?.title || ""}
                  className={`w-full bg-zinc-900 border ${state.fieldErrors?.title ? 'border-red-500' : 'border-zinc-800 focus:border-emerald-500'} text-white px-4 py-3 rounded-lg outline-none transition-colors`} 
                  placeholder="e.g. Fortnite Chapter 6" 
                />
                {state.fieldErrors?.title && <p className="text-xs text-red-400 mt-1">{state.fieldErrors.title[0]}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Expected Date</label>
                <input 
                  name="date" 
                  defaultValue={state.fields?.date || ""}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 text-white px-4 py-3 rounded-lg outline-none transition-colors" 
                  placeholder="e.g. December 2026 or Q4" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Source URL</label>
                <input 
                  name="source" 
                  defaultValue={state.fields?.source || ""}
                  className={`w-full bg-zinc-900 border ${state.fieldErrors?.source ? 'border-red-500' : 'border-zinc-800 focus:border-emerald-500'} text-white px-4 py-3 rounded-lg outline-none transition-colors`} 
                  placeholder="Where did you see this?" 
                />
                {state.fieldErrors?.source && <p className="text-xs text-red-400 mt-1">{state.fieldErrors.source[0]}</p>}
              </div>

              <div className="pt-2">
                <SubmitButton />
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}