// @ts-nocheck
/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { spawnSync } from "child_process";

// ---------------------------------------------------------------------
// Phase 16 — Deliverable 2
// Anchor Publication Orchestrator (DNS + GitHub + Rekor)
// ---------------------------------------------------------------------

const NOW_UTC = mustEnv("WHENISDUE_NOW_UTC"); 
const LOG_ID = mustEnv("WHENISDUE_LOG_ID"); 
const DNS_RECORD_NAME = mustEnv("WHENISDUE_DNS_RECORD_NAME"); 
const DNS_FORMAT_VERSION = mustEnv("WHENISDUE_DNS_FORMAT_VERSION"); 

const PRIMARY_STH_PATH = mustEnv("WHENISDUE_PRIMARY_STH_PATH"); 
const WITNESSED_STH_PATH = mustEnv("WHENISDUE_WITNESSED_STH_PATH"); 

const OUTPUT_DIR = mustEnv("WHENISDUE_ANCHOR_OUTPUT_DIR"); 

const ENABLE_DNS = mustEnvBool("WHENISDUE_PUBLISH_DNS"); 
const ENABLE_GITHUB = mustEnvBool("WHENISDUE_PUBLISH_GITHUB"); 
const ENABLE_REKOR = mustEnvBool("WHENISDUE_PUBLISH_REKOR"); 

const DNS_PROVIDER = mustEnv("WHENISDUE_DNS_PROVIDER"); 
const DNS_TTL_SECONDS = mustEnvInt("WHENISDUE_DNS_TTL_SECONDS"); 
const DNS_SIGNING_PRIVATE_KEY_B64 = mustEnv("WHENISDUE_DNS_SIGNING_PRIVATE_KEY_B64"); 

const GITHUB_ATTEST_CMD = mustEnv("WHENISDUE_GITHUB_ATTEST_CMD"); 
const GITHUB_ATTEST_SUBJECT_PATH = mustEnv("WHENISDUE_GITHUB_ATTEST_SUBJECT_PATH"); 
const GITHUB_ATTEST_PREDICATE_PATH = mustEnv("WHENISDUE_GITHUB_ATTEST_PREDICATE_PATH"); 

const REKOR_UPLOAD_CMD = mustEnv("WHENISDUE_REKOR_UPLOAD_CMD"); 
const REKOR_ARTIFACT_PATH = mustEnv("WHENISDUE_REKOR_ARTIFACT_PATH"); 
const REKOR_OUTPUT_JSON_PATH = mustEnv("WHENISDUE_REKOR_OUTPUT_JSON_PATH"); 

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN ?? "";
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID ?? "";

type PrimarySTH = {
  origin: string;
  treeSize: number;
  rootHash: string; 
  timestamp: string; 
  signature: string; 
};

type WitnessedSTHArtifact = {
  primarySTH: PrimarySTH;
  quorumPolicy: { required: number; total: number; minWitnessAgeHours: number };
  witnesses: Array<{
    witnessId: string;
    publicKey: string;
    signature: string;
    observedAtUtc: string;
    status: "VALID" | "INVALID" | "STALE" | "UNKNOWN";
  }>;
  hashAlgorithm: "sha256";
  serialization: "rfc8785";
  validWitnessCount: number;
  healthState: "GREEN" | "AMBER" | "RED" | "CRITICAL";
  healthReason: string;
};

type AnchorRecord = {
  specVersion: "1.0.0";
  logId: string;
  dns: {
    name: string;
    ttlSeconds: number;
    value: string; 
    valueSha256: string; 
    signedAtUtc: string;
    signatureEd25519: string; 
    keyFingerprint: string; 
  };
  inputs: {
    primarySthPath: string;
    witnessedSthPath: string;
  };
  sth: {
    size: number;
    rootHash: string;
    sthJsonSha256: string;
    sthSignature: string;
    sthTimestamp: string;
  };
  witnessed: {
    witnessedJsonSha256: string;
    quorumRequired: number;
    quorumTotal: number;
    validWitnessCount: number;
    healthState: WitnessedSTHArtifact["healthState"];
  };
};

