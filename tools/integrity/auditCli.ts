// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Phase 18 — Deliverable 2
 * auditCli.ts
 *
 * Offline verifier ("audit-cli" parity for bundles)
 */

import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { spawnSync } from "child_process";

// We import the canonicalizer from Deliverable 1
import { canonicalizeJson } from "./TrustVerdictEngine";

type CheckStatus = "PASS" | "WARN" | "FAIL";

type Verdict = {
  overallStatus: "PASS" | "WARN" | "FAIL";
  auditMetadata: {
    bundlePath: string;
    extractedDir: string;
    auditTimestampUtc: string;
  };
  checks: Array<{
    name: string;
    status: CheckStatus;
    errorCode: string | null;
    details: string;
  }>;
  resolvedKeys: Record<string, string>;
};

function main() {
  const args = parseArgs(process.argv.slice(2));
  const bundlePath = reqArg(args, "--bundle");
  const outPath = args["--out"] || "verdict.json";

  const ts = requireUtcArgOrNow(args["--auditUtc"]);

  const verdict: Verdict = {
    overallStatus: "PASS",
    auditMetadata: {
      bundlePath: bundlePath,
      extractedDir: "",
      auditTimestampUtc: ts,
    },
    checks: [],
    resolvedKeys: {},
  };

  try {
    if (!fs.existsSync(bundlePath)) {
      return finishInvalid(verdict, "INVALID_INPUT", "Bundle file not found", outPath, 3);
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "whenisdue-audit-"));
    verdict.auditMetadata.extractedDir = tmpDir;

    const untarOk = untarTo(bundlePath, tmpDir);
    if (!untarOk.ok) {
      return finishInvalid(
        verdict,
        "INVALID_INPUT",
        `Unable to extract bundle: ${untarOk.err}`,
        outPath,
        3
      );
    }

    const manifestPath = path.join(tmpDir, "manifest.json");
    const trustContractPath = path.join(tmpDir, "trust-contract.json");

    if (!fs.existsSync(manifestPath) || !fs.existsSync(trustContractPath)) {
      return finishInvalid(
        verdict,
        "INCOMPLETE_EVIDENCE",
        "Missing manifest.json or trust-contract.json",
        outPath,
        4
      );
    }

    const manifest = readJson(manifestPath);
    if (!manifest || !Array.isArray(manifest.files)) {
      return finishInvalid(verdict, "INVALID_INPUT", "Malformed manifest.json", outPath, 3);
    }

    const preflight = verifyManifestFiles(tmpDir, manifest.files);
    if (!preflight.ok) {
      addCheck(verdict, "preflight_manifest", "FAIL", "HASH_MISMATCH", preflight.err);
      return finish(verdict, outPath, 2);
    }
    addCheck(
      verdict,
      "preflight_manifest",
      "PASS",
      null,
      `Verified ${manifest.files.length} file hashes and sizes`
    );

    const registryPath = path.join(tmpDir, "data", "registry.json");
    const statementPath = path.join(tmpDir, "transparency", "statement.cose");
    const receiptPath = path.join(tmpDir, "transparency", "receipt.cbor");
    const sthPath = path.join(tmpDir, "transparency", "sth.json");

    const missing: string[] = [];
    for (const p of [registryPath, statementPath, receiptPath, sthPath]) {
      if (!fs.existsSync(p)) missing.push(path.relative(tmpDir, p));
    }
    if (missing.length) {
      return finishInvalid(
        verdict,
        "INCOMPLETE_EVIDENCE",
        `Missing mandatory artifacts: ${missing.join(", ")}`,
        outPath,
        4
      );
    }

    const trustContract = readJson(trustContractPath);
    if (!trustContract) {
      return finishInvalid(verdict, "INVALID_INPUT", "Malformed trust-contract.json", outPath, 3);
    }

    const registryKey = resolveRegistryPublicKey(trustContract);
    if (!registryKey) {
      addCheck(
        verdict,
        "identity_bootstrap",
        "FAIL",
        "KEY_RESOLUTION_FAIL",
        "Unable to resolve registry public key from trust-contract.json"
      );
      return finish(verdict, outPath, 2);
    }
    verdict.resolvedKeys["registry_key"] = registryKey.fingerprint;

    addCheck(
      verdict,
      "identity_bootstrap",
      "PASS",
      null,
      `Resolved registry key: ${registryKey.fingerprint}`
    );

    const registryJson = readJson(registryPath);
    if (!registryJson) {
      return finishInvalid(verdict, "INVALID_INPUT", "Malformed data/registry.json", outPath, 3);
    }

    const registryJcsBytes = Buffer.from(canonicalizeJson(registryJson), "utf8");
    const detachedPayload = sha256(registryJcsBytes);

    const statementBytes = fs.readFileSync(statementPath);
    const statementRes = verifyCoseSign1Ed25519(statementBytes, detachedPayload, registryKey.publicKeyBytes);

    if (!statementRes.ok) {
      addCheck(verdict, "statement_verify", "FAIL", "STATEMENT_SIG_INVALID", statementRes.err);
      return finish(verdict, outPath, 2);
    }

    addCheck(
      verdict,
      "statement_verify",
      "PASS",
      null,
      `COSE_Sign1 verified (kid=${statementRes.kid || "n/a"})`
    );

    const receiptBytes = fs.readFileSync(receiptPath);
    const receiptObj = cborDecode(receiptBytes);

    const receiptRes = verifyReceiptAndRecomputeRoot(receiptObj, statementBytes, sthPath);
    if (!receiptRes.ok) {
      addCheck(verdict, "receipt_inclusion", "FAIL", "RECEIPT_INCLUSION_FAIL", receiptRes.err);
      return finish(verdict, outPath, 2);
    }
    addCheck(
      verdict,
      "receipt_inclusion",
      "PASS",
      null,
      `Inclusion verified: leaf_index=${receiptRes.leafIndex}`
    );

    const sth = readJson(sthPath);
    if (!sth) {
      return finishInvalid(verdict, "INVALID_INPUT", "Malformed transparency/sth.json", outPath, 3);
    }

    const sthRes = verifySthAndQuorum(sth, trustContract, path.join(tmpDir, "witnesses"));
    if (!sthRes.ok) {
      addCheck(verdict, "sth_quorum", sthRes.severity as CheckStatus, sthRes.errorCode, sthRes.details);
      return finish(verdict, outPath, sthRes.exitCode);
    }

    addCheck(
      verdict,
      "sth_quorum",
      sthRes.severity as CheckStatus,
      null,
      `Quorum: ${sthRes.validCount} of ${sthRes.total} signatures verified (required=${sthRes.required})`
    );

    const tsaRes = verifyRfc3161BestEffort(tmpDir, sthPath);
    addCheck(verdict, "rfc3161_timestamp", tsaRes.status, tsaRes.errorCode, tsaRes.details);

    if (tsaRes.status === "WARN") {
      verdict.overallStatus = "WARN";
      return finish(verdict, outPath, 1);
    }

    return finish(verdict, outPath, 0);
  } catch (e: any) {
    const msg = e?.message ? String(e.message) : "Unknown error";
    addCheck(verdict, "runtime", "FAIL", "RUNTIME_ERROR", msg);
    return finish(verdict, outPath, 2);
  }
}

