// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Phase 18 — Deliverable 1, File 2
 * buildTrustVerdict.ts
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  computeTrustVerdict,
  signTrustVerdict,
  canonicalizeJson,
  sha256HexOfCanonicalJson,
  TrustVerdictInputs,
} from "./TrustVerdictEngine";

function main() {
  const args = parseArgs(process.argv.slice(2));

  const inputPath = reqArg(args, "--input");
  const outPath = reqArg(args, "--out");
  const privateKeyPath = reqArg(args, "--privateKey");
  const trustServiceId = reqArg(args, "--trustServiceId");
  const keyId = args["--keyId"];

  const safeInput = normalizeRelPath(inputPath);
  const safeOut = normalizeRelPath(outPath);
  const safeKey = normalizeRelPath(privateKeyPath);

  if (!fs.existsSync(safeInput)) throw new Error("Input evidence JSON not found");
  if (!fs.existsSync(safeKey)) throw new Error("Private key PEM not found");

  const raw = fs.readFileSync(safeInput, "utf8");
  const evidence: TrustVerdictInputs = JSON.parse(raw);

  if (!evidence.computedAtUtc) {
    throw new Error("computedAtUtc must be provided in evidence JSON (no implicit clock usage)");
  }

  const verdictUnsigned = computeTrustVerdict(evidence);

  const privateKeyPem = fs.readFileSync(safeKey, "utf8");

  const verdictSigned = signTrustVerdict(verdictUnsigned, {
    ed25519PrivateKeyPem: privateKeyPem,
    trustServiceId,
    keyId,
  });

  ensureDir(path.dirname(safeOut));

  writeJsonAtomic(safeOut, verdictSigned);

  const unsignedForHash = { ...verdictSigned };
  delete (unsignedForHash as any).signature;

  const hashHex = sha256HexOfCanonicalJson(unsignedForHash);
  writeTextAtomic(`${safeOut}.sha256`, `${hashHex}\n`);

  // eslint-disable-next-line no-console
  console.log(`OK: trustVerdict written → ${safeOut}`);
  // eslint-disable-next-line no-console
  console.log(`OK: canonical_sha256=${hashHex}`);
}

/* ----------------------------- Utilities ----------------------------- */

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
  return s;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeJsonAtomic(absPath: string, obj: unknown) {
  const tmp = absPath + ".tmp";
  const json = JSON.stringify(obj, null, 2) + "\n";
  fs.writeFileSync(tmp, json, "utf8");
  fs.renameSync(tmp, absPath);
}

function writeTextAtomic(absPath: string, text: string) {
  const tmp = absPath + ".tmp";
  fs.writeFileSync(tmp, text, "utf8");
  fs.renameSync(tmp, absPath);
}

main();