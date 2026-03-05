// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Phase 18 — Deliverable 3 (File 2)
 * runMirrorSync.ts
 *
 * CLI orchestrator for MirrorSyncEngine.
 */

import fs from "fs";
import path from "path";
import { MirrorSyncEngine } from "./MirrorSyncEngine";

type Args = {
  baseUrl: string;
  mirrorId: string;
  dir: string;
  timeoutMs?: number;
  maxTiles?: number;
  jsonOut?: string;
  ua?: string;
};

function parseArgs(argv: string[]): { ok: true; args: Args } | { ok: false; message: string } {
  const a: any = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith("--")) continue;
    const key = k.slice(2);
    const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    a[key] = val;
  }

  const baseUrl = String(a.baseUrl || "");
  const mirrorId = String(a.mirrorId || "");
  const dir = String(a.dir || "");

  if (!baseUrl) return { ok: false, message: "Missing --baseUrl" };
  if (!mirrorId) return { ok: false, message: "Missing --mirrorId" };
  if (!dir) return { ok: false, message: "Missing --dir" };

  const timeoutMs = a.timeoutMs !== undefined ? toInt(a.timeoutMs, undefined) : undefined;
  const maxTiles = a.maxTiles !== undefined ? toInt(a.maxTiles, undefined) : undefined;
  const jsonOut = a.jsonOut ? String(a.jsonOut) : undefined;
  const ua = a.ua ? String(a.ua) : undefined;

  return {
    ok: true,
    args: { baseUrl, mirrorId, dir, timeoutMs, maxTiles, jsonOut, ua },
  };
}

function toInt(v: any, fallback: number | undefined): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function writeJsonAtomic(absPath: string, obj: unknown) {
  const dir = path.dirname(absPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = absPath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, absPath);
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed.ok) {
    console.error(parsed.message);
    process.exit(3); 
    return;
  }

  const { baseUrl, mirrorId, dir, timeoutMs, maxTiles, jsonOut, ua } = parsed.args;

  const engine = new MirrorSyncEngine();
  const res = await engine.run({
    baseUrl,
    mirrorId,
    mirrorDir: dir,
    timeoutMs,
    maxTilesPerRun: maxTiles,
    userAgent: ua,
  });

  if (res.ok) {
    console.log(
      `OK: committedTiles=${res.committedTiles} treeSize=${res.newTreeSize} rootHash=${res.newRootHash} summaryUpdated=${res.summaryUpdated}`
    );
    if (jsonOut) writeJsonAtomic(jsonOut, { status: "OK", ...res, baseUrl, mirrorId, mirrorDir: dir, ranAtUtc: new Date().toISOString() });
    process.exit(0);
  } else {
    console.error(`FAIL: ${res.code} ${res.message}`);
    if (jsonOut) writeJsonAtomic(jsonOut, { status: "FAIL", ...res, baseUrl, mirrorId, mirrorDir: dir, ranAtUtc: new Date().toISOString() });

    process.exit(2);
  }
}

main().catch((e) => {
  console.error("FATAL:", e?.message || String(e));
  process.exit(2);
});