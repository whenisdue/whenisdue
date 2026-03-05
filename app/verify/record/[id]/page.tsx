"use client";

import { useParams } from "next/navigation";
import { useForensicData } from "./useForensicData";
import { 
  ShieldCheck, ShieldAlert, ShieldQuestion, 
  TerminalSquare, Download, Hash, FileJson, Link, AlertTriangle
} from "lucide-react";

export default function RecordForensicPage() {
  const params = useParams();
  const id = params.id as string;
  const { state, proveExpanded, expandProve, generateChecklist } = useForensicData(id);

  if (state.kind === "LOADING") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-mono text-sm text-gray-500">
        <div className="animate-pulse flex flex-col items-center">
          <TerminalSquare className="mb-4 text-gray-400" size={32} />
          <span>Executing Verification Sequence...</span>
          <span className="mt-2 text-xs text-blue-500">Step: {state.step}</span>
        </div>
      </div>
    );
  }

  if (state.kind === "FAILED") {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-white p-6 border border-red-200 rounded-xl shadow-sm text-center">
          <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Record Verification Failed</h1>
          <p className="font-mono text-sm text-red-600 bg-red-50 p-4 rounded inline-block">
            {state.error.code}: {state.error.message}
          </p>
        </div>
      </div>
    );
  }

  const { verdict, data } = state;
  const checklist = generateChecklist();

  // Deterministic Helpers
  const truncHash = (hash?: string) => hash ? `${hash.slice(0, 16)}...${hash.slice(-8)}` : "N/A";
  const statusColors = {
    GREEN: "bg-green-600 text-white",
    AMBER: "bg-amber-500 text-white",
    RED: "bg-red-600 text-white",
    NEUTRAL: "bg-gray-400 text-white"
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12 font-sans">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 pt-8 pb-4 px-6 mb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <TerminalSquare className="mr-3 text-gray-400" />
            Record Verification
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm font-mono mt-4">
            <div className="bg-gray-100 border border-gray-300 px-3 py-1 rounded flex items-center">
              <span className="text-gray-500 mr-2">ID:</span>
              <span className="font-bold">{data.id}</span>
            </div>
            {data.trustVerdict?.canonicalUrl && (
              <a href={data.trustVerdict.canonicalUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center">
                <Link size={14} className="mr-1"/> {data.trustVerdict.canonicalUrl}
              </a>
            )}
          </div>
          
          {/* EVIDENCE LINK STRIP */}
          <div className="flex gap-4 mt-6 text-xs text-gray-500 font-mono overflow-x-auto pb-2">
            <a href={data.links.trustVerdictUrl} className="hover:text-gray-900 border-b border-transparent hover:border-gray-900">trustVerdict.json</a>
            <a href={data.links.statementUrl} className="hover:text-gray-900 border-b border-transparent hover:border-gray-900">statement.cose</a>
            <a href={data.links.receiptUrl} className="hover:text-gray-900 border-b border-transparent hover:border-gray-900">receipt.cbor</a>
          </div>
        </div>
      </div>

      {/* MAIN FORENSIC LAYOUT */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT RAIL: Glance & Explain */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* GLANCE PANEL */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className={`p-6 flex items-center justify-between ${statusColors[verdict.light]}`}>
              <div className="flex items-center space-x-3">
                {verdict.light === "GREEN" ? <ShieldCheck size={32} /> : verdict.light === "RED" ? <ShieldAlert size={32} /> : <ShieldQuestion size={32} />}
                <div>
                  <div className="text-xs uppercase tracking-widest opacity-80">Cryptographic Verdict</div>
                  <div className="text-2xl font-bold">{verdict.label}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase opacity-80">Citeability</div>
                <div className="text-3xl font-black">{verdict.citeabilityScoreShown}</div>
              </div>
            </div>

            {verdict.collapseApplied && (
              <div className="bg-red-900 text-red-100 p-4 text-sm font-bold flex items-start">
                <AlertTriangle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                <p>CRITICAL: Active network conflict. This record must not be cited.</p>
              </div>
            )}

            <div className="p-6">
              <table className="w-full text-sm text-left font-mono">
                <tbody>
                  <tr className="border-b border-gray-100"><td className="py-2 text-gray-500">Status</td><td className="py-2 font-bold">{verdict.statusShown}</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 text-gray-500">Computed (UTC)</td><td className="py-2">{verdict.computedAtUtc || "N/A"}</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 text-gray-500">Registry Hash</td><td className="py-2" title={data.trustVerdict?.registryHash}>{truncHash(data.trustVerdict?.registryHash)}</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 text-gray-500">STH Hash</td><td className="py-2" title={data.trustVerdict?.sthHash}>{truncHash(data.trustVerdict?.sthHash)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* EXPLAIN PANEL */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Reason Codes</h3>
            <ul className="space-y-3 font-mono text-sm">
              {verdict.reasons.sort((a,b) => a.code.localeCompare(b.code)).map((r, idx) => (
                <li key={idx} className="flex flex-col bg-gray-50 p-3 rounded">
                  <span className="font-bold text-gray-800">{r.code}</span>
                  {r.detail && <span className="text-gray-500 text-xs mt-1">{r.detail}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT RAIL: Prove & Export */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* PROVE PANEL */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Cryptographic Proof Chain</h3>
              {!proveExpanded && (
                <button onClick={expandProve} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded text-xs font-bold transition">
                  Load Raw Evidence
                </button>
              )}
            </div>

            {/* Deterministic Checklist */}
            <div className="mb-8">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Deterministic Check Results</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm font-mono">
                  <thead className="bg-gray-50 text-gray-500 text-xs border-b border-gray-200">
                    <tr><th className="p-3">Check</th><th className="p-3">Status</th><th className="p-3">Code</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {checklist.checks.map((chk, i) => (
                      <tr key={i} className={chk.status === "FAIL" ? "bg-red-50" : ""}>
                        <td className="p-3 text-gray-700">{chk.name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            chk.status === "PASS" ? "bg-green-100 text-green-800" :
                            chk.status === "FAIL" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>{chk.status}</span>
                        </td>
                        <td className="p-3 text-xs text-gray-500">{chk.code}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RAW TABS (Only if expanded) */}
            {proveExpanded && (
              <div className="mt-8">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                  <FileJson size={14} className="mr-2"/> trustVerdict.json Payload
                </h4>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-64">
                  <pre>{JSON.stringify(data.trustVerdict, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>

          {/* EXPORT PANEL */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center">
              <Download size={16} className="mr-2"/> Examiner-Ready Export
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Download the fully self-contained cryptographic bundle to verify this record completely offline using open-source SCITT CLI tools.
            </p>
            <div className="bg-gray-50 p-4 rounded border border-gray-200 font-mono text-xs text-gray-500 mb-4">
              Expected Artifacts:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>trustVerdict.json</li>
                <li>statement.cose</li>
                <li>receipt.cbor</li>
              </ul>
            </div>
            <button disabled className="w-full bg-blue-600 opacity-50 cursor-not-allowed text-white px-4 py-3 rounded text-sm font-bold">
              Download Audit Bundle (.zip) - Pending CI Pipeline
            </button>
          </div>

        </div>
      </div>
      
      {/* FOOTER */}
      <div className="max-w-6xl mx-auto mt-12 text-center border-t border-gray-200 pt-6 text-xs text-gray-400 font-mono">
        <p>Evidence shown is deterministic. UTC timestamps only. No probabilistic claims or legal guarantees.</p>
      </div>

    </div>
  );
}