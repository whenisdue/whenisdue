"use client";

import { useEffect, useState } from "react";
import { useGlobalEvidence, useRecordVerification, GlobalDashboardState } from "./useVerifyData";
import { Search, Server, ShieldAlert, Activity, FileJson, Hash } from "lucide-react";

export default function VerifyDashboardPage() {
  const { state: globalState, refresh } = useGlobalEvidence();
  const { recordState, verifyRecord } = useRecordVerification();
  const [recordId, setRecordId] = useState("");

  // Auto-fetch global state on load
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000); // 60s revalidation per blueprint
    return () => clearInterval(interval);
  }, [refresh]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyRecord(recordId, globalState);
  };

  // Helper for deterministic hash display
  const truncHash = (hash?: string) => {
    if (!hash) return "N/A";
    const h = hash.replace("sha256:", "");
    if (h.length <= 14) return h;
    return `${h.slice(0, 8)}...${h.slice(-6)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      {/* 1. Top Status Banner */}
      {globalState.kind !== "LOADING_GLOBAL" && (
        <div
          className={`w-full py-3 px-6 text-white text-sm font-medium flex justify-between items-center ${
            globalState.health.overall === "GREEN"
              ? "bg-green-600"
              : globalState.health.overall === "AMBER"
              ? "bg-amber-500"
              : "bg-red-600"
          }`}
        >
          <div className="flex items-center space-x-2">
            {globalState.health.overall === "GREEN" ? <Activity size={16} /> : <ShieldAlert size={16} />}
            <span>
              GLOBAL NETWORK HEALTH: {globalState.health.overall} ({globalState.health.reasonCode})
            </span>
          </div>
          <span className="opacity-80">UTC: {globalState.health.computedAtUtc}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto mt-8 px-4">
        {/* Artifacts Quick Links */}
        {globalState.kind !== "LOADING_GLOBAL" && globalState.data?.artifacts && (
          <div className="flex space-x-4 mb-8 text-xs text-gray-500 font-mono overflow-x-auto pb-2">
            <a href={globalState.data.artifacts.manifestUrl} target="_blank" className="hover:text-blue-600 flex items-center"><FileJson size={12} className="mr-1"/> Manifest</a>
            <a href={globalState.data.artifacts.trustUrl} target="_blank" className="hover:text-blue-600 flex items-center"><FileJson size={12} className="mr-1"/> Trust Contract</a>
            <a href={globalState.data.artifacts.latestSthUrl} target="_blank" className="hover:text-blue-600 flex items-center"><FileJson size={12} className="mr-1"/> Latest STH</a>
            <a href={globalState.data.artifacts.conflictsIndexUrl} target="_blank" className="hover:text-blue-600 flex items-center"><FileJson size={12} className="mr-1"/> Conflicts</a>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Record Verification */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm min-h-[400px]">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Search className="mr-2 text-gray-400" /> Verify Record
              </h2>
              
              <form onSubmit={handleVerify} className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="Enter Record ID (e.g. record-123)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  value={recordId}
                  onChange={(e) => setRecordId(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={recordState.kind === "VERIFYING"}
                  className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
                >
                  {recordState.kind === "VERIFYING" ? "Fetching..." : "Verify"}
                </button>
              </form>

              {/* Record Fetch Progress / State */}
              {recordState.kind === "INPUT_INVALID" && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{recordState.message}</div>
              )}
              
              {recordState.kind === "VERIFYING" && (
                <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-sm font-mono animate-pulse">
                  Step: {recordState.step}
                </div>
              )}

              {recordState.kind === "VERIFY_FAILED" && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                  <strong>Verification Failed:</strong> {recordState.error.message}
                </div>
              )}

              {recordState.kind === "VERIFIED_RESULT" && (
                <div className="mt-8 border border-gray-200 rounded-lg overflow-hidden">
                  <div className={`p-4 text-white font-bold flex justify-between items-center ${
                    recordState.summary.traffic.light === "GREEN" ? "bg-green-600" :
                    recordState.summary.traffic.light === "AMBER" ? "bg-amber-500" : "bg-red-600"
                  }`}>
                    <span>{recordState.summary.traffic.label}</span>
                    <span>Citeability Score: {recordState.trustVerdict.citeabilityScore}/100</span>
                  </div>
                  
                  {recordState.summary.collapseApplied && (
                    <div className="p-3 bg-red-100 text-red-800 font-bold text-sm text-center border-b border-red-200">
                      CRITICAL: Active network conflict. Record must not be cited. ({recordState.summary.collapseReasonCode})
                    </div>
                  )}

                  <div className="p-6">
                    <table className="w-full text-sm text-left">
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 font-medium text-gray-500">Record ID</td>
                          <td className="py-2 font-mono">{recordState.trustVerdict.id}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium text-gray-500">Status</td>
                          <td className="py-2">{recordState.trustVerdict.status}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium text-gray-500">Computed At (UTC)</td>
                          <td className="py-2 font-mono">{recordState.trustVerdict.computedAtUtc}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Cryptographic Evidence Chain</h4>
                      <div className="flex gap-4">
                        <a href={recordState.links.trustVerdictUrl} target="_blank" className="text-blue-600 hover:underline text-sm flex items-center"><FileJson size={14} className="mr-1"/> trustVerdict.json</a>
                        <a href={recordState.links.statementUrl} target="_blank" className="text-blue-600 hover:underline text-sm flex items-center"><Hash size={14} className="mr-1"/> statement.cose</a>
                        <a href={recordState.links.receiptUrl} target="_blank" className="text-blue-600 hover:underline text-sm flex items-center"><Hash size={14} className="mr-1"/> receipt.cbor</a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Network Health */}
          <div className="space-y-6">
            
            {/* STH Panel */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-[200px]">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                <Server size={16} className="mr-2" /> Transparency Log
              </h3>
              {globalState.kind === "LOADING_GLOBAL" ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <div className="text-sm font-mono space-y-3">
                  <div>
                    <div className="text-xs text-gray-400">Tree Size</div>
                    <div className="text-lg font-bold text-gray-900">{globalState.data?.latestSth?.treeSize ?? "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Root Hash</div>
                    <div className="truncate text-gray-600">{truncHash(globalState.data?.latestSth?.rootHash)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Timestamp</div>
                    <div className="text-gray-600">{globalState.data?.latestSth?.timestamp ?? "N/A"}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Witness Quorum Panel */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm min-h-[200px]">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                <Activity size={16} className="mr-2" /> Witness Quorum
              </h3>
              {globalState.kind === "LOADING_GLOBAL" ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ) : (
                <div className="text-sm font-mono">
                  {(globalState.data?.witnessReputation?.results?.length ?? 0) > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      {globalState.data?.witnessReputation?.results.map((w: any) => (
                        <div key={w.witnessId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="truncate w-32" title={w.witnessId}>{w.witnessId}</span>
                          <span className={`font-bold ${w.weight > 0 ? "text-green-600" : "text-red-500"}`}>W: {w.weight}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500">No telemetry available</span>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        <div className="mt-12 text-center text-xs text-gray-400 font-mono">
          <p>Evidence shown is deterministic; timestamps are UTC; no probabilistic claims.</p>
        </div>
      </div>
    </div>
  );
}