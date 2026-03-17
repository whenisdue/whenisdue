import VerifyOTPForm from '@/components/VerifyOTPForm'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { SubscriptionService } from "@/lib/services/subscription-service"
import { auditLogger } from "@/lib/services/audit-logger"

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; sub?: string }>
}) {
  const { token, sub } = await searchParams;

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

  if (sub && !token) {
    return (
      <main className="min-h-screen bg-slate-50 pt-10 px-4">
        <VerifyOTPForm subscriptionId={sub} />
      </main>
    )
  }

  // Call our new Service Layer directly since this is a Server Component
  const subService = new SubscriptionService(auditLogger);
  const result = await subService.verifyEmail(sub, token as string);
  const isSuccess = result.type === 'SUCCESS' || result.type === 'VERIFICATION_IDEMPOTENT';

  return (
    <main className="min-h-screen bg-slate-50 pt-20 px-4">
      <div className={`max-w-md mx-auto border rounded-xl p-8 text-center ${isSuccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          {isSuccess ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
        </div>
        
        <h1 className={`text-2xl font-black mb-2 ${isSuccess ? 'text-green-900' : 'text-red-900'}`}>
          {isSuccess ? 'Email Verified!' : 'Verification Failed'}
        </h1>
        
        <p className={`font-medium mb-8 ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
          {isSuccess 
            ? 'Your reminders are now active. You can safely close this window.' 
            : (result as any).message || 'Something went wrong verifying your link.'}
        </p>

        <Link href="/" className="inline-block bg-white border border-slate-200 text-slate-700 font-bold text-sm uppercase tracking-widest py-3 px-6 rounded-lg hover:bg-slate-50 transition-colors">
          Return Home
        </Link>
      </div>
    </main>
  )
}