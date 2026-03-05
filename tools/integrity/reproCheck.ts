// @ts-nocheck
/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { spawnSync } from "child_process";

// ---------------------------------------------------------------------
// Phase 16 — Deliverable 3
// Tier-A Determinism Harness (reproCheck.ts)
// ---------------------------------------------------------------------

type CopyMode = "COPY" | "HARDLINK";

// --------------------------- Required env ---------------------------------

const NOW_UTC = mustEnv("WHENISDUE_NOW_UTC"); 
const BUILD_CMD = mustEnv("WHENISDUE_BUILD_CMD"); 
const ARTIFACT_DIR = mustEnv("WHENISDUE_ARTIFACT_DIR"); 
const OUT_A = mustEnv("WHENISDUE_REPRO_OUT_A"); 
const OUT_B = mustEnv("WHENISDUE_REPRO_OUT_B"); 

const COPY_MODE = (process.env.WHENISDUE_REPRO_COPY_MODE ?? "COPY").trim().toUpperCase() as CopyMode;
if (COPY_MODE !== "COPY" && COPY_MODE !== "HARDLINK") fail("WHENISDUE_REPRO_COPY_MODE must be COPY or HARDLINK");

// Optional env
const SOURCE_DATE_EPOCH = mustEnvInt("WHENISDUE_SOURCE_DATE_EPOCH", 0); 
const DIFFOSCOPE_CMD = (process.env.WHENISDUE_DIFFOSCOPE_CMD ?? "diffoscope").trim();
const ENABLE_DIFFOSCOPE = mustEnvBool("WHENISDUE_ENABLE_DIFFOSCOPE", true);
const MAX_DIFF_FILES = mustEnvInt("WHENISDUE_MAX_DIFF_FILES", 50); 

const CLEAN_CMD = (process.env.WHENISDUE_CLEAN_CMD ?? "").trim();

// --------------------------- Main -----------------------------------------

function main(): void {
  if (!isIsoUtc(NOW_UTC)) fail("WHENISDUE_NOW_UTC must be ISO 8601 UTC (ends with Z)");

  console.log(`[repro] now=${NOW_UTC}`);
  console.log(`[repro] build=${BUILD_CMD}`);
  console.log(`[repro] artifactDir=${ARTIFACT_DIR}`);
  console.log(`[repro] outA=${OUT_A}`);
  console.log(`[repro] outB=${OUT_B}`);
  console.log(`[repro] mode=${COPY_MODE}`);
  console.log(`[repro] SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH}`);

  runBuild("A", {
    SOURCE_DATE_EPOCH: String(SOURCE_DATE_EPOCH),
    LC_ALL: "C",
    TZ: "UTC",
    WHENISDUE_NOW_UTC: NOW_UTC,
  });

  snapshotArtifacts(ARTIFACT_DIR, OUT_A, COPY_MODE);
  const manifestA = buildManifest(OUT_A);
  writeText(path.join(OUT_A, "repro.manifest.sha256"), manifestA.manifestSha256 + "\n");
  writeJson(path.join(OUT_A, "repro.manifest.json"), manifestA);

  runBuild("B", {
    SOURCE_DATE_EPOCH: String(SOURCE_DATE_EPOCH),
    LC_ALL: "C",
    TZ: "UTC",
    WHENISDUE_NOW_UTC: NOW_UTC,
    WHENISDUE_REPRO_RUN: "B",
    HOME: "/tmp/whenisdue-repro-home",
  });

  snapshotArtifacts(ARTIFACT_DIR, OUT_B, COPY_MODE);
  const manifestB = buildManifest(OUT_B);
  writeText(path.join(OUT_B, "repro.manifest.sha256"), manifestB.manifestSha256 + "\n");
  writeJson(path.join(OUT_B, "repro.manifest.json"), manifestB);

  if (manifestA.manifestSha256 === manifestB.manifestSha256) {
    console.log("[repro] ✅ PASS: manifest hash match");
    console.log(`[repro] hash=${manifestA.manifestSha256}`);
    process.exit(0);
  }

  console.error("[repro] ❌ FAIL: manifest hash mismatch");
  console.error(`[repro] A=${manifestA.manifestSha256}`);
  console.error(`[repro] B=${manifestB.manifestSha256}`);

  const diff = diffManifests(manifestA, manifestB, MAX_DIFF_FILES);
  writeJson(path.join(process.cwd(), "repro.diff.json"), diff);
  console.error(`[repro] wrote repro.diff.json (capped to ${MAX_DIFF_FILES} file entries)`);

  if (ENABLE_DIFFOSCOPE) tryRunDiffoscope(OUT_A, OUT_B);

  process.exit(1);
}

main();

// --------------------------- Build runner ---------------------------------

