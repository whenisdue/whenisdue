"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle, ArrowRightLeft, Clock, ExternalLink, UserCheck, Server } from "lucide-react";
import { format } from "date-fns";
import { fetchServerTruthAtPIT } from "@/app/admin/audit/actions";

type RuleStatus = 'DRAFT' | 'REVIEWED' | 'VERIFIED' | 'ACTIVE' | 'SUPERSEDED';

interface VersionNode {
  id: string;
  versionNumber: number;
  status: RuleStatus;
  recordedFrom: string;
  recordedTo: string | null;
  validFrom: string;
  validTo: string | null;
  changeReason: string;
  verifiedBy: string;
  sourceAuthority: string;
  sourceUrl: string;
  eventCount: number;
  identifierKind: string;
  holidayPolicy: string;
  issuanceWindow: string;
}

interface Props {
  stateCode: string;
  programCode: string;
  lineage: VersionNode[];
}

// Helper to get local time formatted for datetime-local input
const getLocalDatetime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

export default function BitemporalAuditController({ stateCode, programCode, lineage }: Props) {
  // Auditor Polish: Initialized with local time instead of UTC
  const [asOfSystemDate, setAsOfSystemDate] = useState<string>(getLocalDatetime());
  const [serverTruth, setServerTruth] = useState<{ status: 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR', data?: string } | null>(null);
  
  // Safe Selection State
  const [selectedId, setSelectedId] = useState<string | null>(lineage.length > 0 ? (lineage.find(v => v.status === 'ACTIVE')?.id || lineage[0].id) : null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [isDiffMode, setIsDiffMode] = useState(false);

  // Empty State Guard
  if (lineage.length === 0 || !selectedId) {
    return (
      <div className="p-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
        <p className="text-slate-400 font-bold">No version lineage found for this identity.</p>
      </div>
    );
  }

  const selected = lineage.find(v => v.id === selectedId);
  const comparison = compareId ? lineage.find(v => v.id === compareId) : null;

  // Fallback if state gets corrupted
  if (!selected) return null;

  // Server-Backed PIT Fetch
  const handleVerifyTruth = async () => {
    setServerTruth({ status: 'LOADING' });
    const res = await fetchServerTruthAtPIT(stateCode, programCode, asOfSystemDate);
    
    if (res.type === 'TRUTH_FOUND') {
      setServerTruth({ status: 'SUCCESS', data: `Version ${res.versionNumber} (${res.status})` });
    } else {
      setServerTruth({ status: 'ERROR', data: res.message });
    }
  };

  // Expanded Diff Payload Map
  const diffFields = [
    { label: 'Identifier Kind', key: 'identifierKind' as const },
    { label: 'Issuance Window', key: 'issuanceWindow' as const },
    { label: 'Holiday Policy', key: 'holidayPolicy' as const },
    { label: 'Source Authority', key: 'sourceAuthority' as const },
    { label: 'Verified By', key: 'verifiedBy' as const },
    { label: 'Change Reason', key: 'changeReason' as const },
    { 
      label: 'Valid From', 
      key: 'validFrom' as const, 
      formatFn: (val: string) => format(new Date(val), 'MMM d, yyyy') 
    },
    { 
      label: 'Valid To', 
      key: 'validTo' as const, 
      formatFn: (val: string | null) => val ? format(new Date(val), 'MMM d, yyyy') : 'Indefinite' 
    }
  ];

  return (
    <div className="flex flex-col gap-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
      
      {/* GLOBAL AS-OF CONTROL BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><Clock className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">System Audit Clock (Recorded Time)</p>
            <input 
              type="datetime-local" 
              value={asOfSystemDate}
              onChange={(e) => { setAsOfSystemDate(e.target.value); setServerTruth(null); }}
              className="text-sm font-bold text-slate-900 focus:outline-none cursor-pointer border-b border-dashed border-slate-300 pb-0.5"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {serverTruth?.status === 'SUCCESS' && (
            <p className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Server Truth: {serverTruth.data}
            </p>
          )}
          {serverTruth?.status === 'ERROR' && (
            <p className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {serverTruth.data}
            </p>
          )}
          <button 
            onClick={handleVerifyTruth}
            disabled={serverTruth?.status === 'LOADING'}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 disabled:opacity-50"
          >
            <Server className="w-4 h-4" /> Verify DB Truth
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LINEAGE RAIL */}
        <div className="col-span-4 space-y-4">
          <div className="relative pl-4">
            <div className="absolute left-[31px] top-4 bottom-4 w-0.5 bg-slate-200" />
            <div className="space-y-6 relative">
              {lineage.map((v) => (
                <div key={v.id} className="flex items-center gap-3">
                  <button
                    onClick={() => { setSelectedId(v.id); setIsDiffMode(false); }}
                    className={`z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 border-slate-50 shadow-md transition-all ${
                      selectedId === v.id ? 'scale-110 ring-2 ring-blue-500' : ''
                    } ${v.status === 'ACTIVE' ? 'bg-green-500' : v.status === 'DRAFT' ? 'bg-amber-500' : 'bg-slate-300'}`}
                  >
                    <span className="text-white text-[10px] font-black">v{v.versionNumber}</span>
                  </button>
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-800 leading-none">{v.status}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{format(new Date(v.recordedFrom), 'MMM d, yyyy')}</p>
                  </div>
                  {selectedId !== v.id && (
                    <button 
                      onClick={() => { setCompareId(v.id); setIsDiffMode(true); }}
                      className="text-[10px] font-black text-blue-600 uppercase hover:underline"
                    >
                      Compare
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* INSPECTOR / DIFF PANEL */}
        <div className="col-span-8 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden min-h-[500px]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <h3 className="text-xl font-black text-slate-900">
              {isDiffMode ? `Diff: v${comparison?.versionNumber} vs v${selected.versionNumber}` : `Inspector: Version ${selected.versionNumber}`}
            </h3>
            {isDiffMode && <button onClick={() => setIsDiffMode(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Exit Diff</button>}
          </div>

          <div className="p-6 space-y-6">
            {!isDiffMode && (
              <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Source Authority</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{selected.sourceAuthority}</span>
                    <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Change Reason</p>
                  <p className="text-sm font-bold text-slate-700 italic">"{selected.changeReason || "Initial version"}"</p>
                </div>
              </div>
            )}

            {/* DYNAMIC DIFF VIEW */}
            <div className="space-y-3">
               {diffFields.map(field => {
                 const selectedVal = field.formatFn ? field.formatFn(selected[field.key] as string) : String(selected[field.key] || '');
                 const compareVal = comparison ? (field.formatFn ? field.formatFn(comparison[field.key] as string) : String(comparison[field.key] || '')) : null;
                 const hasChanged = isDiffMode && comparison && selectedVal !== compareVal;

                 return (
                   <div key={field.key} className={`flex items-center justify-between p-3 rounded-xl border ${hasChanged ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                     <span className="text-xs font-black text-slate-400 uppercase w-1/3">{field.label}</span>
                     <div className="flex items-center gap-3 justify-end w-2/3 text-right">
                       {hasChanged && (
                         <>
                           <span className="text-sm font-bold text-red-500 line-through">{compareVal}</span>
                           <ArrowRightLeft className="w-3 h-3 text-slate-300" />
                         </>
                       )}
                       <span className={`text-sm font-bold ${hasChanged ? 'text-green-600' : 'text-slate-900'}`}>
                          {selectedVal}
                       </span>
                     </div>
                   </div>
                 );
               })}
            </div>

            {/* AUDIT METADATA */}
            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Verified By</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <UserCheck className="w-3 h-3 text-green-500" />
                  <span className="text-xs font-bold text-slate-700">{selected.verifiedBy || "System Admin"}</span>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Outputs Generated</p>
                <p className="text-xs font-bold text-slate-700 mt-1">{selected.eventCount} Events recorded</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}