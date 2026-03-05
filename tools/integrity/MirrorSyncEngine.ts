// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Phase 18 — Deliverable 3
 * MirrorSyncEngine.ts
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import https from "https";
import http from "http";
import { URL } from "url";

import { canonicalizeJson } from "./TrustVerdictEngine";

export type MirrorSyncOptions = {
  baseUrl: string;        
  mirrorId: string;       
  mirrorDir: string;      
  userAgent?: string;
  timeoutMs?: number;     
  maxTilesPerRun?: number; 
};

type TrustContract = any;

type Sth = {
  origin?: string;
  treeSize: number;
  rootHash: string; 
  timestamp: string;
  signature: string; 
};

type SyncManifest = {
  specVersion?: string;
  publishedUtc?: string;
  latest?: {
    treeSize: number;
    rootHash: string;
    timestamp: string;
  };
  tiles?: Array<{ path: string; sha256: string; size: number }>;
};

type GossipObservation = {
  observedAtUtc: string;
  sourceUrl: string;
  treeSize: number;
  rootHash: string;
  sthHash: string; 
};

type SyncResult =
  | { ok: true; committedTiles: number; newTreeSize: number; newRootHash: string; summaryUpdated: boolean }
  | { ok: false; code: string; message: string };

export class MirrorSyncEngine {
  async run(opts: MirrorSyncOptions): Promise<SyncResult> {
    const timeoutMs = Number.isFinite(opts.timeoutMs) ? Math.max(1000, opts.timeoutMs!) : 15000;
    const maxTiles = Number.isFinite(opts.maxTilesPerRun) ? Math.max(1, opts.maxTilesPerRun!) : 500;
    const ua = opts.userAgent || "whenisdue-mirror-sync/1.0";

    ensureDir(opts.mirrorDir);
    ensureDir(path.join(opts.mirrorDir, "transparency", "sth"));
    ensureDir(path.join(opts.mirrorDir, "transparency", "tiles"));
    ensureDir(path.join(opts.mirrorDir, "gossip", "observations"));

    const trustUrl = new URL("/.well-known/whenisdue-trust.json", opts.baseUrl).toString();
    const sthUrl = new URL("/transparency/sth/latest.json", opts.baseUrl).toString();
    const manifestUrl = new URL("/transparency/sync-manifest.json", opts.baseUrl).toString();

    const trust = await fetchJson(trustUrl, ua, timeoutMs);
    if (!trust.ok) return { ok: false, code: "FETCH_FAIL", message: `trust: ${trust.message}` };

    const remoteSth = await fetchJson(sthUrl, ua, timeoutMs);
    if (!remoteSth.ok) return { ok: false, code: "FETCH_FAIL", message: `sth: ${remoteSth.message}` };

    const remoteManifest = await fetchJson(manifestUrl, ua, timeoutMs);
    if (!remoteManifest.ok) return { ok: false, code: "FETCH_FAIL", message: `manifest: ${remoteManifest.message}` };

    const trustContract = trust.data as TrustContract;
    const sth = normalizeSth(remoteSth.data);
    const manifest = normalizeManifest(remoteManifest.data);

    if (!sth.ok) return { ok: false, code: "BAD_STH", message: sth.message };
    if (!manifest.ok) return { ok: false, code: "BAD_MANIFEST", message: manifest.message };

    const regKey = resolveRegistryPublicKey(trustContract);
    if (!regKey) return { ok: false, code: "KEY_RESOLUTION_FAIL", message: "Registry public key not found in trust contract" };

    const sthCore = {
      origin: sth.value.origin,
      treeSize: sth.value.treeSize,
      rootHash: sth.value.rootHash,
      timestamp: sth.value.timestamp,
    };

    const sthCoreJcs = Buffer.from(canonicalizeJson(sthCore), "utf8");
    const sthSigOk = verifyEd25519SigHexOrB64(regKey.publicKeyBytes, sthCoreJcs, sth.value.signature);
    if (!sthSigOk) return { ok: false, code: "STH_SIG_INVALID", message: "Remote STH signature invalid" };

    const localSthPath = path.join(opts.mirrorDir, "transparency", "sth", "latest.json");
    const localSth = fs.existsSync(localSthPath) ? safeReadJson(localSthPath) : null;

    const localTreeSize = toInt(localSth?.treeSize, 0);
    const remoteTreeSize = sth.value.treeSize;

    if (remoteTreeSize < localTreeSize) {
      return { ok: false, code: "ROLLBACK_DETECTED", message: `Remote treeSize ${remoteTreeSize} < local ${localTreeSize}` };
    }

    const tiles = mapManifestTiles(manifest.value);
    if (!tiles.length) {
      return { ok: false, code: "NO_TILES", message: "sync-manifest.json contains no tiles[] entries" };
    }

    const missing = tiles
      .filter((t) => !fs.existsSync(path.join(opts.mirrorDir, "transparency", "tiles", t.path)))
      .slice(0, maxTiles);

    let committed = 0;
    for (const t of missing) {
      const tileUrl = new URL(`/transparency/tiles/${trimLeadingSlash(t.path)}`, opts.baseUrl).toString();

      const bytes = await fetchBytes(tileUrl, ua, timeoutMs);
      if (!bytes.ok) return { ok: false, code: "FETCH_FAIL", message: `tile ${t.path}: ${bytes.message}` };

      if (Number.isFinite(t.size) && t.size > 0 && bytes.data.length !== t.size) {
        return { ok: false, code: "TILE_SIZE_MISMATCH", message: `tile ${t.path}: got ${bytes.data.length}, expected ${t.size}` };
      }

      const actualHex = sha256(bytes.data).toString("hex");
      const expectedHex = normalizeSha256Hex(t.sha256);
      if (!expectedHex) {
        return { ok: false, code: "BAD_MANIFEST", message: `tile ${t.path}: manifest sha256 not parseable` };
      }
      if (actualHex !== expectedHex) {
        return { ok: false, code: "TILE_HASH_MISMATCH", message: `tile ${t.path}: hash mismatch` };
      }

      const absTilePath = path.join(opts.mirrorDir, "transparency", "tiles", t.path);
      ensureDir(path.dirname(absTilePath));
      writeFileAtomic(absTilePath, bytes.data);
      committed++;
    }

    writeJsonAtomic(path.join(opts.mirrorDir, "transparency", "sth", "latest.json"), sth.value);
    writeJsonAtomic(path.join(opts.mirrorDir, "transparency", "sync-manifest.json"), manifest.value);

    const sthHash = sha256(Buffer.from(canonicalizeJson(sthCore), "utf8")).toString("hex");
    const obs: GossipObservation = {
      observedAtUtc: new Date().toISOString(),
      sourceUrl: opts.baseUrl,
      treeSize: sth.value.treeSize,
      rootHash: sth.value.rootHash,
      sthHash,
    };
    const obsName = `obs_${obs.observedAtUtc.replace(/[:.]/g, "-")}_${sth.value.treeSize}.json`;
    writeJsonAtomic(path.join(opts.mirrorDir, "gossip", "observations", obsName), obs);

    const summaryUpdated = buildGossipSummary(opts.mirrorDir);

    const idxPath = path.join(opts.mirrorDir, "mirror", "index.json");
    ensureDir(path.dirname(idxPath));

    const mirrorIndex = {
      mirrorId: opts.mirrorId,
      baseUrl: opts.baseUrl,
      supportedArtifacts: ["tiles", "sth_history", "diffs", "gossip"],
      lastObservedSTH: {
        treeSize: sth.value.treeSize,
        rootHash: sth.value.rootHash,
        timestamp: sth.value.timestamp,
      },
      updatedUtc: new Date().toISOString(),
    };
    writeJsonAtomic(idxPath, mirrorIndex);

    return {
      ok: true,
      committedTiles: committed,
      newTreeSize: sth.value.treeSize,
      newRootHash: sth.value.rootHash,
      summaryUpdated,
    };
  }
}

