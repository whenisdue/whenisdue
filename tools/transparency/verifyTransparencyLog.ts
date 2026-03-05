// @ts-nocheck
/* eslint-disable no-console */
/**
 * Phase 13 — Deliverable 2
 * Transparency Verifier (dev tool)
 *
 * Verifies:
 * 1) STH signature (Ed25519) over canonical payload
 * 2) Root hash matches recomputed Merkle root from web/public/transparency/entries/**
 * 3) (Optional) Inclusion proof for a specific (version_id + registry_slug) leaf
 * using tiles to reconstruct the audit path (deterministic, no network)
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

type LeafEntry = {
  version_id: string;
  registry_slug: string;
  data_hash: string;
  source_uri: string;
  published_at: string;
};

type STH = {
  tree_size: number;
  root_hash: string;
  timestamp_utc: string;
  key_id: string;
  signature_b64: string;
  algo: "ed25519-sha256";
};

const ROOT = process.cwd();
const TILE_WIDTH = 256;

// -------------------- deterministic JSON canonical-ish stringify --------------------
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

// -------------------- filesystem helpers --------------------

function readJson<T>(absPath: string): T {
  return JSON.parse(fs.readFileSync(absPath, "utf8")) as T;
}

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
    const e = readJson<LeafEntry>(f);
    if (e && typeof e.version_id === "string" && typeof e.registry_slug === "string") entries.push(e);
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

// -------------------- signature verification --------------------

function sha256Hex(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function loadPublicKey(): crypto.KeyObject {
  const pubB64 = process.env.WHENISDUE_LOG_ED25519_PUBLIC_KEY_B64?.trim();
  if (!pubB64) throw new Error("Missing WHENISDUE_LOG_ED25519_PUBLIC_KEY_B64 (base64 SPKI DER). Set this env variable to verify signatures.");
  return crypto.createPublicKey({ key: Buffer.from(pubB64, "base64"), format: "der", type: "spki" });
}

function ed25519Verify(publicKey: crypto.KeyObject, msg: Buffer, sig: Buffer): boolean {
  return crypto.verify(null, msg, publicKey, sig);
}

// -------------------- tiles + inclusion proof --------------------

type TileJson = {
  level: number;
  tile_index: number;
  width: number;
  count: number;
  algo: string;
  hashes_hex: string[];
};

function tilePath(level: number, tileIndex: number): string {
  const a = Math.floor(tileIndex / 1000);
  const b = tileIndex % 1000;
  const pa = String(a).padStart(3, "0");
  const pb = String(b).padStart(3, "0");
  return path.join(ROOT, "web/public/transparency/tiles", String(level), pa, `${pb}.tile.json`);
}

function getHashAt(level: number, idx: number): Buffer {
  const tileIndex = Math.floor(idx / TILE_WIDTH);
  const within = idx % TILE_WIDTH;
  const p = tilePath(level, tileIndex);
  if (!fs.existsSync(p)) throw new Error(`Missing tile file for level=${level} tile=${tileIndex}: ${p}`);
  const tile = readJson<TileJson>(p);
  if (!tile.hashes_hex[within]) throw new Error(`Missing hash in tile for level=${level} idx=${idx}`);
  return Buffer.from(tile.hashes_hex[within], "hex");
}

function buildInclusionProofFromTiles(treeSize: number, leafIndex0: number): Buffer[] {
  const proof: Buffer[] = [];
  let idx = leafIndex0;
  let level = 0;

  let levelSize = treeSize;
  while (levelSize > 1) {
    const sibling = idx ^ 1;
    const siblingIdx = sibling < levelSize ? sibling : idx;
    proof.push(getHashAt(level, siblingIdx));

    idx = Math.floor(idx / 2);
    levelSize = Math.ceil(levelSize / 2);
    level += 1;
  }

  return proof;
}

function verifyInclusion(leafHash: Buffer, proof: Buffer[], treeSize: number, leafIndex0: number): Buffer {
  let idx = leafIndex0;
  let acc = leafHash;
  let levelSize = treeSize;

  for (let i = 0; i < proof.length; i++) {
    const sib = proof[i];
    const isRight = (idx % 2) === 1;

    acc = isRight ? ctNodeHash(sib, acc) : ctNodeHash(acc, sib);

    idx = Math.floor(idx / 2);
    levelSize = Math.ceil(levelSize / 2);
    if (levelSize <= 1) break;
  }

  return acc;
}

// -------------------- CLI args --------------------

function parseArgs(argv: string[]) {
  const out: Record<string, string | boolean> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--include") out.include = true;
    else if (a === "--version") out.version = argv[++i] ?? "";
    else if (a === "--slug") out.slug = argv[++i] ?? "";
    else if (a === "--help") out.help = true;
  }
  return out;
}

// -------------------- main --------------------

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    console.log(`Usage:
  ts-node tools/transparency/verifyTransparencyLog.ts
  ts-node tools/transparency/verifyTransparencyLog.ts --include --version v1.2.4 --slug events
Env:
  WHENISDUE_LOG_ED25519_PUBLIC_KEY_B64 (base64 SPKI DER)
`);
    process.exit(0);
  }

  const sthAbs = path.join(ROOT, "web/public/transparency/sth/latest.json");
  if (!fs.existsSync(sthAbs)) throw new Error("Missing web/public/transparency/sth/latest.json. Run the builder first.");

  const sth = readJson<STH>(sthAbs);

  // 1) Verify STH signature
  const publicKey = loadPublicKey();
  const spkiDer = publicKey.export({ format: "der", type: "spki" }) as Buffer;
  const computedKeyId = `sha256:${sha256Hex(spkiDer)}`;
  if (computedKeyId !== sth.key_id) {
    throw new Error(`KeyId mismatch: sth.key_id=${sth.key_id} computed=${computedKeyId}`);
  }

  const sthUnsigned = {
    tree_size: sth.tree_size,
    root_hash: sth.root_hash,
    timestamp_utc: sth.timestamp_utc,
    key_id: sth.key_id,
    algo: sth.algo,
  };
  const sthMsg = Buffer.from(stableStringify(sthUnsigned), "utf8");
  const sig = Buffer.from(sth.signature_b64, "base64");
  const okSig = ed25519Verify(publicKey, sthMsg, sig);
  if (!okSig) throw new Error("STH signature verification FAILED.");

  console.log(`[OK] STH signature verified`);
  console.log(`     tree_size=${sth.tree_size}`);
  console.log(`     root_hash=${sth.root_hash}`);
  console.log(`     key_id=${sth.key_id}`);

  // 2) Verify root against entries
  const entries = loadAllEntriesSorted();
  if (entries.length !== sth.tree_size) {
    throw new Error(`Consistency FAIL: sth.tree_size=${sth.tree_size} but entries=${entries.length}`);
  }

  const leafHashes = entries.map(ctLeafHash);
  const root = merkleRoot(leafHashes);
  const rootTag = `sha256:${root.toString("hex")}`;
  if (rootTag !== sth.root_hash) {
    throw new Error(`Root mismatch: computed=${rootTag} sth=${sth.root_hash}`);
  }

  console.log(`[OK] Root hash matches recomputed Merkle root`);

  // 3) Optional inclusion proof via tiles
  if (args.include) {
    const version = String(args.version ?? "").trim();
    const slug = String(args.slug ?? "").trim();
    if (!version || !slug) throw new Error("Inclusion proof requires --version and --slug");

    const idx0 = entries.findIndex((e) => e.version_id === version && e.registry_slug === slug);
    if (idx0 < 0) throw new Error(`Leaf not found for version=${version} slug=${slug}`);

    const leaf = entries[idx0];
    const leafHash = ctLeafHash(leaf);

    const proof = buildInclusionProofFromTiles(sth.tree_size, idx0);
    const rootFromProof = verifyInclusion(leafHash, proof, sth.tree_size, idx0);
    const proofRootTag = `sha256:${rootFromProof.toString("hex")}`;

    if (proofRootTag !== sth.root_hash) {
      throw new Error(`Inclusion proof FAILED: proof_root=${proofRootTag} sth_root=${sth.root_hash}`);
    }

    console.log(`[OK] Inclusion proof verified (tiles)`);
    console.log(`     leaf_index=${idx0} (0-based)`);
    console.log(`     version_id=${leaf.version_id}`);
    console.log(`     registry_slug=${leaf.registry_slug}`);
    console.log(`     leaf_data_hash=${leaf.data_hash}`);
  }
}

main();