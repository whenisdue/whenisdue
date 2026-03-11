import { Analytics } from "@vercel/analytics/react"
import Script from 'next/script'
import { Providers } from "./providers"
import './globals.css'
import GlobalRequestButton from "@/components/GlobalRequestButton";

export const metadata = {
  title: 'WhenIsDue | Authority Verification Engine',
  description: 'Independent public data platform tracking benefit schedules and financial deposit windows.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <Script
          id="adsense-init"
          strategy="lazyOnload"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
        />
      </head>
      {/* UPDATED: Changed bg-black to bg-slate-50 and text-white to text-slate-900 */}
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col" suppressHydrationWarning={true}>
        <Providers>
          {/* NAVIGATION: Light-mode Institutional Style */}
          <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <a href="/" className="text-xl font-black tracking-tighter text-slate-900 hover:text-blue-700 transition-colors">
                  WHENISDUE<span className="text-blue-600">.</span>
                </a>
                <div className="hidden md:flex gap-6 text-sm font-bold text-slate-500">
                  <a href="/agencies" className="hover:text-slate-900 transition-colors">Directory</a>
                  <a href="/series/ssa-ssdi-payments" className="hover:text-slate-900 transition-colors">Sample Series</a>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono font-bold text-slate-400 border border-slate-200 px-2 py-1 rounded bg-slate-50">
                  v1.0.0-PROTOTYPE
                </span>
              </div>
            </div>
          </nav>

          <div className="flex-grow">
            {children}
          </div>

          {/* FOOTER: Calm, Editorial Transparency */}
          <footer className="mt-20 border-t border-slate-200 bg-white pt-16 pb-24 px-10">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between gap-12 text-[10px] text-slate-500 uppercase tracking-[0.2em] leading-relaxed">
              <div className="max-w-sm">
                <h4 className="text-slate-900 font-black mb-4">The Authority Protocol</h4>
                <p>
                  Schedules are modeled via public agency release patterns and verified monthly. 
                  Standard bank settlement timing is dependent on individual financial institutions. 
                  This platform provides reference data only.
                </p>
              </div>
              <div className="md:text-right border-l md:border-l-0 md:border-r border-slate-200 pl-6 md:pl-0 md:pr-6">
                <h4 className="text-slate-900 font-black mb-4">Independent Data Platform</h4>
                <p>
                  Not affiliated with the SSA, VA, or USDA. <br />
                  Data cross-verified against official government publications. <br />
                  © 2026 WHENISDUE • SECURITY: AUTH-VERIFIED
                </p>
              </div>
            </div>
          </footer>

          {/* --- FLOATING REQUEST BUTTON --- */}
          <GlobalRequestButton />
          
          {/* VERCEL ANALYTICS SENSOR */}
          <Analytics />
          
        </Providers>
      </body>
    </html>
  )
}