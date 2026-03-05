"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import CopyLinkButton from "../../../components/CopyLinkButton";

function toInt(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function parseLocalDateInput(value: string): Date | null {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value);
  if (!m) return null;
  const y = toInt(m[1], NaN);
  const mo = toInt(m[2], NaN);
  const d = toInt(m[3], NaN);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  // Local midnight to avoid UTC parsing drift.
  const dt = new Date(y, mo - 1, d, 0, 0, 0, 0);
  if (!Number.isFinite(dt.getTime())) return null;
  return dt;
}

function formatPretty(dt: Date): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "2-digit",
    }).format(dt);
  } catch {
    return formatISODateLocal(dt);
  }
}

function formatISODateLocal(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysBetweenLocalMidnights(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function buildQs(dateStr: string, fromStr: string): string {
  const qs = new URLSearchParams();
  if (dateStr) qs.set("date", dateStr);
  if (fromStr) qs.set("from", fromStr);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export default function DaysUntilClient() {
  const sp = useSearchParams();

  const [dateStr, setDateStr] = useState("");
  const [fromStr, setFromStr] = useState("");
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  
  const hydratedOnceRef = useRef(false);
  const lastSyncedRef = useRef<string>("");

  // Heartbeat
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  // Hydrate from URL params
  useEffect(() => {
    if (hydratedOnceRef.current) return;
    hydratedOnceRef.current = true;

    const qDate = sp.get("date");
    const qFrom = sp.get("from");
    if (qDate) setDateStr(qDate);
    if (qFrom) setFromStr(qFrom);
  }, [sp]);

  const targetDate = useMemo(() => parseLocalDateInput(dateStr), [dateStr]);
  const fromDate = useMemo(
    () => (fromStr ? parseLocalDateInput(fromStr) : new Date(nowMs)),
    [fromStr, nowMs]
  );

  const canCalculate = Boolean(targetDate) && Boolean(fromDate);

  const result = useMemo(() => {
    if (!targetDate || !fromDate) return null;

    // Use local midnight for both
    const a = parseLocalDateInput(formatISODateLocal(fromDate));
    const b = parseLocalDateInput(formatISODateLocal(targetDate));
    if (!a || !b) return null;

    const diffDays = daysBetweenLocalMidnights(a, b);
    const abs = Math.abs(diffDays);
    const absStr = abs.toLocaleString();

    return { 
      kind: diffDays === 0 ? "today" : diffDays > 0 ? "until" : "since", 
      absStr, 
      diffDays,
      targetIso: formatISODateLocal(targetDate),
      fromIso: formatISODateLocal(fromDate)
    };
  }, [targetDate, fromDate, nowMs]);

  // Sync URL only when inputs are valid + stable (avoid spam while typing)
  useEffect(() => {
    if (!canCalculate) return;
    const qs = buildQs(dateStr, fromStr);
    
    // Debounce slightly to avoid history spam
    const t = setTimeout(() => {
      if (qs === lastSyncedRef.current) return;
      window.history.replaceState({}, "", `${window.location.pathname}${qs}`);
      lastSyncedRef.current = qs;
    }, 250);

    return () => clearTimeout(t);
  }, [canCalculate, dateStr, fromStr]);

  return (
    <>
      <h1 className="text-4xl font-semibold tracking-tight">Days Until</h1>
      <p className="mt-2 text-sm opacity-75">
        Pick a date. We’ll show how many days remain — or how many days have passed.
      </p>

      <div className="mt-10 space-y-6">
        <div className="w-[520px] max-w-full">
          <label className="text-sm opacity-70 mb-2 block">Target date</label>

          <div className="grid grid-cols-[1fr_56px] gap-3">
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full h-[48px] p-3 rounded-lg border border-white/10 bg-black/40 text-white [color-scheme:dark]"
              aria-label="Target date"
            />

            <button
              onClick={() => {
                setDateStr("");
                setFromStr("");
                lastSyncedRef.current = "";
                window.history.replaceState({}, "", window.location.pathname);
              }}
              className="w-[56px] h-[48px] rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition"
              aria-label="Clear"
              title="Clear"
            >
              ×
            </button>
          </div>
        </div>

        <div className="w-[520px] max-w-full">
          <label className="text-sm opacity-70 mb-2 block">From (optional)</label>
          <input
            type="date"
            value={fromStr}
            onChange={(e) => setFromStr(e.target.value)}
            className="w-full h-[48px] p-3 rounded-lg border border-white/10 bg-black/40 text-white [color-scheme:dark]"
            aria-label="From date"
          />
          <div className="mt-2 text-xs opacity-60">Leave blank to count from today.</div>
        </div>
      </div>

      {result && targetDate && (
        <div className="mt-10 w-[720px] max-w-full rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-6xl sm:text-7xl font-semibold tracking-tight leading-none">
                {result.absStr}
                <span className="ml-2 text-3xl sm:text-4xl font-semibold opacity-75">
                  {result.kind === "since" ? "days ago" : "days"}
                </span>
              </div>

              <div className="mt-2 text-sm opacity-75">
                {result.kind === "since"
                  ? `Since ${formatPretty(targetDate)}.`
                  : result.kind === "today"
                    ? `It’s ${formatPretty(targetDate)}.`
                    : `Until ${formatPretty(targetDate)}.`}
              </div>
            </div>

            <CopyLinkButton className="shrink-0 mt-1" />
          </div>

          <div className="mt-6 text-sm opacity-80 space-y-1">
            <div>
              <span className="opacity-60">Target:</span> {result.targetIso}
            </div>
            <div>
              <span className="opacity-60">From:</span> {result.fromIso}
            </div>
          </div>

          <div className="mt-5 text-xs opacity-60">
            Tip: This uses local midnight to avoid timezone “off by 1 day” issues.
          </div>
        </div>
      )}
    </>
  );
}