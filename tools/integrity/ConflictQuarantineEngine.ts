// @ts-nocheck
/* eslint-disable no-console */
/**
 * ConflictQuarantineEngine.ts
 *
 * Phase 19 — Deliverable 1, File 6
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

type ConflictIndex = {
  version: number;
  updatedAtUtc: string;
  conflicts: Array<{
    conflictId: string;
    conflictType: "EQUIVOCATION" | "ROLLBACK" | "PREFIX_MISMATCH" | string;
    severity?: "AMBER" | "RED" | "CRITICAL" | string;
    detectedAtUtc: string;
    detectedBy: string;
    logId: string;
    treeSizeA: number;
    rootHashA: string;
    treeSizeB: number;
    rootHashB: string;
    canonicalConflictHash: string;
    href: string;
    implicated?: {
      mirrors?: string[];
      witnesses?: string[];
    };
  }>;
};

export type QuarantineDecision = {
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
    mirrors: Record<
      string,
      {
        weight: 0;
        reason: string;
        until: "manual" | "resolved";
        conflictIds: string[];
      }
    >;
    witnesses: Record<
      string,
      {
        weight: 0;
        reason: string;
        until: "manual" | "resolved";
        conflictIds: string[];
      }
    >;
  };
  signature: {
    canonicalHashSha256: string;
  };
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

function isObject(x: any): x is Record<string, any> {
  return Boolean(x) && typeof x === "object" && !Array.isArray(x);
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
  if (isObject(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${jcsStringify(value[k])}`).join(",")}}`;
  }
  return "null";
}

function safeStr(x: any, fallback = ""): string {
  return typeof x === "string" ? x : fallback;
}

function safeInt(x: any, fallback = 0): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function classifySeverity(c: any): "AMBER" | "RED" {
  const s = safeStr(c?.severity, "");
  if (s === "AMBER") return "AMBER";
  return "RED";
}

export class ConflictQuarantineEngine {
  static compute(params: {
    conflictsIndexPath: string;
    computedAtUtc?: string;
  }): QuarantineDecision {
    const computedAtUtc = params.computedAtUtc || new Date().toISOString();

    let index: ConflictIndex | null = null;
    let parseError: string | null = null;

    try {
      const raw = readUtf8(params.conflictsIndexPath);
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as any).conflicts)) {
        throw new Error("conflicts index malformed");
      }
      index = parsed as ConflictIndex;
    } catch (e: any) {
      parseError = String(e?.message || e);
      index = null;
    }

    const mirrors: QuarantineDecision["quarantine"]["mirrors"] = {};
    const witnesses: QuarantineDecision["quarantine"]["witnesses"] = {};

    let activeRed = false;
    let reason = "no_conflicts";
    let state: QuarantineDecision["global"]["state"] = "GREEN";

    if (!index) {
      state = "AMBER";
      reason = `conflicts_index_unavailable:${parseError || "unknown"}`;
    } else if (index.conflicts.length === 0) {
      state = "GREEN";
      reason = "no_active_conflicts";
    } else {
      const severities = index.conflicts.map((c) => classifySeverity(c));
      activeRed = severities.some((s) => s === "RED");

      state = activeRed ? "RED" : "AMBER";
      reason = activeRed ? "active_red_conflict" : "active_amber_alerts";

      for (const c of index.conflicts) {
        const cid = safeStr(c.conflictId, "");
        const ctype = safeStr(c.conflictType, "UNKNOWN");
        const sev = classifySeverity(c);

        const implicatedMirrors = Array.isArray(c.implicated?.mirrors) ? c.implicated!.mirrors! : [];
        const implicatedWitnesses = Array.isArray(c.implicated?.witnesses) ? c.implicated!.witnesses! : [];

        for (const mid of implicatedMirrors) {
          const key = safeStr(mid, "").trim();
          if (!key) continue;
          if (!mirrors[key]) {
            mirrors[key] = {
              weight: 0,
              reason: `${sev}:${ctype}`,
              until: "manual",
              conflictIds: [],
            };
          }
          mirrors[key].conflictIds.push(cid);
        }

        for (const wid of implicatedWitnesses) {
          const key = safeStr(wid, "").trim();
          if (!key) continue;
          if (!witnesses[key]) {
            witnesses[key] = {
              weight: 0,
              reason: `${sev}:${ctype}`,
              until: "manual",
              conflictIds: [],
            };
          }
          witnesses[key].conflictIds.push(cid);
        }
      }

      for (const k of Object.keys(mirrors)) {
        mirrors[k].conflictIds = Array.from(new Set(mirrors[k].conflictIds)).sort();
      }
      for (const k of Object.keys(witnesses)) {
        witnesses[k].conflictIds = Array.from(new Set(witnesses[k].conflictIds)).sort();
      }
    }

    const decision: QuarantineDecision = {
      schemaVersion: 1,
      computedAtUtc,
      source: {
        conflictsIndexPath: params.conflictsIndexPath,
        conflictsUpdatedAtUtc: index?.updatedAtUtc || null,
        conflictsCount: index?.conflicts?.length ?? 0,
      },
      global: {
        activeRedConflict: activeRed,
        quorumInvalidated: activeRed, 
        state,
        reason,
      },
      quarantine: {
        mirrors,
        witnesses,
      },
      signature: {
        canonicalHashSha256: "pending",
      },
    };

    const canonical = jcsStringify(decision);
    decision.signature.canonicalHashSha256 = sha256HexBytes(Buffer.from(canonical, "utf8"));

    return decision;
  }

  static writeToFile(params: {
    conflictsIndexPath: string;
    outPath: string;
    computedAtUtc?: string;
  }): QuarantineDecision {
    const decision = ConflictQuarantineEngine.compute({
      conflictsIndexPath: params.conflictsIndexPath,
      computedAtUtc: params.computedAtUtc,
    });

    writeUtf8(params.outPath, JSON.stringify(decision, null, 2) + "\n");
    return decision;
  }
}

function main(): void {
  const conflictsDir = process.env.WID_CONFLICTS_DIR || "integrity/conflicts";
  const indexPath = process.env.WID_CONFLICTS_INDEX_PATH || path.join(conflictsDir, "index.json");
  const outPath = process.env.WID_CONFLICTS_QUARANTINE_PATH || path.join(conflictsDir, "quarantine.json");

  const decision = ConflictQuarantineEngine.writeToFile({
    conflictsIndexPath: indexPath,
    outPath,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        wrote: outPath,
        state: decision.global.state,
        quorumInvalidated: decision.global.quorumInvalidated,
        activeRedConflict: decision.global.activeRedConflict,
        quarantinedMirrors: Object.keys(decision.quarantine.mirrors).length,
        quarantinedWitnesses: Object.keys(decision.quarantine.witnesses).length,
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