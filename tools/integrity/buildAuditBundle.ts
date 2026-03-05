// @ts-nocheck
/* eslint-disable no-restricted-syntax */
/**
 * Phase 17 — Deliverable 5: Exportable “Examiner-Ready” Audit Bundle
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

type BundleManifest = {
  specVersion: "whenisdue-audit-bundle/1";
  bundleId: string;
  auditLabel: string;
  sourceDateEpoch: number;
  createdBy: {
    tool: "buildAuditBundle.ts";
    node: string;
  };
  contents: {
    claimsDir: string;
    transparencyDir: string;
    witnessesDir: string;
    reproDir: string;
  };
  files: Array<{
    relPath: string;
    sha256: string;
    bytes: number;
  }>;
  archive: {
    relPath: string;
    sha256: string;
    bytes: number;
  };
};

function main() {
  const args = parseArgs(process.argv.slice(2));

  const bundleId = (args["--bundleId"] || "").trim();
  const auditLabel = (args["--auditLabel"] || "").trim();
  const sourceDateEpoch = toInt(args["--sourceDateEpoch"]);
  const outDir = reqPath(args["--outDir"], "--outDir");
  const bundleOut = reqPath(args["--bundleOut"], "--bundleOut");

  const claimsDir = reqPath(args["--claimsDir"], "--claimsDir");
  const transparencyDir = reqPath(args["--transparencyDir"], "--transparencyDir");
  const witnessesDir = reqPath(args["--witnessesDir"], "--witnessesDir");
  const reproDir = reqPath(args["--reproDir"], "--reproDir");

  if (!bundleId) throw new Error("Missing --bundleId");
  if (!auditLabel) throw new Error("Missing --auditLabel");
  if (!Number.isFinite(sourceDateEpoch) || sourceDateEpoch < 0) {
    throw new Error("Invalid --sourceDateEpoch (must be >= 0 int)");
  }

  const safeOutDir = normalizeRelPath(outDir);
  const safeBundleOut = normalizeRelPath(bundleOut);
  const safeClaimsDir = normalizeRelPath(claimsDir);
  const safeTransparencyDir = normalizeRelPath(transparencyDir);
  const safeWitnessesDir = normalizeRelPath(witnessesDir);
  const safeReproDir = normalizeRelPath(reproDir);

  ensureDir(safeOutDir);
  ensureDir(path.dirname(safeBundleOut));

  const stageRoot = path.resolve(process.cwd(), safeOutDir);
  rmrf(stageRoot);
  ensureDir(stageRoot);

  const stageClaims = path.join(stageRoot, "claims");
  const stageTransparency = path.join(stageRoot, "transparency");
  const stageWitnesses = path.join(stageRoot, "witnesses");
  const stageRepro = path.join(stageRoot, "repro");

  ensureDir(stageClaims);
  ensureDir(stageTransparency);
  ensureDir(stageWitnesses);
  ensureDir(stageRepro);

  copyTreeFiltered(safeClaimsDir, stageClaims);
  copyTreeFiltered(safeTransparencyDir, stageTransparency);
  copyTreeFiltered(safeWitnessesDir, stageWitnesses);
  copyTreeFiltered(safeReproDir, stageRepro);

  const verifySh = buildVerifySh();
  writeTextAtomic(path.join(stageRoot, "verify.sh"), verifySh);
  chmodX(path.join(stageRoot, "verify.sh"));

  const bundleJsonPath = path.join(stageRoot, "bundle.json");

  const fileList = listFilesDeterministic(stageRoot)
    .filter((p) => path.basename(p) !== path.basename(safeBundleOut)) 
    .filter((p) => !p.endsWith(".tar.gz")); 

  const manifestFiles = fileList.map((abs) => {
    const rel = toPosixRel(path.relative(stageRoot, abs));
    const buf = fs.readFileSync(abs);
    return {
      relPath: rel,
      sha256: sha256Hex(buf),
      bytes: buf.byteLength,
    };
  });

  const bundleManifestBase: Omit<BundleManifest, "archive"> = {
    specVersion: "whenisdue-audit-bundle/1",
    bundleId,
    auditLabel,
    sourceDateEpoch,
    createdBy: {
      tool: "buildAuditBundle.ts",
      node: process.version,
    },
    contents: {
      claimsDir: toPosixUrlPath(safeClaimsDir),
      transparencyDir: toPosixUrlPath(safeTransparencyDir),
      witnessesDir: toPosixUrlPath(safeWitnessesDir),
      reproDir: toPosixUrlPath(safeReproDir),
    },
    files: manifestFiles,
  };

  writeJsonAtomic(bundleJsonPath, bundleManifestBase);

  const archiveAbs = path.resolve(process.cwd(), safeBundleOut);
  const archiveDir = path.dirname(archiveAbs);
  ensureDir(archiveDir);

  const tarArgs = [
    "-czf",
    archiveAbs,
    "--sort=name",
    "--mtime=@0",
    "--owner=0",
    "--group=0",
    "--numeric-owner",
    "--pax-option=exthdr.name=%d/PaxHeaders/%f,delete=atime,delete=ctime",
    ".",
  ];

  const tar = spawnSync("tar", tarArgs, {
    cwd: stageRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      LC_ALL: "C",
      TZ: "UTC",
      SOURCE_DATE_EPOCH: String(sourceDateEpoch),
    },
  });

  if (tar.status !== 0) {
    throw new Error("tar failed — ensure `tar` is available in the build environment");
  }

  const archBuf = fs.readFileSync(archiveAbs);
  const archSha = sha256Hex(archBuf);

  const finalManifest: BundleManifest = {
    ...bundleManifestBase,
    archive: {
      relPath: toPosixUrlPath(safeBundleOut),
      sha256: archSha,
      bytes: archBuf.byteLength,
    },
  };

  const sidecarPath = archiveAbs.replace(/\.tar\.gz$/i, ".manifest.json");
  writeJsonAtomic(sidecarPath, finalManifest);

  // eslint-disable-next-line no-console
  console.log(`OK: ARCHIVE=${safeBundleOut}`);
  // eslint-disable-next-line no-console
  console.log(`OK: SHA256=${archSha}`);
  // eslint-disable-next-line no-console
  console.log(`OK: SIDECAR=${toPosixUrlPath(path.relative(process.cwd(), sidecarPath).replace(/\\/g, "/"))}`);
}

function buildVerifySh(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

# WhenIsDue Examiner-Ready Audit Bundle Verifier
# Zero-network, offline checks:
#  1) Validates SHA-256 of every file listed in bundle.json
#  2) Optionally verifies COSE blobs if openssl + known pubkeys are available (stub hooks)
#
# Usage:
#   ./verify.sh
#
# Notes:
#  - This script verifies integrity of the bundle itself.
#  - Cryptographic verification of COSE/SCITT receipts should be performed with your preferred COSE tool.

ROOT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v openssl >/dev/null 2>&1; then
  echo "FAIL: openssl not found"
  exit 1
fi

if ! command -v sha256sum >/dev/null 2>&1; then
  echo "FAIL: sha256sum not found"
  exit 1
fi

if [ ! -f "./bundle.json" ]; then
  echo "FAIL: bundle.json missing"
  exit 1
fi

echo "== WhenIsDue Audit Bundle Verification =="

FILES=$(grep -n '"relPath"' -n ./bundle.json | sed -E 's/.*"relPath": "([^"]+)".*/\\1/' || true)