/* ----------------------------- Gossip Summary ----------------------------- */

function buildGossipSummary(mirrorDir: string): boolean {
  const obsDir = path.join(mirrorDir, "gossip", "observations");
  if (!fs.existsSync(obsDir)) return false;

  const files = fs.readdirSync(obsDir).filter((f) => f.endsWith(".json")).sort();
  const observations: GossipObservation[] = [];

  for (const f of files) {
    const p = path.join(obsDir, f);
    const j = safeReadJson(p);
    if (!j) continue;
    if (!Number.isFinite(toInt(j.treeSize, NaN))) continue;
    if (typeof j.rootHash !== "string") continue;
    if (typeof j.observedAtUtc !== "string") continue;
    observations.push(j as GossipObservation);
  }

  const latestBySource: Record<string, GossipObservation> = {};
  for (const o of observations) {
    const k = String(o.sourceUrl || "");
    if (!k) continue;
    const prev = latestBySource[k];
    if (!prev || String(o.observedAtUtc) > String(prev.observedAtUtc)) {
      latestBySource[k] = o;
    }
  }

  const summary = {
    updatedUtc: new Date().toISOString(),
    count: observations.length,
    observations: observations.map((o) => sha256(Buffer.from(canonicalizeJson(o), "utf8")).toString("hex")),
    latestSTHs: Object.fromEntries(
      Object.entries(latestBySource)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([k, v]) => [k, { treeSize: v.treeSize, rootHash: v.rootHash, observedAtUtc: v.observedAtUtc, sthHash: v.sthHash }])
    ),
  };

  const outPath = path.join(mirrorDir, "gossip", "summary.json");
  writeJsonAtomic(outPath, summary);
  return true;
}