/* ----------------------------- Core Verification ----------------------------- */

function verifyCoseSign1Ed25519(
  coseBytes: Buffer,
  detachedPayload: Buffer,
  ed25519PublicKeyRaw32: Buffer
): { ok: true; kid?: string } | { ok: false; err: string } {
  let msg: any;
  try {
    msg = cborDecode(coseBytes);
  } catch {
    return { ok: false, err: "CBOR decode failed for statement.cose" };
  }
  if (!Array.isArray(msg) || msg.length !== 4) return { ok: false, err: "Invalid COSE_Sign1 structure" };

  const protectedBstr: Buffer = bufOrFail(msg[0]);
  const signature: Buffer = bufOrFail(msg[3]);

  const protectedMap = safeDecodeCborMap(protectedBstr);
  const alg = protectedMap?.get?.(1);
  if (alg !== -8) return { ok: false, err: `Unsupported alg in protected header (expected -8 EdDSA, got ${String(alg)})` };

  const kidVal = protectedMap?.get?.(4);
  const kid = kidVal ? asKidString(kidVal) : undefined;

  const context = "Signature1";
  const externalAad = Buffer.alloc(0);

  const sigStructure = cborEncode([context, protectedBstr, externalAad, detachedPayload]);

  const ok = crypto.verify(
    null,
    sigStructure,
    { key: ed25519PublicKeyFromRaw(ed25519PublicKeyRaw32), dsaEncoding: "ieee-p1363" as any },
    signature
  );

  if (!ok) return { ok: false, err: "Ed25519 signature verification failed for statement.cose" };
  return { ok: true, kid };
}

