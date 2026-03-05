// @ts-nocheck
/* eslint-disable no-console */

/**
 * Phase 14 — Deliverable 4
 * Selective Graph Signing (High-value first)
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import fg from "fast-glob";
import jsonld from "jsonld";
import rdfCanonize from "rdf-canonize";
import nacl from "tweetnacl";

type AnyJson = Record<string, any>;

type SelectionConfig = {
  mode?: "highValueFirst" | "all" | "none";
  maxToSign?: number;
  highValueTypes?: string[];
  highValueIdPrefixes?: string[];
  highValueContains?: Array<{ path: string[]; equals?: any; exists?: boolean }>;
  alwaysIncludeGlobs?: string[];
  excludeGlobs?: string[];
};

type ProofConfig = {
  verificationMethod: string;
  proofPurpose?: string;
  cryptosuite?: string;
  createdUtc?: "auto" | string;
};

type CanonConfig = {
  maxWorkFactor?: number;
};

type KeysConfig = {
  ed25519PrivateKeyHexEnv: string;
};

type GraphSigningConfig = {
  inputs: string[];
  outputDir: string;
  selection?: SelectionConfig;
  proof: ProofConfig;
  canonicalization?: CanonConfig;
  keys: KeysConfig;
};

const REPO_ROOT = process.cwd();

function readJsonFile(p: string): AnyJson {
  const abs = path.join(REPO_ROOT, p);
  const raw = fs.readFileSync(abs, "utf8");
  return JSON.parse(raw) as AnyJson;
}

function writeJsonFile(p: string, obj: AnyJson): void {
  const abs = path.join(REPO_ROOT, p);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function sha256Hex(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function base64url(buf: Uint8Array): string {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getArg(name: string): string | null {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  const v = process.argv[idx + 1];
  return typeof v === "string" ? v : null;
}

function safeGetByPath(obj: any, p: string[]): any {
  let cur = obj;
  for (const key of p) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = cur[key];
  }
  return cur;
}

function normalizeType(t: any): string[] {
  if (!t) return [];
  if (Array.isArray(t)) return t.filter((x) => typeof x === "string");
  if (typeof t === "string") return [t];
  return [];
}

function isHighValueGraph(doc: AnyJson, sel: SelectionConfig): boolean {
  const hvTypes = sel.highValueTypes ?? [];
  const hvPrefixes = sel.highValueIdPrefixes ?? [];
  const hvContains = sel.highValueContains ?? [];

  const types = normalizeType(doc["@type"]);
  const id = typeof doc["@id"] === "string" ? doc["@id"] : "";

  const typeHit = hvTypes.length > 0 && types.some((t) => hvTypes.includes(t));
  const idHit = hvPrefixes.length > 0 && hvPrefixes.some((pfx) => id.startsWith(pfx));

  const containsHit =
    hvContains.length > 0 &&
    hvContains.some((rule) => {
      const v = safeGetByPath(doc, rule.path);
      if (rule.exists === true) return v !== undefined;
      if ("equals" in rule) return v === rule.equals;
      return false;
    });

  return Boolean(typeHit || idHit || containsHit);
}

async function canonicalizeToNQuads(doc: AnyJson, maxWorkFactor: number): Promise<string> {
  const expanded = (await jsonld.expand(doc, {
    documentLoader: (url: string) => {
      throw new Error(`Remote context loading is disabled for determinism: ${url}`);
    }
  })) as any;

  const nquads = (await jsonld.toRDF(expanded, {
    format: "application/n-quads"
  })) as string;

  const canon = await rdfCanonize.canonize(nquads, {
    algorithm: "RDFC-1.0",
    format: "application/n-quads",
    maxWorkFactor
  });

  return canon as string;
}

function signEd25519(privateKeyHex: string, message: Uint8Array): Uint8Array {
  const sk = Buffer.from(privateKeyHex.replace(/^0x/i, ""), "hex");
  if (sk.length !== 64) {
    if (sk.length === 32) {
      const kp = nacl.sign.keyPair.fromSeed(new Uint8Array(sk));
      return nacl.sign.detached(message, kp.secretKey);
    }
    throw new Error(`Invalid Ed25519 key length. Expected 64-byte secret key or 32-byte seed. Got ${sk.length} bytes.`);
  }
  return nacl.sign.detached(message, new Uint8Array(sk));
}

function removeExistingProof(doc: AnyJson): AnyJson {
  if (!doc || typeof doc !== "object") return doc;
  const copy = JSON.parse(JSON.stringify(doc)) as AnyJson;
  delete copy.proof;
  return copy;
}

function attachProof(doc: AnyJson, proof: AnyJson): AnyJson {
  const out = JSON.parse(JSON.stringify(doc)) as AnyJson;
  out.proof = proof;
  return out;
}

function nowUtcIso(): string {
  return new Date().toISOString();
}

function resolveOutputPath(inputPath: string, outputDir: string): string {
  const rel = inputPath.replace(/^[./]*/, "");
  return path.join(outputDir, rel);
}

