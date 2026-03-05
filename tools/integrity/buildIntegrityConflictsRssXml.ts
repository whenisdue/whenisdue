// @ts-nocheck
/* eslint-disable no-console */
/**
 * buildIntegrityConflictsRssXml.ts
 *
 * Phase 19 — Deliverable 1, File 5
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

type ConflictIndex = {
  version: number;
  updatedAtUtc: string;
  proofs?: number;
  invalid?: number;
  conflicts: Array<{
    conflictId: string;
    conflictType: string;
    severity?: string;
    detectedAtUtc: string;
    detectedBy: string;
    logId: string;
    treeSizeA: number;
    rootHashA: string;
    treeSizeB: number;
    rootHashB: string;
    canonicalConflictHash: string;
    href: string;
  }>;
};

function readUtf8(p: string): string {
  return fs.readFileSync(p, "utf8");
}

function writeUtf8(p: string, s: string): void {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s, "utf8");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sha256Hex(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function isoToRfc822(isoUtc: string): string {
  const d = new Date(isoUtc);
  if (!Number.isFinite(d.getTime())) return new Date(0).toUTCString();
  return d.toUTCString();
}

function buildItemGuid(conflictId: string, canonicalConflictHash: string): string {
  return `urn:whenisdue:conflict:${conflictId}:${canonicalConflictHash}`;
}

function buildFeed(params: {
  siteBaseUrl: string;
  index: ConflictIndex | null;
  nowIso: string;
  indexError?: string;
}): string {
  const { siteBaseUrl, index, nowIso, indexError } = params;

  const channelTitle = "WhenIsDue Integrity Conflicts";
  const channelLink = `${siteBaseUrl}/integrity/conflicts`;
  const channelDesc =
    "Machine-verifiable conflict proofs for equivocation, rollback, and prefix mismatch events.";

  const items: string[] = [];

  if (!index) {
    const guid = `urn:whenisdue:conflict:index-error:${sha256Hex(indexError || "index_error")}`;
    items.push(
      [
        "<item>",
        `<title>${escapeXml("Integrity conflict index unavailable")}</title>`,
        `<link>${escapeXml(channelLink)}</link>`,
        `<guid isPermaLink="false">${escapeXml(guid)}</guid>`,
        `<pubDate>${escapeXml(isoToRfc822(nowIso))}</pubDate>`,
        `<description>${escapeXml(indexError || "index.json missing or malformed")}</description>`,
        "</item>",
      ].join("")
    );
  } else {
    for (const c of index.conflicts) {
      const title = `[${c.severity || "RED"}] ${c.conflictType} — treeSize ${c.treeSizeA} vs ${c.treeSizeB}`;
      const link = `${siteBaseUrl}${c.href.startsWith("/") ? c.href : `/${c.href}`}`;
      const guid = buildItemGuid(c.conflictId, c.canonicalConflictHash);

      const descLines = [
        `Conflict ID: ${c.conflictId}`,
        `Type: ${c.conflictType}`,
        `Severity: ${c.severity || "RED"}`,
        `Log ID: ${c.logId}`,
        `Detected by: ${c.detectedBy}`,
        `Detected at (UTC): ${c.detectedAtUtc}`,
        `STH A: size=${c.treeSizeA} root=${c.rootHashA}`,
        `STH B: size=${c.treeSizeB} root=${c.rootHashB}`,
        `Canonical conflict hash: ${c.canonicalConflictHash}`,
      ];

      items.push(
        [
          "<item>",
          `<title>${escapeXml(title)}</title>`,
          `<link>${escapeXml(link)}</link>`,
          `<guid isPermaLink="false">${escapeXml(guid)}</guid>`,
          `<pubDate>${escapeXml(isoToRfc822(c.detectedAtUtc))}</pubDate>`,
          `<description>${escapeXml(descLines.join(" | "))}</description>`,
          "</item>",
        ].join("")
      );
    }

    if (index.conflicts.length === 0) {
      const guid = `urn:whenisdue:conflict:none:${sha256Hex(index.updatedAtUtc)}`;
      items.push(
        [
          "<item>",
          `<title>${escapeXml("No active conflicts")}</title>`,
          `<link>${escapeXml(channelLink)}</link>`,
          `<guid isPermaLink="false">${escapeXml(guid)}</guid>`,
          `<pubDate>${escapeXml(isoToRfc822(index.updatedAtUtc || nowIso))}</pubDate>`,
          `<description>${escapeXml(
            "No conflict proofs are currently listed in integrity/conflicts/index.json."
          )}</description>`,
          "</item>",
        ].join("")
      );
    }
  }

  const lastBuild = index?.updatedAtUtc && index.updatedAtUtc.endsWith("Z") ? index.updatedAtUtc : nowIso;

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0">` +
    `<channel>` +
    `<title>${escapeXml(channelTitle)}</title>` +
    `<link>${escapeXml(channelLink)}</link>` +
    `<description>${escapeXml(channelDesc)}</description>` +
    `<language>en</language>` +
    `<lastBuildDate>${escapeXml(isoToRfc822(lastBuild))}</lastBuildDate>` +
    items.join("") +
    `</channel>` +
    `</rss>` +
    `\n`
  );
}

function main(): void {
  const conflictsDir = process.env.WID_CONFLICTS_DIR || "integrity/conflicts";
  const indexPath = process.env.WID_CONFLICTS_INDEX_PATH || path.join(conflictsDir, "index.json");
  const outPath = process.env.WID_CONFLICTS_FEED_PATH || path.join(conflictsDir, "feed.xml");
  const siteBaseUrl = process.env.WID_SITE_BASE_URL || "https://whenisdue.com";

  const nowIso = new Date().toISOString();

  let index: ConflictIndex | null = null;
  let indexError: string | undefined;

  try {
    if (!fs.existsSync(indexPath)) throw new Error("index.json not found");
    const raw = readUtf8(indexPath);
    const parsed = JSON.parse(raw) as ConflictIndex;

    if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as any).conflicts)) {
      throw new Error("index.json malformed");
    }
    index = parsed;
  } catch (e: any) {
    index = null;
    indexError = String(e?.message || e);
  }

  const xml = buildFeed({ siteBaseUrl, index, nowIso, indexError });
  writeUtf8(outPath, xml);

  console.log(
    JSON.stringify(
      {
        ok: true,
        wrote: outPath,
        indexUsed: Boolean(index),
        conflicts: index?.conflicts?.length ?? 0,
        indexError: index ? null : indexError,
      },
      null,
      2
    )
  );
}

if (require.main === module) {
  try {
    main();
  } catch (e: any) {
    console.error(String(e?.message || e));
    process.exit(2);
  }
}