function verifyReceiptAndRecomputeRoot(
  receiptObj: any,
  statementCoseBytes: Buffer,
  sthPath: string
): { ok: true; leafIndex: number } | { ok: false; err: string } {
  if (!Array.isArray(receiptObj) || receiptObj.length !== 3) {
    return { ok: false, err: "Invalid receipt format (expected 3-item CBOR array)" };
  }

  const hashAlgId = receiptObj[0];
  const leafIndex = toSafeInt(receiptObj[1]);
  const siblings = receiptObj[2];

  if (hashAlgId !== -16) return { ok: false, err: `Unsupported hashAlgId (expected -16 SHA-256, got ${String(hashAlgId)})` };
  if (!Number.isFinite(leafIndex) || leafIndex < 0) return { ok: false, err: "Invalid leaf_index in receipt" };
  if (!Array.isArray(siblings)) return { ok: false, err: "Invalid siblings list in receipt" };

  const sth = readJson(sthPath);
  if (!sth || !sth.rootHash) return { ok: false, err: "Missing or malformed STH rootHash" };

  const expectedRootHex = normalizeHashHex(String(sth.rootHash));
  if (!expectedRootHex) return { ok: false, err: "STH rootHash not parseable" };

  const leafHash = sha256(statementCoseBytes);

  let idx = leafIndex;
  let acc = leafHash;

  for (const sib of siblings) {
    const sibBuf = bufOrFail(sib);
    const leftRight =
      (idx & 1) === 0
        ? Buffer.concat([acc, sibBuf])
        : Buffer.concat([sibBuf, acc]);
    acc = sha256(leftRight);
    idx = idx >>> 1;
  }

  const computedRootHex = acc.toString("hex");
  if (computedRootHex !== expectedRootHex) {
    return {
      ok: false,
      err: `Root mismatch: computed=${computedRootHex} expected=${expectedRootHex}`,
    };
  }

  return { ok: true, leafIndex };
}

