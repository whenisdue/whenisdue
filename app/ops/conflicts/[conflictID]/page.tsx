"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useOpsStore } from "../../../../store/useOpsStore";
import { generateDraftId, generateSnapshotHash } from "../../../../lib/crypto/draft-hasher";
import { 
  ShieldAlert, FileJson, Lock, RefreshCw, 
  Download, FileWarning, TerminalSquare, Key 
} from "lucide-react";

export default function ConflictTriageWorkspace() {
  const params = useParams();
  const conflictId = params.conflictId as string;

  // Zustand Store
  const { getActiveDraft, createDraft, supersedeDraft, cancelDraft } = useOpsStore();
  const activeDraft = getActiveDraft(conflictId, "CONFLICT_RESOLUTION");

  // Local UI State
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null; // Prevent hydration mismatch

  // --- Handlers ---

  const handleCreateDraft = () => {
    const requiredSigners = ["did:web:whenisdue.com:operator-1", "did:web:whenisdue.com:operator-2"];
    const payload = {
      schemaVersion: "1.0",
      draftType: "RESOLUTION_EVENT",
      actionType: "CONFLICT_RESOLUTION",
      conflictId,
      revision: 1,
      createdAtUtc: new Date().toISOString(),
      policyVersion: "v1.0.0",
      requiredSignersSnapshot: requiredSigners,
      resolutionPlan: {
        resolutionType: "BRANCH_REJECTED",
        decision: {
          reasonCode: "EQUIVOCATION_CONFIRMED",
          notes: "Triage initialized. Awaiting evidence review and operator consensus."
        }
      }
    };

    try {
      const draftId = generateDraftId(payload);
      createDraft(conflictId, "CONFLICT_RESOLUTION", draftId, payload);
    } catch (err: any) {
      alert(`Gating Failure: ${err.message}`);
    }
  };

  const handleBumpRevision = () => {
    if (!activeDraft) return;

    const newPayload = { 
      ...activeDraft.payload, 
      revision: activeDraft.revision + 1,
      createdAtUtc: new Date().toISOString()
    };

    try {
      const newDraftId = generateDraftId(newPayload);
      supersedeDraft(conflictId, "CONFLICT_RESOLUTION", newDraftId, newPayload);
    } catch (err: any) {
      alert(`Gating Failure: ${err.message}`);
    }
  };

  // --- UI Helpers ---
  const trunc = (s?: string) => s ? `${s.slice(0, 16)}...${s.slice(-8)}` : "N/A";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12 font-sans">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 pt-8 pb-6 px-6 mb-8">
        <div className="max-w-6xl mx-auto flex justify-between items-end">
          <div>
            <div className="flex items-center text-xs font-bold text-red-600 uppercase tracking-widest mb-2">
              <ShieldAlert size={14} className="mr-1" /> Active RED Conflict
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Triage Workspace
            </h1>
            <div className="flex items-center gap-4 text-sm font-mono mt-2 text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">ID: {conflictId}</span>
            </div>
          </div>
          <div className="text-xs font-mono bg-gray-900 text-green-400 px-3 py-2 rounded flex items-center shadow-inner">
            <TerminalSquare size={14} className="mr-2" />
            Sterile Mode: Active
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT RAIL: EVIDENCE */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center">
              <FileWarning size={16} className="mr-2 text-amber-500" /> Immutable Evidence
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              This data is fetched statically from the public registry. It cannot be altered by operators.
            </p>
            <div className="space-y-4 font-mono text-xs">
              <div>
                <span className="block text-gray-400 mb-1">Conflict Type</span>
                <span className="bg-red-50 text-red-800 font-bold px-2 py-1 rounded border border-red-100">EQUIVOCATION</span>
              </div>
              <div>
                <span className="block text-gray-400 mb-1">STH A (Root Hash)</span>
                <span className="break-all bg-gray-100 p-2 rounded block border">{trunc("sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")}</span>
              </div>
              <div>
                <span className="block text-gray-400 mb-1">STH B (Root Hash)</span>
                <span className="break-all bg-gray-100 p-2 rounded block border">{trunc("sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT RAIL: DRAFT WORKBENCH */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
                <FileJson size={16} className="mr-2" /> Resolution Workbench
              </h3>
              {activeDraft && (
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center border border-amber-200">
                  <Lock size={12} className="mr-1" /> Active Draft Lock (Rev {activeDraft.revision})
                </span>
              )}
            </div>

            {!activeDraft ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-500 mb-4">No active resolution draft exists for this conflict.</p>
                <button 
                  onClick={handleCreateDraft}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition shadow-sm"
                >
                  Create Resolution Draft
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* DRAFT IDENTITY */}
                <div className="bg-gray-900 rounded-lg p-5 text-white shadow-inner">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-xs uppercase tracking-widest text-gray-400">Deterministic DraftId</div>
                    <div className="text-xs font-mono bg-gray-800 text-gray-300 px-2 py-1 rounded">RFC 8785 (JCS)</div>
                  </div>
                  <div className="font-mono text-sm text-green-400 break-all bg-black p-3 rounded border border-gray-800">
                    {activeDraft.draftId}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-xs font-mono">
                    <div className="flex items-center text-gray-400">
                      <Key size={14} className="mr-2" /> 
                      SnapshotHash: {trunc(generateSnapshotHash(activeDraft.payload.requiredSignersSnapshot))}
                    </div>
                    <div className="text-gray-500">UTC: {activeDraft.createdAtUtc}</div>
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
                  <button 
                    onClick={handleBumpRevision}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-3 px-4 rounded transition flex justify-center items-center text-sm"
                  >
                    <RefreshCw size={16} className="mr-2" /> Bump Revision
                  </button>
                  <button 
                    className="flex-1 bg-blue-600 border border-blue-700 text-white hover:bg-blue-700 font-bold py-3 px-4 rounded transition flex justify-center items-center text-sm shadow-sm"
                  >
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