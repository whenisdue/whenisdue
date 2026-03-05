import React from 'react';
import type { CciResult } from '../../lib/patternAggregation';

export type HistoricalPatternData = {
  totalOccurrences: number;
  mostCommonMonth: string;
  monthFrequency: string;
  typicalWindow: string;
  cci?: CciResult;
};

interface HistoricalPatternBlockProps {
  data: HistoricalPatternData | null;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const safeNum = (n: number | undefined, decimals = 0) => {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '--';
  return n.toFixed(decimals);
};

const HistoricalPatternBlock: React.FC<HistoricalPatternBlockProps> = ({ data }) => {
  if (!data) return null;

  const { cci } = data;
  const showCci = cci && cci.eligible;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm">
      <div className="font-medium opacity-90 mb-2">Historical Cadence</div>
      <ul className="space-y-1 opacity-80 list-disc pl-4 marker:text-white/30">
        <li>Occurred {data.totalOccurrences} times in verified history</li>
        <li>
          Most common month: {data.mostCommonMonth} ({data.monthFrequency} cycles)
        </li>
        <li>Typical window: {data.typicalWindow}</li>
      </ul>

      {showCci && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium opacity-60 uppercase tracking-wide">
                CCI
              </span>
              <span className="font-mono text-sm font-medium opacity-90">
                {safeNum(cci.cci, 2)}
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 bg-white/5 opacity-80">
              {cci.tier}
            </span>
          </div>

          <div className="space-y-1 text-xs opacity-70">
            <div>
              Based on {cci.cycleCount} historical cycles
              {cci.lowEvidence && <span className="opacity-60"> • low evidence</span>}
            </div>
            <div>
              Most common month: {MONTH_NAMES[cci.topMonth] ?? '--'} ({safeNum(cci.concentration * 100, 0)}%)
            </div>
            <div>
              Typical window: {safeNum(cci.windowDays, 1)} days (p10–p90)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalPatternBlock;