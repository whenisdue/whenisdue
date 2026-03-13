// RESEARCH APPLIED: Batch 3, Tab 9 (Segment-level error boundaries & reset)

'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-8 border-2 border-red-100 bg-red-50 rounded-lg text-center">
      <h2 className="text-lg font-bold text-red-800 mb-2">Schedule Temporarily Unavailable</h2>
      <p className="text-sm text-red-600 mb-4">
        We encountered a problem loading these payment dates. Our team has been notified.
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
      >
        Try Again
      </button>
    </div>
  );
}