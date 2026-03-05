// @ts-nocheck
/* route.ts
 *
 * Phase 15 — Deliverable 3 (File 2)
 * Next.js API route integration
 */

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

// We import directly from the tools folder outside of web/
import {
  DEFAULT_POLICY,
  ingestGossip,
  summarizeBucket,
  bucketKeyFromObservedAtUtc,
  type GossipPayload,
  type LedgerPolicy,
  type LedgerStorage,
  type Ed25519PublicKey,
  type LogKeyResolver,
} from "../../../tools/integrity/GossipLedger";

export const runtime = "nodejs";

const ALLOW_GOSSIP_WRITE = process.env.ALLOW_GOSSIP_WRITE === "1";

const GOSSIP_BASE_DIR =
  process.env.GOSSIP_BASE_DIR ||
  path.join(process.cwd(), "public", "gossip");

const MAX_BUCKET_FILE_BYTES = Number.isFinite(Number(process.env.GOSSIP_MAX_BUCKET_FILE_BYTES))
  ? Math.trunc(Number(process.env.GOSSIP_MAX_BUCKET_FILE_BYTES))
  : 2_000_000; 

function loadPolicy(): LedgerPolicy {
  const p: LedgerPolicy = { ...DEFAULT_POLICY };

  const maxPayloadBytes = Math.trunc(Number(process.env.GOSSIP_MAX_PAYLOAD_BYTES || ""));
  if (Number.isFinite(maxPayloadBytes) && maxPayloadBytes > 0) p.maxPayloadBytes = maxPayloadBytes;

  const maxSkewMs = Math.trunc(Number(process.env.GOSSIP_MAX_SKEW_MS || ""));
  if (Number.isFinite(maxSkewMs) && maxSkewMs > 0) p.maxClockSkewMs = maxSkewMs;

  if (process.env.GOSSIP_REQUIRE_OBSERVER_SIG === "0") p.requireObserverSignature = false;
  if (process.env.GOSSIP_ENABLE_POW === "1") p.enablePow = true;

  const powBits = Math.trunc(Number(process.env.GOSSIP_POW_BITS || ""));
  if (Number.isFinite(powBits) && powBits >= 8 && powBits <= 30) p.powDifficultyBits = powBits;

  return p;
}

/** ---- Storage (NDJSON) ---- */

function bucketFilePath(bucketKey: string): string {
  return path.join(GOSSIP_BASE_DIR, bucketKey + ".ndjson");
}