function verifySthAndQuorum(
  sth: any,
  trustContract: any,
  witnessesDir: string
): { ok: true; severity: string; required: number; total: number; validCount: number } | { ok: false; severity: string; errorCode: string; details: string; exitCode: 1 | 2 } {
  const policy = trustContract?.quorumPolicy || trustContract?.witnessQuorum || trustContract?.quorum;
  const required = toSafeInt(policy?.required);
  const total = toSafeInt(policy?.total);

  if (!Number.isFinite(required) || required < 1) {
    return { ok: false, severity: "FAIL", errorCode: "INVALID_POLICY", details: "Missing/invalid quorumPolicy.required", exitCode: 2 };
  }
  if (!Number.isFinite(total) || total < required) {
    return { ok: false, severity: "FAIL", errorCode: "INVALID_POLICY", details: "Missing/invalid quorumPolicy.total", exitCode: 2 };
  }

  const treeSize = toSafeInt(sth.treeSize ?? sth.primarySTH?.treeSize);
  const rootHash = sth.rootHash ?? sth.primarySTH?.rootHash;
  const timestamp = sth.timestamp ?? sth.primarySTH?.timestamp;

  if (!Number.isFinite(treeSize) || treeSize < 0) {
    return { ok: false, severity: "FAIL", errorCode: "INVALID_STH", details: "STH.treeSize invalid", exitCode: 2 };
  }
  if (typeof rootHash !== "string" || !rootHash) {
    return { ok: false, severity: "FAIL", errorCode: "INVALID_STH", details: "STH.rootHash missing", exitCode: 2 };
  }
  if (typeof timestamp !== "string" || !timestamp) {
    return { ok: false, severity: "FAIL", errorCode: "INVALID_STH", details: "STH.timestamp missing", exitCode: 2 };
  }

  const primarySig = sth.signature ?? sth.primarySTH?.signature;
  const primaryOrigin = sth.origin ?? sth.primarySTH?.origin ?? sth.logId ?? sth.primarySTH?.logId;

  if (primarySig && typeof primarySig === "string") {
    const registryKey = resolveRegistryPublicKey(trustContract);
    if (!registryKey) {
      return { ok: false, severity: "FAIL", errorCode: "KEY_RESOLUTION_FAIL", details: "Registry public key missing for STH verification", exitCode: 2 };
    }
    const sthBlob = canonicalizeJson({
      origin: primaryOrigin,
      treeSize,
      rootHash,
      timestamp,
    });
    const ok = verifyEd25519SigHexOrB64(registryKey.publicKeyBytes, Buffer.from(sthBlob, "utf8"), primarySig);
    if (!ok) {
      return { ok: false, severity: "FAIL", errorCode: "STH_SIG_INVALID", details: "Primary STH signature invalid", exitCode: 2 };
    }
  } else {
    return { ok: false, severity: "FAIL", errorCode: "STH_SIG_MISSING", details: "Primary STH signature missing", exitCode: 2 };
  }

  const witnessSigs = sth.witnesses ?? sth.witnessSignatures ?? sth.quorum ?? sth.witness_quorum;
  if (!Array.isArray(witnessSigs)) {
    return {
      ok: false,
      severity: "WARN",
      errorCode: "QUORUM_NOT_MET",
      details: "No witness signatures present in STH",
      exitCode: 1,
    };
  }

  const witnessBlob = canonicalizeJson({
    origin: primaryOrigin,
    treeSize,
    rootHash,
    timestamp,
  });
  const witnessMsg = Buffer.from(witnessBlob, "utf8");

  let validCount = 0;

  for (const w of witnessSigs) {
    const witnessId = w?.id ?? w?.witnessId;
    const sig = w?.sig ?? w?.signature;
    if (typeof witnessId !== "string" || typeof sig !== "string") continue;

    const didPath = path.join(witnessesDir, witnessId, "did.json");
    if (!fs.existsSync(didPath)) continue;

    const didDoc = readJson(didPath);
    const pub = resolveWitnessPublicKeyFromDid(didDoc);
    if (!pub) continue;

    const ok = verifyEd25519SigHexOrB64(pub.publicKeyBytes, witnessMsg, sig);
    if (ok) validCount++;
  }

  if (validCount >= required) {
    return { ok: true, severity: "PASS", required, total, validCount };
  }

  if (validCount >= 1) {
    return { ok: true, severity: "WARN", required, total, validCount };
  }

  return {
    ok: false,
    severity: "WARN",
    errorCode: "QUORUM_NOT_MET",
    details: `0 witness signatures verified (required=${required})`,
    exitCode: 1,
  };
}

/* ----------------------------- RFC3161 Best-Effort ----------------------------- */

