// @ts-nocheck
/* buildMonitorFeedJson.ts
 *
 * Phase 15 — Deliverable 4 (File 1)
 * Build a JSON Feed v1.1 for monitor alarms
 */

import fs from "fs/promises";
import path from "path";

type AlarmSeverity = "INFO" | "WARN" | "CRITICAL";

type AlarmJson = {
  alarmId: string;
  alarmType: string;
  severity: AlarmSeverity;
  detectionTimestamp: string; 
  evidence?: unknown;
  signedByMonitorKey?: unknown;
};

function toInt(n: unknown, fallback: number): number {
  const v = typeof n === "string" ? Number(n) : typeof n === "number" ? n : NaN;
  return Number.isFinite(v) ? Math.trunc(v) : fallback;
}

function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function clampIsoUtc(s: string): string {
  if (!s || typeof s !== "string") return "";
  if (!s.includes("T") || !s.endsWith("Z")) return "";
  return s;
}

async function listJsonFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".json"))
      .map((e) => path.join(dir, e.name));
  } catch {
    return [];
  }
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function stableSortAlarms(a: AlarmJson, b: AlarmJson): number {
  const ta = safeString(a.detectionTimestamp, "");
  const tb = safeString(b.detectionTimestamp, "");
  if (ta !== tb) return ta < tb ? 1 : -1; 
  const ia = safeString(a.alarmId, "");
  const ib = safeString(b.alarmId, "");
  if (ia !== ib) return ia < ib ? -1 : 1;
  return 0;
}

function buildTitle(a: AlarmJson): string {
  const sev = safeString(a.severity, "WARN");
  const typ = safeString(a.alarmType, "ALARM");
  return `${sev}: ${typ}`;
}

function buildSummary(a: AlarmJson): string {
  const sev = safeString(a.severity, "WARN");
  const typ = safeString(a.alarmType, "ALARM");
  const ts = clampIsoUtc(safeString(a.detectionTimestamp, ""));
  const id = safeString(a.alarmId, "");
  const tsPart = ts ? ` at ${ts}` : "";
  const idPart = id ? ` (alarmId: ${id})` : "";
  return `Monitor reported ${sev} ${typ}${tsPart}.${idPart}`;
}

function ensureDirForFile(filePath: string): Promise<void> {
  return fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function main() {
  const siteOrigin = process.env.SITE_ORIGIN || "https://whenisdue.com";
  const alarmsDir =
    process.env.MONITOR_ALARMS_DIR ||
    path.join(process.cwd(), "web", "public", "monitor", "alarms");
  const outPath =
    process.env.MONITOR_FEED_OUT ||
    path.join(process.cwd(), "web", "public", "monitor", "feed.json");
  const maxItems = Math.max(
    1,
    toInt(process.env.MONITOR_FEED_MAX_ITEMS, 50)
  );

  const files = await listJsonFiles(alarmsDir);
  const alarms: AlarmJson[] = [];

  for (const fp of files) {
    const a = await readJsonFile<AlarmJson>(fp);
    if (!a) continue;

    const alarmId = safeString(a.alarmId, "");
    const alarmType = safeString(a.alarmType, "");
    const severity = safeString(a.severity, "") as AlarmSeverity;
    const detectionTimestamp = clampIsoUtc(safeString(a.detectionTimestamp, ""));

    if (!alarmId || !alarmType || !detectionTimestamp) continue;
    if (severity !== "INFO" && severity !== "WARN" && severity !== "CRITICAL") continue;

    alarms.push({
      alarmId,
      alarmType,
      severity,
      detectionTimestamp,
      evidence: a.evidence,
      signedByMonitorKey: a.signedByMonitorKey,
    });
  }

  alarms.sort(stableSortAlarms);

  const items = alarms.slice(0, maxItems).map((a) => {
    const alarmUrl = `${siteOrigin}/monitor/alarm/${encodeURIComponent(a.alarmId)}`;
    return {
      id: a.alarmId,
      url: alarmUrl,
      title: buildTitle(a),
      content_text: buildSummary(a),
      date_published: a.detectionTimestamp,
      tags: [a.severity, a.alarmType],
    };
  });

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "WhenIsDue Monitor Alerts",
    home_page_url: `${siteOrigin}/verify`,
    feed_url: `${siteOrigin}/monitor/feed.json`,
    items,
  };

  await ensureDirForFile(outPath);
  await fs.writeFile(outPath, JSON.stringify(feed), "utf8");

  // eslint-disable-next-line no-console
  console.log(`OK buildMonitorFeedJson items=${items.length} out=${outPath}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("FAIL buildMonitorFeedJson", e?.message || e);
  process.exit(1);
});