async function main() {
  const configPath = getArg("--config") ?? "tools/graph/graphSigning.config.json";
  
  // Create default config if missing
  if (!fs.existsSync(path.join(REPO_ROOT, configPath))) {
    console.warn(`⚠️ Config missing at ${configPath}. Generating default config...`);
    const defaultCfg: GraphSigningConfig = {
      inputs: ["web/public/transparency/**/*.json", "web/public/.well-known/**/*.json"],
      outputDir: "web/public/signed",
      selection: {
        mode: "highValueFirst",
        maxToSign: 50,
        alwaysIncludeGlobs: ["web/public/.well-known/whenisdue-trust.json"]
      },
      proof: {
        verificationMethod: "did:web:whenisdue.com#key-1",
        proofPurpose: "assertionMethod",
        cryptosuite: "eddsa-rdfc-2022",
        createdUtc: "auto"
      },
      canonicalization: { maxWorkFactor: 2 },
      keys: { ed25519PrivateKeyHexEnv: "WHENISDUE_GRAPH_SIGNING_PRIVATE_KEY_HEX" }
    };
    writeJsonFile(configPath, defaultCfg);
  }

  const cfg = readJsonFile(configPath) as GraphSigningConfig;

  const sel: SelectionConfig = cfg.selection ?? { mode: "highValueFirst" };
  const mode = sel.mode ?? "highValueFirst";
  const maxToSign = Number.isFinite(sel.maxToSign as any) ? Number(sel.maxToSign) : 50;

  let privateKeyHex = process.env[cfg.keys?.ed25519PrivateKeyHexEnv || "WHENISDUE_GRAPH_SIGNING_PRIVATE_KEY_HEX"];
  
  // Safe local fallback
  if (!privateKeyHex) {
    console.warn("⚠️ Missing Private Key Environment Variable. Using local dummy key for testing.");
    // Generate a dummy 32-byte seed
    privateKeyHex = crypto.randomBytes(32).toString("hex");
  }

  const maxWorkFactor = Number.isFinite(cfg.canonicalization?.maxWorkFactor as any)
    ? Number(cfg.canonicalization?.maxWorkFactor)
    : 2;

  const exclude = sel.excludeGlobs ?? [];
  const inputs = cfg.inputs ?? [];
  if (!Array.isArray(inputs) || inputs.length === 0) {
    console.error(`Config inputs[] is required.`);
    process.exit(2);
  }

  const candidateFiles = await fg(inputs.map(i => path.join(REPO_ROOT, i)), {
    onlyFiles: true,
    dot: true,
    unique: true,
    ignore: exclude.map(i => path.join(REPO_ROOT, i))
  });

  const alwaysIncludePaths = sel.alwaysIncludeGlobs?.length
    ? await fg(sel.alwaysIncludeGlobs.map(i => path.join(REPO_ROOT, i)), { onlyFiles: true, dot: true, unique: true, ignore: exclude })
    : [];

  const alwaysSet = new Set(alwaysIncludePaths);

  const scored: Array<{ file: string; score: number }> = [];
  for (const absFile of candidateFiles) {
    const file = path.relative(REPO_ROOT, absFile);
    if (!file.endsWith(".json") && !file.endsWith(".jsonld")) continue;

    let doc: AnyJson;
    try {
      doc = readJsonFile(file);
    } catch {
      continue;
    }

    let score = 0;
    if (alwaysSet.has(absFile)) score += 1000;
    if (isHighValueGraph(doc, sel)) score += 100;

    const id = typeof doc["@id"] === "string" ? doc["@id"] : "";
    if (id.includes("/registry") || id.includes("/graph")) score += 25;

    if (doc.publisher) score += 10;
    if (doc.isBasedOn) score += 10;

    scored.push({ file, score });
  }

  scored.sort((a, b) => b.score - a.score);

  const toProcess =
    mode === "none"
      ? []
      : mode === "all"
        ? scored
        : scored.slice(0, Math.max(0, maxToSign));

  if (toProcess.length === 0) {
    console.log(`[signSelectiveGraphs] Nothing selected (mode=${mode}).`);
    process.exit(0);
  }

  const report: AnyJson = {
    generatedAt: nowUtcIso(),
    mode,
    maxToSign,
    outputDir: cfg.outputDir,
    signed: [] as any[]
  };

  let signedCount = 0;

  for (const item of toProcess) {
    const file = item.file;

    let doc: AnyJson;
    try {
      doc = readJsonFile(file);
    } catch (e) {
      console.warn(`[skip] unreadable json: ${file}`);
      continue;
    }

    const baseDoc = removeExistingProof(doc);

    let canonNQuads = "";
    try {
      canonNQuads = await canonicalizeToNQuads(baseDoc, maxWorkFactor);
    } catch (e: any) {
      console.warn(`[skip] canonicalization failed (usually missing contexts): ${file}`);
      continue;
    }

    const digestHex = sha256Hex(canonNQuads);
    const digestBytes = Buffer.from(digestHex, "hex");

    const sig = signEd25519(privateKeyHex, new Uint8Array(digestBytes));
    const proofValue = base64url(sig);

    const created =
      cfg.proof.createdUtc === "auto" || !cfg.proof.createdUtc ? nowUtcIso() : String(cfg.proof.createdUtc);

    const proof: AnyJson = {
      type: "DataIntegrityProof",
      cryptosuite: cfg.proof.cryptosuite ?? "eddsa-rdfc-2022",
      created,
      proofPurpose: cfg.proof.proofPurpose ?? "assertionMethod",
      verificationMethod: cfg.proof.verificationMethod,
      proofValue,
      digest: {
        algorithm: "sha256",
        value: `sha256:${digestHex}`,
        canonicalization: "RDFC-1.0",
        format: "application/n-quads"
      }
    };

    const signedDoc = attachProof(baseDoc, proof);

    const outPath = resolveOutputPath(file, cfg.outputDir);
    writeJsonFile(outPath, signedDoc);

    report.signed.push({
      input: file,
      output: outPath,
      score: item.score,
      id: typeof signedDoc["@id"] === "string" ? signedDoc["@id"] : "",
      types: normalizeType(signedDoc["@type"]),
      digest: `sha256:${digestHex}`
    });

    signedCount += 1;
  }

  const reportPath = path.join(cfg.outputDir, "graph-signing.report.json");
  writeJsonFile(reportPath, report);

  console.log(`[signSelectiveGraphs] Signed ${signedCount} graphs.`);
  console.log(`[signSelectiveGraphs] Report: ${reportPath}`);
}

main().catch((err) => {
  console.error(String(err?.stack ?? err));
  process.exit(2);
});