function runBuild(label: "A" | "B", envExtra: Record<string, string>): void {
  console.log(`[repro] --- build ${label} ---`);

  if (CLEAN_CMD) {
    console.log(`[repro] clean ${label}: ${CLEAN_CMD}`);
    runShellOrFail(CLEAN_CMD, envExtra);
  }

  console.log(`[repro] build ${label}: ${BUILD_CMD}`);
  runShellOrFail(BUILD_CMD, envExtra);

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fail(`[repro] build ${label} produced no ARTIFACT_DIR: ${ARTIFACT_DIR}`);
  }
}

// --------------------------- Snapshot -------------------------------------

function snapshotArtifacts(srcDir: string, destDir: string, mode: CopyMode): void {
  rmrf(destDir);
  ensureDir(destDir);

  copyDirRecursive(srcDir, destDir, mode);

  clampMtimeRecursive(destDir, SOURCE_DATE_EPOCH);

  console.log(`[repro] snapshotted ${srcDir} -> ${destDir}`);
}

function copyDirRecursive(src: string, dest: string, mode: CopyMode): void {
  const entries = fs.readdirSync(src, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);

    if (e.isDirectory()) {
      ensureDir(d);
      copyDirRecursive(s, d, mode);
    } else if (e.isFile()) {
      if (mode === "HARDLINK") {
        fs.linkSync(s, d);
      } else {
        fs.copyFileSync(s, d);
      }
    } else if (e.isSymbolicLink()) {
      const target = fs.readlinkSync(s);
      fs.symlinkSync(target, d);
    }
  }
}

function clampMtimeRecursive(root: string, epochSeconds: number): void {
  const stack: string[] = [root];
  const atime = epochSeconds;
  const mtime = epochSeconds;

  while (stack.length) {
    const cur = stack.pop()!;
    const st = lstatSafe(cur);
    if (!st) continue;

    if (st.isDirectory()) {
      const entries = fs.readdirSync(cur, { withFileTypes: true });
      for (const e of entries) stack.push(path.join(cur, e.name));
      safeUtimes(cur, atime, mtime);
    } else {
      safeUtimes(cur, atime, mtime);
    }
  }
}

// --------------------------- Manifest -------------------------------------

type FileEntry = {
  relPath: string;
  size: number;
  sha256: string;
};

type Manifest = {
  createdAtUtc: string;
  sourceDateEpoch: number;
  baseDir: string;
  fileCount: number;
  totalBytes: number;
  files: FileEntry[]; 
  manifestSha256: string; 
};

function buildManifest(baseDir: string): Manifest {
  const files = listFiles(baseDir);
  const entries: FileEntry[] = [];
  let totalBytes = 0;

  for (const rel of files) {
    const abs = path.join(baseDir, rel);
    const st = fs.statSync(abs);
    const h = sha256FileHex(abs);
    entries.push({ relPath: rel, size: st.size, sha256: h });
    totalBytes += st.size;
  }

  entries.sort((a, b) => (a.relPath < b.relPath ? -1 : a.relPath > b.relPath ? 1 : 0));

  const lines = entries.map((e) => `${e.sha256}  ${e.size}  ${e.relPath}`).join("\n") + "\n";
  const manifestSha256 = sha256Hex(lines);

  return {
    createdAtUtc: NOW_UTC,
    sourceDateEpoch: SOURCE_DATE_EPOCH,
    baseDir,
    fileCount: entries.length,
    totalBytes,
    files: entries,
    manifestSha256,
  };
}

function listFiles(baseDir: string): string[] {
  const out: string[] = [];
  const stack: string[] = [""];

  while (stack.length) {
    const rel = stack.pop()!;
    const abs = path.join(baseDir, rel);
    const entries = fs.readdirSync(abs, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    for (const e of entries) {
      const relChild = rel ? path.posix.join(rel.replace(/\\/g, "/"), e.name) : e.name;
      const absChild = path.join(baseDir, relChild);

      const st = lstatSafe(absChild);
      if (!st) continue;

      if (st.isDirectory()) {
        stack.push(relChild);
      } else if (st.isFile()) {
        out.push(relChild);
      } else if (st.isSymbolicLink()) {
        const target = fs.readlinkSync(absChild);
        const sidecar = absChild + ".whenisdue.symlink";
        fs.writeFileSync(sidecar, target, "utf8");
        out.push(relChild + ".whenisdue.symlink");
      }
    }
  }

  out.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return out;
}

// --------------------------- Diff -----------------------------------------

type ManifestDiff = {
  a: { baseDir: string; manifestSha256: string; fileCount: number; totalBytes: number };
  b: { baseDir: string; manifestSha256: string; fileCount: number; totalBytes: number };
  summary: { added: number; removed: number; changed: number };
  files: Array<
    | { type: "ADDED"; relPath: string; b: FileEntry }
    | { type: "REMOVED"; relPath: string; a: FileEntry }
    | { type: "CHANGED"; relPath: string; a: FileEntry; b: FileEntry }
  >;
};

function diffManifests(a: Manifest, b: Manifest, cap: number): ManifestDiff {
  const mapA = new Map(a.files.map((x) => [x.relPath, x]));
  const mapB = new Map(b.files.map((x) => [x.relPath, x]));

  const allPaths = new Set<string>([...mapA.keys(), ...mapB.keys()]);
  const sorted = [...allPaths].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));

  const diffs: ManifestDiff["files"] = [];
  let added = 0;
  let removed = 0;
  let changed = 0;

  for (const p of sorted) {
    const ea = mapA.get(p);
    const eb = mapB.get(p);

    if (!ea && eb) {
      added++;
      if (diffs.length < cap) diffs.push({ type: "ADDED", relPath: p, b: eb });
      continue;
    }

    if (ea && !eb) {
      removed++;
      if (diffs.length < cap) diffs.push({ type: "REMOVED", relPath: p, a: ea });
      continue;
    }

    if (ea && eb) {
      if (ea.sha256 !== eb.sha256 || ea.size !== eb.size) {
        changed++;
        if (diffs.length < cap) diffs.push({ type: "CHANGED", relPath: p, a: ea, b: eb });
      }
    }
  }

  return {
    a: { baseDir: a.baseDir, manifestSha256: a.manifestSha256, fileCount: a.fileCount, totalBytes: a.totalBytes },
    b: { baseDir: b.baseDir, manifestSha256: b.manifestSha256, fileCount: b.fileCount, totalBytes: b.totalBytes },
    summary: { added, removed, changed },
    files: diffs,
  };
}

