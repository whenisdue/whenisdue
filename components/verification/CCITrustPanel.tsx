import { ShieldCheck, Info } from "lucide-react";

interface CCITrustProps {
  score: number; // 0.0 to 1.0
  programName: string;
  sourceUrl?: string;
}

export default function CCITrustPanel({ score, programName, sourceUrl }: CCITrustProps) {
  const percentage = Math.round(score * 100);
  
  // Dynamic color grading based on the score
  const getStatusColor = (s: number) => {
    if (s >= 0.95) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/5";
    if (s >= 0.85) return "text-amber-400 border-amber-500/30 bg-amber-500/5";
    return "text-slate-400 border-slate-500/30 bg-slate-500/5";
  };

  return (
    <div className={`mt-8 rounded-2xl border p-5 ${getStatusColor(score)}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          <span className="font-bold uppercase tracking-widest text-xs">Cadence Confidence Index</span>
        </div>
        <div className="text-2xl font-black">{percentage}%</div>
      </div>
      
      <p className="text-sm leading-relaxed opacity-90">
        This {programName} schedule is derived using the <strong>WhenIsDue Authority Engine</strong>. 
        Our {percentage}% confidence score is based on {score > 0.9 ? "deterministic federal statutes" : "historical pattern matching"} 
        and verified {sourceUrl ? "against official .gov publications" : "using cadence stability analysis"}.
      </p>

      {sourceUrl && (
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
          <Info className="w-4 h-4 opacity-60" />
          <a href={sourceUrl} target="_blank" className="text-xs underline opacity-60 hover:opacity-100 transition-opacity">
            View Official Source (.gov)
          </a>
        </div>
      )}
    </div>
  );
}