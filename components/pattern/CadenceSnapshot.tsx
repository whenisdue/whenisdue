import React from 'react';
import type { HistoricalPatternData } from './HistoricalPatternBlock';

interface CadenceSnapshotProps {
  data: HistoricalPatternData | null;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CadenceSnapshot: React.FC<CadenceSnapshotProps> = ({ data }) => {
  if (!data || !data.cci || !data.cci.eligible) return null;

  const { cci } = data;

  return (
    <div className="w-[720px] max-w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 mt-8">
      <div className="text-sm font-medium opacity-90 mb-3">Cadence Snapshot</div>
      <div className="flex flex-col gap-1 text-sm opacity-80 tabular-nums">
        <div>Occurred {cci.cycleCount} confirmed cycles</div>
        <div>
          {MONTH_NAMES[cci.topMonth] ?? 'Unknown'} concentration: {Math.round(cci.concentration * 100)}%
        </div>
        <div>Typical window: {cci.windowDays} days</div>
        <div>
          CCI: {cci.cci.toFixed(2)} ({cci.tier})
        </div>
      </div>
    </div>
  );
};

export default CadenceSnapshot;