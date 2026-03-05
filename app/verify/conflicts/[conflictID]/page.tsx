"use client";

import { useParams } from "next/navigation";
import { useConflictDetail } from "../useConflictsData";
import { ShieldAlert, SplitSquareHorizontal, Download, TerminalSquare } from "lucide-react";

export default function ConflictDetailPage() {
  const params = useParams();
  const state = useConflictDetail(params.conflictId as string);

  if (state.kind === "LOADING") return <div className="p-8 text-center font-mono text-gray-500 animate-pulse">Loading Conflict Evidence...</div>;
  if (state.kind === "FAILED") return <div className="p-8 text-red-500 font-bold text-center">Failed to load conflict: {state.error.message}</div>;

  const { verdict, compare, export: exportData } = state;

  const trunc = (s?: string | null) => s ? `${s.slice(0,16)}...${s.slice(-8)}` : "N/A";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12 font-sans">
      <div className="bg-white border-b border-gray-200 pt-8 pb-6 px-6 mb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <SplitSquareHorizontal className="mr-3 text-red-500" /> Conflict Analysis
          </h1>
          <div className="flex items-center gap-4 text-sm font-mono mt-4">
            <div className="bg-gray-100 border border-gray-300 px-3 py-1 rounded">
              <span className="text-gray-500 mr-2">ID:</span><span className="font-bold">{state.conflictId}</span>
            </div>
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded font-bold border border-red-200">
              {verdict.conflictType} ({verdict.severity})
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT RAIL */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-red-300 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-red-600 text-white p-6 flex items-center space-x-3">
              <ShieldAlert size={32} />
              <div>
                <div className="text-xs uppercase tracking-widest opacity-80">Verdict</div>
                <div className="text-xl font-bold">{verdict.label}</div>
              </div>
            </div>
            <div className="p-6 bg-red-50 text-red-900 font-bold text-sm border-b border-red-100">
              {verdict.message}
            </div>
            <div className="p-6 text-sm font-mono space-y-4">
               <div>
                 <div className="text-xs text-gray-500 mb-1">Canonical Conflict Hash</div>
                 <div className="break-all text-gray-800 bg-gray-100 p-2 rounded border">{verdict.canonicalConflictHash || "N/A"}</div>
               </div>
            </div>
          </div>
        </div>

        {/* RIGHT RAIL: SIDE BY SIDE */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 border-b pb-2">Divergent Signed Tree Heads (STH)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* STH A */}
              <div className="border border-gray-200 rounded-lg overflow-hidden font-mono text-sm">
                <div className="bg-gray-100 p-3 border-b font-bold text-gray-700 text-center">STH - A (Observed)</div>
                <div className="p-4 space-y-4">
                  <div><div className="text-xs text-gray-500">Tree Size</div><div className="text-lg">{compare.sthA.treeSize}</div></div>
                  <div><div className="text-xs text-gray-500">Root Hash</div><div className="break-all bg-red-50 text-red-800 p-1 rounded">{trunc(compare.sthA.rootHash)}</div></div>
                  <div><div className="text-xs text-gray-500">Signature Status</div><div className="text-amber-600">{compare.sthA.signatureStatus}</div></div>
                </div>
              </div>

              {/* STH B */}
              <div className="border border-gray-200 rounded-lg overflow-hidden font-mono text-sm">
                <div className="bg-gray-100 p-3 border-b font-bold text-gray-700 text-center">STH - B (Observed)</div>
                <div className="p-4 space-y-4">
                  <div><div className="text-xs text-gray-500">Tree Size</div><div className="text-lg">{compare.sthB.treeSize}</div></div>
                  <div><div className="text-xs text-gray-500">Root Hash</div><div className="break-all bg-red-50 text-red-800 p-1 rounded">{trunc(compare.sthB.rootHash)}</div></div>
                  <div><div className="text-xs text-gray-500">Signature Status</div><div className="text-amber-600">{compare.sthB.signatureStatus}</div></div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-gray-50 p-4 rounded border text-sm text-gray-700 font-mono">
              <strong>Divergence Narrative:</strong> {compare.highlights.map(h => h.note).join(" ") || "Conflict detected."}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center">
              <Download size={16} className="mr-2"/> Offline Verification Steps
            </h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700 font-mono">
              {exportData.offlineSteps.map((step: string, i: number) => <li key={i}>{step}</li>)}
            </ol>
            <a href={exportData.proofUrl} target="_blank" className="mt-6 inline-block bg-gray-900 text-white px-4 py-2 rounded text-sm font-bold hover:bg-gray-800">
              Download Raw Proof (JSON)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}