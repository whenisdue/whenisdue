"use client";

import { useWitnessesData } from "./useWitnessesData";
import { Users, Activity, ShieldAlert, Key, FileJson, BarChart3, Clock } from "lucide-react";

export default function WitnessesPage() {
  const state = useWitnessesData();

  if (state.kind === "LOADING") return <div className="p-12 text-center font-mono text-gray-500 animate-pulse"><Users className="mx-auto mb-4" size={32}/>Loading Witness Quorum...</div>;
  if (state.kind === "FAILED") return <div className="p-12 text-red-500 font-bold text-center border border-red-200 bg-red-50 m-8 rounded-lg">{state.error.message}</div>;

  const { banner, quorum, table, timeline, continuity, rawRefs } = state;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12 font-sans">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 pt-8 pb-6 px-6 mb-8">
        <div className="max-w-6xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Users className="mr-3 text-blue-500" /> Witness Network
            </h1>
            <p className="text-sm text-gray-500">Stake-weighted quorum capacity, reputation telemetry, and key continuity.</p>
          </div>
          <div className="flex gap-4 text-xs font-mono overflow-x-auto">
            <a href={rawRefs.trustUrl} target="_blank" className="flex items-center text-blue-600 hover:underline"><FileJson size={14} className="mr-1"/> Trust Policy</a>
            <a href={rawRefs.directoryUrl} target="_blank" className="flex items-center text-blue-600 hover:underline"><FileJson size={14} className="mr-1"/> Directory</a>
            <a href={rawRefs.reputationUrl} target="_blank" className="flex items-center text-blue-600 hover:underline"><FileJson size={14} className="mr-1"/> Reputation</a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-8">
        
        {/* BANNER */}
        <div className={`p-5 rounded-xl border flex items-center justify-between shadow-sm text-white ${
          banner.status === "RED" ? "bg-red-600 border-red-700" : banner.status === "AMBER" ? "bg-amber-500 border-amber-600" : "bg-green-600 border-green-700"
        }`}>
          <div className="flex items-center space-x-4">
            {banner.status === "GREEN" ? <Activity size={28} /> : <ShieldAlert size={28} />}
            <div>
              <div className="font-bold text-lg">{banner.title}</div>
              <div className="text-sm opacity-90 mt-1 font-mono">{banner.summaryLines[0]}</div>
            </div>
          </div>
          <div className="flex gap-6 text-center font-mono">
            <div><div className="text-2xl font-black">{banner.counts.active}</div><div className="text-xs uppercase opacity-80">Active</div></div>
            <div><div className="text-2xl font-black">{banner.counts.probationary}</div><div className="text-xs uppercase opacity-80">Probation</div></div>
            <div><div className="text-2xl font-black">{banner.counts.quarantinedRed + banner.counts.quarantinedAmber}</div><div className="text-xs uppercase opacity-80">Quarantine</div></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* QUORUM PANEL */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-6 flex items-center border-b pb-2">
                <BarChart3 size={16} className="mr-2" /> Weighted Quorum
              </h2>
              
              <div className="text-center mb-6">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Score</div>
                <div className="text-4xl font-black text-gray-800">{quorum.quorumScore}</div>
                <div className="text-xs text-gray-400 mt-1">Total Effective Weight: {quorum.totalWeight.toFixed(4)}</div>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-gray-500"><span>Valid Threshold</span><span>{quorum.validThreshold}</span></div>
                <div className="flex justify-between text-gray-500"><span>High-Trust Threshold</span><span>{quorum.highTrustThreshold}</span></div>
              </div>

              <div className="mt-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Top Contributors</h3>
                <div className="space-y-2">
                  {quorum.contributors.slice(0, 5).map(c => (
                    <div key={c.id} className="flex justify-between text-xs font-mono bg-gray-50 p-2 rounded">
                      <span className="truncate w-32">{c.id}</span>
                      <span className="font-bold text-green-600">{c.weight.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* TIMELINE FALLBACK */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center border-b pb-2">
                <Clock size={16} className="mr-2" /> Reputation Timeline
              </h2>
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded text-xs font-mono text-center">
                {timeline.notes[0]}
              </div>
            </div>
          </div>

          {/* TABLE PANEL */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Witness Roster</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-mono whitespace-nowrap">
                  <thead className="bg-gray-100 text-gray-500 text-xs border-b border-gray-200">
                    <tr>
                      <th className="p-4">Witness ID</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Raw Wgt</th>
                      <th className="p-4 text-right">Eff. Wgt</th>
                      <th className="p-4 text-center">Score (S/M)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {table.map(row => (
                      <tr key={row.witnessId} className={`hover:bg-gray-50 ${row.effectiveWeight === 0 ? "opacity-60" : ""}`}>
                        <td className="p-4">
                          <div className="font-bold text-gray-800">{row.displayId}</div>
                          {row.badges.map(b => <span key={b} className="text-[10px] bg-red-100 text-red-800 px-1 py-0.5 rounded mt-1 inline-block mr-1">{b}</span>)}
                        </td>
                        <td className="p-4 text-gray-600">{row.baseStatus}</td>
                        <td className="p-4 text-right text-gray-500">{row.weight.toFixed(4)}</td>
                        <td className="p-4 text-right font-bold text-green-600">{row.effectiveWeight.toFixed(4)}</td>
                        <td className="p-4 text-center text-gray-500">{row.counters?.signedCheckpoints} / {row.counters?.missedCheckpoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* KEY CONTINUITY PANEL */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
                <Key size={16} className="text-gray-500 mr-2"/>
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Key Continuity Surface</h2>
              </div>
              <div className="p-6">
                <div className="text-xs text-gray-500 font-mono mb-4">Active Keys Recognized by Federation</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {continuity.currentKeySet.map(k => (
                    <div key={k.witnessId} className="border rounded p-3 text-xs font-mono bg-gray-50">
                      <div className="font-bold text-gray-800 mb-1">{k.witnessId.split(":").pop()}</div>
                      <div className="text-gray-500 break-all">KID: {k.kid}</div>
                      <div className="text-gray-500 break-all">PUB: {k.pubKey}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}