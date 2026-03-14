import React from 'react';
import { notFound } from 'next/navigation';

// SSA Master Rule Definition
const SSDI_METADATA: Record<string, { title: string; range: string; rule: string; color: string }> = {
  "ssdi-cycle-1": {
    title: "SSDI Birth Cycle 1 (1st-10th)",
    range: "1st - 10th",
    rule: "Second Wednesday of every month",
    color: "blue"
  },
  "ssdi-cycle-2": {
    title: "SSDI Birth Cycle 2 (11th-20th)",
    range: "11th - 20th",
    rule: "Third Wednesday of every month",
    color: "blue"
  },
  "ssdi-cycle-3": {
    title: "SSDI Birth Cycle 3 (21st-31st)",
    range: "21st - 31st",
    rule: "Fourth Wednesday of every month",
    color: "blue"
  }
};

export default async function SsaSeriesPage({ params }: { params: { slug: string } }) {
  const data = SSDI_METADATA[params.slug];

  if (!data) return notFound();

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* BREADCRUMB */}
        <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">
          Federal / Social Security / {params.slug}
        </div>

        {/* HERO SECTION */}
        <div className="bg-gray-900 border border-gray-800 p-12 rounded-[40px] shadow-2xl mb-12 text-center">
          <h1 className="text-5xl font-black tracking-tight mb-6">{data.title}</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Because your birth day falls between the <span className="text-white font-bold">{data.range}</span>, 
            your payments are issued on the <span className={`text-${data.color}-500 font-bold underline decoration-2`}>{data.rule}</span>.
          </p>
        </div>

        {/* CASEWORKER SUMMARY CARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl">
            <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Verification Status</h3>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-lg font-bold">2026 Verified</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Checked against official SSA.gov Publication No. 05-10031.</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl text-left">
            <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Immediate Action</h3>
            <p className="text-sm text-gray-400">If your payment date falls on a Federal Holiday, funds are typically issued on the <strong>previous business day</strong>.</p>
          </div>
        </div>

        {/* Placeholder for future 2026 Calendar Table */}
        <div className="bg-gray-900 border border-dashed border-gray-700 p-20 rounded-[40px] text-center">
           <span className="text-gray-600 font-black uppercase tracking-widest text-xs">2026 Monthly Calendar Loading...</span>
        </div>

      </div>
    </main>
  );
}