function main(): void {
  if (!isIsoUtc(NOW_UTC)) fail("WHENISDUE_NOW_UTC must be ISO 8601 UTC (ends with Z)");

  const primary = readJsonStrict<PrimarySTH>(PRIMARY_STH_PATH);
  validatePrimarySTH(primary);

  const witnessed = readJsonStrict<WitnessedSTHArtifact>(WITNESSED_STH_PATH);
  validateWitnessedArtifact(witnessed);

  const primaryRaw = fs.readFileSync(PRIMARY_STH_PATH, "utf8");
  const witnessedRaw = fs.readFileSync(WITNESSED_STH_PATH, "utf8");

  const sthJsonSha256 = sha256Hex(primaryRaw);
  const witnessedJsonSha256 = sha256Hex(witnessedRaw);

  const unsignedValue = [
    `v=${DNS_FORMAT_VERSION}`,
    `log=${LOG_ID}`,
    `size=${toNonNegInt(primary.treeSize)}`,
    `root=${stripSha256Prefix(primary.rootHash)}`,
    `sth=${sthJsonSha256}`,
    `t=${NOW_UTC}`,
  ].join("; ");

  const { signatureB64, pubKeyB64, pubKeyFingerprintHex } = ed25519SignDetachedBase64(
    base64ToBytes(DNS_SIGNING_PRIVATE_KEY_B64),
    utf8ToBytes(unsignedValue)
  );

  const fullValue = `${unsignedValue}; s=${signatureB64}`;

  const record: AnchorRecord = {
    specVersion: "1.0.0",
    logId: LOG_ID,
    dns: {
      name: DNS_RECORD_NAME,
      ttlSeconds: DNS_TTL_SECONDS,
      value: fullValue,
      valueSha256: sha256Hex(fullValue),
      signedAtUtc: NOW_UTC,
      signatureEd25519: signatureB64,
      keyFingerprint: pubKeyFingerprintHex,
    },
    inputs: {
      primarySthPath: PRIMARY_STH_PATH,
      witnessedSthPath: WITNESSED_STH_PATH,
    },
    sth: {
      size: toNonNegInt(primary.treeSize),
      rootHash: primary.rootHash,
      sthJsonSha256,
      sthSignature: primary.signature,
      sthTimestamp: primary.timestamp,
    },
    witnessed: {
      witnessedJsonSha256,
      quorumRequired: toNonNegInt(witnessed.quorumPolicy.required),
      quorumTotal: toNonNegInt(witnessed.quorumPolicy.total),
      validWitnessCount: toNonNegInt(witnessed.validWitnessCount),
      healthState: witnessed.healthState,
    },
  };

  ensureDir(OUTPUT_DIR);

  const anchorRecordPath = path.join(OUTPUT_DIR, "anchor-record.json");
  writeCanonicalJson(anchorRecordPath, record);

  const dnsValuePath = path.join(OUTPUT_DIR, "dns-txt-value.txt");
  fs.writeFileSync(dnsValuePath, fullValue + "\n", "utf8");

  console.log(`[anchor] wrote ${anchorRecordPath}`);
  console.log(`[anchor] dns value sha256 ${record.dns.valueSha256}`);
  console.log(`[anchor] key fingerprint ${record.dns.keyFingerprint}`);

  if (ENABLE_DNS) publishDns(record);
  if (ENABLE_GITHUB) publishGithubAttestation(record);
  if (ENABLE_REKOR) publishRekor(record);

  console.log("[anchor] publication complete");
}

main();

