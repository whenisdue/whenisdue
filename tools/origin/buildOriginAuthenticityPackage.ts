// @ts-nocheck
/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

type ManifestEntry = {
  path: string; // posix-style relative path from repo root
  sha256: string; // hex
  bytes: number;
};

type WhenIsDueManifest = {
  specVersion: "whenisdue-manifest-v1";
  iss: string;
  builtUtc: string; // ISO
  keyId: string;
  files: ManifestEntry[];
  manifestSha256: string; // sha256:hex of canonical manifest payload (without signature)
};

type OriginDoc = {
  iss: string;
  specVersion: string;
  purpose?: string;
  policy?: string;
  transparency?: Record<string, unknown>;
  keys?: {
    activeKeyId: string;
    verificationMethods: Array<{
      keyId: string;
      type: string;
      publicKeyBase64: string;
      publicKeySha256: string;
    }>;
  };
  manifest?: {
    manifestUrl: string;
    signatureUrl: string;
    activeManifestSha256: string;
    activeManifestSignatureKeyId: string;
  };
  build?: {
    builtUtc: string;
    note?: string;
  };
  [k: string]: unknown;
};

const REPO_ROOT = process.cwd();

function toPosix(p: string): string {
  return p.split(path.sep).join(path.posix.sep);
}

function sha256Hex(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function readFileBuffer(rel: string): Buffer {
  const abs = path.join(REPO_ROOT, rel);
  return fs.readFileSync(abs);
}

function canonicalizeJson(value: unknown): string {
  const norm = normalize(value);
  return JSON.stringify(norm);

  function normalize(v: any): any {
    if (v === null) return null;

    const t = typeof v;
    if (t === "string" || t === "boolean") return v;

    if (t === "number") {
      if (!Number.isFinite(v)) {
        throw new Error("Non-finite number encountered during canonicalization.");
      }
      return v;
    }

    if (Array.isArray(v)) {
      return v.map((x) => normalize(x));
    }

    if (t === "object") {
      const out: Record<string, any> = {};
      const keys = Object.keys(v).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      for (const k of keys) out[k] = normalize(v[k]);
      return out;
    }

    throw new Error(`Unsupported type in canonicalization: ${t}`);
  }
}

function ensureDir(absDir: string): void {
  if (!fs.existsSync(absDir)) {
    fs.mkdirSync(absDir, { recursive: true });
  }
}

function writeUtf8(absPath: string, content: string): void {
  ensureDir(path.dirname(absPath));
  fs.writeFileSync(absPath, content, "utf8");
}

function computeManifestEntries(relPaths: string[]): ManifestEntry[] {
  const entries: ManifestEntry[] = [];
  for (const rel of relPaths) {
    const buf = readFileBuffer(rel);
    entries.push({
      path: toPosix(rel),
      sha256: `sha256:${sha256Hex(buf)}`,
      bytes: buf.byteLength,
    });
  }
  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return entries;
}

function signEd25519(privateKeyPem: string, payload: Buffer): Buffer {
  const key = crypto.createPrivateKey(privateKeyPem);
  return crypto.sign(null, payload, key);
}

function derivePublicKey(privateKeyPem: string): { publicKeyBase64: string; publicKeySha256Hex: string } {
  const priv = crypto.createPrivateKey(privateKeyPem);
  const pub = crypto.createPublicKey(priv);
  const der = pub.export({ type: "spki", format: "der" }) as Buffer;
  const publicKeyBase64 = der.toString("base64");
  const publicKeySha256Hex = sha256Hex(der);
  return { publicKeyBase64, publicKeySha256Hex };
}

function loadOriginDoc(originAbsPath: string): OriginDoc {
  const raw = fs.readFileSync(originAbsPath, "utf8");
  return JSON.parse(raw) as OriginDoc;
}

function main(): void {
  const ISS = "https://whenisdue.com";
  const KEY_ID = "key-1";

  let privateKeyPem = process.env.WHENISDUE_ORIGIN_ED25519_PRIVATE_KEY_PEM;
  
  // Fallback for local testing if env variable is missing
  if (!privateKeyPem || privateKeyPem.trim().length < 64) {
    console.warn("⚠️ No valid WHENISDUE_ORIGIN_ED25519_PRIVATE_KEY_PEM found. Generating dummy key for local testing.");
    const { privateKey } = crypto.generateKeyPairSync("ed25519");
    privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }) as string;
  }

  const builtUtc = new Date().toISOString();

  // Adapted paths for your specific project structure
  const filesToBind: string[] = [
    "data/events.json",
    "data/couplingSignalRegistry.json",
    "data/eligibilitySignalRegistry.json",
    "web/public/.well-known/registry-checkpoint.json"
  ];

  for (const rel of filesToBind) {
    const abs = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(abs)) {
      console.warn(`Manifest bind file missing (skipping for now): ${rel}`);
    }
  }

  // Filter out missing files to prevent crashes during dev
  const validFiles = filesToBind.filter(rel => fs.existsSync(path.join(REPO_ROOT, rel)));
  const entries = computeManifestEntries(validFiles);

  const manifestCore = {
    specVersion: "whenisdue-manifest-v1" as const,
    iss: ISS,
    builtUtc,
    keyId: KEY_ID,
    files: entries,
  };

  const canonicalManifestCore = canonicalizeJson(manifestCore);
  const manifestShaHex = sha256Hex(Buffer.from(canonicalManifestCore, "utf8"));
  const manifestSha = `sha256:${manifestShaHex}`;

  const fullManifest: WhenIsDueManifest = {
    ...manifestCore,
    manifestSha256: manifestSha,
  };

  const canonicalFullManifest = canonicalizeJson(fullManifest);
  const signatureRaw = signEd25519(privateKeyPem, Buffer.from(canonicalFullManifest, "utf8"));
  const signatureB64 = signatureRaw.toString("base64");

  const manifestAbs = path.join(REPO_ROOT, "web/public/.well-known/whenisdue-manifest.json");
  const sigAbs = path.join(REPO_ROOT, "web/public/.well-known/whenisdue-manifest.sig");

  writeUtf8(manifestAbs, canonicalFullManifest + "\n");
  writeUtf8(sigAbs, signatureB64 + "\n");

  const originAbs = path.join(REPO_ROOT, "web/public/.well-known/whenisdue-origin.json");
  const origin = loadOriginDoc(originAbs);

  const { publicKeyBase64, publicKeySha256Hex } = derivePublicKey(privateKeyPem);

  origin.iss = ISS;
  origin.keys = origin.keys ?? { activeKeyId: KEY_ID, verificationMethods: [] };
  origin.keys.activeKeyId = KEY_ID;
  origin.keys.verificationMethods = [
    {
      keyId: KEY_ID,
      type: "Ed25519",
      publicKeyBase64,
      publicKeySha256: publicKeySha256Hex,
    },
  ];

  origin.manifest = origin.manifest ?? {
    manifestUrl: `${ISS}/.well-known/whenisdue-manifest.json`,
    signatureUrl: `${ISS}/.well-known/whenisdue-manifest.sig`,
    activeManifestSha256: manifestSha,
    activeManifestSignatureKeyId: KEY_ID,
  };

  origin.manifest.manifestUrl = `${ISS}/.well-known/whenisdue-manifest.json`;
  origin.manifest.signatureUrl = `${ISS}/.well-known/whenisdue-manifest.sig`;
  origin.manifest.activeManifestSha256 = manifestSha;
  origin.manifest.activeManifestSignatureKeyId = KEY_ID;

  origin.build = origin.build ?? { builtUtc };
  origin.build.builtUtc = builtUtc;

  const canonicalOrigin = canonicalizeJson(origin);
  writeUtf8(originAbs, canonicalOrigin + "\n");

  console.log("✅ Origin authenticity package generated:");
  console.log(`- ${toPosix(path.relative(REPO_ROOT, originAbs))}`);
  console.log(`- ${toPosix(path.relative(REPO_ROOT, manifestAbs))}`);
  console.log(`- ${toPosix(path.relative(REPO_ROOT, sigAbs))}`);
  console.log(`- activeManifestSha256=${manifestSha}`);
}

main();