function verifyRfc3161BestEffort(bundleRoot: string, sthPath: string): { status: CheckStatus; errorCode: string | null; details: string } {
  const tsrPath = path.join(bundleRoot, "anchors", "rfc3161", "release.tsr");
  const chainPath = path.join(bundleRoot, "anchors", "rfc3161", "chain.pem");

  if (!fs.existsSync(tsrPath)) {
    return { status: "WARN", errorCode: "LTV_EVIDENCE_MISSING", details: "release.tsr missing (timestamp not provided in bundle)" };
  }
  if (!fs.existsSync(chainPath)) {
    return { status: "WARN", errorCode: "LTV_EVIDENCE_MISSING", details: "chain.pem missing (cannot verify TSA signature offline)" };
  }

  const sth = readJson(sthPath);
  if (!sth) return { status: "WARN", errorCode: "INVALID_STH", details: "Cannot read sth.json to compute TSA messageImprint" };

  const sthJcs = Buffer.from(canonicalizeJson(sth), "utf8");
  const imprintHex = sha256(sthJcs).toString("hex");

  const openssl = which("openssl");
  if (!openssl) {
    return { status: "WARN", errorCode: "OPENSSL_MISSING", details: "OpenSSL not found; skipping RFC3161 verification" };
  }

  const tmpData = path.join(bundleRoot, ".sth_jcs.tmp");
  fs.writeFileSync(tmpData, sthJcs);

  const verify = spawnSync(openssl, ["ts", "-verify", "-in", tsrPath, "-CAfile", chainPath, "-data", tmpData], {
    encoding: "utf8",
  });

  try { fs.unlinkSync(tmpData); } catch { /* ignore */ }

  if (verify.status !== 0) {
    return { status: "WARN", errorCode: "TSA_TOKEN_INVALID", details: `OpenSSL ts -verify failed: ${strip(verify.stderr || verify.stdout)}` };
  }

  const txt = spawnSync(openssl, ["ts", "-reply", "-in", tsrPath, "-text"], { encoding: "utf8" });
  const out = (txt.stdout || "") + "\n" + (txt.stderr || "");
  if (!out.toLowerCase().includes(imprintHex.toLowerCase())) {
    return { status: "WARN", errorCode: "TSA_IMPRINT_MISMATCH", details: "TSA token verified but messageImprint not found in textual dump (format variance)" };
  }

  return { status: "PASS", errorCode: null, details: "RFC3161 token verified via OpenSSL and imprint matched STH" };
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

function resolveWitnessPublicKeyFromDid(didDoc: any): { publicKeyBytes: Buffer } | null {
  const vms = didDoc?.verificationMethod;
  if (!Array.isArray(vms)) return null;

  for (const vm of vms) {
    const raw =
      vm?.publicKeyMultibase ??
      vm?.publicKeyBase64 ??
      vm?.publicKeyHex ??
      vm?.publicKey ??
      null;
    if (!raw) continue;

    const pub = decodeKeyToRaw32(raw);
    if (!pub) continue;
    return { publicKeyBytes: pub };
  }

  return null;
}

/* ----------------------------- Crypto Helpers ----------------------------- */

function sha256(buf: Buffer): Buffer {
  return crypto.createHash("sha256").update(buf).digest();
}

function ed25519PublicKeyFromRaw(raw32: Buffer): crypto.KeyObject {
  const prefix = Buffer.from("302a300506032b6570032100", "hex");
  const spki = Buffer.concat([prefix, raw32]);
  return crypto.createPublicKey({ key: spki, format: "der", type: "spki" });
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

function decodeSig(s: string): Buffer | null {
  const t = s.trim();
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
  const out = Buffer.concat([Buffer.alloc(leadingZeros), Buffer.from(bytes)]);
  return out;
}

/* ----------------------------- Manifest Verification ----------------------------- */

function verifyManifestFiles(
  root: string,
  files: Array<{ path: string; sha256: string; size: number }>
): { ok: true } | { ok: false; err: string } {
  for (const f of files) {
    if (!f || typeof f.path !== "string" || typeof f.sha256 !== "string") {
      return { ok: false, err: "Invalid manifest entry shape" };
    }
    const rel = normalizeRelPath(f.path);
    const abs = path.join(root, rel);

    if (!fs.existsSync(abs)) return { ok: false, err: `Missing file: ${rel}` };

    const stat = fs.statSync(abs);
    if (Number.isFinite(f.size) && stat.size !== f.size) {
      return { ok: false, err: `Size mismatch for ${rel}: actual=${stat.size} expected=${f.size}` };
    }

    const bytes = fs.readFileSync(abs);
    const h = sha256(bytes).toString("hex");
    const expected = normalizeHashHex(f.sha256);
    if (!expected) return { ok: false, err: `Bad sha256 in manifest for ${rel}` };

    if (h !== expected) return { ok: false, err: `Hash mismatch for ${rel}: actual=${h} expected=${expected}` };
  }
  return { ok: true };
}

/* ----------------------------- Tar + OS helpers ----------------------------- */

function untarTo(bundle: string, dir: string): { ok: true } | { ok: false; err: string } {
  const tar = which("tar");
  if (!tar) return { ok: false, err: "tar not found on PATH" };

  const res = spawnSync(tar, ["-xzf", bundle, "-C", dir], { encoding: "utf8" });
  if (res.status !== 0) {
    return { ok: false, err: strip(res.stderr || res.stdout) || "tar failed" };
  }
  return { ok: true };
}

function which(bin: string): string | null {
  const cmd = process.platform === "win32" ? "where" : "which";
  const r = spawnSync(cmd, [bin], { encoding: "utf8" });
  if (r.status !== 0) return null;
  const out = (r.stdout || "").trim().split(/\r?\n/)[0];
  return out || null;
}

/* ----------------------------- CBOR Encoding Helpers ----------------------------- */

type CborValue = number | string | Uint8Array | CborValue[] | Map<number | string, CborValue> | null | boolean;

function safeDecodeCborMap(b: Buffer): Map<any, any> | null {
  try {
    const m = cborDecode(b);
    if (m instanceof Map) return m;
    if (m && typeof m === "object" && !Array.isArray(m)) {
      const mp = new Map<any, any>();
      for (const [k, v] of Object.entries(m)) {
        const ik = /^-?\d+$/.test(k) ? parseInt(k, 10) : k;
        mp.set(ik, v);
      }
      return mp;
    }
    return null;
  } catch {
    return null;
  }
}

function asKidString(v: any): string {
  if (typeof v === "string") return v;
  if (Buffer.isBuffer(v)) return v.toString("hex");
  return String(v);
}

function bufOrFail(v: any): Buffer {
  if (Buffer.isBuffer(v)) return v;
  if (v instanceof Uint8Array) return Buffer.from(v);
  throw new Error("Expected buffer-like value in CBOR structure");
}

function cborEncode(value: CborValue): Uint8Array {
  const chunks: Uint8Array[] = [];
  encodeAny(value, chunks);
  return concatChunks(chunks);
}

function encodeAny(value: CborValue, out: Uint8Array[]): void {
  if (value === null) { out.push(Uint8Array.from([0xf6])); return; }
  if (typeof value === "boolean") { out.push(Uint8Array.from([value ? 0xf5 : 0xf4])); return; }
  if (typeof value === "number") {
    if (!Number.isInteger(value)) throw new Error("CBOR encoder only supports integers in this module");
    encodeInt(value, out); return;
  }
  if (typeof value === "string") { encodeText(value, out); return; }
  if (value instanceof Uint8Array || Buffer.isBuffer(value)) { encodeBytes(new Uint8Array(value), out); return; }
  if (Array.isArray(value)) { encodeArray(value, out); return; }
  if (value instanceof Map) { encodeMap(value, out); return; }
  throw new Error("Unsupported CBOR type");
}

function encodeInt(n: number, out: Uint8Array[]): void {
  if (n >= 0) encodeMajorWithValue(0, n, out);
  else encodeMajorWithValue(1, -1 - n, out);
}

function encodeBytes(b: Uint8Array, out: Uint8Array[]): void {
  encodeMajorWithValue(2, b.length, out); out.push(b);
}

function encodeText(s: string, out: Uint8Array[]): void {
  const b = Buffer.from(s, "utf8");
  encodeMajorWithValue(3, b.length, out); out.push(new Uint8Array(b));
}

function encodeArray(arr: CborValue[], out: Uint8Array[]): void {
  encodeMajorWithValue(4, arr.length, out);
  for (const item of arr) encodeAny(item, out);
}

function encodeMap(map: Map<number | string, CborValue>, out: Uint8Array[]): void {
  const entries: Array<{ key: number | string; val: CborValue; encKey: Uint8Array }> = [];
  for (const [k, v] of map.entries()) {
    const encKey = cborEncodeKey(k);
    entries.push({ key: k, val: v, encKey });
  }
  entries.sort((a, b) => compareCborKeyBytes(a.encKey, b.encKey));
  encodeMajorWithValue(5, entries.length, out);
  for (const e of entries) { out.push(e.encKey); encodeAny(e.val, out); }
}

function cborEncodeKey(k: number | string): Uint8Array {
  const chunks: Uint8Array[] = [];
  if (typeof k === "number") encodeInt(k, chunks);
  else encodeText(k, chunks);
  return concatChunks(chunks);
}

function compareCborKeyBytes(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== b.length) return a.length - b.length;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    if (d !== 0) return d;
  }
  return 0;
}

