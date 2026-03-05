import Script from 'next/script'
import { Providers } from "./providers"
import './globals.css'

export const metadata = {
  title: 'WhenIsDue | Authority Verification Engine',
  description: 'Independent public data platform. Cryptographically verified historical distributions.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Absolute best performant loading: strategy="lazyOnload" to protect Core Web Vitals */}
        <Script
          id="adsense-init"
          strategy="lazyOnload"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-black text-white min-h-screen flex flex-col" suppressHydrationWarning={true}>
        {/* PostHog Providers Wrapper */}
        <Providers>
          <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
  <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between">
    <div className="flex items-center gap-8">
      {/* FIXED: Changed href from /agencies to / and added hover:text-white */}
      <a href="/" className="text-xl font-black tracking-tighter text-white hover:text-blue-400 transition-colors">
        WHENISDUE<span className="text-blue-500">.</span>
      </a>
      <div className="hidden md:flex gap-6 text-sm font-medium text-gray-400">
        <a href="/agencies" className="hover:text-white transition-colors">Directory</a>
        <a href="/series/ssa-ssdi-payments" className="hover:text-white transition-colors">Sample Series</a>
      </div>
    </div>
    {/* v1.0.0 Tag */}
    <div className="flex items-center gap-4">
      <span className="text-[10px] font-mono text-gray-500 border border-gray-800 px-2 py-1 rounded">
        v1.0.0-PROTOTYPE
      </span>
    </div>
  </div>
</nav>

          <div className="flex-grow">
            {children}
          </div>

          {/* Updated Transparency Footer */}
          <footer className="mt-20 border-t border-gray-900 pt-16 pb-24 px-10">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between gap-12 text-[10px] text-gray-600 uppercase tracking-[0.2em] leading-relaxed">
              <div className="max-w-sm">
                <h4 className="text-gray-400 font-black mb-4">The 4-3-2 Authority Protocol</h4>
                <p>
                  Dates are modeled via Treasury ACH file-release patterns. 
                  Standard bank settlement occurs at 8:30 AM ET on the payment date. 
                  Direct Express deposits do not participate in early release windows.
                </p>
              </div>
              <div className="md:text-right border-l md:border-l-0 md:border-r border-gray-900 pl-6 md:pl-0 md:pr-6">
                <h4 className="text-gray-400 font-black mb-4">Independent Data Platform</h4>
                <p>
                  Not affiliated with the SSA, VA, or USDA. <br />
                  Deterministic logic cross-verified against Reddit "hit" sentiment data. <br />
                  © 2026 WHENISDUE • SIGNATURE: AUTH-95-ACCURACY
                </p>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}