// @ts-nocheck
/* buildIntegrityConflictsFeedXml.ts
 *
 * Phase 15 — Deliverable 4 (File 2)
 * Build an RSS 2.0 feed for conflict proofs
 */

import fs from "fs/promises";
import path from "path";

type ConflictSeverity = "INFO" | "WARN" | "CRITICAL";

type ConflictProof = {
  conflictId: string; 
  conflictType: string; 
  detectedAtUtc: string; 
  logId: string;
  severity: ConflictSeverity;
  signedByHub?: string;
  signature?: unknown;
  sthA?: {
    treeSize?: number;
    rootHash?: string;
    timestamp?: string;
    signature?: string;
  };
  sthB?: {
    treeSize?: number;
    rootHash?: string;
    timestamp?: string;
    signature?: string;
  };
  verificationResults?: {
    mismatchField?: string;
    expected?: string;
    actual?: string;
  };
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

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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

function stableSortConflicts(a: ConflictProof, b: ConflictProof): number {
  const ta = safeString(a.detectedAtUtc, "");
  const tb = safeString(b.detectedAtUtc, "");
  if (ta !== tb) return ta < tb ? 1 : -1; 
  const ia = safeString(a.conflictId, "");
  const ib = safeString(b.conflictId, "");
  if (ia !== ib) return ia < ib ? -1 : 1;
  return 0;
}

function buildTitle(c: ConflictProof): string {
  const sev = safeString(c.severity, "CRITICAL");
  const typ = safeString(c.conflictType, "CONFLICT");
  return `${sev}: ${typ}`;
}

function buildDescription(c: ConflictProof): string {
  const sev = safeString(c.severity, "CRITICAL");
  const typ = safeString(c.conflictType, "CONFLICT");
  const ts = clampIsoUtc(safeString(c.detectedAtUtc, ""));
  const logId = safeString(c.logId, "");
  const id = safeString(c.conflictId, "");
  const aSize = Number.isFinite(c.sthA?.treeSize as number) ? String(c.sthA?.treeSize) : "";
  const bSize = Number.isFinite(c.sthB?.treeSize as number) ? String(c.sthB?.treeSize) : "";
  const mismatchField = safeString(c.verificationResults?.mismatchField, "");

  const parts: string[] = [];
  parts.push(`Severity: ${sev}`);
  parts.push(`Type: ${typ}`);
  if (ts) parts.push(`Detected: ${ts}`);
  if (logId) parts.push(`Log: ${logId}`);
  if (id) parts.push(`ConflictId: ${id}`);
  if (aSize || bSize) parts.push(`TreeSize: ${aSize || "?"} vs ${bSize || "?"}`);
  if (mismatchField) parts.push(`Mismatch: ${mismatchField}`);

  return parts.join(" | ");
}

function ensureDirForFile(filePath: string): Promise<void> {
  return fs.mkdir(path.dirname(filePath), { recursive: true });
}

function rssDateFromIso(isoUtc: string): string {
  const d = new Date(isoUtc);
  if (!Number.isFinite(d.getTime())) return new Date(0).toUTCString();
  return d.toUTCString();
}

async function main() {
  const siteOrigin = process.env.SITE_ORIGIN || "https://whenisdue.com";
  const conflictsDir =
    process.env.CONFLICTS_DIR ||
    path.join(process.cwd(), "web", "public", "integrity", "conflicts");
  const outPath =
    process.env.CONFLICTS_FEED_OUT ||
    path.join(process.cwd(), "web", "public", "integrity", "conflicts", "feed.xml");
  const maxItems = Math.max(
    1,
    toInt(process.env.CONFLICTS_FEED_MAX_ITEMS, 50)
  );

  const files = await listJsonFiles(conflictsDir);
  const conflicts: ConflictProof[] = [];

  for (const fp of files) {
    if (fp.toLowerCase().endsWith(`${path.sep}feed.xml`)) continue;

    const c = await readJsonFile<ConflictProof>(fp);
    if (!c) continue;

    const conflictId = safeString(c.conflictId, "");
    const conflictType = safeString(c.conflictType, "");
    const detectedAtUtc = clampIsoUtc(safeString(c.detectedAtUtc, ""));
    const logId = safeString(c.logId, "");
    const severity = safeString(c.severity, "") as ConflictSeverity;

    if (!conflictId || !conflictType || !detectedAtUtc || !logId) continue;
    if (severity !== "INFO" && severity !== "WARN" && severity !== "CRITICAL") continue;

    conflicts.push({
      ...c,
      conflictId,
      conflictType,
      detectedAtUtc,
      logId,
      severity,
    });
  }

  conflicts.sort(stableSortConflicts);

  const items = conflicts.slice(0, maxItems).map((c) => {
    const itemTitle = buildTitle(c);
    const itemDesc = buildDescription(c);
    const pubDate = rssDateFromIso(c.detectedAtUtc);

    const guid = xmlEscape(c.conflictId);
    
    // Adjusted link to correctly route to /verify instead of /pvc
    const link = `${siteOrigin}/verify?conflictId=${encodeURIComponent(c.conflictId)}`;

    return { itemTitle, itemDesc, pubDate, guid, link };
  });

  const channelTitle = "WhenIsDue Integrity Conflicts";
  const channelLink = `${siteOrigin}/verify`;
  const channelDesc =
    "Cryptographically verifiable conflict proofs for registry integrity incidents.";

  const lastBuildDate = new Date().toUTCString();

  let xml = "";
  xml += `<?xml version="1.0" encoding="UTF-8"?>`;
  xml += `<rss version="2.0">`;
  xml += `<channel>`;
  xml += `<title>${xmlEscape(channelTitle)}</title>`;
  xml += `<link>${xmlEscape(channelLink)}</link>`;
  xml += `<description>${xmlEscape(channelDesc)}</description>`;
  xml += `<language>en</language>`;
  xml += `<lastBuildDate>${xmlEscape(lastBuildDate)}</lastBuildDate>`;

  for (const it of items) {
    xml += `<item>`;
    xml += `<title>${xmlEscape(it.itemTitle)}</title>`;
    xml += `<link>${xmlEscape(it.link)}</link>`;
    xml += `<guid isPermaLink="false">${it.guid}</guid>`;
    xml += `<pubDate>${xmlEscape(it.pubDate)}</pubDate>`;
    xml += `<description>${xmlEscape(it.itemDesc)}</description>`;
    xml += `</item>`;
  }

  xml += `</channel>`;
  xml += `</rss>`;

  await ensureDirForFile(outPath);
  await fs.writeFile(outPath, xml, "utf8");

  // eslint-disable-next-line no-console
  console.log(`OK buildIntegrityConflictsFeedXml items=${items.length} out=${outPath}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("FAIL buildIntegrityConflictsFeedXml", e?.message || e);
  process.exit(1);
});