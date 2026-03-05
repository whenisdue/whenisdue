"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import CopyLinkButton from "../../../components/CopyLinkButton";

function toInt(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function isCompleteYmd(value: string): boolean {
  return /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value.trim());
}

function parseLocalDateInput(value: string): Date | null {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value.trim());
  if (!m) return null;

  const y = toInt(m[1], NaN);
  const mo = toInt(m[2], NaN);
  const d = toInt(m[3], NaN);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;

  const dt = new Date(y, mo - 1, d, 0, 0, 0, 0);
  if (!Number.isFinite(dt.getTime())) return null;
  return dt;
}

function formatISODateLocal(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

function computeDiff(a: Date, b: Date) {
  const diffMs = Math.abs(b.getTime() - a.getTime());

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);

  return { days, weeks, hours, minutes };
}

function syncUrl(next: { a?: string; b?: string }) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);

  if (typeof next.a === "string" && next.a.trim().length > 0) url.searchParams.set("a", next.a);
  else url.searchParams.delete("a");
  
  if (typeof next.b === "string" && next.b.trim().length > 0) url.searchParams.set("b", next.b);
  else url.searchParams.delete("b");

  window.history.replaceState({}, "", url.toString());
}

function DateDifferenceInner() {
  const sp = useSearchParams();

  const [aStr, setAStr] = useState<string>("");
  const [bStr, setBStr] = useState<string>("");
  
  const hydratedOnceRef = useRef(false);
  const lastSyncedRef = useRef<string>("");

  useEffect(() => {
    if (hydratedOnceRef.current) return;
    hydratedOnceRef.current = true;

    const qa = sp.get("a") ?? sp.get("start") ?? sp.get("from") ?? "";
    const qb = sp.get("b") ?? sp.get("end") ?? sp.get("to") ?? "";
    
    if (qa) setAStr(qa);
    if (qb) setBStr(qb);
  }, [sp]);

  const aDate = useMemo(() => parseLocalDateInput(aStr), [aStr]);
  const bDate = useMemo(() => parseLocalDateInput(bStr), [bStr]);

  const canShow = Boolean(aDate) && Boolean(bDate);

  const diff = useMemo(() => {
    if (!aDate || !bDate) return null;
    return computeDiff(aDate, bDate);
  }, [aDate, bDate]);

  useEffect(() => {
    if (!canShow) return;
    if (!isCompleteYmd(aStr) || !isCompleteYmd(bStr)) return;

    const key = `${aStr}|${bStr}`;
    const t = setTimeout(() => {
      if (key === lastSyncedRef.current) return;
      syncUrl({ a: aStr, b: bStr });
      lastSyncedRef.current = key;
    }, 250);

    return () => clearTimeout(t);
  }, [canShow, aStr, bStr]);

  function onClearA() {
    setAStr("");
    lastSyncedRef.current = "";
    syncUrl({ a: "", b: bStr });
  }

  function onClearB() {
    setBStr("");
    lastSyncedRef.current = "";
    syncUrl({ a: aStr, b: "" });
  }

  const orderLine = useMemo(() => {
    if (!aDate || !bDate) return "—";
    const aIso = formatISODateLocal(aDate);
    const bIso = formatISODateLocal(bDate);
    if (aIso === bIso) return "Same date.";
    if (aDate.getTime() < bDate.getTime()) return `From ${formatPretty(aDate)} to ${formatPretty(bDate)}.`;
    return `From ${formatPretty(bDate)} to ${formatPretty(aDate)}.`;
  }, [aDate, bDate]);

  const fieldW = "w-[520px] max-w-full";

  return (
    <>
      <div className="mt-10 space-y-6">
        <div className={fieldW}>
          <label className="text-sm opacity-70 mb-2 block">First date</label>
          <div className="grid grid-cols-[1fr_56px] gap-3 items-center">
            <input
              type="date"
              value={aStr}
              onChange={(e) => setAStr(e.target.value)}
              className="w-full h-[48px] p-3 rounded-lg border border-white/10 bg-black/40 text-white [color-scheme:dark]"
              aria-label="First date"
            />
            <button
              onClick={onClearA}
              className="w-[56px] h-[48px] rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition"
              aria-label="Clear first date"
              title="Clear"
            >
              ×
            </button>
          </div>
        </div>

        <div className={fieldW}>
          <label className="text-sm opacity-70 mb-2 block">Second date</label>
          <div className="grid grid-cols-[1fr_56px] gap-3 items-center">
            <input
              type="date"
              value={bStr}
              onChange={(e) => setBStr(e.target.value)}
              className="w-full h-[48px] p-3 rounded-lg border border-white/10 bg-black/40 text-white [color-scheme:dark]"
              aria-label="Second date"
            />
            <button
              onClick={onClearB}
              className="w-[56px] h-[48px] rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition"
              aria-label="Clear second date"
              title="Clear"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {canShow && diff && aDate && bDate && (
        <div className="mt-10 w-[720px] max-w-full rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="text-6xl sm:text-7xl font-semibold tracking-tight leading-none">
              {diff.days.toLocaleString()}{" "}
              <span className="text-3xl sm:text-4xl font-semibold opacity-75">days</span>
            </div>
            <CopyLinkButton className="shrink-0 mt-1" />
          </div>

          <div className="mt-3 text-sm opacity-75">{orderLine}</div>

          <div className="mt-6 text-sm opacity-80 space-y-1">
            <div>
              <span className="opacity-60">Weeks:</span> {diff.weeks.toLocaleString()}
            </div>
            <div>
              <span className="opacity-60">Hours:</span> {diff.hours.toLocaleString()}
            </div>
            <div>
              <span className="opacity-60">Minutes:</span> {diff.minutes.toLocaleString()}
            </div>
          </div>

          <div className="mt-5 text-xs opacity-60">
            Tip: If a date ever looks off by 1 day, it’s usually timezone parsing. This tool uses local midnight to avoid that.
          </div>
        </div>
      )}
    </>
  );
}

export default function DateDifferenceClient() {
  return (
    <Suspense fallback={<div className="mt-10 text-sm opacity-60">Loading calculator...</div>}>
      <DateDifferenceInner />
    </Suspense>
  );
}