if [ -z "$FILES" ]; then
  echo "FAIL: no files found in bundle.json"
  exit 1
fi

FAILS=0
while read -r REL; do
  if [ -z "$REL" ]; then
    continue
  fi
  EXPECT=$(awk -v rel="$REL" '
    $0 ~ "\"relPath\": \"" rel "\"" { found=1 }
    found && $0 ~ "\"sha256\":" { gsub(/.*"sha256": "/,""); gsub(/".*/,""); print; exit }
  ' ./bundle.json)

  if [ -z "$EXPECT" ]; then
    echo "FAIL: missing expected sha256 for $REL"
    FAILS=$((FAILS+1))
    continue
  fi

  if [ ! -f "./$REL" ]; then
    echo "FAIL: file missing: $REL"
    FAILS=$((FAILS+1))
    continue
  fi

  ACTUAL=$(sha256sum "./$REL" | awk '{print $1}')
  if [ "$ACTUAL" != "$EXPECT" ]; then
    echo "FAIL: sha256 mismatch: $REL"
    echo "  expected: $EXPECT"
    echo "  actual:   $ACTUAL"
    FAILS=$((FAILS+1))
  fi
done <<< "$FILES"

if [ "$FAILS" -ne 0 ]; then
  echo "FAIL: $FAILS integrity checks failed"
  exit 1
fi

echo "OK: All bundle.json file hashes match."

TSR_COUNT=$(find ./transparency -type f -name "*.tsr" 2>/dev/null | wc -l | tr -d ' ')
if [ "$TSR_COUNT" -gt 0 ]; then
  echo "Checking RFC3161 .tsr parseability ($TSR_COUNT files)..."
  while IFS= read -r TSR; do
    if ! openssl ts -reply -in "$TSR" -text >/dev/null 2>&1; then
      echo "FAIL: openssl could not parse TSR: $TSR"
      exit 1
    fi
  done < <(find ./transparency -type f -name "*.tsr" | LC_ALL=C sort)
  echo "OK: All TSR files parse as RFC3161 replies."
fi

echo "OK: Bundle integrity verified."
`;
}

function copyTreeFiltered(srcRel: string, dstAbs: string) {
  const srcAbs = path.resolve(process.cwd(), srcRel);
  if (!fs.existsSync(srcAbs)) return;
  const st = fs.statSync(srcAbs);
  if (!st.isDirectory()) throw new Error(`Expected directory: ${srcRel}`);

  const files = listFilesDeterministic(srcAbs);
  for (const abs of files) {
    const rel = path.relative(srcAbs, abs);
    const out = path.join(dstAbs, rel);
    ensureDir(path.dirname(out));
    fs.copyFileSync(abs, out);
  }
}

function listFilesDeterministic(rootAbs: string): string[] {
  const out: string[] = [];
  const stack: string[] = [rootAbs];

  while (stack.length) {
    const dir = stack.pop() as string;
    const entries = fs.readdirSync(dir, { withFileTypes: true })
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "en"));

    for (const ent of entries) {
      const abs = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        stack.push(abs);
      } else if (ent.isFile()) {
        out.push(abs);
      }
    }
  }

  out.sort((a, b) => a.localeCompare(b, "en"));
  return out;
}

function writeTextAtomic(absPath: string, text: string) {
  ensureDir(path.dirname(absPath));
  const tmp = absPath + ".tmp";
  fs.writeFileSync(tmp, text, "utf8");
  fs.renameSync(tmp, absPath);
}

function writeJsonAtomic(absPath: string, obj: unknown) {
  ensureDir(path.dirname(absPath));
  const json = JSON.stringify(obj, null, 2) + "\n";
  const tmp = absPath + ".tmp";
  fs.writeFileSync(tmp, json, "utf8");
  fs.renameSync(tmp, absPath);
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function rmrf(p: string) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

function chmodX(absPath: string) {
  try {
    fs.chmodSync(absPath, 0o755);
  } catch {
  }
}

function sha256Hex(buf: Buffer | Uint8Array): string {
  const h = crypto.createHash("sha256");
  h.update(buf);
  return h.digest("hex");
}

function toInt(v: string | undefined): number {
  if (!v) return NaN;
  const n = Number(v);
  if (!Number.isFinite(n)) return NaN;
  return Math.trunc(n);
}

function reqPath(v: string | undefined, flag: string): string {
  const s = (v || "").trim();
  if (!s) throw new Error(`Missing ${flag}`);
  return s;
}

function normalizeRelPath(p: string): string {
  const s = p.replace(/\\/g, "/").trim();
  if (s.length < 1) throw new Error("Empty path");
  if (s.startsWith("/")) throw new Error(`Absolute path not allowed: ${s}`);
  if (s.includes("..")) throw new Error(`Parent traversal not allowed: ${s}`);
  return s;
}

function toPosixRel(rel: string): string {
  return rel.replace(/\\/g, "/");
}

function toPosixUrlPath(p: string): string {
  const s = p.replace(/\\/g, "/").replace(/^\.\//, "/");
  return s.startsWith("public/") ? `/${s.slice("public/".length)}` : s.startsWith("/") ? s : `/${s}`;
}

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

main();