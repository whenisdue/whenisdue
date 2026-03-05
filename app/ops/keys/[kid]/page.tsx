"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useOpsStore } from "../../../../store/useOpsStore";
import { generateDraftId, generateSnapshotHash } from "../../../../lib/crypto/draft-hasher";
import { Key, ShieldAlert, FileJson, Lock, RefreshCw, Download, FileWarning, TerminalSquare, Upload } from "lucide-react";

export default function KeyRotationWorkspace() {
  const params = useParams();
  const kid = params.kid as string; // The ID of the key being rotated

  const { getActiveDraft, createDraft, supersedeDraft } = useOpsStore();
  const activeDraft = getActiveDraft(kid, "KEY_ROTATION");

  const [isMounted, setIsMounted] = useState(false);
  const [newKid, setNewKid] = useState("");
  const [newPubKey, setNewPubKey] = useState("");
  const [continuityType, setContinuityType] = useState<"CONTINUITY_PROOF" | "RECOVERY_ROTATION">("CONTINUITY_PROOF");

  useEffect(() => { setIsMounted(true); }, []);
  if (!isMounted) return null;

  const handleCreateDraft = () => {
    if (!newKid || !newPubKey) {
      alert("Validation Error: New Key ID and Public Key are required.");
      return;
    }

    const payload = {
      schemaVersion: "1.0",
      draftType: "KEY_ROTATION_EVENT",
      actionType: "KEY_ROTATION",
      policyVersion: "v1.0.0",
      revision: 1,
      riskClass: continuityType === "RECOVERY_ROTATION" ? "EMERGENCY" : "STANDARD",
      scope: {
        serviceId: "whenisdue.com/hub",
        keyPurpose: "HUB_SIGNING_KEY",
        keyId: kid
      },
      currentKey: {
        kid: kid,
        alg: "Ed25519"
      },
      newKey: {
        kid: newKid,
        publicKey: newPubKey,
        alg: "Ed25519"
      },
      continuity: {
        continuityType: continuityType,
        continuityProofRef: continuityType === "CONTINUITY_PROOF" ? "pending-upload" : undefined,
        recoveryJustificationRef: continuityType === "RECOVERY_ROTATION" ? "incident-123" : undefined
      },
      effective: {
        effectiveNotBeforeUtc: new Date(Date.now() + 86400000).toISOString(), // +24 hours
        recommendedGracePeriodHours: 48
      },
      requiredSignersSnapshot: ["did:web:whenisdue.com:operator-1", "did:web:whenisdue.com:operator-2"],
      createdAtUtc: new Date().toISOString()
    };

    try {
      const draftId = generateDraftId(payload);
      createDraft(kid, "KEY_ROTATION", draftId, payload);
    } catch (err: any) {
      alert(`Gating Failure: ${err.message}`);
    }
  };

  const handleBumpRevision = () => {
    if (!activeDraft) return;
    const newPayload = { ...activeDraft.payload, revision: activeDraft.revision + 1, createdAtUtc: new Date().toISOString() };
    try {
      const newDraftId = generateDraftId(newPayload);
      supersedeDraft(kid, "KEY_ROTATION", newDraftId, newPayload);
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
            <div className="flex items-center text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">
              <Key size={14} className="mr-1" /> Key Rotation Ceremony
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Rotation Workspace</h1>
            <div className="flex items-center gap-4 text-sm font-mono mt-2 text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">Target KID: {kid}</span>
            </div>
          </div>
          <div className="text-xs font-mono bg-gray-900 text-green-400 px-3 py-2 rounded flex items-center shadow-inner">
            <TerminalSquare size={14} className="mr-2" /> Sterile Mode: Active
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT RAIL: TARGET KEY INFO */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center">
              <FileWarning size={16} className="mr-2 text-blue-500" /> Current Key Policy
            </h3>
            <div className="space-y-4 font-mono text-xs">
              <div>
                <span className="block text-gray-400 mb-1">Key Purpose</span>
                <span className="bg-blue-50 text-blue-800 font-bold px-2 py-1 rounded border border-blue-100">HUB_SIGNING_KEY</span>
              </div>
              <div>
                <span className="block text-gray-400 mb-1">Algorithm</span>
                <span className="bg-gray-100 p-2 rounded block border">Ed25519</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT RAIL: DRAFT WORKBENCH */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
                <FileJson size={16} className="mr-2" /> Rotation Draft Builder
              </h3>
              {activeDraft && (
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center border border-amber-200">
                  <Lock size={12} className="mr-1" /> Active Draft Lock (Rev {activeDraft.revision})
                </span>
              )}
            </div>

            {!activeDraft ? (
              <div className="space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Continuity Strategy</label>
                  <select 
                    className="w-full p-2 border rounded font-mono text-sm"
                    value={continuityType} onChange={(e) => setContinuityType(e.target.value as any)}
                  >
                    <option value="CONTINUITY_PROOF">Standard (Old Key Signs New Key)</option>
                    <option value="RECOVERY_ROTATION">Emergency (Key Compromised / Lost)</option>
                  </select>
                </div>
                {continuityType === "RECOVERY_ROTATION" && (
                  <div className="bg-red-50 text-red-800 p-3 rounded border border-red-200 text-xs font-bold flex items-center">
                    <ShieldAlert size={14} className="mr-2" />
                    WARNING: Recovery rotations require elevated Custodian approval thresholds.
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">New Key ID (KID)</label>
                  <input type="text" className="w-full p-2 border rounded font-mono text-sm" placeholder="e.g. hub-key-v2" value={newKid} onChange={e => setNewKid(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">New Public Key (Hex/Base64)</label>
                  <input type="text" className="w-full p-2 border rounded font-mono text-sm" placeholder="Paste Ed25519 public key..." value={newPubKey} onChange={e => setNewPubKey(e.target.value)} />
                </div>
                <button onClick={handleCreateDraft} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition shadow-sm mt-4">
                  Initialize Rotation Draft
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* DRAFT IDENTITY */}
                <div className={`rounded-lg p-5 text-white shadow-inner ${activeDraft.payload.riskClass === "EMERGENCY" ? "bg-red-900" : "bg-gray-900"}`}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-xs uppercase tracking-widest text-gray-400">Deterministic DraftId</div>
                    <div className="text-xs font-mono bg-black text-white px-2 py-1 rounded">{activeDraft.payload.riskClass} CLASS</div>
                  </div>
                  <div className="font-mono text-sm text-green-400 break-all bg-black p-3 rounded border border-gray-800">{activeDraft.draftId}</div>
                  <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-xs font-mono">
                    <div className="flex items-center text-gray-400">
                      <Key size={14} className="mr-2" /> SnapshotHash: {trunc(generateSnapshotHash(activeDraft.payload.requiredSignersSnapshot))}
                    </div>
                  </div>
                </div>

                {/* CONTINUITY UPLOAD */}
                {activeDraft.payload.continuity.continuityType === "CONTINUITY_PROOF" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-bold text-blue-900">Upload Continuity Proof</div>
                      <div className="text-xs text-blue-700 font-mono mt-1">Required: Signature from {kid}</div>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold flex items-center hover:bg-blue-700">
                      <Upload size={14} className="mr-2"/> Import .cose
                    </button>
                  </div>
                )}

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
                  <button className="flex-1 bg-blue-600 border border-blue-700 text-white hover:bg-blue-700 font-bold py-3 px-4 rounded transition flex justify-center items-center text-sm shadow-sm">
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