/* ----------------------------- Manifest + STH Normalization ----------------------------- */

function normalizeSth(raw: any): { ok: true; value: Sth } | { ok: false; message: string } {
  if (!raw || typeof raw !== "object") return { ok: false, message: "STH is not an object" };
  const treeSize = toInt(raw.treeSize, NaN);
  const rootHash = typeof raw.rootHash === "string" ? raw.rootHash : "";
  const timestamp = typeof raw.timestamp === "string" ? raw.timestamp : "";
  const signature = typeof raw.signature === "string" ? raw.signature : "";
  const origin = typeof raw.origin === "string" ? raw.origin : "whenisdue.com/v1";

  if (!Number.isFinite(treeSize) || treeSize < 0) return { ok: false, message: "STH.treeSize invalid" };
  if (!rootHash) return { ok: false, message: "STH.rootHash missing" };
  if (!timestamp) return { ok: false, message: "STH.timestamp missing" };
  if (!signature) return { ok: false, message: "STH.signature missing" };

  return { ok: true, value: { origin, treeSize, rootHash, timestamp, signature } };
}

function normalizeManifest(raw: any): { ok: true; value: SyncManifest } | { ok: false; message: string } {
  if (!raw || typeof raw !== "object") return { ok: false, message: "sync-manifest is not an object" };
  const tiles = Array.isArray(raw.tiles) ? raw.tiles : [];
  return { ok: true, value: { ...raw, tiles } };
}

