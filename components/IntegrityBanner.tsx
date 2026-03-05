"use client";

import React, { useEffect, useMemo, useState } from "react";

type IntegrityMode = "GREEN" | "AMBER" | "RED" | "BLUE";

type MonitorFeed = {
  version?: string;
  title?: string;
  home_page_url?: string;
  items?: Array<{
    id?: string;
    url?: string;
    title?: string;
    content_text?: string;
    date_published?: string; 
    _alarm?: {
      alarmType?: string;
      severity?: "INFO" | "WARN" | "CRITICAL";
      detectionTimestamp?: string; 
    };
  }>;
};

type TrustManifest = {
  kind?: string;
  updatedUtc?: string;
  maintenanceMode?: boolean;
  pvc?: {
    maintenanceMode?: boolean;
  };
};

function toInt(n: unknown, fallback: number): number {
  const v = typeof n === "string" ? Number(n) : typeof n === "number" ? n : NaN;
  return Number.isFinite(v) ? Math.trunc(v) : fallback;
}

function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function clampNowMs(n: number): number {
  return Number.isFinite(n) ? n : Date.now();
}

function parseIsoMs(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : NaN;
}

function withinMs(nowMs: number, isoUtc: string, windowMs: number): boolean {
  const t = parseIsoMs(isoUtc);
  if (!Number.isFinite(t)) return false;
  return Math.abs(nowMs - t) <= windowMs;
}

function xmlTextContent(xml: string, tag: string): string[] {
  const out: string[] = [];
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    out.push(m[1] || "");
  }
  return out;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function modeLabel(mode: IntegrityMode): string {
  switch (mode) {
    case "GREEN":
      return "Verified";
    case "AMBER":
      return "Uncertain";
    case "RED":
      return "Conflict";
    case "BLUE":
      return "Maintenance";
    default:
      return "Uncertain";
  }
}

function modeMessage(mode: IntegrityMode, meta: { lastVerifiedUtc?: string; detail?: string }): string {
  const t = meta.lastVerifiedUtc ? `Last verified: ${meta.lastVerifiedUtc}` : "Last verified: unavailable";
  const d = meta.detail ? ` — ${meta.detail}` : "";
  switch (mode) {
    case "GREEN":
      return `${t}${d}`;
    case "AMBER":
      return `Pending witness reconciliation. ${t}${d}`;
    case "RED":
      return `Integrity alert: cryptographic conflict detected. Current version untrusted. ${t}${d}`;
    case "BLUE":
      return `Registry in maintenance mode. Deterministic builds paused. ${t}${d}`;
    default:
      return `${t}${d}`;
  }
}

type Props = {
  siteOrigin?: string;
  refreshMs?: number;
};

