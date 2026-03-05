"use client";

import { useState, useEffect } from "react";
import { useOpsStore } from "../../../store/useOpsStore";
import { generateDraftId, generateSnapshotHash } from "../../../lib/crypto/draft-hasher";
import { BookOpen, ShieldAlert, FileJson, Lock, RefreshCw, Download, TerminalSquare, AlertTriangle, GitCompare } from "lucide-react";

export default function GovernanceWorkspace() {
  const { getActiveDraft, createDraft, supersedeDraft } = useOpsStore();

  const [isMounted, setIsMounted] = useState(false);
  const [policyDomain, setPolicyDomain] = useState("TRUST_CONTRACT_CORE");
  const [policyTarget, setPolicyTarget] = useState("global");
  const [riskClass, setRiskClass] = useState<"STANDARD" | "HIGH" | "EMERGENCY">("STANDARD");
  const [timelockClass, setTimelockClass] = useState<"T1" | "T2" | "T0">("T1");

  // Compound key for the active draft lock
  const targetId = `whenisdue.com::${policyDomain}::${policyTarget}`;
  const activeDraft = getActiveDraft(targetId, "GOVERNANCE_UPDATE");

  useEffect(() => { setIsMounted(true); }, []);
  if (!isMounted) return null;

  const handleCreateDraft = () => {
    // Generate a dummy machine-readable diff for the payload
    const dummyDiff = {
      fromPolicyPackHash: "sha256:current123...",
      toPolicyPackHash: "sha256:proposed456...",
      changes: [{ jsonPointer: "/policies/quorumPolicy/thresholdWeight", op: "replace", oldValue: 0.67, newValue: 0.75 }]
    };

    const payload = {
      schemaVersion: "1.0",
      draftType: "GOVERNANCE_UPDATE_EVENT",
      actionType: "GOVERNANCE_UPDATE",
      governanceUpdateId: crypto.randomUUID(), // In prod, use deterministic uuid-v5
      serviceId: "whenisdue.com",
      policyDomain,
      policyTarget,
      revision: 1,
      riskClass,
      policySnapshot: {
        currentPolicyPackRef: "/governance/policy-pack/v1.0.0.json",
        currentPolicyPackHash: "sha256:abcdef1234567890",
        currentPolicyVersion: "1.0.0"
      },
      changeSet: {
        changeType: "PATCH_POLICY_PACK",
        policyPatch: dummyDiff
      },
      activation: {
        effectiveNotBeforeUtc: new Date(Date.now() + 86400000 * (timelockClass === "T2" ? 7 : 1)).toISOString(), // T2 = 7 days, T1 = 1 day
        timelockClass,
        activationMode: "TIME_BASED"
      },
      compatibility: {
        minSupportedClientVersion: "1.0.0",
        requiresRebuildArtifacts: timelockClass === "T2"
      },
      constraints: {
        blockIfActiveRedConflict: riskClass !== "EMERGENCY",
        requiresHighTrustQuorum: timelockClass === "T2"
      },
      evidenceRefs: {
        rationaleRef: "ipfs://...",
        diffRef: "ipfs://..."
      },
      requiredSignersSnapshot: ["did:web:whenisdue.com:operator-1", "did:web:whenisdue.com:operator-2", "did:web:whenisdue.com:operator-3"],
      createdAtUtc: new Date().toISOString()
    };

    try {
      const draftId = generateDraftId(payload);
      createDraft(targetId, "GOVERNANCE_UPDATE", draftId, payload);
    } catch (err: any) {
      alert(`Gating Failure: ${err.message}`);
    }
  };

  const handleBumpRevision = () => {
    if (!activeDraft) return;
    const newPayload = { ...activeDraft.payload, revision: activeDraft.revision + 1, createdAtUtc: new Date().toISOString() };
    try {
      const newDraftId = generateDraftId(newPayload);
      supersedeDraft(targetId, "GOVERNANCE_UPDATE", newDraftId, newPayload);
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
            <div className="flex items-center text-xs font-bold text-purple-600 uppercase tracking-widest mb-2">
              <BookOpen size={14} className="mr-1" /> Governance Protocol
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Policy Editor Workspace</h1>
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
        {/* LEFT RAIL: SNAPSHOT BINDING */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center">
              <ShieldAlert size={16} className="mr-2 text-purple-500" /> Current Policy Snapshot
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Approvals are cryptographically bound to this exact policy state. Any drift invalidates the draft.
            </p>
            <div className="space-y-4 font-mono text-xs">
              <div>
                <span className="block text-gray-400 mb-1">Active Version</span>
                <span className="bg-purple-50 text-purple-800 font-bold px-2 py-1 rounded border border-purple-100">v1.0.0</span>
              </div>
              <div>
                <span className="block text-gray-400 mb-1">PolicyPack Hash</span>
                <span className="break-all bg-gray-100 p-2 rounded block border">{trunc("sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT RAIL: DRAFT WORKBENCH */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
                <FileJson size={16} className="mr-2" /> Governance Draft Builder
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
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Policy Domain</label>
                    <select className="w-full p-2 border rounded font-mono text-sm" value={policyDomain} onChange={(e) => setPolicyDomain(e.target.value)}>
                      <option value="TRUST_CONTRACT_CORE">TRUST_CONTRACT_CORE</option>
                      <option value="QUORUM_POLICY">QUORUM_POLICY</option>
                      <option value="AEO_POLICY">AEO_POLICY</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Timelock Class</label>
                    <select className="w-full p-2 border rounded font-mono text-sm" value={timelockClass} onChange={(e) => setTimelockClass(e.target.value as any)}>
                      <option value="T1">T1 (Standard - 24h)</option>
                      <option value="T2">T2 (High Risk - 7 Days)</option>
                      <option value="T0">T0 (Emergency Override)</option>
                    </select>
                  </div>
                </div>

                {timelockClass === "T2" && (
                  <div className="bg-amber-50 text-amber-800 p-3 rounded border border-amber-200 text-xs font-bold flex items-center">
                    <AlertTriangle size={14} className="mr-2" />
                    T2 Requires High-Trust Quorum and triggers automated artifact rebuilds.
                  </div>
                )}
                
                <button onClick={handleCreateDraft} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded transition shadow-sm mt-4">
                  Initialize Governance Draft
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* DRAFT IDENTITY */}
                <div className={`rounded-lg p-5 text-white shadow-inner ${activeDraft.payload.riskClass === "EMERGENCY" ? "bg-red-900" : "bg-gray-900"}`}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-xs uppercase tracking-widest text-gray-400">Deterministic DraftId</div>
                    <div className="text-xs font-mono bg-black text-white px-2 py-1 rounded">{activeDraft.payload.activation.timelockClass} TIMELOCK</div>
                  </div>
                  <div className="font-mono text-sm text-green-400 break-all bg-black p-3 rounded border border-gray-800">{activeDraft.draftId}</div>
                  <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-xs font-mono">
                    <div className="flex items-center text-gray-400">
                      <GitCompare size={14} className="mr-2" /> Diff Ref: {trunc(activeDraft.payload.evidenceRefs.diffRef)}
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
                  <button className="flex-1 bg-purple-600 border border-purple-700 text-white hover:bg-purple-700 font-bold py-3 px-4 rounded transition flex justify-center items-center text-sm shadow-sm">
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