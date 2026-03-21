import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Script from 'next/script'
import { Providers } from "./providers"
import GlobalFooter from "@/src/components/GlobalFooter" // Correct path per screenshot
import './globals.css'

export const metadata = {
  title: 'WhenIsDue | Official Benefit Schedule Reference',
  description: 'Independent public information platform tracking state benefit schedules and financial deposit windows for 2026.',
  verification: {
    google: '41a30e1a7a52d0f8', 
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
      <body className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased selection:bg-blue-200 selection:text-blue-900" suppressHydrationWarning={true}>
        <Providers>
          {/* THE MASTER WRAPPER: Ensures footer stays at bottom */}
          <div className="min-h-screen flex flex-col">
            
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
                  <a href="/states" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors hidden md:block">
                    State Directory
                  </a>
                  <span className="text-[10px] font-bold text-slate-500 border border-slate-200 px-2.5 py-1 rounded bg-slate-50 uppercase tracking-wider">
                    Public Reference
                  </span>
                </div>
              </div>
            </nav>

            {/* MAIN CONTENT AREA */}
            <main className="flex-grow">
              {children}
            </main>

            {/* GLOBAL COMPLIANCE FOOTER: Replaces the old hardcoded footer */}
            <GlobalFooter />
            
          </div>

          {/* Layer 1: Global Behavioral Analytics */}
          <Analytics />
          {/* Layer 2: Core Web Vitals & Speed Monitoring */}
          <SpeedInsights />
          
        </Providers>
      </body>
    </html>
  )
}