function encodeMajorWithValue(major: number, value: number, out: Uint8Array[]): void {
  if (value < 24) { out.push(Uint8Array.from([(major << 5) | value])); return; }
  if (value <= 0xff) { out.push(Uint8Array.from([(major << 5) | 24, value])); return; }
  if (value <= 0xffff) { out.push(Uint8Array.from([(major << 5) | 25, (value >> 8) & 0xff, value & 0xff])); return; }
  if (value <= 0xffffffff) {
    out.push(Uint8Array.from([(major << 5) | 26, (value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]));
    return;
  }
  const hi = Math.floor(value / 2 ** 32); const lo = value >>> 0;
  out.push(Uint8Array.from([(major << 5) | 27, (hi >>> 24) & 0xff, (hi >>> 16) & 0xff, (hi >>> 8) & 0xff, hi & 0xff, (lo >>> 24) & 0xff, (lo >>> 16) & 0xff, (lo >>> 8) & 0xff, lo & 0xff]));
}

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  let total = 0; for (const c of chunks) total += c.length;
  const out = new Uint8Array(total); let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

function cborDecode(bytes: Uint8Array): any {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let i = 0;
  const read = (): any => {
    if (i >= dv.byteLength) throw new Error("CBOR decode: truncated");
    const first = dv.getUint8(i++); const major = first >> 5; const addl = first & 0x1f;
    const readLen = (): number => {
      if (addl < 24) return addl; if (addl === 24) return dv.getUint8(i++);
      if (addl === 25) { const v = dv.getUint16(i); i += 2; return v; }
      if (addl === 26) { const v = dv.getUint32(i); i += 4; return v; }
      if (addl === 27) { const hi = dv.getUint32(i); const lo = dv.getUint32(i + 4); i += 8; return hi * 2 ** 32 + lo; }
      throw new Error("CBOR decode: indefinite lengths not supported");
    };
    if (major === 0) return readLen(); if (major === 1) return -1 - readLen();
    if (major === 2) { const len = readLen(); const b = bytes.subarray(i, i + len); i += len; return new Uint8Array(b); }
    if (major === 3) { const len = readLen(); const b = bytes.subarray(i, i + len); i += len; return Buffer.from(b).toString("utf8"); }
    if (major === 4) { const len = readLen(); const arr: any[] = []; for (let j = 0; j < len; j++) arr.push(read()); return arr; }
    if (major === 5) {
      const len = readLen(); const map = new Map<any, any>();
      for (let j = 0; j < len; j++) { const k = read(); const v = read(); map.set(k, v); }
      return map;
    }
    if (major === 7) {
      if (addl === 20) return false; if (addl === 21) return true; if (addl === 22) return null;
      throw new Error("CBOR decode: unsupported simple value");
    }
    throw new Error("CBOR decode: unsupported major type");
  };
  const val = read();
  if (i !== dv.byteLength) throw new Error("CBOR decode: trailing bytes");
  return val;
}

/* ----------------------------- General helpers ----------------------------- */

function parseArgs(argv: string[]): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const v = argv[i + 1];
      if (v && !v.startsWith("--")) {
        out[a] = v;
        i++;
      } else {
        out[a] = "true";
      }
    }
  }
  return out;
}

