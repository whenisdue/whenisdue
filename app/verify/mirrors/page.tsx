"use client";

import { useMirrorsData } from "./useMirrorsData";
import { Globe, Server, Activity, ShieldAlert, FileJson, AlertTriangle } from "lucide-react";

export default function MirrorsNetworkPage() {
  const state = useMirrorsData();

  if (state.kind === "LOADING") return <div className="p-12 text-center font-mono text-gray-500 animate-pulse flex flex-col items-center"><Globe size={32} className="mb-4" />Pinging global mirror federation...</div>;
  if (state.kind === "FAILED") return <div className="p-12 text-red-500 font-bold text-center border border-red-200 bg-red-50 m-8 rounded-lg">{state.error.message}</div>;

  const { banner, map, table, convergence, rawRefs } = state;

  const statusColors = {
    GREEN: "bg-green-500 border-green-600 text-white",
    AMBER: "bg-amber-400 border-amber-500 text-gray-900",
    RED: "bg-red-600 border-red-700 text-white",
    UNREACHABLE: "bg-gray-300 border-gray-400 text-gray-700"
  };

  const trunc = (s?: string | null) => s ? `${s.slice(0, 12)}...` : "N/A";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12 font-sans">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 pt-8 pb-6 px-6 mb-8">
        <div className="max-w-6xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Globe className="mr-3 text-blue-500" /> Federation Network Map
            </h1>
            <p className="text-sm text-gray-500">Live operational status and synchronization convergence of all global mirrors.</p>
          </div>
          <div className="flex gap-4 text-xs font-mono">
            <a href={rawRefs.mirrorDirectoryUrl} target="_blank" className="flex items-center text-blue-600 hover:underline"><FileJson size={14} className="mr-1"/> Directory</a>
            <a href={rawRefs.primarySthUrl} target="_blank" className="flex items-center text-blue-600 hover:underline"><FileJson size={14} className="mr-1"/> Primary STH</a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-8">
        
        {/* BANNER */}
        <div className={`p-5 rounded-xl border flex items-center justify-between shadow-sm text-white ${
          banner.light === "RED" ? "bg-red-600 border-red-700" : banner.light === "AMBER" ? "bg-amber-500 border-amber-600" : "bg-green-600 border-green-700"
        }`}>
          <div className="flex items-center space-x-4">
            {banner.light === "GREEN" ? <Activity size={28} /> : <ShieldAlert size={28} />}
            <div>
              <div className="font-bold text-lg">{banner.message}</div>
              <div className="text-sm opacity-90 mt-1">Reachable Nodes: {banner.reachableMirrors} / {banner.totalMirrors}</div>
            </div>
          </div>
          <div className="flex gap-6 text-center font-mono">
            <div><div className="text-2xl font-black">{banner.greenCount}</div><div className="text-xs uppercase opacity-80">Synced</div></div>
            <div><div className="text-2xl font-black">{banner.amberCount}</div><div className="text-xs uppercase opacity-80">Lagging</div></div>
            <div><div className="text-2xl font-black">{banner.redCount}</div><div className="text-xs uppercase opacity-80">Diverged</div></div>
          </div>
        </div>

        {/* CLUSTER MAP */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-6 flex items-center border-b pb-2">
            <Server size={16} className="mr-2" /> Topography Visualizer
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {map.clusters.map(cluster => (
              <div key={cluster.clusterId} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-xs font-bold text-gray-500 uppercase mb-3">{cluster.label}</div>
                <div className="flex flex-wrap gap-2">
                  {cluster.nodes.map(node => (
                    <div 
                      key={node.mirrorId} 
                      title={`${node.mirrorId}\nLag: ${node.treeLag ?? 'N/A'}`}
                      className={`px-3 py-1.5 rounded shadow-sm text-xs font-bold border flex items-center ${statusColors[node.status]}`}
                    >
                      {node.isQuarantined && <AlertTriangle size={12} className="mr-1" />}
                      {node.mirrorId.split(":")[2] || node.mirrorId}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-4 text-xs font-mono text-gray-500 border-t pt-4">
            {map.legend.map(l => (
              <div key={l.status} className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 border ${statusColors[l.status]}`}></div>
                {l.label}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CONVERGENCE PANEL */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm min-h-[300px]">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 border-b pb-2">Root Convergence</h2>
              
              <div className="space-y-4 font-mono text-sm">
                <div>
                  <div className="text-xs text-gray-500">Canonical Root (Primary)</div>
                  <div className="break-all bg-gray-100 p-2 rounded text-gray-700 text-xs mt-1 border">{convergence.canonicalRootHash || "N/A"}</div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-500">Federation Majority Root</div>
                  <div className={`break-all p-2 rounded text-xs mt-1 border ${convergence.canonicalRootHash === convergence.majorityRootHash ? "bg-green-50 text-green-800 border-green-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
                    {convergence.majorityRootHash || "N/A"}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-xs text-gray-500 mb-2">Hash Distribution Buckets</div>
                  {convergence.rootHashBuckets.map((b, i) => (
                    <div key={i} className="flex justify-between items-center mb-1 text-xs">
                      <span className="truncate w-3/4">{trunc(b.rootHash)}</span>
                      <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-bold">{b.count} nodes</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Node Telemetry</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-mono whitespace-nowrap">
                  <thead className="bg-gray-100 text-gray-500 text-xs border-b border-gray-200">
                    <tr>
                      <th className="p-4">Mirror ID</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Tree Size</th>
                      <th className="p-4">Lag</th>
                      <th className="p-4">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {table.map(row => (
                      <tr key={row.mirrorId} className="hover:bg-gray-50">
                        <td className="p-4 font-bold text-gray-700">{row.mirrorId.split(":")[2] || row.mirrorId}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold border ${statusColors[row.status]}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600">{row.treeSize ?? "N/A"}</td>
                        <td className="p-4 text-gray-600">{row.treeLag !== null ? `-${row.treeLag}` : "-"}</td>
                        <td className="p-4 text-xs text-gray-500">{row.reasonCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}