// --------------------------- Optional diffoscope ---------------------------

function tryRunDiffoscope(dirA: string, dirB: string): void {
  const which = spawnSync("/bin/sh", ["-lc", `command -v ${shellEscape(DIFFOSCOPE_CMD)} >/dev/null 2>&1`], {
    stdio: "inherit",
  });

  if (which.status !== 0) {
    console.warn(`[repro] diffoscope not found (${DIFFOSCOPE_CMD}); skipping`);
    return;
  }

  console.warn("[repro] running diffoscope (best-effort) ...");
  const res = spawnSync("/bin/sh", ["-lc", `${shellEscape(DIFFOSCOPE_CMD)} ${shellEscape(dirA)} ${shellEscape(dirB)} || true`], {
    stdio: "inherit",
    env: { ...process.env, LC_ALL: "C", TZ: "UTC" },
  });

  if (res.error) {
    console.warn(`[repro] diffoscope error: ${String(res.error)}`);
  }
}

// --------------------------- Crypto ---------------------------------------

function sha256Hex(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function sha256FileHex(p: string): string {
  const h = crypto.createHash("sha256");
  const fd = fs.openSync(p, "r");
  try {
    const buf = Buffer.alloc(1024 * 1024);
    while (true) {
      const n = fs.readSync(fd, buf, 0, buf.length, null);
      if (n <= 0) break;
      h.update(buf.subarray(0, n));
    }
  } finally {
    fs.closeSync(fd);
  }
  return h.digest("hex");
}

// --------------------------- IO -------------------------------------------

function writeText(p: string, s: string): void {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, s, "utf8");
}

function writeJson(p: string, obj: unknown): void {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function ensureDir(dir: string): void {
  if (!dir) return;
  fs.mkdirSync(dir, { recursive: true });
}

function rmrf(p: string): void {
  if (!p) return;
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

function lstatSafe(p: string): fs.Stats | null {
  try {
    return fs.lstatSync(p);
  } catch {
    return null;
  }
}

function safeUtimes(p: string, atimeSec: number, mtimeSec: number): void {
  try {
    fs.utimesSync(p, atimeSec, mtimeSec);
  } catch {
  }
}

// --------------------------- Env helpers ----------------------------------

function mustEnv(key: string): string {
  const v = process.env[key];
  if (!v || !String(v).trim()) {
    console.warn(`⚠️ Missing env var: ${key}. Using local dummy fallback.`);
    if (key === "WHENISDUE_NOW_UTC") return new Date().toISOString();
    return "dummy";
  }
  return String(v).trim();
}

function mustEnvInt(key: string, def: number): number {
  const raw = (process.env[key] ?? String(def)).trim();
  const n = Number(raw);
  if (!Number.isFinite(n)) fail(`Env var ${key} must be finite number`);
  return Math.trunc(n);
}

function mustEnvBool(key: string, def: boolean): boolean {
  const raw = (process.env[key] ?? (def ? "true" : "false")).trim().toLowerCase();
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  fail(`Env var ${key} must be boolean-like (true/false)`);
}

function isIsoUtc(v: unknown): boolean {
  if (typeof v !== "string") return false;
  if (!v.endsWith("Z")) return false;
  const ms = Date.parse(v);
  return Number.isFinite(ms);
}

// --------------------------- Shell ----------------------------------------

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

function shellEscape(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

// --------------------------- Errors ---------------------------------------

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}