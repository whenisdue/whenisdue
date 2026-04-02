import IssuancePredictor from '@/components/launch/IssuancePredictor';

/**
 * @description Test deployment for the OpenClaw moment.
 */
export default function PredictPage() {
  return (
    <main className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
      <div className="mb-12 text-center">
        <h1 className="text-zinc-200 text-6xl font-black tracking-tighter mb-2">
          WhenIs<span className="text-emerald-500">Due</span>
        </h1>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
          Deterministic Benefit Intelligence
        </p>
      </div>
      
      <IssuancePredictor />
      
      <p className="mt-12 text-zinc-700 text-[10px] font-mono uppercase tracking-widest max-w-xs text-center">
        Data verified via US-Oracle Bridge (B179) // us-east-1 synchronization active
      </p>
    </main>
  );
}