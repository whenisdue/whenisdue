'use client'

import { useActionState } from 'react'
import { loginAdmin } from './actions'
import { ShieldCheck } from 'lucide-react'

const initialState = {
  error: null,
}

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState)

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl relative overflow-hidden">
        
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

        <div className="mb-8 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold mb-2">
            Restricted Access
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Control Room</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Enter your operator credentials to continue.
          </p>
        </div>

        <form action={formAction} className="space-y-4 relative z-10">
          <div className="space-y-2">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="w-full h-12 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-500/50 focus:bg-zinc-900 transition-all"
              placeholder="Enter master password"
            />
          </div>

          {state.error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400 font-medium text-center">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full h-12 rounded-xl bg-white text-black font-bold tracking-wide transition-all hover:bg-zinc-200 hover:scale-[1.02] active:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Decrypting...' : 'Unlock Terminal'}
          </button>
        </form>
      </div>
    </main>
  )
}