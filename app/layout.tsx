import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Script from 'next/script'
import { Providers } from "./providers"
import './globals.css'

export const metadata = {
  title: 'WhenIsDue | Official Benefit Schedule Reference',
  description: 'Independent public information platform tracking state benefit schedules and financial deposit windows for 2026.',
  verification: {
    google: '41a30e1a7a52d0f8', // Backup Google Verification Hash
  }
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
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased selection:bg-blue-200 selection:text-blue-900" suppressHydrationWarning={true}>
        <Providers>
          {/* NAVIGATION: Caseworker-Grade Utility Style */}
          <nav className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <a href="/" className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-1 hover:text-blue-700 transition-colors">
                  WHENISDUE<span className="text-blue-600">.</span>
                </a>
                {/* Live System Indicator */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                    2026 Engine Live
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 md:gap-6">
                <a href="/agencies" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors hidden md:block">
                  State Directory
                </a>
                <span className="text-[10px] font-bold text-slate-500 border border-slate-200 px-2.5 py-1 rounded bg-slate-50 uppercase tracking-wider">
                  Public Reference
                </span>
              </div>
            </div>
          </nav>

          <main className="flex-grow">
            {children}
          </main>

          {/* FOOTER: High-Authority Transparency */}
          <footer className="mt-auto border-t border-slate-200 bg-white pt-12 pb-20 px-6">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between gap-10">
              <div className="max-w-md">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <h4 className="text-slate-900 font-bold text-sm uppercase tracking-widest">Verified Data Protocol</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  All schedule logic is mapped deterministically from official state and federal agency publications. 
                  Standard bank settlement times may vary by financial institution. This platform provides independent, machine-audited reference data.
                </p>
              </div>
              <div className="md:text-right border-l-2 border-slate-100 pl-6 md:pl-0 md:border-l-0 md:border-r-2 md:pr-6 flex flex-col justify-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] leading-relaxed">
                  Not affiliated with USDA or state agencies.<br />
                  Data checked against .gov sources.<br />
                  <span className="text-slate-600 mt-2 block font-black">© 2026 WHENISDUE • SYSTEM V2.0</span>
                </p>
              </div>
            </div>
          </footer>

          {/* Layer 1: Global Behavioral Analytics */}
          <Analytics />
          {/* Layer 2: Core Web Vitals & Speed Monitoring */}
          <SpeedInsights />
          
        </Providers>
      </body>
    </html>
  )
}