"use client";

import { useConflictsDirectory } from "./useConflictsData";
import { AlertTriangle, ShieldAlert, Activity, FileJson, Rss } from "lucide-react";
import Link from "next/link";

export default function ConflictsDirectoryPage() {
  const state = useConflictsDirectory();

  if (state.kind === "LOADING") return <div className="p-8 text-center font-mono text-gray-500 animate-pulse">Loading Directory... ({state.step})</div>;
  if (state.kind === "FAILED") return <div className="p-8 text-red-500 font-bold text-center">Failed to load: {state.error.message}</div>;

  const { banner, table, quarantine } = state;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12 font-sans">
      <div className="bg-white border-b border-gray-200 pt-8 pb-6 px-6 mb-8">
        <div className="max-w-6xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <AlertTriangle className="mr-3 text-red-500" /> Integrity Conflicts
            </h1>
            <p className="text-sm text-gray-500">Public registry of active divergence, rollbacks, and equivocations.</p>
          </div>
          <div className="flex gap-4 text-xs font-mono">
            <a href="/integrity/conflicts/index.json" target="_blank" className="flex items-center text-blue-600 hover:underline"><FileJson size={14} className="mr-1"/> index.json</a>
            <a href="/integrity/conflicts/feed.xml" target="_blank" className="flex items-center text-orange-500 hover:underline"><Rss size={14} className="mr-1"/> RSS Feed</a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* GLOBAL BANNER */}
        <div className={`p-4 rounded-lg border flex items-center justify-between text-white shadow-sm ${
          banner.light === "RED" ? "bg-red-600 border-red-700" : banner.light === "AMBER" ? "bg-amber-500 border-amber-600" : "bg-green-600 border-green-700"
        }`}>
          <div className="flex items-center space-x-3">
            {banner.light === "GREEN" ? <Activity size={24} /> : <ShieldAlert size={24} />}
            <div>
              <div className="font-bold text-lg">{banner.message}</div>
              <div className="text-xs opacity-80 font-mono mt-1">UTC: {banner.updatedAtUtc}</div>
            </div>
          </div>
          <div className="flex gap-6 text-center font-mono">
            <div><div className="text-2xl font-black">{banner.activeRedCount}</div><div className="text-xs uppercase opacity-80">RED</div></div>
            <div><div className="text-2xl font-black">{banner.activeAmberCount}</div><div className="text-xs uppercase opacity-80">AMBER</div></div>
          </div>
        </div>

        {/* ACTIVE CONFLICTS TABLE */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Active Conflict Proofs</h2>
          </div>
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-gray-100 text-gray-500 text-xs border-b border-gray-200">
              <tr><th className="p-4">Severity</th><th className="p-4">Type</th><th className="p-4">Conflict ID</th><th className="p-4">Detected (UTC)</th><th className="p-4">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {table.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">No active conflicts.</td></tr>
              ) : table.map(c => (
                <tr key={c.conflictId} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${c.severity === "RED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                      {c.severity}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-700">{c.conflictType}</td>
                  <td className="p-4 text-gray-500">{c.conflictId.slice(0,18)}...</td>
                  <td className="p-4 text-gray-500">{c.detectedAtUtc}</td>
                  <td className="p-4">
                    <Link href={c.href} className="text-blue-600 hover:underline font-bold">Inspect &rarr;</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}