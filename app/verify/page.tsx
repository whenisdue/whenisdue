import { verifySubscriptionToken } from '@/app/actions/verify'
import VerifyOTPForm from '@/components/VerifyOTPForm'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; sub?: string }>
}) {
  const { token, sub } = await searchParams;

  // SCENARIO 1: Missing sub ID entirely (User just typed /verify into the browser)
  if (!sub) {
    return (
      <main className="min-h-screen bg-slate-50 pt-20 px-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-black text-slate-900 mb-4">Invalid Link</h1>
          <p className="text-slate-500 mb-8">This verification link is missing required information.</p>
          <Link href="/" className="text-blue-600 font-bold hover:underline">Return Home</Link>
        </div>
      </main>
    )
  }

  // SCENARIO 2: Has sub, but no token. (This is an SMS user who needs to type their OTP)
  if (sub && !token) {
    return (
      <main className="min-h-screen bg-slate-50 pt-10 px-4">
        <VerifyOTPForm subscriptionId={sub} />
      </main>
    )
  }

  // SCENARIO 3: Has BOTH sub and token. (This is an Email user clicking the magic link)
  const result = await verifySubscriptionToken(sub, token as string);

  return (
    <main className="min-h-screen bg-slate-50 pt-20 px-4">
      <div className={`max-w-md mx-auto border rounded-xl p-8 text-center ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${result.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          {result.success ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
        </div>
        
        <h1 className={`text-2xl font-black mb-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
          {result.success ? 'Email Verified!' : 'Verification Failed'}
        </h1>
        
        <p className={`font-medium mb-8 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
          {result.success 
            ? 'Your reminders are now active. You can safely close this window.' 
            : result.error || 'Something went wrong verifying your link.'}
        </p>

        <Link href="/" className="inline-block bg-white border border-slate-200 text-slate-700 font-bold text-sm uppercase tracking-widest py-3 px-6 rounded-lg hover:bg-slate-50 transition-colors">
          Return Home
        </Link>
      </div>
    </main>
  )
}