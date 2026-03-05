// @ts-nocheck
/* eslint-disable no-console */
/**
 * Phase 13 — Deliverable 1
 * Transparency Log Builder (CI script)
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

type LeafEntry = {
  version_id: string;
  registry_slug: string;
  data_hash: string;     // sha256:...
  source_uri: string;    // public URL
  published_at: string;  // ISO UTC
};

type STH = {
  tree_size: number;
  root_hash: string;     // sha256:...
  timestamp_utc: string; // ISO UTC
  key_id: string;        // sha256:... (SPKI fingerprint)
  signature_b64: string; // Ed25519 signature over canonical STH payload
  algo: "ed25519-sha256";
};

type Config = {
  issuerOrigin: string;
  registries: Array<{
    slug: string;
    filePath: string;
    sourceUri: string;
  }>;
};

const ROOT = process.cwd();
const TILE_WIDTH = 256;

// -------------------- tiny utilities --------------------

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}
function writeJson(absPath: string, obj: unknown) {
  ensureDir(path.dirname(absPath));
  fs.writeFileSync(absPath, JSON.stringify(obj, null, 2) + "\n", "utf8");
}
function readJson<T>(absPath: string): T {
  return JSON.parse(fs.readFileSync(absPath, "utf8")) as T;
}
function toUtcIso(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}
function sha256Hex(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}
function sha256Tag(buf: Buffer): string {
  return `sha256:${sha256Hex(buf)}`;
}

function stableStringify(x: any): string {
  if (x === null) return "null";
  const t = typeof x;
  if (t === "string") return JSON.stringify(x);
  if (t === "boolean") return x ? "true" : "false";
  if (t === "number") {
    if (!Number.isFinite(x)) throw new Error("Non-finite number in canonical JSON.");
    return JSON.stringify(x);
  }
  if (Array.isArray(x)) return "[" + x.map(stableStringify).join(",") + "]";
  if (t === "object") {
    const keys = Object.keys(x).sort();
    return (
      "{" +
      keys
        .map((k) => JSON.stringify(k) + ":" + stableStringify((x as any)[k]))
        .join(",") +
      "}"
    );
  }
  throw new Error(`Unsupported JSON type: ${t}`);
}

// -------------------- CT hashing --------------------

function ctLeafHash(entry: LeafEntry): Buffer {
  const jcs = stableStringify(entry);
  const msg = Buffer.concat([Buffer.from([0x00]), Buffer.from(jcs, "utf8")]);
  return crypto.createHash("sha256").update(msg).digest();
}
function ctNodeHash(left: Buffer, right: Buffer): Buffer {
  const msg = Buffer.concat([Buffer.from([0x01]), left, right]);
  return crypto.createHash("sha256").update(msg).digest();
}
function merkleRoot(leaves: Buffer[]): Buffer {
  if (leaves.length === 0) return crypto.createHash("sha256").update(Buffer.alloc(0)).digest();
  let level = leaves.slice();
  while (level.length > 1) {
    const next: Buffer[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const l = level[i];
      const r = i + 1 < level.length ? level[i + 1] : level[i];
      next.push(ctNodeHash(l, r));
    }
    level = next;
  }
  return level[0];
}

// -------------------- paths --------------------

function entryPathByIndex(idx1: number): string {
  const a = Math.floor(idx1 / 1_000_000);
  const b = Math.floor((idx1 % 1_000_000) / 1_000);
  const c = idx1 % 1_000;
  const pa = String(a).padStart(3, "0");
  const pb = String(b).padStart(3, "0");
  const pc = String(c).padStart(3, "0");
  return path.join(ROOT, "web/public/transparency/entries", pa, pb, `${pc}.json`);
}

function tilePath(level: number, tileIndex: number): string {
  const a = Math.floor(tileIndex / 1000);
  const b = tileIndex % 1000;
  const pa = String(a).padStart(3, "0");
  const pb = String(b).padStart(3, "0");
  return path.join(ROOT, "web/public/transparency/tiles", String(level), pa, `${pb}.tile.json`);
}

// -------------------- listing existing entries --------------------

function listFilesRecursive(absDir: string): string[] {
  if (!fs.existsSync(absDir)) return [];
  const out: string[] = [];
  const walk = (d: string) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else out.push(p);
    }
  };
  walk(absDir);
  return out;
}

function loadAllEntriesSorted(): LeafEntry[] {
  const base = path.join(ROOT, "web/public/transparency/entries");
  const files = listFilesRecursive(base).filter((p) => p.endsWith(".json"));
  const entries: LeafEntry[] = [];
  for (const f of files) {
    try {
      const e = readJson<LeafEntry>(f);
      if (e && typeof e.version_id === "string" && typeof e.registry_slug === "string") entries.push(e);
    } catch {
    }
  }

  entries.sort((a, b) => {
    const da = a.published_at.localeCompare(b.published_at);
    if (da !== 0) return da;
    const ds = a.registry_slug.localeCompare(b.registry_slug);
    if (ds !== 0) return ds;
    const dv = a.version_id.localeCompare(b.version_id);
    if (dv !== 0) return dv;
    return a.data_hash.localeCompare(b.data_hash);
  });
  return entries;
}

// -------------------- keys + signing --------------------

function loadKeypair(): { privateKey: crypto.KeyObject; publicKey: crypto.KeyObject; keyId: string } {
  const privB64 = process.env.WHENISDUE_LOG_ED25519_PRIVATE_KEY_B64?.trim() || crypto.generateKeyPairSync("ed25519").privateKey.export({ format: "der", type: "pkcs8" }).toString("base64");
  
  const privateKey = crypto.createPrivateKey({
    key: Buffer.from(privB64, "base64"),
    format: "der",
    type: "pkcs8",
  });

  const pubB64 = process.env.WHENISDUE_LOG_ED25519_PUBLIC_KEY_B64?.trim();
  const publicKey = pubB64
    ? crypto.createPublicKey({ key: Buffer.from(pubB64, "base64"), format: "der", type: "spki" })
    : crypto.createPublicKey(privateKey);

  const spkiDer = publicKey.export({ format: "der", type: "spki" }) as Buffer;
  const keyId = `sha256:${sha256Hex(spkiDer)}`;
  return { privateKey, publicKey, keyId };
}

function ed25519Sign(privateKey: crypto.KeyObject, msg: Buffer): Buffer {
  return crypto.sign(null, msg, privateKey);
}

function ed25519Verify(publicKey: crypto.KeyObject, msg: Buffer, sig: Buffer): boolean {
  return crypto.verify(null, msg, publicKey, sig);
}

// -------------------- tiles writer --------------------

function writeTilesFromLeafHashes(leafHashes: Buffer[]) {
  const levels: Buffer[][] = [];
  levels.push(leafHashes);

  while (levels[levels.length - 1].length > 1) {
    const prev = levels[levels.length - 1];
    const next: Buffer[] = [];
    for (let i = 0; i < prev.length; i += 2) {
      const l = prev[i];
      const r = i + 1 < prev.length ? prev[i + 1] : prev[i];
      next.push(ctNodeHash(l, r));
    }
    levels.push(next);
  }

  for (let level = 0; level < levels.length; level++) {
    const arr = levels[level];
    const tileCount = Math.ceil(arr.length / TILE_WIDTH);
    for (let t = 0; t < tileCount; t++) {
      const slice = arr.slice(t * TILE_WIDTH, (t + 1) * TILE_WIDTH);
      const hashesHex = slice.map((b) => b.toString("hex"));
      writeJson(tilePath(level, t), {
        level,
        tile_index: t,
        width: TILE_WIDTH,
        count: hashesHex.length,
        algo: "sha256-ct",
        hashes_hex: hashesHex,
      });
    }
  }
}

// -------------------- config + version --------------------

function loadConfig(): Config {
  const abs = path.join(ROOT, "tools/transparency/transparencyLog.config.json");
  if (!fs.existsSync(abs)) {
    throw new Error("Missing tools/transparency/transparencyLog.config.json");
  }
  return readJson<Config>(abs);
}

function getVersionId(): string {
  const v = process.env.WHENISDUE_RELEASE_VERSION_ID?.trim();
  if (v) return v;

  const pkgPath = path.join(ROOT, "web/package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = readJson<{ version?: string }>(pkgPath);
    if (pkg.version?.trim()) return `v${pkg.version.trim()}`;
  }

  const seed = toUtcIso(new Date()).slice(0, 10);
  return `v0.0.0-${sha256Hex(Buffer.from(seed, "utf8")).slice(0, 10)}`;
}

// -------------------- main builder --------------------

function buildNewLeaves(config: Config, versionId: string, nowUtc: string): LeafEntry[] {
  return config.registries.map((r) => {
    const abs = path.join(ROOT, r.filePath);
    if (!fs.existsSync(abs)) throw new Error(`Registry missing: ${r.filePath}`);
    const bytes = fs.readFileSync(abs);
    return {
      version_id: versionId,
      registry_slug: r.slug,
      data_hash: sha256Tag(bytes),
      source_uri: r.sourceUri,
      published_at: nowUtc,
    };
  });
}

function main() {
  const config = loadConfig();
  const { privateKey, publicKey, keyId } = loadKeypair();

  const nowUtc = toUtcIso(new Date());
  const versionId = getVersionId();

  const sthAbs = path.join(ROOT, "web/public/transparency/sth/latest.json");

  if (fs.existsSync(sthAbs)) {
    const prior = readJson<STH>(sthAbs);
    const existing = loadAllEntriesSorted();
    if (prior.tree_size !== existing.length) {
      throw new Error(
        `Consistency Guard FAIL: prior.tree_size=${prior.tree_size} but entries=${existing.length}. Possible rollback/tamper.`
      );
    }
  }

  const before = loadAllEntriesSorted();
  const newLeaves = buildNewLeaves(config, versionId, nowUtc);

  const startIdx = before.length + 1;
  for (let i = 0; i < newLeaves.length; i++) {
    writeJson(entryPathByIndex(startIdx + i), newLeaves[i]);
  }

  const all = loadAllEntriesSorted();
  const leafHashes = all.map(ctLeafHash);
  const root = merkleRoot(leafHashes);
  const rootHashTag = `sha256:${root.toString("hex")}`;

  writeTilesFromLeafHashes(leafHashes);

  const sthUnsigned = {
    tree_size: all.length,
    root_hash: rootHashTag,
    timestamp_utc: nowUtc,
    key_id: keyId,
    algo: "ed25519-sha256" as const,
  };
  const sthMsg = Buffer.from(stableStringify(sthUnsigned), "utf8");
  const sig = ed25519Sign(privateKey, sthMsg);

  if (!ed25519Verify(publicKey, sthMsg, sig)) {
    throw new Error("STH self-verification failed (signature mismatch).");
  }

  const sth: STH = {
    ...sthUnsigned,
    signature_b64: sig.toString("base64"),
  };
  writeJson(sthAbs, sth);

  console.log(`✅ [OK] Transparency log updated`);
  console.log(`     version_id=${versionId}`);
  console.log(`     tree_size=${sth.tree_size}`);
  console.log(`     root_hash=${sth.root_hash}`);
  console.log(`     key_id=${sth.key_id}`);
}

main();