export default function IntegrityBanner(props: Props) {
  const siteOrigin = props.siteOrigin || "";
  const refreshMs = toInt(props.refreshMs, 60_000);

  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const [mode, setMode] = useState<IntegrityMode>("AMBER");
  const [lastVerifiedUtc, setLastVerifiedUtc] = useState<string>("");
  const [detail, setDetail] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let alive = true;

    async function runOnce() {
      let nextMode: IntegrityMode = "AMBER";
      let nextLastVerified = "";
      let nextDetail = "";

      const startedMs = clampNowMs(Date.now());

      let manifest: TrustManifest | null = null;
      try {
        const res = await fetch(`${siteOrigin}/.well-known/whenisdue-trust.json`, {
          cache: "no-store",
        });
        if (res.ok) {
          manifest = (await res.json()) as TrustManifest;
        }
      } catch {
        // ignore
      }

      const maintenance =
        Boolean(manifest?.maintenanceMode) || Boolean(manifest?.pvc?.maintenanceMode);

      if (maintenance) {
        nextMode = "BLUE";
      }

      let conflictRecent = false;
      let conflictHint = "";
      try {
        const res = await fetch(`${siteOrigin}/integrity/conflicts/feed.xml`, {
          cache: "no-store",
        });
        if (res.ok) {
          const xml = await res.text();
          const pubDates = xmlTextContent(xml, "pubDate")
            .map((s) => decodeXmlEntities(s).trim())
            .filter(Boolean);

          const titles = xmlTextContent(xml, "title")
            .map((s) => decodeXmlEntities(s).trim())
            .filter(Boolean);

          const itemTitles = titles.slice(1);

          for (let i = 0; i < pubDates.length; i++) {
            const t = Date.parse(pubDates[i]);
            if (Number.isFinite(t) && Math.abs(nowMs - t) <= 24 * 60 * 60 * 1000) {
              conflictRecent = true;
              conflictHint = itemTitles[i] || "Recent conflict proof published";
              break;
            }
          }
        }
      } catch {
        // ignore
      }

      if (!maintenance && conflictRecent) {
        nextMode = "RED";
        nextDetail = conflictHint;
      }

      let monitor: MonitorFeed | null = null;
      let monitorOk = false;
      let monitorHint = "";

      try {
        const res = await fetch(`${siteOrigin}/monitor/feed.json`, {
          cache: "no-store",
        });
        if (res.ok) {
          monitor = (await res.json()) as MonitorFeed;
        }
      } catch {
        // ignore
      }

      if (monitor?.items && Array.isArray(monitor.items)) {
        const newest = monitor.items
          .map((it) => {
            const ts = safeString(it._alarm?.detectionTimestamp || it.date_published || "", "");
            const ms = parseIsoMs(ts);
            return { it, ts, ms };
          })
          .filter((x) => Number.isFinite(x.ms))
          .sort((a, b) => (a.ms < b.ms ? 1 : a.ms > b.ms ? -1 : 0))[0];

        if (newest?.ts) {
          nextLastVerified = newest.ts;
        }

        const isFresh = newest?.ts ? withinMs(nowMs, newest.ts, 30 * 60 * 1000) : false;

        const hasCritical = monitor.items.some((it) => it._alarm?.severity === "CRITICAL");
        const hasWarn = monitor.items.some((it) => it._alarm?.severity === "WARN");

        if (hasCritical) {
          monitorHint = "Monitor reported CRITICAL condition";
        } else if (hasWarn) {
          monitorHint = "Monitor reported WARN condition";
        } else if (!isFresh) {
          monitorHint = "Monitor heartbeat is stale";
        } else {
          monitorOk = true;
        }
      } else {
        monitorHint = "Monitor feed unavailable";
      }

      if (nextMode === "AMBER") {
        nextMode = monitorOk ? "GREEN" : "AMBER";
        nextDetail = monitorOk ? "" : monitorHint;
      } else {
        if (!nextDetail) nextDetail = monitorHint;
      }

      if (!nextLastVerified) {
        nextLastVerified = new Date(startedMs).toISOString();
      }

      if (!alive) return;
      setMode(nextMode);
      setLastVerifiedUtc(nextLastVerified);
      setDetail(nextDetail);
      setIsLoading(false);
    }

    runOnce();

    const id = setInterval(() => {
      runOnce();
    }, Math.max(10_000, refreshMs));

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [nowMs, refreshMs, siteOrigin]);

  const classes = useMemo(() => {
    switch (mode) {
      case "GREEN":
        return "border-emerald-300 bg-emerald-50 text-emerald-900";
      case "AMBER":
        return "border-amber-300 bg-amber-50 text-amber-900";
      case "RED":
        return "border-red-300 bg-red-50 text-red-900";
      case "BLUE":
        return "border-sky-300 bg-sky-50 text-sky-900";
      default:
        return "border-slate-300 bg-slate-50 text-slate-900";
    }
  }, [mode]);

  const label = modeLabel(mode);
  const msg = modeMessage(mode, { lastVerifiedUtc, detail });

  return (
    <div className="w-full mb-6">
      <div className={`w-full rounded-lg px-4 py-3 border ${classes}`}>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold tracking-wide">
              Integrity Status: <span className="uppercase">{label}</span>
            </div>
            {isLoading ? (
              <span className="text-xs opacity-70">(checking)</span>
            ) : null}
          </div>
          <div className="text-xs opacity-80">
            <a
              href="/verify"
              className="underline underline-offset-2 hover:opacity-100"
            >
              Public Verification Console
            </a>
          </div>
        </div>

        <div className="mt-2 text-sm leading-snug">{msg}</div>

        {mode === "RED" ? (
          <div className="mt-2 text-xs leading-snug font-bold">
            Action: Halt automated updates. Review the conflict proof and reconcile witnesses.
          </div>
        ) : null}
      </div>
    </div>
  );
}