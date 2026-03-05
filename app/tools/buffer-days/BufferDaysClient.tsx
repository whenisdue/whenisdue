"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import CopyLinkButton from "../../../components/CopyLinkButton";

type Unit = "days" | "weeks" | "months";

function toInt(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function parseLocalDateInput(value: string): Date | null {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value);
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

function addMonthsLocal(date: Date, deltaMonths: number): Date {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();

  const targetMonth = m + deltaMonths;
  const firstOfTarget = new Date(y, targetMonth, 1, 0, 0, 0, 0);
  const lastDay = new Date(firstOfTarget.getFullYear(), firstOfTarget.getMonth() + 1, 0, 0, 0, 0, 0).getDate();
  const clampedDay = Math.min(d, lastDay);
  return new Date(firstOfTarget.getFullYear(), firstOfTarget.getMonth(), clampedDay, 0, 0, 0, 0);
}

function subtractDurationLocal(date: Date, amount: number, unit: Unit): Date {
  const amt = clamp(toInt(amount, 0), 0, 1_000_000);
  if (amt === 0) return new Date(date.getTime());

  if (unit === "days") return new Date(date.getTime() - amt * 24 * 60 * 60 * 1000);
  if (unit === "weeks") return new Date(date.getTime() - amt * 7 * 24 * 60 * 60 * 1000);
  return addMonthsLocal(date, -amt);
}

function BufferDaysInner() {
  const sp = useSearchParams();

  const [finishByStr, setFinishByStr] = useState<string>("");
  const [workTakesRaw, setWorkTakesRaw] = useState<string>("30");
  const [unit, setUnit] = useState<Unit>("days");
  const [bufferRaw, setBufferRaw] = useState<string>("3");
  
  const hydratedOnceRef = useRef(false);
  const lastSyncedRef = useRef<string>("");

  useEffect(() => {
    if (hydratedOnceRef.current) return;
    hydratedOnceRef.current = true;

    const qDate = sp.get("date");
    const qDuration = sp.get("duration");
    const qUnit = sp.get("unit");
    const qBuffer = sp.get("buffer");

    if (qDate) setFinishByStr(qDate);
    if (qDuration) setWorkTakesRaw(qDuration);
    if (qUnit === "days" || qUnit === "weeks" || qUnit === "months") setUnit(qUnit);
    if (qBuffer) setBufferRaw(qBuffer);
  }, [sp]);

  const finishByDate = useMemo(() => parseLocalDateInput(finishByStr), [finishByStr]);
  const workTakes = useMemo(() => clamp(toInt(workTakesRaw, NaN), 0, 1_000_000), [workTakesRaw]);
  const bufferDays = useMemo(() => clamp(toInt(bufferRaw, NaN), 0, 1_000_000), [bufferRaw]);
  
  const canCompute =
    Boolean(finishByDate) &&
    Number.isFinite(workTakes) &&
    Number.isFinite(bufferDays);

  const computed = useMemo(() => {
    if (!canCompute || !finishByDate) return null;

    const finishMinusBuffer = new Date(finishByDate.getTime() - bufferDays * 24 * 60 * 60 * 1000);
    const start = subtractDurationLocal(finishMinusBuffer, workTakes, unit);

    return { start, finishMinusBuffer };
  }, [canCompute, finishByDate, bufferDays, workTakes, unit]);

  useEffect(() => {
    if (!canCompute || !finishByDate) return;

    const url = new URL(window.location.href);
    url.searchParams.set("date", finishByStr);
    url.searchParams.set("duration", String(workTakes));
    url.searchParams.set("unit", unit);
    url.searchParams.set("buffer", String(bufferDays));

    const nextSearch = url.search;
    
    const t = setTimeout(() => {
      if (nextSearch === lastSyncedRef.current) return;
      window.history.replaceState({}, "", url.toString());
      lastSyncedRef.current = nextSearch;
    }, 250);

    return () => clearTimeout(t);
  }, [canCompute, finishByStr, workTakes, unit, bufferDays]);

  function onClear() {
    setFinishByStr("");
    setWorkTakesRaw("30");
    setUnit("days");
    setBufferRaw("3");
    
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("date");
      url.searchParams.delete("duration");
      url.searchParams.delete("unit");
      url.searchParams.delete("buffer");
      window.history.replaceState({}, "", url.toString());
      lastSyncedRef.current = "";
    }
  }

  const fieldW = "w-[520px] max-w-full";

  return (
    <>
      <h1 className="text-4xl font-semibold tracking-tight">Buffer Days</h1>
      <p className="mt-2 text-sm opacity-75">Add safety days so you don’t cut it close.</p>

      <div className="mt-10 space-y-6">
        <div className={fieldW}>
          <label className="text-sm opacity-70 mb-2 block">Finish by</label>
          <div className="grid grid-cols-[1fr_56px] gap-3">
            <input
              type="date"
              value={finishByStr}
              onChange={(e) => setFinishByStr(e.target.value)}
              className="w-full h-[48px] p-3 rounded-lg border border-white/10 bg-black/40 text-white [color-scheme:dark]"
              aria-label="Finish by date"
            />
            <button
              onClick={onClear}
              className="w-[56px] h-[48px] rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition"
              aria-label="Clear"
              title="Clear"
            >
              ×
            </button>
          </div>
          {!finishByDate && finishByStr.length > 0 && (
            <div className="mt-2 text-xs text-red-300">Please pick a valid date.</div>
          )}
        </div>

        <div className={fieldW}>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-4">
            <div>
              <label className="text-sm opacity-70 mb-2 block">Work takes</label>
              <input
                inputMode="numeric"
                value={workTakesRaw}
                onChange={(e) => setWorkTakesRaw(e.target.value)}
                className="w-full h-[48px] p-3 rounded-lg border border-white/10 bg-black/40 text-white"
                placeholder="30"
                aria-label="Work takes"
              />
            </div>

            <div>
              <label className="text-sm opacity-70 mb-2 block">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="w-full h-[48px] p-3 rounded-lg border border-white/10 bg-black/40 text-white"
                aria-label="Unit"
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
          </div>
        </div>

        <div className={fieldW}>
          <label className="text-sm opacity-70 mb-2 block">Extra safety days</label>
          <input
            inputMode="numeric"
            value={bufferRaw}
            onChange={(e) => setBufferRaw(e.target.value)}
            className="w-full h-[48px] p-3 rounded-lg border border-white/10 bg-black/40 text-white"
            placeholder="3"
            aria-label="Extra safety days"
          />
        </div>
      </div>

      {canCompute && computed && finishByDate && (
        <div className="mt-10 w-[720px] max-w-full rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="text-5xl sm:text-6xl font-semibold tracking-tight">
              {formatPretty(computed.start)}
            </div>
            <CopyLinkButton className="shrink-0 mt-1" />
          </div>

          <div className="mt-3 text-sm opacity-75">
            Start on <span className="font-semibold">{formatPretty(computed.start)}</span> to finish by{" "}
            <span className="font-semibold">{formatPretty(finishByDate)}</span>.
          </div>

          <div className="mt-6 text-sm opacity-80 space-y-1">
            <div>
              <span className="opacity-60">Finish by:</span> {formatISODateLocal(finishByDate)}
            </div>
            <div>
              <span className="opacity-60">Work takes:</span> {workTakes} {unit}
            </div>
            <div>
              <span className="opacity-60">Safety days:</span> {bufferDays} days
            </div>
            <div>
              <span className="opacity-60">Latest start:</span> {formatISODateLocal(computed.start)}
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

export default function BufferDaysClient() {
  return (
    <Suspense fallback={<div className="text-sm opacity-60">Loading calculator...</div>}>
      <BufferDaysInner />
    </Suspense>
  );
}