function publishDns(record: AnchorRecord): void {
  console.log(`[dns] provider=${DNS_PROVIDER}`);

  if (DNS_PROVIDER === "DRY_RUN") {
    console.log(`[dns] DRY_RUN would set TXT ${record.dns.name} ttl=${record.dns.ttlSeconds}`);
    console.log(`[dns] value: ${record.dns.value}`);
    return;
  }

  if (DNS_PROVIDER === "CLOUDFLARE") {
    if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
      fail("CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID are required for DNS_PROVIDER=CLOUDFLARE");
    }
    cloudflareUpsertTxt({
      apiToken: CLOUDFLARE_API_TOKEN,
      zoneId: CLOUDFLARE_ZONE_ID,
      name: record.dns.name,
      ttl: record.dns.ttlSeconds,
      content: record.dns.value,
    });
    console.log(`[dns] Cloudflare upsert complete: ${record.dns.name}`);
    return;
  }

  fail(`Unsupported WHENISDUE_DNS_PROVIDER: ${DNS_PROVIDER}`);
}

function cloudflareUpsertTxt(args: {
  apiToken: string;
  zoneId: string;
  name: string;
  ttl: number;
  content: string;
}): void {
  const https = require("https") as typeof import("https");

  const base = `https://api.cloudflare.com/client/v4/zones/${args.zoneId}/dns_records`;

  const searchUrl = `${base}?type=TXT&name=${encodeURIComponent(args.name)}`;
  const search = httpJson(https, searchUrl, args.apiToken, "GET", undefined);
  if (!search.success) fail(`[dns] Cloudflare search failed: ${searchUrl}`);

  const records: Array<{ id: string; content: string }> = Array.isArray(search.result) ? search.result : [];
  const existing = records.length ? records[0] : null;

  const payload = JSON.stringify({
    type: "TXT",
    name: args.name,
    content: args.content,
    ttl: args.ttl,
  });

  if (existing) {
    const putUrl = `${base}/${existing.id}`;
    const put = httpJson(https, putUrl, args.apiToken, "PUT", payload);
    if (!put.success) fail(`[dns] Cloudflare update failed: ${putUrl}`);
    return;
  }

  const post = httpJson(https, base, args.apiToken, "POST", payload);
  if (!post.success) fail(`[dns] Cloudflare create failed: ${base}`);
}

function httpJson(
  https: typeof import("https"),
  urlStr: string,
  token: string,
  method: "GET" | "POST" | "PUT",
  body: string | undefined
): any {
  const url = new URL(urlStr);

  const res = execHttps(https, {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Content-Length": body ? Buffer.byteLength(body) : 0,
    },
  }, body);

  const parsed = safeJsonParse(res.body);
  if (!parsed) {
    fail(`[dns] Non-JSON response from Cloudflare (${method} ${urlStr}) status=${res.statusCode}`);
  }
  if (res.statusCode < 200 || res.statusCode >= 300) {
    fail(`[dns] Cloudflare HTTP ${res.statusCode} (${method} ${urlStr})`);
  }
  return parsed;
}

