import React from 'react';

const agencies = [
  {
    name: "Social Security Administration",
    slug: "ssa",
    description: "United States federal agency that administers Social Security.",
    activeSeries: [
      { name: "SSDI Payments", key: "ssa-ssdi-payments" },
      { name: "SSI Payments", key: "ssa-ssi-payments" }
    ],
    status: "VERIFIED_SOURCE"
  },
  {
    name: "Internal Revenue Service",
    slug: "irs",
    description: "U.S. government agency responsible for tax collection.",
    activeSeries: [
      { name: "Tax Refund Windows", key: "irs-refunds" }
    ],
    status: "PENDING_AUDIT"
  }
];

export default function AgencyDirectory() {
  return (
    <main className="min-h-screen bg-black text-white p-8 font-sans">
      <header className="max-w-5xl mx-auto mb-12 border-b border-gray-800 pb-8">
        <h1 className="text-4xl font-extrabold mb-4">Agency Directory</h1>
        <p className="text-gray-400 text-lg">
          Browsing all verified data sources and organizations currently tracked by the WhenIsDue Authority Engine.
        </p>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {agencies.map((agency) => (
          <div key={agency.slug} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-white">{agency.name}</h2>
              <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                agency.status === 'VERIFIED_SOURCE' ? 'text-green-400 border-green-900 bg-green-950' : 'text-amber-400 border-amber-900 bg-amber-950'
              }`}>
                {agency.status}
              </span>
            </div>
            
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              {agency.description}
            </p>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Monitored Series</h3>
              <div className="flex flex-wrap gap-2">
                {agency.activeSeries.map((series) => (
                  <a 
                    key={series.key}
                    href={`/series/${series.key}`}
                    className="bg-black border border-gray-700 hover:bg-gray-800 text-blue-400 text-xs py-2 px-3 rounded-md transition-all"
                  >
                    {series.name} →
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <footer className="max-w-5xl mx-auto mt-20 pt-8 border-t border-gray-800 text-center text-gray-600 text-sm">
        <p>© 2026 WhenIsDue Authority Engine • Zero-Trust Verified</p>
      </footer>
    </main>
  );
}