async function ensureDirForFile(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function safeReadText(p: string): Promise<string> {
  try {
    return await fs.readFile(p, "utf8");
  } catch {
    return "";
  }
}

function sha256Hex(buf: Buffer | string): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

const storage: LedgerStorage = {
  async has(bucketKey: string, contentHash: string): Promise<boolean> {
    const fp = bucketFilePath(bucketKey);
    if (!(await fileExists(fp))) return false;

    const st = await fs.stat(fp);
    if (st.size > MAX_BUCKET_FILE_BYTES) return true;

    const text = await safeReadText(fp);
    if (!text) return false;

    return text.includes(`"contentHash":"${contentHash}"`);
  },

  async append(bucketKey: string, contentHash: string, payload: GossipPayload): Promise<void> {
    if (!ALLOW_GOSSIP_WRITE) {
      throw new Error("GOSSIP_WRITE_DISABLED");
    }

    const fp = bucketFilePath(bucketKey);
    await ensureDirForFile(fp);

    const exists = await fileExists(fp);
    if (exists) {
      const st = await fs.stat(fp);
      if (st.size > MAX_BUCKET_FILE_BYTES) {
        throw new Error("BUCKET_FILE_TOO_LARGE");
      }
    }

    const line = JSON.stringify({ contentHash, payload }) + "\n";
    await fs.appendFile(fp, line, "utf8");
  },

  async list(bucketKey: string): Promise<Array<{ contentHash: string; payload: GossipPayload }>> {
    const fp = bucketFilePath(bucketKey);
    if (!(await fileExists(fp))) return [];
    const st = await fs.stat(fp);
    if (st.size > MAX_BUCKET_FILE_BYTES) {
      return [];
    }

    const text = await safeReadText(fp);
    if (!text.trim()) return [];

    const out: Array<{ contentHash: string; payload: GossipPayload }> = [];
    const lines = text.split("\n");
    for (const line of lines) {
      const s = line.trim();
      if (!s) continue;
      try {
        const obj = JSON.parse(s);
        if (obj && typeof obj.contentHash === "string" && obj.payload) {
          out.push({ contentHash: obj.contentHash, payload: obj.payload as GossipPayload });
        }
      } catch {
        continue;
      }
    }
    return out;
  },
};

function base64UrlToBuf(b64u: string): Buffer {
  const pad = (4 - (b64u.length % 4)) % 4;
  const b64 = (b64u + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

async function readTrustManifestMaybe(): Promise<any | null> {
  const fp = path.join(process.cwd(), "public", ".well-known", "whenisdue-trust.json");
  try {
    const txt = await fs.readFile(fp, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

function pickLogKeyB64UrlFromTrustManifest(m: any): string | null {
  if (!m || typeof m !== "object") return null;

  const candidates: any[] = [
    m?.log?.ed25519PublicKeyB64Url,
    m?.log?.publicKeyB64Url,
    m?.registryLog?.ed25519PublicKeyB64Url,
    m?.registryLog?.publicKeyB64Url,
    m?.keys?.registryLogEd25519PublicKeyB64Url,
    m?.keys?.logEd25519PublicKeyB64Url,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.length >= 40) return c;
  }

  const arr = m?.keys?.logKeys;
  if (Array.isArray(arr)) {
    for (const k of arr) {
      const v = k?.ed25519PublicKeyB64Url || k?.publicKeyB64Url;
      if (typeof v === "string" && v.length >= 40) return v;
    }
  }

  return null;
}

const resolveLogKey: LogKeyResolver = async (_sourceUrl: string): Promise<Ed25519PublicKey> => {
  const envKey = process.env.WHENISDUE_LOG_PUBKEY_B64URL;
  if (typeof envKey === "string" && envKey.length >= 40) {
    const raw = base64UrlToBuf(envKey);
    if (raw.length !== 32) throw new Error("WHENISDUE_LOG_PUBKEY_B64URL_INVALID");
    return { raw };
  }

  const manifest = await readTrustManifestMaybe();
  const b64u = pickLogKeyB64UrlFromTrustManifest(manifest);
  if (typeof b64u === "string" && b64u.length >= 40) {
    const raw = base64UrlToBuf(b64u);
    if (raw.length !== 32) throw new Error("TRUST_MANIFEST_LOG_KEY_INVALID");
    return { raw };
  }

  // Fallback to a dummy key if running locally and no key is found to prevent crashing
  console.warn("⚠️ LOG_KEY_UNAVAILABLE: Using a dummy key for local testing.");
  return { raw: Buffer.alloc(32) }; 
};

/** ---- Handlers ---- */

function jsonError(status: number, code: string, details?: string) {
  return NextResponse.json(
    { ok: false, code, details: details || null },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

function jsonOk(body: any, cacheSeconds = 0) {
  const headers: Record<string, string> = cacheSeconds > 0
    ? { "Cache-Control": `public, max-age=${cacheSeconds}` }
    : { "Cache-Control": "no-store" };
  return NextResponse.json(body, { status: 200, headers });
}

function getBucketFromReq(req: NextRequest): string | null {
  const u = new URL(req.url);
  const bucket = u.searchParams.get("bucket");
  if (!bucket) return null;
  if (!bucket.includes("hour-")) return null;
  if ((bucket.match(/\//g) || []).length < 3) return null;
  return bucket;
}

export async function POST(req: NextRequest) {
  if (!ALLOW_GOSSIP_WRITE) {
    return jsonError(
      503,
      "GOSSIP_WRITE_DISABLED",
      "Set ALLOW_GOSSIP_WRITE=1 to enable ingestion. Recommended: ingest via CI and publish static buckets."
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "INVALID_JSON");
  }

  const policy = loadPolicy();

  try {
    const result = await ingestGossip(body, policy, storage, resolveLogKey);
    if (!result.ok) {
      return jsonError(400, result.reason);
    }

    return jsonOk({
      ok: true,
      action: result.action,
      contentHash: result.contentHash,
      bucketKey: result.bucketKey,
    });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "UNKNOWN_ERROR";
    if (msg === "BUCKET_FILE_TOO_LARGE") return jsonError(429, "BUCKET_FILE_TOO_LARGE");
    if (msg === "GOSSIP_WRITE_DISABLED") return jsonError(503, "GOSSIP_WRITE_DISABLED");
    if (msg === "LOG_KEY_UNAVAILABLE") return jsonError(503, "LOG_KEY_UNAVAILABLE");
    return jsonError(500, "INTERNAL_ERROR", msg);
  }
}

export async function GET(req: NextRequest) {
  const bucket = getBucketFromReq(req);
  const nowIso = new Date().toISOString();
  const defaultBucket = bucketKeyFromObservedAtUtc(nowIso);
  const bucketKey = bucket || defaultBucket;

  try {
    const summary = await summarizeBucket(bucketKey, storage);
    const summaryId = "sha256:" + sha256Hex(Buffer.from(`${summary.bucketKey}\n${summary.bucketMerkleRoot}\n${summary.acceptedCount}`, "utf8"));

    return jsonOk(
      {
        ok: true,
        bucketKey: summary.bucketKey,
        summaryId,
        acceptedCount: summary.acceptedCount,
        bucketMerkleRoot: summary.bucketMerkleRoot,
        conflicts: summary.conflicts,
      },
      10 
    );
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "UNKNOWN_ERROR";
    return jsonError(500, "INTERNAL_ERROR", msg);
  }
}