function mapManifestTiles(m: SyncManifest): Array<{ path: string; sha256: string; size: number }> {
  const tiles = Array.isArray(m.tiles) ? m.tiles : [];
  const out: Array<{ path: string; sha256: string; size: number }> = [];
  for (const t of tiles) {
    if (!t || typeof t !== "object") continue;
    const p = typeof (t as any).path === "string" ? (t as any).path : "";
    const h = typeof (t as any).sha256 === "string" ? (t as any).sha256 : "";
    const s = toInt((t as any).size, 0);
    if (!p || !h) continue;
    out.push({ path: normalizeRelPath(p), sha256: h, size: s });
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

/* ----------------------------- Trust Contract Key Resolution ----------------------------- */

function resolveRegistryPublicKey(trustContract: any): { publicKeyBytes: Buffer; fingerprint: string } | null {
  const candidates: any[] = [];
  if (Array.isArray(trustContract?.registryKeys)) candidates.push(...trustContract.registryKeys);
  if (Array.isArray(trustContract?.keys)) candidates.push(...trustContract.keys);
  if (trustContract?.registry?.publicKey) candidates.push({ publicKey: trustContract.registry.publicKey, id: "registry" });

  for (const k of candidates) {
    const raw = k?.publicKeyEd25519 ?? k?.publicKey ?? k?.key ?? null;
    if (!raw) continue;

    const pub = decodeKeyToRaw32(raw);
    if (!pub) continue;

    const fp = k?.fingerprint ?? k?.kid ?? k?.id ?? `eddsa:${pub.toString("hex").slice(0, 16)}…`;
    return { publicKeyBytes: pub, fingerprint: String(fp) };
  }
  return null;
}

/* ----------------------------- Network (no deps) ----------------------------- */

async function fetchJson(url: string, ua: string, timeoutMs: number): Promise<{ ok: true; data: any } | { ok: false; message: string }> {
  const bytes = await fetchBytes(url, ua, timeoutMs);
  if (!bytes.ok) return bytes;
  try {
    return { ok: true, data: JSON.parse(bytes.data.toString("utf8")) };
  } catch {
    return { ok: false, message: "Invalid JSON" };
  }
}

async function fetchBytes(urlStr: string, ua: string, timeoutMs: number): Promise<{ ok: true; data: Buffer } | { ok: false; message: string }> {
  const url = new URL(urlStr);
  const isHttps = url.protocol === "https:";
  const mod = isHttps ? https : http;

  return await new Promise((resolve) => {
    const req = mod.request(
      url,
      {
        method: "GET",
        headers: {
          "User-Agent": ua,
          "Accept": "application/json, application/octet-stream;q=0.9, */*;q=0.8",
        },
      },
      (res) => {
        const status = res.statusCode || 0;
        const chunks: Buffer[] = [];
        res.on("data", (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
        res.on("end", () => {
          const body = Buffer.concat(chunks);
          if (status >= 200 && status < 300) return resolve({ ok: true, data: body });
          return resolve({ ok: false, message: `HTTP ${status}` });
        });
      }
    );

    req.on("error", () => resolve({ ok: false, message: "Network error" }));
    req.setTimeout(timeoutMs, () => {
      try { req.destroy(); } catch { }
      resolve({ ok: false, message: "Timeout" });
    });
    req.end();
  });
}

/* ----------------------------- Crypto + Encoding ----------------------------- */

function sha256(buf: Buffer): Buffer {
  return crypto.createHash("sha256").update(buf).digest();
}

function verifyEd25519SigHexOrB64(pubRaw32: Buffer, message: Buffer, sig: string): boolean {
  const sigBytes = decodeSig(sig);
  if (!sigBytes || sigBytes.length !== 64) return false;

  return crypto.verify(
    null,
    message,
    { key: ed25519PublicKeyFromRaw(pubRaw32), dsaEncoding: "ieee-p1363" as any },
    sigBytes
  );
}

function ed25519PublicKeyFromRaw(raw32: Buffer): crypto.KeyObject {
  const prefix = Buffer.from("302a300506032b6570032100", "hex");
  const spki = Buffer.concat([prefix, raw32]);
  return crypto.createPublicKey({ key: spki, format: "der", type: "spki" });
}

function decodeSig(s: string): Buffer | null {
  const t = String(s || "").trim();
  if (/^[0-9a-fA-F]{128}$/.test(t)) return Buffer.from(t, "hex");
  try {
    const b64 = t.replace(/-/g, "+").replace(/_/g, "/");
    const buf = Buffer.from(b64, "base64");
    return buf.length ? buf : null;
  } catch {
    return null;
  }
}

function decodeKeyToRaw32(v: any): Buffer | null {
  if (typeof v !== "string") return null;
  const s = v.trim();

  if (/^[0-9a-fA-F]{64}$/.test(s)) return Buffer.from(s, "hex");

  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const buf = Buffer.from(b64, "base64");
    if (buf.length === 32) return buf;
  } catch {
  }

  if (s.startsWith("z")) {
    const decoded = base58btcDecode(s.slice(1));
    if (decoded && decoded.length === 32) return decoded;
  }

  return null;
}

function base58btcDecode(s: string): Buffer | null {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const map: Record<string, number> = {};
  for (let i = 0; i < alphabet.length; i++) map[alphabet[i]] = i;

  let num = BigInt(0);
  for (const ch of s) {
    const val = map[ch];
    if (val === undefined) return null;
    num = num * BigInt(58) + BigInt(val);
  }

  let bytes: number[] = [];
  while (num > 0) {
    bytes.push(Number(num % BigInt(256)));
    num = num / BigInt(256);
  }
  bytes = bytes.reverse();

  let leadingZeros = 0;
  for (const ch of s) {
    if (ch === "1") leadingZeros++;
    else break;
  }
  return Buffer.concat([Buffer.alloc(leadingZeros), Buffer.from(bytes)]);
}

function normalizeSha256Hex(h: string): string | null {
  const s = String(h || "").trim().toLowerCase();
  const m = s.startsWith("sha256:") ? s.slice("sha256:".length) : s;
  if (!/^[0-9a-f]{64}$/.test(m)) return null;
  return m;
}

/* ----------------------------- File helpers (atomic) ----------------------------- */

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function writeFileAtomic(absPath: string, bytes: Buffer) {
  ensureDir(path.dirname(absPath));
  const tmp = absPath + ".tmp";
  fs.writeFileSync(tmp, bytes);
  fs.renameSync(tmp, absPath);
}

function writeJsonAtomic(absPath: string, obj: unknown) {
  ensureDir(path.dirname(absPath));
  const tmp = absPath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, absPath);
}

function safeReadJson(p: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function toInt(v: any, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function normalizeRelPath(p: string): string {
  const s = String(p || "").replace(/\\/g, "/").trim();
  if (!s) throw new Error("Empty path");
  if (s.startsWith("/")) throw new Error("Absolute paths not allowed");
  if (s.includes("..")) throw new Error("Parent traversal not allowed");
  return s.replace(/^\.?\//, "");
}

function trimLeadingSlash(p: string): string {
  return String(p || "").replace(/^\/+/, "");
}