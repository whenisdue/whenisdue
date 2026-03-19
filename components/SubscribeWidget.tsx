'use client'

import { useState } from 'react'
import { Bell, Mail, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react'

interface SubscribeWidgetProps {
  stateName: string;
  programCode: string;
  ruleGroup: string;
}

export default function SubscribeWidget({ stateName, programCode, ruleGroup }: SubscribeWidgetProps) {
  const [contactValue, setContactValue] = useState('');
  const [hasConsent, setHasConsent] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS'>('IDLE');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasConsent) return;
    
    setStatus('LOADING');
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: contactValue,
          stateCode: 'TX', // Hardcoded as an example, adjust if stateName is the 2-letter code
          programCode: programCode,
          matchType: 'LAST_NAME_INITIAL', 
          matchValue: 'A' // Adjust based on your actual UI inputs later
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setStatus('SUCCESS'); 
      } else {
        setStatus('IDLE');
        alert(result.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setStatus('IDLE');
      alert("Network error. Please try again.");
    }
  }

  if (status === 'SUCCESS') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 md:p-8 text-center mt-8">
        <div className="mx-auto bg-green-100 text-green-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-black text-green-900 mb-2">Check your email</h3>
        <p className="text-green-800 font-medium">
          We just sent a secure confirmation link to <strong>{contactValue}</strong>. <br className="hidden md:block"/>
          You must click it to activate your reminders.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden mt-8">
      <div className="bg-slate-50 border-b border-slate-200 p-5 md:px-8 flex items-center gap-4">
        <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900">Set Up Email Alerts</h3>
          <p className="text-sm font-medium text-slate-500">Get notified 24 hours before your payment drops.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 md:p-8">
        <div className="mb-6 inline-flex flex-wrap items-center gap-2 bg-blue-50 text-blue-800 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded border border-blue-100">
          <span>Targeting:</span>
          <span className="text-blue-600">•</span>
          <span>{stateName} {programCode}</span>
          <span className="text-blue-600">•</span>
          <span className="truncate max-w-[200px] sm:max-w-none">{ruleGroup}</span>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            Where should we send the reminder?
          </label>
          <input 
            type="email"
            placeholder="you@example.com"
            required
            value={contactValue}
            onChange={(e) => setContactValue(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="mb-8 flex items-start gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
          <input 
            type="checkbox" 
            id="tcpa-consent"
            checked={hasConsent}
            onChange={(e) => setHasConsent(e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="tcpa-consent" className="text-xs text-slate-500 leading-relaxed cursor-pointer">
            <span className="font-bold text-slate-700 block mb-1">I want these reminders.</span>
            By checking this box, you agree to receive automated emails about schedule updates. 
          </label>
        </div>

        <button 
          type="submit" 
          disabled={!hasConsent || !contactValue || status === 'LOADING'}
          className="w-full bg-slate-900 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest py-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {status === 'LOADING' ? 'Securing...' : 'Set My Reminder'} 
          {status !== 'LOADING' && <ArrowRight className="w-4 h-4" />}
        </button>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <ShieldCheck className="w-3 h-3" />
          Bank-Grade Privacy • Unsubscribe Anytime
        </div>
      </form>
    </div>
  )
}