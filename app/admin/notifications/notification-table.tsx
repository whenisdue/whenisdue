"use client";

import { useState } from "react";
import { RotateCw, AlertCircle, CheckCircle2, Mail, Send } from "lucide-react";

interface NotificationTableProps {
  data: any[];
}

export function NotificationTable({ data }: NotificationTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ id: string; msg: string; type: 'success' | 'error' } | null>(null);

  async function handleRetry(outboxId: string) {
    const reason = reasons[outboxId];
    
    // Validation: Ensure the admin provides a reason for the audit trail
    if (!reason || reason.trim().length < 5) {
      alert("Please provide a descriptive reason for this retry (min 5 characters).");
      return;
    }

    setLoadingId(outboxId);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/notifications/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outboxId, reason }),
      });

      const result = await res.json();

      if (res.ok) {
        setFeedback({ id: outboxId, msg: "Retry scheduled successfully!", type: 'success' });
        // Refresh to show the item has moved out of DEAD_LETTER status
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setFeedback({ id: outboxId, msg: result.error || "Retry failed", type: 'error' });
      }
    } catch (e) {
      setFeedback({ id: outboxId, msg: "Network connection error", type: 'error' });
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
          <tr>
            <th className="px-6 py-4">Recipient</th>
            <th className="px-6 py-4">Error Context</th>
            <th className="px-6 py-4 text-right">Manual Recovery</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-6 py-16 text-center text-gray-500">
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-full bg-green-50 p-3">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Queue is Clear</p>
                    <p className="text-xs">No terminal delivery failures detected.</p>
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-gray-100 p-2 text-gray-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      {/* FIXED: Optional chaining to prevent crashes on missing data */}
                      <div className="font-medium text-gray-900">
                        {item.decision?.subscription?.subscriber?.email || "Unknown Recipient"}
                      </div>
                      <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                        {item.decision?.notificationType || "General"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-start gap-2 rounded-lg bg-red-50/50 p-2 text-red-700">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-xs italic leading-snug">
                      {item.lastError || "Unknown connection timeout"}
                    </span>
                  </div>

                  {/* FIXED: Logical guard to narrow the feedback type and remove TS "possibly null" errors */}
                  {feedback && feedback.id === item.id && (
                    <div className={`mt-2 text-[11px] font-semibold px-2 ${
                      feedback.type === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {feedback.type === 'success' ? '✓ ' : '✕ '} {feedback.msg}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <input
                      type="text"
                      placeholder="Audit reason..."
                      className="h-9 w-44 rounded-md border border-gray-300 px-3 text-xs placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                      onChange={(e) => setReasons(prev => ({ ...prev, [item.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleRetry(item.id)}
                    />
                    <button
                      onClick={() => handleRetry(item.id)}
                      disabled={loadingId === item.id}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-all"
                    >
                      {loadingId === item.id ? (
                        <RotateCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          Retry
                        </>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}