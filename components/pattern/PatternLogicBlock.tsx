import React from 'react';

interface PatternLogicBlockProps {
  statusKind: 'confirmed' | 'expected' | 'rumor';
  confidenceScore?: number;
  patternReasoning?: string;
}

const PatternLogicBlock: React.FC<PatternLogicBlockProps> = ({
  statusKind,
  confidenceScore,
  patternReasoning,
}) => {
  // Return null if status is confirmed or if no data is provided
  if (statusKind === 'confirmed') return null;
  if (confidenceScore === undefined && !patternReasoning) return null;

  const subtext = statusKind === 'expected' 
    ? 'Why this date is expected' 
    : 'Unverified estimate';

  const formattedScore = confidenceScore !== undefined 
    ? `${Math.min(100, Math.max(0, Math.round(confidenceScore)))}%` 
    : '--';

  return (
    <div className="p-3 rounded-lg border border-white/10 bg-white/[0.03] space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium opacity-90">Reasoning</span>
          <span className="text-[11px] opacity-50 leading-tight">
            {subtext}
          </span>
        </div>
        <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono font-medium opacity-80 whitespace-nowrap">
          Confidence: {formattedScore}
        </div>
      </div>
      
      {patternReasoning && (
        <p className="text-sm opacity-70 leading-relaxed">
          {patternReasoning}
        </p>
      )}
    </div>
  );
};

export default PatternLogicBlock;