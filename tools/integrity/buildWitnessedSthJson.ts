// @ts-nocheck
/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { WitnessQuorumEngine, type PrimarySTH, type TrustContractSnapshot, type WitnessSignature } from "./WitnessQuorumEngine";

// ----------------------------- Config (Env) -----------------------------

const TRUST_JSON_PATH = mustEnv("WHENISDUE_TRUST_JSON_PATH"); 
const PRIMARY_STH_PATH = mustEnv("WHENISDUE_PRIMARY_STH_PATH"); 
const WITNESS_SIGS_PATH = mustEnv("WHENISDUE_WITNESS_SIGNATURES_PATH"); 
const OUTPUT_PATH = mustEnv("WHENISDUE_WITNESSED_STH_OUTPUT_PATH"); 

const NOW_UTC = mustEnv("WHENISDUE_NOW_UTC"); 

const POLICY_REQUIRED = optIntEnv("WHENISDUE_QUORUM_REQUIRED");
const POLICY_TOTAL = optIntEnv("WHENISDUE_QUORUM_TOTAL");
const POLICY_MIN_AGE_HOURS = optIntEnv("WHENISDUE_QUORUM_MIN_WITNESS_AGE_HOURS");

// ----------------------------- Main -------------------------------------

function main(): void {
  const trust = readJsonStrict<TrustContractSnapshot>(TRUST_JSON_PATH);

  if (POLICY_REQUIRED !== null || POLICY_TOTAL !== null || POLICY_MIN_AGE_HOURS !== null) {
    trust.quorumPolicy = trust.quorumPolicy ?? {};
    if (POLICY_REQUIRED !== null) trust.quorumPolicy.required = POLICY_REQUIRED;
    if (POLICY_TOTAL !== null) trust.quorumPolicy.total = POLICY_TOTAL;
    if (POLICY_MIN_AGE_HOURS !== null) trust.quorumPolicy.minWitnessAgeHours = POLICY_MIN_AGE_HOURS;
  }

  const primarySTH = readJsonStrict<PrimarySTH>(PRIMARY_STH_PATH);
  validatePrimarySTH(primarySTH);

  const witnessSigs = readJsonStrict<WitnessSignature[]>(WITNESS_SIGS_PATH);
  validateWitnessSigs(witnessSigs);

  const artifact = WitnessQuorumEngine.buildWitnessedArtifact({
    primarySTH,
    trust,
    witnessSignatures: witnessSigs,
    nowUtc: NOW_UTC,
  });

  const outJson = canonicalJson(artifact);

  ensureDir(path.dirname(OUTPUT_PATH));
  fs.writeFileSync(OUTPUT_PATH, outJson + "\n", "utf8");

  const sha = sha256Hex(outJson);
  const shaPath = OUTPUT_PATH + ".sha256";
  fs.writeFileSync(shaPath, sha + "\n", "utf8");

  if (artifact.healthState === "CRITICAL") {
    console.error(`[witnessed-sth] CRITICAL: ${artifact.healthReason}`);
    process.exit(1);
  }

  console.log(`[witnessed-sth] wrote ${OUTPUT_PATH}`);
  console.log(`[witnessed-sth] sha256 ${sha}`);
  console.log(`[witnessed-sth] state ${artifact.healthState} (${artifact.validWitnessCount}/${artifact.quorumPolicy.total})`);
}

main();

// ----------------------------- Validation --------------------------------

function validatePrimarySTH(sth: PrimarySTH): void {
  const errors: string[] = [];
  if (!sth || typeof sth !== "object") errors.push("primarySTH must be object");
  if (!isNonEmptyString(sth.origin)) errors.push("primarySTH.origin required");
  if (!Number.isFinite(sth.treeSize) || sth.treeSize < 0) errors.push("primarySTH.treeSize must be >= 0 number");
  if (!isNonEmptyString(sth.rootHash) || !sth.rootHash.startsWith("sha256:")) errors.push("primarySTH.rootHash must start with sha256:");
  if (!isIsoUtc(sth.timestamp)) errors.push("primarySTH.timestamp must be ISO 8601 UTC (ends with Z)");
  if (!isNonEmptyString(sth.signature) || !sth.signature.startsWith("ed25519:")) errors.push("primarySTH.signature must start with ed25519:");

  if (errors.length) fail(`Invalid primary STH (${PRIMARY_STH_PATH})`, errors);
}

function validateWitnessSigs(sigs: WitnessSignature[]): void {
  if (!Array.isArray(sigs)) fail(`Witness signatures must be an array (${WITNESS_SIGS_PATH})`, []);
  const errors: string[] = [];

  for (let i = 0; i < sigs.length; i++) {
    const s = sigs[i];
    const prefix = `witnessSignatures[${i}]`;
    if (!s || typeof s !== "object") {
      errors.push(`${prefix} must be object`);
      continue;
    }
    if (!isNonEmptyString(s.witnessId)) errors.push(`${prefix}.witnessId required`);
    if (!isNonEmptyString(s.signature) || !s.signature.startsWith("ed25519:")) errors.push(`${prefix}.signature must start with ed25519:`);
    if (!isIsoUtc(s.observedAtUtc)) errors.push(`${prefix}.observedAtUtc must be ISO 8601 UTC (ends with Z)`);
  }

  if (errors.length) fail(`Invalid witness signatures (${WITNESS_SIGS_PATH})`, errors);
}

// ----------------------------- IO Helpers --------------------------------

function readJsonStrict<T>(p: string): T {
  if (!fs.existsSync(p)) fail(`Missing required file: ${p}`, []);
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

// ----------------------------- Deterministic JSON (RFC 8785-ish) ---------

function canonicalJson(value: unknown): string {
  return jcsStringify(value);
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

// ----------------------------- Misc Helpers ------------------------------

function sha256Hex(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function mustEnv(key: string): string {
  const v = process.env[key];
  if (!v || !String(v).trim()) {
    console.warn(`⚠️ Missing required env var: ${key}. Using dummy fallback for local dev.`);
    if (key === "WHENISDUE_NOW_UTC") return new Date().toISOString();
    return "dummy-path.json";
  }
  return String(v).trim();
}

function optIntEnv(key: string): number | null {
  const v = process.env[key];
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) fail(`Env var ${key} must be a finite number`, []);
  return Math.trunc(n);
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

function fail(msg: string, details: string[]): never {
  const full = [msg, ...details.map((d) => `- ${d}`)].join("\n");
  console.error(full);
  process.exit(1);
}