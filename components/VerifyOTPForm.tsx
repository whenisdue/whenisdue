'use client'

import { useState } from 'react'
import { verifySubscriptionToken } from '@/app/actions/verify'
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'

export default function VerifyOTPForm({ subscriptionId }: { subscriptionId: string }) {
  const [otp, setOtp] = useState('')
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE')
  const [errorMessage, setErrorMessage] = useState('')

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('LOADING');
    
    const result = await verifySubscriptionToken(subscriptionId, otp.trim());
    
    if (result.success) {
      setStatus('SUCCESS');
    } else {
      setStatus('ERROR');
      setErrorMessage(result.error || "Verification failed.");
    }
  }

  if (status === 'SUCCESS') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center max-w-md mx-auto mt-10">
        <div className="mx-auto bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-green-900 mb-2">Number Verified!</h2>
        <p className="text-green-800 font-medium">
          Your SMS reminders are now active. We will text you exactly when your schedule updates.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8 max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-black text-slate-900 mb-2">Enter Verification Code</h2>
      <p className="text-slate-500 mb-6 font-medium">We sent a 6-digit code to your phone. Enter it below to activate your alerts.</p>

      {status === 'ERROR' && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3 text-sm font-bold border border-red-100">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleVerify}>
        <input 
          type="text"
          maxLength={6}
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full text-center text-3xl tracking-[0.5em] font-mono bg-slate-50 border border-slate-300 rounded-lg px-4 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all mb-6"
          required
        />
        <button 
          type="submit" 
          disabled={otp.length < 6 || status === 'LOADING'}
          className="w-full bg-slate-900 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest py-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {status === 'LOADING' ? 'Verifying...' : 'Verify Number'} 
          {status !== 'LOADING' && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
    </div>
  )
}