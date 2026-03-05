"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useOpsStore } from "../../../../store/useOpsStore";
import { generateDraftId, generateSnapshotHash } from "../../../../lib/crypto/draft-hasher";import { Server, ShieldAlert, FileJson, Lock, RefreshCw, Download, TerminalSquare, AlertTriangle, Activity } from "lucide-react";

export default function MirrorOpsWorkspace() {
  const params = useParams();
  const mirrorId = decodeURIComponent(params.mirrorId as string);

  const { getActiveDraft, createDraft, supersedeDraft } = useOpsStore();

  const [isMounted, setIsMounted] = useState(false);
  const [opType, setOpType] = useState<"ADD" | "REMOVE" | "PROBATION" | "REINSTATE" | "QUARANTINE_LIFT_REQUEST">("ADD");
  const [reasonCode, setReasonCode] = useState("VOLUNTARY_RETIREMENT");
  const [baseUrl, setBaseUrl] = useState(`https://${mirrorId.replace("did:web:", "")}`);

  // Compound key for the active draft lock
  const targetId = `whenisdue.com::MIRROR_REGISTRY_CHANGE::${mirrorId}`;
  const activeDraft = getActiveDraft(targetId, "MIRROR_REGISTRY_CHANGE");

  useEffect(() => { setIsMounted(true); }, []);
  if (!isMounted) return null;

  const handleCreateDraft = () => {
    // Deterministic rules based on policy blueprint
    const isHighRisk = opType === "REMOVE" || opType === "QUARANTINE_LIFT_REQUEST";
    const riskClass = isHighRisk ? "HIGH" : "STANDARD";
    const timelockClass = isHighRisk ? "T2" : "T1";

    const payload = {
      schemaVersion: "1.0",
      draftType: "MIRROR_OP_EVENT",
      actionType: "MIRROR_REGISTRY_CHANGE",
      mirrorOpId: crypto.randomUUID(),
      serviceId: "whenisdue.com",
      revision: 1,
      policySnapshot: {
        currentPolicyPackRef: "/governance/policy-pack/v1.0.0.json",
        currentPolicyPackHash: "sha256:abcdef1234567890",
        currentPolicyVersion: "1.0.0"
      },
      directorySnapshot: {
        currentDirectoryRef: "/mirrors/directory/v12.json",
        currentDirectoryHash: "sha256:9876543210fedcba",
        currentDirectoryVersion: "v12"
      },
      op: {
        opType,
        targetMirrorId: mirrorId,
        reasonCode,
        riskClass,
        timelockClass,
        effectiveNotBeforeUtc: new Date(Date.now() + 86400000 * (timelockClass === "T2" ? 7 : 1)).toISOString(),
        proposedDirectoryPatch: {
          proposedMirrorDescriptor: opType === "ADD" ? {
            mirrorId,
            status: "PROBATION",
            baseUrl,
            endpoints: {
              sthLatest: "/transparency/sth/latest.json",
              syncManifest: "/transparency/sync-manifest.json",
              tilesTemplate: "/transparency/tiles/{size}/{level}/{index}.json"
            }
          } : undefined,
          statusChange: opType === "REMOVE" ? "REVOKED" : undefined
        },
        healthRequirementsSnapshot: {
          requiredAttestationTypes: ["sthLatest", "syncManifest"],
          minAttestationCount: 3,
          maxStalenessSeconds: 3600
        },
        quarantineInputs: {
          quarantineRef: "/integrity/conflicts/quarantine.json",
          quarantineHash: "sha256:quarantine_snapshot_hash",
          blockingEntries: []
        },
        evidenceRefs: ["ipfs://evidence-bundle-hash"],
        diffRef: "ipfs://machine-readable-diff"
      },
      requiredSignersSnapshot: ["did:web:whenisdue.com:operator-1", "did:web:whenisdue.com:operator-2"],
      createdAtUtc: new Date().toISOString()
    };

    try {
      const draftId = generateDraftId(payload);
      createDraft(targetId, "MIRROR_REGISTRY_CHANGE", draftId, payload);
    } catch (err: any) {
      alert(`Gating Failure: ${err.message}`);
    }
  };

  const handleBumpRevision = () => {
    if (!activeDraft) return;
    const newPayload = { ...activeDraft.payload, revision: activeDraft.revision + 1, createdAtUtc: new Date().toISOString() };
    try {
      const newDraftId = generateDraftId(newPayload);
      supersedeDraft(targetId, "MIRROR_REGISTRY_CHANGE", newDraftId, newPayload);
    } catch (err: any) {
      alert(`Gating Failure: ${err.message}`);
    }
  };

  const trunc = (s?: string) => s ? `${s.slice(0, 16)}...${s.slice(-8)}` : "N/A";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12 font-sans">
      <div className="bg-white border-b border-gray-200 pt-8 pb-6 px-6 mb-8">
        <div className="max-w-6xl mx-auto flex justify-between items-end">
          <div>
            <div className="flex items-center text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">
              <Server size={14} className="mr-1" /> Mirror Registry Operations
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Node Editor Workspace</h1>
            <div className="flex items-center gap-4 text-sm font-mono mt-2 text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">Target: {mirrorId}</span>
            </div>
          </div>
          <div className="text-xs font-mono bg-gray-900 text-green-400 px-3 py-2 rounded flex items-center shadow-inner">
            <TerminalSquare size={14} className="mr-2" /> Sterile Mode: Active
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT RAIL: QUARANTINE OVERLAY */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center">
              <Activity size={16} className="mr-2 text-teal-500" /> Current Health & Quarantine
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Operations are strictly gated by the public quarantine index. You cannot reinstate a quarantined node without a Lift Request.
            </p>
            <div className="space-y-4 font-mono text-xs">
              <div>
                <span className="block text-gray-400 mb-1">Mirror Status</span>
                <span className="bg-green-50 text-green-800 font-bold px-2 py-1 rounded border border-green-100">ACTIVE</span>
              </div>
              <div>
                <span className="block text-gray-400 mb-1">Quarantine State</span>
                <span className="bg-gray-100 p-2 rounded block border text-gray-500">CLEAR</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT RAIL: DRAFT WORKBENCH */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
                <FileJson size={16} className="mr-2" /> Mirror Op Builder
              </h3>
              {activeDraft && (
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center border border-amber-200">
                  <Lock size={12} className="mr-1" /> Active Draft Lock (Rev {activeDraft.revision})
                </span>
              )}
            </div>

            {!activeDraft ? (
              <div className="space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Operation Type</label>
                    <select className="w-full p-2 border rounded font-mono text-sm" value={opType} onChange={(e) => setOpType(e.target.value as any)}>
                      <option value="ADD">ADD (New Mirror)</option>
                      <option value="REMOVE">REMOVE (Revoke/Retire)</option>
                      <option value="PROBATION">PROBATION</option>
                      <option value="QUARANTINE_LIFT_REQUEST">QUARANTINE_LIFT_REQUEST</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Reason Code</label>
                    <select className="w-full p-2 border rounded font-mono text-sm" value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
                      <option value="VOLUNTARY_RETIREMENT">Voluntary Retirement</option>
                      <option value="SERVING_CONFLICTING_STH">Serving Conflicting STH</option>
                      <option value="STALE_MIRROR">Stale Mirror / Offline</option>
                      <option value="OTHER">Other / New Admission</option>
                    </select>
                  </div>
                </div>

                {opType === "ADD" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Base URL</label>
                    <input type="text" className="w-full p-2 border rounded font-mono text-sm" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} />
                  </div>
                )}

                {(opType === "REMOVE" || opType === "QUARANTINE_LIFT_REQUEST") && (
                  <div className="bg-amber-50 text-amber-800 p-3 rounded border border-amber-200 text-xs font-bold flex items-center">
                    <AlertTriangle size={14} className="mr-2" />
                    This operation enforces a T2 (High Risk) timelock and requires explicit evidence references.
                  </div>
                )}
                
                <button onClick={handleCreateDraft} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded transition shadow-sm mt-4">
                  Initialize Mirror Operation Draft
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* DRAFT IDENTITY */}
                <div className={`rounded-lg p-5 text-white shadow-inner ${activeDraft.payload.op.riskClass === "HIGH" ? "bg-red-900" : "bg-gray-900"}`}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-xs uppercase tracking-widest text-gray-400">Deterministic DraftId</div>
                    <div className="text-xs font-mono bg-black text-white px-2 py-1 rounded">{activeDraft.payload.op.timelockClass} TIMELOCK</div>
                  </div>
                  <div className="font-mono text-sm text-green-400 break-all bg-black p-3 rounded border border-gray-800">{activeDraft.draftId}</div>
                  <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-xs font-mono">
                    <div className="flex items-center text-gray-400">
                      <ShieldAlert size={14} className="mr-2" /> Prev Directory Hash: {trunc(activeDraft.payload.directorySnapshot.currentDirectoryHash)}
                    </div>
                  </div>
                </div>

                {/* CLEAN ROOM PREVIEW */}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Clean Room JSON Payload</div>
                  <pre className="bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono text-xs overflow-x-auto text-gray-800 h-64">
                    {JSON.stringify(activeDraft.payload, null, 2)}
                  </pre>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-4 border-t border-gray-200 pt-6">
                  <button onClick={handleBumpRevision} className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-3 px-4 rounded transition flex justify-center items-center text-sm">
                    <RefreshCw size={16} className="mr-2" /> Bump Revision
                  </button>
                  <button className="flex-1 bg-teal-600 border border-teal-700 text-white hover:bg-teal-700 font-bold py-3 px-4 rounded transition flex justify-center items-center text-sm shadow-sm">
                    <Download size={16} className="mr-2" /> Export Proposal Bundle
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}