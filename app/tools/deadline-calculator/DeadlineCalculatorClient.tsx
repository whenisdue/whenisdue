"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const lastDay = new Date(
    firstOfTarget.getFullYear(),
    firstOfTarget.getMonth() + 1,
    0, 0, 0, 0, 0
  ).getDate();
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

function buildQuery(params: { date: string; duration: number; unit: Unit }) {
  const q = new URLSearchParams();
  q.set("date", params.date);
  q.set("duration", String(params.duration));
  q.set("unit", params.unit);
  return `?${q.toString()}`;
}

export default function DeadlineCalculatorClient() {
  const sp = useSearchParams();
  const lastSyncedRef = useRef<string>("");

  const [deadlineStr, setDeadlineStr] = useState<string>("");
  const [durationRaw, setDurationRaw] = useState<string>("30");
  const [unit, setUnit] = useState<Unit>("days");

  useEffect(() => {
    const qDate = sp.get("date");
    const qDuration = sp.get("duration");
    const qUnit = sp.get("unit");

    if (typeof qDate === "string" && qDate.trim().length > 0) setDeadlineStr(qDate);
    if (typeof qDuration === "string" && qDuration.trim().length > 0) setDurationRaw(qDuration);
    if (qUnit === "days" || qUnit === "weeks" || qUnit === "months") setUnit(qUnit);
  }, [sp]);

  const deadlineDate = useMemo(() => parseLocalDateInput(deadlineStr), [deadlineStr]);
  const duration = useMemo(() => clamp(toInt(durationRaw, 0), 0, 1_000_000), [durationRaw]);
  
  const computed = useMemo(() => {
    if (!deadlineDate) return null;
    if (!Number.isFinite(duration) || duration <= 0) return null;
    return subtractDurationLocal(deadlineDate, duration, unit);
  }, [deadlineDate, duration, unit]);

  const canCompute = Boolean(deadlineDate) && Number.isFinite(duration) && duration > 0;

  useEffect(() => {
    if (!canCompute || !deadlineDate) return;

    const qs = buildQuery({
      date: formatISODateLocal(deadlineDate),
      duration,
      unit,
    });

    if (qs === lastSyncedRef.current) return;
    lastSyncedRef.current = qs;

    try {
      const url = new URL(window.location.href);
      if (url.search === qs) return;
      url.search = qs;
      window.history.replaceState({}, "", url.toString());
    } catch {
      // no-op
    }
  }, [canCompute, deadlineDate, duration, unit]);

  function onClear() {
    setDeadlineStr("");
    setDurationRaw("30");
    setUnit("days");
    lastSyncedRef.current = "";
    try {
      const url = new URL(window.location.href);
      url.search = "";
      window.history.replaceState({}, "", url.toString());
    } catch {
      // no-op
    }
  }

  const fieldW = "w-[520px] max-w-full";

  return (
    <>
      <h1 className="text-4xl font-semibold tracking-tight">When Should I Start?</h1>
      <p className="mt-2 text-sm opacity-75">
        Enter a finish-by date and how long the work takes. The start date appears instantly.
      </p>

      <div className="mt-10 space-y-6">
        <div className={fieldW}>
          <label className="text-sm opacity-70 mb-2 block">Finish by</label>
          <div className="grid grid-cols-[1fr_56px] gap-3">
            <input
              type="date"
              value={deadlineStr}
              onChange={(e) => setDeadlineStr(e.target.value)}
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
          {!deadlineDate && deadlineStr.length > 0 && (
            <div className="mt-2 text-xs text-red-300">Please pick a valid date.</div>
          )}
        </div>

        <div className={fieldW}>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-4">
            <div>
              <label className="text-sm opacity-70 mb-2 block">Work takes</label>
              <input
                inputMode="numeric"
                value={durationRaw}
                onChange={(e) => setDurationRaw(e.target.value)}
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
      </div>

      {canCompute && computed && deadlineDate && (
        <div className="mt-10 w-[720px] max-w-full rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-5xl sm:text-6xl font-semibold tracking-tight">
              {formatPretty(computed)}
            </div>
            <CopyLinkButton className="shrink-0 mt-1" />
          </div>

          <div className="mt-3 text-sm opacity-75">
            Start on <span className="font-semibold">{formatPretty(computed)}</span> to finish by{" "}
            <span className="font-semibold">{formatPretty(deadlineDate)}</span>.
          </div>

          <div className="mt-6 text-sm opacity-80 space-y-1">
            <div>
              <span className="opacity-60">Finish by:</span> {formatISODateLocal(deadlineDate)}
            </div>
            <div>
              <span className="opacity-60">Work takes:</span> {duration} {unit}
            </div>
            <div>
              <span className="opacity-60">Latest start:</span> {formatISODateLocal(computed)}
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