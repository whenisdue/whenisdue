"use client";

import { useState, useEffect } from "react";
import { useOpsStore } from "../../../store/useOpsStore";
import { generateDraftId, generateSnapshotHash } from "../../../lib/crypto/draft-hasher";
import { Users, ShieldAlert, FileJson, Lock, RefreshCw, Download, TerminalSquare, Server, AlertTriangle, Network } from "lucide-react";

export default function WitnessOpsWorkspace() {
  const { getActiveDraft, createDraft, supersedeDraft } = useOpsStore();

  const [isMounted, setIsMounted] = useState(false);
  const [opType, setOpType] = useState<"ADD" | "REMOVE" | "PROBATION" | "REINSTATE">("ADD");
  const [targetWitnessId, setTargetWitnessId] = useState("");
  const [reasonCode, setReasonCode] = useState("POLICY_NONCOMPLIANCE");
  const [asn, setAsn] = useState("");
  const [provider, setProvider] = useState("");

  // Compound key for the active draft lock
  const targetId = `whenisdue.com::WITNESS_SET_CHANGE::${targetWitnessId || "new"}`;
  const activeDraft = getActiveDraft(targetId, "WITNESS_SET_CHANGE");

  useEffect(() => { setIsMounted(true); }, []);
  if (!isMounted) return null;

  const handleCreateDraft = () => {
    if (!targetWitnessId) {
      alert("Target Witness ID is required.");
      return;
    }

    // Dummy computation for diversity caps
    const proposedWeight = opType === "ADD" ? 1.0 : (opType === "PROBATION" ? 0.1 : 0.0);
    const diversitySummary = {
      totalEligibleWeight: 4.5,
      byAsn: [{ asn: asn || "AS12345", weight: proposedWeight, cap: 0.20, status: proposedWeight / 4.5 > 0.20 ? "FAIL" : "PASS" }],
      byProvider: [{ provider: provider || "AWS", weight: proposedWeight, cap: 0.20, status: proposedWeight / 4.5 > 0.20 ? "FAIL" : "PASS" }]
    };

    const payload = {
      schemaVersion: "1.0",
      draftType: "WITNESS_OP_EVENT",
      actionType: "WITNESS_SET_CHANGE",
      witnessOpId: crypto.randomUUID(),
      serviceId: "whenisdue.com",
      revision: 1,
      policySnapshot: {
        currentPolicyPackRef: "/governance/policy-pack/v1.0.0.json",
        currentPolicyPackHash: "sha256:abcdef1234567890",
        currentPolicyVersion: "1.0.0"
      },
      directorySnapshot: {
        currentDirectoryRef: "/witness/directory/v42.json",
        currentDirectoryHash: "sha256:0987654321fedcba",
        currentDirectoryVersion: "v42"
      },
      op: {
        opType,
        targetWitnessId,
        reasonCode,
        riskClass: opType === "REMOVE" ? "HIGH" : "STANDARD",
        timelockClass: opType === "REMOVE" ? "T2" : "T1",
        effectiveNotBeforeUtc: new Date(Date.now() + 86400000).toISOString(),
        proposedDirectoryPatch: {
          statusChange: opType === "REMOVE" ? "REVOKED" : (opType === "PROBATION" ? "PROBATION" : "ACTIVE"),
          metadata: { asn, provider }
        },
        diversityComputationInputs: diversitySummary,
        evidenceRefs: ["ipfs://evidence-bundle-hash"],
        diffRef: "ipfs://machine-readable-diff"
      },
      requiredSignersSnapshot: ["did:web:whenisdue.com:operator-1", "did:web:whenisdue.com:operator-2"],
      createdAtUtc: new Date().toISOString()
    };

    try {
      const draftId = generateDraftId(payload);
      createDraft(targetId, "WITNESS_SET_CHANGE", draftId, payload);
    } catch (err: any) {
      alert(`Gating Failure: ${err.message}`);
    }
  };

  const handleBumpRevision = () => {
    if (!activeDraft) return;
    const newPayload = { ...activeDraft.payload, revision: activeDraft.revision + 1, createdAtUtc: new Date().toISOString() };
    try {
      const newDraftId = generateDraftId(newPayload);
      supersedeDraft(targetId, "WITNESS_SET_CHANGE", newDraftId, newPayload);
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
            <div className="flex items-center text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">
              <Users size={14} className="mr-1" /> Witness Network Operations
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Registry Editor Workspace</h1>
            <div className="flex items-center gap-4 text-sm font-mono mt-2 text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">Target: {targetId}</span>
            </div>
          </div>
          <div className="text-xs font-mono bg-gray-900 text-green-400 px-3 py-2 rounded flex items-center shadow-inner">
            <TerminalSquare size={14} className="mr-2" /> Sterile Mode: Active
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT RAIL: DIVERSITY CAPS */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center">
              <Network size={16} className="mr-2 text-indigo-500" /> Current Diversity Caps
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Changes that cause ASN or Provider concentration to exceed 20% total network weight will be blocked by the gatekeeper.
            </p>
            <div className="space-y-4 font-mono text-xs">
              <div>
                <span className="block text-gray-400 mb-1">Max Weight Per ASN</span>
                <span className="bg-indigo-50 text-indigo-800 font-bold px-2 py-1 rounded border border-indigo-100">20.00%</span>
              </div>
              <div>
                <span className="block text-gray-400 mb-1">Max Weight Per Provider</span>
                <span className="bg-indigo-50 text-indigo-800 font-bold px-2 py-1 rounded border border-indigo-100">20.00%</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT RAIL: DRAFT WORKBENCH */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
                <FileJson size={16} className="mr-2" /> Witness Op Builder
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
                      <option value="ADD">ADD (New Witness)</option>
                      <option value="REMOVE">REMOVE (Revoke/Retire)</option>
                      <option value="PROBATION">PROBATION (Cap Weight)</option>
                      <option value="REINSTATE">REINSTATE (Restore Active)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Reason Code</label>
                    <select className="w-full p-2 border rounded font-mono text-sm" value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
                      <option value="POLICY_NONCOMPLIANCE">Policy Noncompliance</option>
                      <option value="UNRESPONSIVE">Unresponsive / Offline</option>
                      <option value="DOUBLE_SIGNING">Double Signing (Equivocation)</option>
                      <option value="VOLUNTARY_RETIREMENT">Voluntary Retirement</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Target Witness ID</label>
                  <input type="text" className="w-full p-2 border rounded font-mono text-sm" placeholder="did:web:witness-1.whenisdue.com" value={targetWitnessId} onChange={e => setTargetWitnessId(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">ASN (e.g. AS16509)</label>
                    <input type="text" className="w-full p-2 border rounded font-mono text-sm" placeholder="AS..." value={asn} onChange={e => setAsn(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Provider (e.g. AWS)</label>
                    <input type="text" className="w-full p-2 border rounded font-mono text-sm" placeholder="Provider Name" value={provider} onChange={e => setProvider(e.target.value)} />
                  </div>
                </div>

                {opType === "REMOVE" && (
                  <div className="bg-red-50 text-red-800 p-3 rounded border border-red-200 text-xs font-bold flex items-center">
                    <AlertTriangle size={14} className="mr-2" />
                    REMOVE operations enforce T2 (High Risk) timelocks and require Immutable Evidence Refs.
                  </div>
                )}
                
                <button onClick={handleCreateDraft} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded transition shadow-sm mt-4">
                  Initialize Witness Operation Draft
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

                {/* DIVERSITY PREVIEW */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">Pre-Publish Diversity Computation</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div className="bg-white p-2 border border-indigo-100 rounded">
                      <span className="block text-gray-500 mb-1">ASN Impact</span>
                      <span className={activeDraft.payload.op.diversityComputationInputs.byAsn[0].status === "PASS" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                        {activeDraft.payload.op.diversityComputationInputs.byAsn[0].status} (Cap: {activeDraft.payload.op.diversityComputationInputs.byAsn[0].cap})
                      </span>
                    </div>
                    <div className="bg-white p-2 border border-indigo-100 rounded">
                      <span className="block text-gray-500 mb-1">Provider Impact</span>
                      <span className={activeDraft.payload.op.diversityComputationInputs.byProvider[0].status === "PASS" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                        {activeDraft.payload.op.diversityComputationInputs.byProvider[0].status} (Cap: {activeDraft.payload.op.diversityComputationInputs.byProvider[0].cap})
                      </span>
                    </div>
                  </div>
                </div>

                {/* CLEAN ROOM PREVIEW */}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Clean Room JSON Payload</div>
                  <pre className="bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono text-xs overflow-x-auto text-gray-800 h-48">
                    {JSON.stringify(activeDraft.payload, null, 2)}
                  </pre>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-4 border-t border-gray-200 pt-6">
                  <button onClick={handleBumpRevision} className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-3 px-4 rounded transition flex justify-center items-center text-sm">
                    <RefreshCw size={16} className="mr-2" /> Bump Revision
                  </button>
                  <button className="flex-1 bg-indigo-600 border border-indigo-700 text-white hover:bg-indigo-700 font-bold py-3 px-4 rounded transition flex justify-center items-center text-sm shadow-sm">
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