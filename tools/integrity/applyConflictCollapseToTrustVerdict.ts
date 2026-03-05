// @ts-nocheck
/* eslint-disable no-console */
/**
 * applyConflictCollapseToTrustVerdict.ts
 *
 * Phase 19 — Deliverable 1, File 7
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

type QuarantineDecision = {
  schemaVersion: 1;
  computedAtUtc: string;
  source: {
    conflictsIndexPath: string;
    conflictsUpdatedAtUtc: string | null;
    conflictsCount: number;
  };
  global: {
    activeRedConflict: boolean;
    quorumInvalidated: boolean;
    state: "GREEN" | "AMBER" | "RED";
    reason: string;
  };
  quarantine: {
    mirrors: Record<string, { weight: 0; reason: string; until: string; conflictIds: string[] }>;
    witnesses: Record<string, { weight: 0; reason: string; until: string; conflictIds: string[] }>;
  };
  signature: { canonicalHashSha256: string };
};

function readUtf8(p: string): string {
  return fs.readFileSync(p, "utf8");
}

function writeUtf8(p: string, s: string): void {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s, "utf8");
}

function sha256HexBytes(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function jcsStringify(value: any): string {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "string") return JSON.stringify(value);
  if (t === "number") {
    if (!Number.isFinite(value)) return "null";
    return JSON.stringify(value);
  }
  if (t === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return `[${value.map(jcsStringify).join(",")}]`;
  if (t === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${jcsStringify(value[k])}`).join(",")}}`;
  }
  return "null";
}

function listJsonFilesRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop()!;
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && e.name.toLowerCase().endsWith(".json")) out.push(p);
    }
  }
  return out.sort();
}

function tryReadQuarantine(p: string): { ok: true; q: QuarantineDecision } | { ok: false; error: string } {
  try {
    const raw = readUtf8(p);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error("quarantine malformed");
    if (!parsed.global || typeof parsed.global !== "object") throw new Error("quarantine.global missing");
    return { ok: true, q: parsed as QuarantineDecision };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

function patchTrustVerdict(
  obj: any,
  opts: {
    conflictState: "GREEN" | "AMBER" | "RED";
    activeRedConflict: boolean;
    reason: string;
    quarantineHash: string;
    quarantinePath: string;
  }
): { changed: boolean; patched: any } {
  if (!obj || typeof obj !== "object") return { changed: false, patched: obj };

  if (!opts.activeRedConflict) {
    const next = { ...obj };
    next.activeConflict = {
      state: opts.conflictState,
      activeRedConflict: false,
      reason: opts.reason,
      quarantine: {
        path: opts.quarantinePath,
        canonicalHashSha256: opts.quarantineHash,
      },
    };
    return { changed: true, patched: next };
  }

  const next = { ...obj };

  if (typeof next.citeabilityScore === "number" || typeof next.citeabilityScore === "string") {
    next.citeabilityScore = 0;
  } else {
    next.citeabilityScore = 0;
  }

  if (typeof next.status === "string") {
    next.status = "FAIL";
  } else {
    next.status = "FAIL";
  }

  if (Array.isArray(next.checks)) {
    const checks = [...next.checks];
    const existingIdx = checks.findIndex((c: any) => c && typeof c === "object" && c.name === "active_conflict");
    const conflictCheck = {
      name: "active_conflict",
      status: "FAIL",
      errorCode: "ACTIVE_RED_CONFLICT",
      details: `Active RED conflict: ${opts.reason}`,
    };
    if (existingIdx >= 0) checks[existingIdx] = conflictCheck;
    else checks.push(conflictCheck);
    next.checks = checks;
  }

  next.activeConflict = {
    state: "RED",
    activeRedConflict: true,
    reason: opts.reason,
    collapseApplied: true,
    quarantine: {
      path: opts.quarantinePath,
      canonicalHashSha256: opts.quarantineHash,
    },
  };

  const canonical = jcsStringify(next);
  next.canonicalHashSha256 = sha256HexBytes(Buffer.from(canonical, "utf8"));

  return { changed: true, patched: next };
}

function main(): void {
  const verdictDir = process.env.WID_TRUST_VERDICT_DIR || "verify/trustVerdict";
  const quarantinePath = process.env.WID_CONFLICTS_QUARANTINE_PATH || "integrity/conflicts/quarantine.json";
  const strict = (process.env.WID_STRICT || "") === "1";

  const qRes = tryReadQuarantine(quarantinePath);
  if (!qRes.ok) {
    const msg = `quarantine_unavailable:${qRes.error}`;
    if (strict) {
      console.error(msg);
      process.exit(2);
    }
    console.warn(msg);
    console.log(
      JSON.stringify(
        {
          ok: true,
          applied: 0,
          skipped: "no_quarantine",
          verdictDir,
          quarantinePath,
        },
        null,
        2
      )
    );
    return;
  }

  const q = qRes.q;
  const files = listJsonFilesRecursive(verdictDir);

  let applied = 0;
  let scanned = 0;

  for (const f of files) {
    scanned += 1;
    try {
      const raw = readUtf8(f);
      const obj = JSON.parse(raw);

      const patched = patchTrustVerdict(obj, {
        conflictState: q.global.state,
        activeRedConflict: Boolean(q.global.activeRedConflict),
        reason: q.global.reason,
        quarantineHash: q.signature?.canonicalHashSha256 || "",
        quarantinePath,
      });

      if (patched.changed) {
        writeUtf8(f, JSON.stringify(patched.patched, null, 2) + "\n");
        applied += 1;
      }
    } catch (e: any) {
      const msg = `failed_patch:${f}:${String(e?.message || e)}`;
      if (strict) {
        console.error(msg);
        process.exit(2);
      }
      console.warn(msg);
      continue;
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        scanned,
        applied,
        conflictState: q.global.state,
        activeRedConflict: q.global.activeRedConflict,
        quorumInvalidated: q.global.quorumInvalidated,
        quarantineHash: q.signature?.canonicalHashSha256 || null,
      },
      null,
      2
    )
  );
}

if (require.main === module) {
  try {
    main();
  } catch (e: any) {
    console.error(String(e?.message || e));
    process.exit(2);
  }
}