function execHttps(
  https: typeof import("https"),
  opts: any,
  body?: string
): { statusCode: number; body: string } {
  const chunks: Buffer[] = [];
  const req = https.request(opts);
  return new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
    req.on("response", (resp: any) => {
      resp.on("data", (d: Buffer) => chunks.push(d));
      resp.on("end", () => resolve({ statusCode: resp.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  }) as any;
}

function publishGithubAttestation(record: AnchorRecord): void {
  const predicate = {
    predicateType: "https://whenisdue.com/spec/anchor-publication/v1",
    issuedAtUtc: NOW_UTC,
    logId: record.logId,
    dns: record.dns,
    sth: record.sth,
    witnessed: record.witnessed,
  };

  ensureDir(path.dirname(GITHUB_ATTEST_PREDICATE_PATH));
  writeCanonicalJson(GITHUB_ATTEST_PREDICATE_PATH, predicate);

  console.log("[github] running attestation command");
  runShellOrFail(GITHUB_ATTEST_CMD, {
    WHENISDUE_ATTEST_SUBJECT: GITHUB_ATTEST_SUBJECT_PATH,
    WHENISDUE_ATTEST_PREDICATE: GITHUB_ATTEST_PREDICATE_PATH,
  });

  console.log("[github] attestation command completed");
}

function publishRekor(record: AnchorRecord): void {
  ensureDir(path.dirname(REKOR_OUTPUT_JSON_PATH));

  console.log("[rekor] running upload command");
  runShellOrFail(REKOR_UPLOAD_CMD, {
    WHENISDUE_REKOR_ARTIFACT: REKOR_ARTIFACT_PATH,
    WHENISDUE_REKOR_OUTPUT: REKOR_OUTPUT_JSON_PATH,
    WHENISDUE_LOG_ID: record.logId,
    WHENISDUE_NOW_UTC: NOW_UTC,
    WHENISDUE_DNS_VALUE_SHA256: record.dns.valueSha256,
  });

  if (REKOR_OUTPUT_JSON_PATH.trim().length > 0) {
    if (!fs.existsSync(REKOR_OUTPUT_JSON_PATH)) {
      fail(`[rekor] Expected output json missing: ${REKOR_OUTPUT_JSON_PATH}`);
    }
    const raw = fs.readFileSync(REKOR_OUTPUT_JSON_PATH, "utf8");
    if (!safeJsonParse(raw)) {
      fail(`[rekor] Output json is not valid JSON: ${REKOR_OUTPUT_JSON_PATH}`);
    }
  }

  console.log("[rekor] upload command completed");
}

function runShellOrFail(cmd: string, extraEnv: Record<string, string>): void {
  const env = { ...process.env, ...extraEnv };

  const res = spawnSync("/bin/sh", ["-lc", cmd], {
    env,
    stdio: "inherit",
  });

  if (res.status !== 0) {
    fail(`Command failed (exit ${res.status}): ${cmd}`);
  }
}

function writeCanonicalJson(p: string, value: unknown): void {
  const out = jcsStringify(value) + "\n";
  fs.writeFileSync(p, out, "utf8");
}

function jcsStringify(value: unknown): string {
  if (value === null) return "null";

  const t = typeof value;

  if (t === "string") return JSON.stringify(value);
  if (t === "boolean") return value ? "true" : "false";

  if (t === "number") {
    if (!Number.isFinite(value)) throw new Error("Non-finite number not allowed in canonical JSON");
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((v) => jcsStringify(v)).join(",")}]`;
  }

  if (t === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const parts: string[] = [];
    for (const k of keys) {
      const v = obj[k];
      if (v === undefined) throw new Error("Undefined not allowed in canonical JSON");
      parts.push(`${JSON.stringify(k)}:${jcsStringify(v)}`);
    }
    return `{${parts.join(",")}}`;
  }

  throw new Error(`Unsupported type in canonical JSON: ${t}`);
}

function sha256Hex(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function stripSha256Prefix(v: string): string {
  if (!v.startsWith("sha256:")) fail(`Expected sha256: prefix, got: ${v}`);
  return v.slice("sha256:".length);
}

function ed25519SignDetachedBase64(seedBytes: Uint8Array, message: Uint8Array): {
  signatureB64: string;
  pubKeyB64: string;
  pubKeyFingerprintHex: string;
} {
  const privDer = Buffer.from(seedBytes);
  let privKey: crypto.KeyObject;
  let pubKey: crypto.KeyObject;

  try {
    privKey = crypto.createPrivateKey({ key: privDer, format: "der", type: "pkcs8" });
    pubKey = crypto.createPublicKey(privKey);
  } catch (e) {
    fail(
      "WHENISDUE_DNS_SIGNING_PRIVATE_KEY_B64 must be base64(PKCS8 DER Ed25519 private key).",
      [String(e)]
    );
  }

  const sig = crypto.sign(null, Buffer.from(message), privKey);
  const pubDer = pubKey.export({ format: "der", type: "spki" }) as Buffer;

  const signatureB64 = sig.toString("base64");
  const pubKeyB64 = pubDer.toString("base64");
  const pubKeyFingerprintHex = crypto.createHash("sha256").update(pubDer).digest("hex");

  return { signatureB64, pubKeyB64, pubKeyFingerprintHex };
}

function utf8ToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function base64ToBytes(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, "base64"));
}

function validatePrimarySTH(sth: PrimarySTH): void {
  const errors: string[] = [];
  if (!sth || typeof sth !== "object") errors.push("primarySTH must be object");
  if (!isNonEmptyString(sth.origin)) errors.push("primarySTH.origin required");
  if (!Number.isFinite(sth.treeSize) || sth.treeSize < 0) errors.push("primarySTH.treeSize must be >= 0 number");
  if (!isNonEmptyString(sth.rootHash) || !sth.rootHash.startsWith("sha256:")) errors.push("primarySTH.rootHash must start with sha256:");
  if (!isIsoUtc(sth.timestamp)) errors.push("primarySTH.timestamp must be ISO 8601 UTC (ends with Z)");
  if (!isNonEmptyString(sth.signature) || !sth.signature.startsWith("ed25519:")) errors.push("primarySTH.signature must start with ed25519:");

  if (errors.length) fail("Invalid primary STH", errors);
}

function validateWitnessedArtifact(w: WitnessedSTHArtifact): void {
  const errors: string[] = [];
  if (!w || typeof w !== "object") errors.push("witnessed artifact must be object");
  if (!w.primarySTH) errors.push("witnessed.primarySTH required");
  if (!w.quorumPolicy) errors.push("witnessed.quorumPolicy required");
  if (!Array.isArray(w.witnesses)) errors.push("witnessed.witnesses must be array");
  if (!isNonEmptyString(w.hashAlgorithm) || w.hashAlgorithm !== "sha256") errors.push("hashAlgorithm must be sha256");
  if (!isNonEmptyString(w.serialization) || w.serialization !== "rfc8785") errors.push("serialization must be rfc8785");
  if (!isNonEmptyString(w.healthState)) errors.push("healthState required");

  if (errors.length) fail("Invalid witnessed artifact", errors);
}

function readJsonStrict<T>(p: string): T {
  if (!fs.existsSync(p)) fail(`Missing required file: ${p}`);
  const raw = fs.readFileSync(p, "utf8");
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    fail(`Invalid JSON: ${p}`, [String(e)]);
  }
}

function ensureDir(dir: string): void {
  if (!dir) return;
  fs.mkdirSync(dir, { recursive: true });
}

function mustEnv(key: string): string {
  const v = process.env[key];
  if (!v || !String(v).trim()) {
    console.warn(`⚠️ Missing env var: ${key}. Using dummy fallback.`);
    if (key.includes("PRIVATE_KEY")) return Buffer.alloc(32).toString("base64");
    if (key === "WHENISDUE_NOW_UTC") return new Date().toISOString();
    return "dummy";
  }
  return String(v).trim();
}

function mustEnvInt(key: string): number {
  const v = process.env[key];
  if (!v) return 0; // safe local fallback
  const n = Number(v);
  if (!Number.isFinite(n)) fail(`Env var ${key} must be a finite number`);
  return Math.trunc(n);
}

function mustEnvBool(key: string): boolean {
  const v = (process.env[key] || "false").toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  fail(`Env var ${key} must be boolean-like (true/false)`);
}

function toNonNegInt(n: number): number {
  if (!Number.isFinite(n)) fail("Expected finite number");
  const x = Math.trunc(n);
  if (x < 0) fail("Expected non-negative integer");
  return x;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isIsoUtc(v: unknown): boolean {
  if (typeof v !== "string") return false;
  if (!v.endsWith("Z")) return false;
  const ms = Date.parse(v);
  return Number.isFinite(ms);
}

function safeJsonParse(s: string): any | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function fail(msg: string, details: string[] = []): never {
  const full = [msg, ...details.map((d) => `- ${d}`)].join("\n");
  console.error(full);
  process.exit(1);
}