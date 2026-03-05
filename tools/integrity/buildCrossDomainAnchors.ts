// @ts-nocheck
/* eslint-disable no-console */
/**
 * buildCrossDomainAnchors.ts
 *
 * Phase 19 — Deliverable 4 (File 2)
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { CrossDomainAnchorEngine, type CrossDomainAnchorInput, type SignedTreeHead } from "./CrossDomainAnchorEngine";

function readJson<T>(p: string): T {
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw) as T;
}

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of argv) {
    if (!a.startsWith("--")) continue;
    const idx = a.indexOf("=");
    if (idx === -1) out[a.slice(2)] = "true";
    else out[a.slice(2, idx)] = a.slice(idx + 1);
  }
  return out;
}

function sha256Hex(buf: Buffer | string): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function normalizeSha256(x: string): string {
  const v = String(x).trim();
  const hex = v.startsWith("sha256:") ? v.slice("sha256:".length) : v;
  if (!/^[a-f0-9]{64}$/i.test(hex)) throw new Error(`Invalid sha256 hex: ${x}`);
  return `sha256:${hex.toLowerCase()}`;
}

function todayUtcEpoch(): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type TrustContract = {
  specVersion?: string;
  trustContractVersion?: string;
  registry?: { logId?: string };
};

type PrevAnchorRecord = {
  anchorId: string;
  canonicalAnchorHash?: string;
};

function extractPrevAnchorHash(prev: any): string {
  if (typeof prev?.canonicalAnchorHash === "string" && /^[a-f0-9]{64}$/i.test(prev.canonicalAnchorHash)) {
    return `sha256:${prev.canonicalAnchorHash.toLowerCase()}`;
  }
  if (typeof prev?.canonicalAnchorHash === "string" && prev.canonicalAnchorHash.startsWith("sha256:")) {
    return normalizeSha256(prev.canonicalAnchorHash);
  }
  throw new Error("Previous anchorRecord missing canonicalAnchorHash; cannot chain anchors deterministically.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const repoRoot = args["root"] ? path.resolve(args["root"]) : process.cwd();

  const sthPath = path.resolve(repoRoot, args["sth"] || "public/transparency/sth/latest.json");
  const diffRootPath = path.resolve(repoRoot, args["diffRoot"] || "public/transparency/diff/root.json");
  const trustPath = path.resolve(repoRoot, args["trust"] || "public/.well-known/whenisdue-trust.json");

  const outBase = path.resolve(repoRoot, args["out"] || "public/anchors/cross-domain");
  const epoch = args["epoch"] || todayUtcEpoch();

  const signerKeyId = mustEnv("WID_ANCHOR_SIGNER_KEY_ID");
  const signerPrivPemB64 = mustEnv("WID_ANCHOR_SIGNER_PRIV_PEM_B64");
  const signerPrivateKeyHex = `pem:${signerPrivPemB64}`;

  const sth = readJson<SignedTreeHead>(sthPath);
  const diffRootObj = readJson<{ diffRootHash: string }>(diffRootPath);
  const trust = readJson<TrustContract>(trustPath);

  const logId = args["logId"] || trust.registry?.logId || "whenisdue.com/transparency/v1";
  const registryId = mustEnv("WID_REGISTRY_ID");
  const version = mustEnv("WID_REGISTRY_VERSION");
  const trustContractVersion = args["trustContractVersion"] || trust.trustContractVersion || trust.specVersion || "1.0.0";

  const diffRootHash = diffRootObj?.diffRootHash
    ? normalizeSha256(diffRootObj.diffRootHash)
    : `sha256:${sha256Hex("no-diff")}`;

  const prevPath = args["prevAnchor"] ? path.resolve(repoRoot, args["prevAnchor"]) : "";
  let prevAnchor: CrossDomainAnchorInput["prevAnchor"] | undefined;
  if (prevPath && fs.existsSync(prevPath)) {
    const prev = readJson<any>(prevPath);
    prevAnchor = {
      anchorId: String(prev.anchorId),
      anchorHash: extractPrevAnchorHash(prev),
    };
  }

  const dnsHost = args["dnsHost"] || "_anchor.registry.whenisdue.com";
  const rfc3161TokenUrl = args["rfc3161TokenUrl"] || "";

  const input: CrossDomainAnchorInput = {
    logId,
    registryId,
    version,
    epoch,
    trustContractVersion,
    sth,
    diffRootHash,
    prevAnchor,
    signer: {
      keyId: signerKeyId,
      privateKeyHex: signerPrivateKeyHex,
    },
    refs: {
      dnsHost,
      rfc3161TokenUrl: rfc3161TokenUrl || undefined,
    },
  };

  const result = CrossDomainAnchorEngine.generate(input);

  const outDir = path.join(outBase, epoch);
  CrossDomainAnchorEngine.writeOutputs({ outDir, result });

  const latestDir = path.join(outBase, "latest");
  fs.mkdirSync(latestDir, { recursive: true });
  fs.writeFileSync(path.join(latestDir, "anchorRecord.json"), JSON.stringify(result.anchorRecord, null, 2) + "\n", "utf8");
  fs.writeFileSync(path.join(latestDir, "dnsTxtValue.txt"), result.dnsTxtValue + "\n", "utf8");
  fs.writeFileSync(path.join(latestDir, "chainPayloads.json"), JSON.stringify(result.chainPayloads, null, 2) + "\n", "utf8");

  console.log(`[ok] cross-domain anchor generated for epoch=${epoch}`);
  console.log(`     out=${outDir}`);
  console.log(`     dnsHost=${dnsHost}`);
  console.log(`     btcOpReturnBytes=${Buffer.from(result.chainPayloads.btcOpReturnHex, "hex").length}`);
}

main().catch((err) => {
  console.error("[fatal]", err?.stack || String(err));
  process.exit(1);
});