function reqArg(args: Record<string, string | undefined>, key: string): string {
  const v = args[key];
  if (!v) throw new Error(`Missing required argument ${key}`);
  return v;
}

function normalizeRelPath(p: string): string {
  const s = p.replace(/\\/g, "/").trim();
  if (!s) throw new Error("Empty path");
  if (s.startsWith("/")) throw new Error("Absolute paths not allowed");
  if (s.includes("..")) throw new Error("Parent traversal not allowed");
  return s.replace(/^\.?\//, "");
}

function readJson(p: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function toSafeInt(v: any): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return NaN;
  return Math.trunc(n);
}

function normalizeHashHex(h: string): string | null {
  const s = h.trim().toLowerCase();
  const m = s.startsWith("sha256:") ? s.slice("sha256:".length) : s;
  if (!/^[0-9a-f]{64}$/.test(m)) return null;
  return m;
}

function strip(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function requireUtcArgOrNow(arg?: string): string {
  if (arg) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(arg)) {
      throw new Error("--auditUtc must be ISO-8601 UTC (e.g., 2026-03-02T09:00:00Z)");
    }
    return arg;
  }
  return new Date().toISOString();
}

/* ----------------------------- Verdict writing ----------------------------- */

function addCheck(v: Verdict, name: string, status: CheckStatus, errorCode: string | null, details: string) {
  v.checks.push({ name, status, errorCode, details });
  if (status === "FAIL") v.overallStatus = "FAIL";
  else if (status === "WARN" && v.overallStatus !== "FAIL") v.overallStatus = "WARN";
}

function writeJsonAtomic(absPath: string, obj: unknown) {
  const dir = path.dirname(absPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const tmp = absPath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, absPath);
}

function finish(verdict: Verdict, outPath: string, exitCode: number): never {
  writeJsonAtomic(outPath, verdict);
  // eslint-disable-next-line no-console
  console.log(`VERDICT: ${verdict.overallStatus} → ${outPath}`);
  process.exit(exitCode);
}

function finishInvalid(verdict: Verdict, code: string, details: string, outPath: string, exitCode: number): never {
  addCheck(verdict, "input", exitCode === 1 ? "WARN" : "FAIL", code, details);
  return finish(verdict, outPath, exitCode);
}

main();