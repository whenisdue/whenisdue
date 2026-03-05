// @ts-nocheck
/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

type Json = any;

type GuardConfig = {
  specVersion: "whenisdue-semantic-drift-guard-v1";
  watchFiles: string[];
  safeEditFields: string[];
  semanticCriticalFields: string[];
  semanticVersionField: string; 
  requireMajorBumpOnSemanticChange: boolean;
  externalAnchorCheck?: {
    enabled: boolean;
    timeoutMs: number;
    userAgent: string;
    maxBytes: number;
    allowlistDomains?: string[];
    cacheDir?: string; 
    failClosedOnFetchError: boolean;
  };
};

type DiffIssue = {
  file: string;
  recordId: string;
  kind: "NEW_RECORD" | "REMOVED_RECORD" | "SAFE_EDIT" | "SEMANTIC_SHIFT" | "MISSING_SEMVER";
  message: string;
  changedPaths?: string[];
};

const REPO_ROOT = process.cwd();

function readJsonFile(rel: string): Json {
  const abs = path.join(REPO_ROOT, rel);
  const raw = fs.readFileSync(abs, "utf8");
  return JSON.parse(raw);
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

function sha256Hex(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function stableJsonStringify(value: unknown): string {
  return JSON.stringify(normalize(value));

  function normalize(v: any): any {
    if (v === null) return null;
    const t = typeof v;
    if (t === "string" || t === "boolean") return v;
    if (t === "number") {
      if (!Number.isFinite(v)) throw new Error("Non-finite number in JSON.");
      return v;
    }
    if (Array.isArray(v)) return v.map((x) => normalize(x));
    if (t === "object") {
      const out: Record<string, any> = {};
      const keys = Object.keys(v).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      for (const k of keys) out[k] = normalize(v[k]);
      return out;
    }
    throw new Error(`Unsupported JSON type: ${t}`);
  }
}

function run(cmd: string): string {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString("utf8").trim();
}

function pickBaseRef(): string {
  const envBaseSha = process.env.GITHUB_BASE_SHA || process.env.SEMANTIC_BASE_SHA;
  if (envBaseSha && envBaseSha.length >= 7) return envBaseSha;

  const envBaseRef = process.env.GITHUB_BASE_REF || process.env.SEMANTIC_BASE_REF;
  if (envBaseRef && envBaseRef.length > 0) {
    const candidate = `origin/${envBaseRef}`;
    try {
      run(`git rev-parse --verify ${candidate}`);
      return run(`git merge-base HEAD ${candidate}`);
    } catch {
    }
  }

  try {
    run(`git rev-parse --verify origin/main`);
    return run(`git merge-base HEAD origin/main`);
  } catch {
  }

  return run(`git rev-parse HEAD~1`);
}

function gitShowJson(ref: string, fileRel: string): Json | null {
  try {
    const content = execSync(`git show ${ref}:${fileRel}`, { stdio: ["ignore", "pipe", "pipe"] }).toString("utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function toRecordMap(doc: Json): Map<string, Json> {
  const m = new Map<string, Json>();

  if (!doc || typeof doc !== "object") return m;

  const arr =
    Array.isArray(doc.records) ? doc.records :
    Array.isArray(doc.items) ? doc.items :
    Array.isArray(doc) ? doc : null;

  if (arr) {
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      const id = String(item.id ?? item.recordId ?? item.eventId ?? item.couplingId ?? item.eligibilitySignalId ?? "");
      if (!id) continue;
      m.set(id, item);
    }
    return m;
  }

  for (const [k, v] of Object.entries(doc)) {
    if (!v || typeof v !== "object") continue;
    const id = String((v as any).id ?? k);
    m.set(id, v);
  }
  return m;
}

function isSemverMajorBump(baseSemver: string, headSemver: string): boolean {
  const b = parseSemver(baseSemver);
  const h = parseSemver(headSemver);
  if (!b || !h) return false;
  return h.major > b.major;

  function parseSemver(s: string): { major: number; minor: number; patch: number } | null {
    const m = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(String(s).trim());
    if (!m) return null;
    return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
  }
}

function diffObjectPaths(base: Json, head: Json, prefix = ""): string[] {
  const out: string[] = [];

  if (base === head) return out;

  const baseIsObj = base && typeof base === "object";
  const headIsObj = head && typeof head === "object";

  if (!baseIsObj || !headIsObj) {
    out.push(prefix || "/");
    return out;
  }

  if (Array.isArray(base) || Array.isArray(head)) {
    if (!Array.isArray(base) || !Array.isArray(head)) {
      out.push(prefix || "/");
      return out;
    }
    const max = Math.max(base.length, head.length);
    for (let i = 0; i < max; i++) {
      const p = `${prefix}/${i}`;
      if (i >= base.length) out.push(p);
      else if (i >= head.length) out.push(p);
      else out.push(...diffObjectPaths(base[i], head[i], p));
    }
    return out;
  }

  const keys = new Set<string>([...Object.keys(base), ...Object.keys(head)]);
  for (const k of Array.from(keys).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    const p = `${prefix}/${k}`;
    if (!(k in base)) out.push(p);
    else if (!(k in head)) out.push(p);
    else out.push(...diffObjectPaths(base[k], head[k], p));
  }
  return out;
}

function isPathSafe(pathStr: string, safeFields: string[], semanticCriticalFields: string[]): boolean {
  for (const crit of semanticCriticalFields) {
    if (pathStr === `/${crit}` || pathStr.startsWith(`/${crit}/`)) return false;
  }
  for (const sf of safeFields) {
    if (pathStr === `/${sf}` || pathStr.startsWith(`/${sf}/`)) return true;
  }
  return false;
}

async function fetchWithLimit(url: string, timeoutMs: number, userAgent: string, maxBytes: number): Promise<Buffer> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent": userAgent,
        "accept": "text/html,application/json,application/xml,text/plain,*/*",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) {
      const arr = new Uint8Array(await res.arrayBuffer());
      if (arr.byteLength > maxBytes) throw new Error(`Response too large (${arr.byteLength} bytes)`);
      return Buffer.from(arr);
    }

    let total = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) throw new Error(`Response too large (>${maxBytes} bytes)`);
        chunks.push(value);
      }
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c)));
  } finally {
    clearTimeout(t);
  }
}

function domainOf(urlStr: string): string {
  try {
    return new URL(urlStr).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function ensureDir(absDir: string): void {
  fs.mkdirSync(absDir, { recursive: true });
}

async function maybeCheckExternalAnchors(cfg: GuardConfig, fileRel: string, recordId: string, rec: Json, issues: DiffIssue[]): Promise<void> {
  const ext = cfg.externalAnchorCheck;
  if (!ext || !ext.enabled) return;

  const anchors: any[] = Array.isArray(rec.anchors) ? rec.anchors : Array.isArray(rec.provenanceAnchors) ? rec.provenanceAnchors : [];
  if (!anchors.length) return;

  const cacheDirRel = ext.cacheDir ?? ".cache/semantic-drift";
  const cacheDirAbs = path.join(REPO_ROOT, cacheDirRel);
  ensureDir(cacheDirAbs);

  for (let idx = 0; idx < anchors.length; idx++) {
    const a = anchors[idx];
    const url = String(a.url ?? a.sourceUrl ?? "");
    if (!url) continue;

    if (Array.isArray(ext.allowlistDomains) && ext.allowlistDomains.length > 0) {
      const d = domainOf(url);
      if (!ext.allowlistDomains.includes(d)) {
        issues.push({
          file: fileRel,
          recordId,
          kind: "SEMANTIC_SHIFT",
          message: `External anchor domain not in allowlist: ${url}`,
        });
        continue;
      }
    }

    const expected = String(a.expectedContentSha256 ?? a.expectedStructureSha256 ?? "").trim();
    if (!expected) continue; 

    const cacheKey = sha256Hex(Buffer.from(url, "utf8"));
    const cachePathAbs = path.join(cacheDirAbs, `${cacheKey}.bin`);

    let content: Buffer | null = null;
    try {
      if (fs.existsSync(cachePathAbs)) {
        content = fs.readFileSync(cachePathAbs);
      } else {
        content = await fetchWithLimit(url, ext.timeoutMs, ext.userAgent, ext.maxBytes);
        fs.writeFileSync(cachePathAbs, content);
      }
    } catch (err: any) {
      if (ext.failClosedOnFetchError) {
        issues.push({
          file: fileRel,
          recordId,
          kind: "SEMANTIC_SHIFT",
          message: `External anchor fetch failed (fail-closed): ${url} :: ${String(err?.message ?? err)}`,
        });
      } else {
        console.warn(`WARN: External anchor fetch failed (soft): ${url} :: ${String(err?.message ?? err)}`);
      }
      continue;
    }

    const got = `sha256:${sha256Hex(content)}`;
    if (got !== expected) {
      issues.push({
        file: fileRel,
        recordId,
        kind: "SEMANTIC_SHIFT",
        message: `External anchor content hash mismatch: ${url} expected=${expected} got=${got}`,
      });
    }
  }
}

async function main(): Promise<void> {
  const configRel = process.env.SEMANTIC_DRIFT_CONFIG || "tools/semanticDrift/semanticDrift.config.json";
  if (!exists(configRel)) {
    throw new Error(`Missing ${configRel}. Create it to run the semantic drift guard.`);
  }

  const cfg = readJsonFile(configRel) as GuardConfig;
  if (cfg?.specVersion !== "whenisdue-semantic-drift-guard-v1") {
    throw new Error(`Invalid config specVersion (expected whenisdue-semantic-drift-guard-v1).`);
  }

  const baseRef = pickBaseRef();
  const headRef = "HEAD";

  const issues: DiffIssue[] = [];

  for (const fileRel of cfg.watchFiles) {
    if (!exists(fileRel)) {
      console.warn(`WARN: Watched file missing in HEAD: ${fileRel}`);
      continue;
    }

    const baseDoc = gitShowJson(baseRef, fileRel);
    const headDoc = readJsonFile(fileRel);

    if (!baseDoc) {
      const headMap = toRecordMap(headDoc);
      for (const [id, rec] of headMap.entries()) {
        issues.push({
          file: fileRel,
          recordId: id,
          kind: "NEW_RECORD",
          message: `New record detected (base missing): ${id}`,
        });
        await maybeCheckExternalAnchors(cfg, fileRel, id, rec, issues);
      }
      continue;
    }

    const baseMap = toRecordMap(baseDoc);
    const headMap = toRecordMap(headDoc);

    for (const id of baseMap.keys()) {
      if (!headMap.has(id)) {
        issues.push({
          file: fileRel,
          recordId: id,
          kind: "REMOVED_RECORD",
          message: `Record removed (must be explicit + reviewed): ${id}`,
        });
      }
    }

    for (const [id, headRec] of headMap.entries()) {
      const baseRec = baseMap.get(id);

      if (!baseRec) {
        issues.push({
          file: fileRel,
          recordId: id,
          kind: "NEW_RECORD",
          message: `New record added: ${id}`,
        });
        await maybeCheckExternalAnchors(cfg, fileRel, id, headRec, issues);
        continue;
      }

      const changedPaths = diffObjectPaths(baseRec, headRec, "");

      if (changedPaths.length === 0) continue;

      const unsafe = changedPaths.filter((p) => !isPathSafe(p, cfg.safeEditFields, cfg.semanticCriticalFields));
      const safeOnly = unsafe.length === 0;

      if (safeOnly) {
        issues.push({
          file: fileRel,
          recordId: id,
          kind: "SAFE_EDIT",
          message: `Safe-edit only changes: ${id}`,
          changedPaths,
        });
        await maybeCheckExternalAnchors(cfg, fileRel, id, headRec, issues);
        continue;
      }

      const semverField = cfg.semanticVersionField;
      const baseSemver = String((baseRec as any)?.[semverField] ?? "").trim();
      const headSemver = String((headRec as any)?.[semverField] ?? "").trim();

      if (!baseSemver || !headSemver) {
        issues.push({
          file: fileRel,
          recordId: id,
          kind: "MISSING_SEMVER",
          message: `Semantic-critical fields changed but ${semverField} missing (fail-closed): ${id}`,
          changedPaths: unsafe,
        });
        await maybeCheckExternalAnchors(cfg, fileRel, id, headRec, issues);
        continue;
      }

      if (cfg.requireMajorBumpOnSemanticChange) {
        if (!isSemverMajorBump(baseSemver, headSemver)) {
          issues.push({
            file: fileRel,
            recordId: id,
            kind: "SEMANTIC_SHIFT",
            message: `Semantic-critical change without MAJOR semver bump (${semverField}): ${id} base=${baseSemver} head=${headSemver}`,
            changedPaths: unsafe,
          });
          await maybeCheckExternalAnchors(cfg, fileRel, id, headRec, issues);
          continue;
        }
      }

      issues.push({
        file: fileRel,
        recordId: id,
        kind: "SEMANTIC_SHIFT",
        message: `Semantic-critical change detected (major bump observed): ${id} base=${baseSemver} head=${headSemver}`,
        changedPaths: unsafe,
      });

      await maybeCheckExternalAnchors(cfg, fileRel, id, headRec, issues);
    }
  }

  const allowMajorBumpedShifts = String(process.env.SEMANTIC_ALLOW_MAJOR_BUMPS || "").toLowerCase() === "true";

  const hardFails: DiffIssue[] = [];
  for (const i of issues) {
    if (i.kind === "REMOVED_RECORD" || i.kind === "MISSING_SEMVER") {
      hardFails.push(i);
      continue;
    }
    if (i.kind === "SEMANTIC_SHIFT") {
      const isMajorObserved = i.message.includes("major bump observed");
      if (!allowMajorBumpedShifts || !isMajorObserved) {
        hardFails.push(i);
      }
    }
  }

  const grouped: Record<string, DiffIssue[]> = {};
  for (const i of issues) {
    grouped[i.kind] = grouped[i.kind] ?? [];
    grouped[i.kind].push(i);
  }

  console.log("— Semantic Drift Guard Report —");
  console.log(`baseRef=${baseRef}`);
  console.log(`headRef=${headRef}`);
  console.log(`config=${configRel}`);
  console.log("");

  for (const kind of Object.keys(grouped).sort()) {
    console.log(`${kind}: ${grouped[kind].length}`);
    for (const it of grouped[kind]) {
      console.log(`- file=${it.file} id=${it.recordId} :: ${it.message}`);
      if (it.changedPaths && it.changedPaths.length > 0) {
        const top = it.changedPaths.slice(0, 30);
        for (const p of top) console.log(`    • ${p}`);
        if (it.changedPaths.length > top.length) console.log(`    • ... +${it.changedPaths.length - top.length} more`);
      }
    }
    console.log("");
  }

  if (hardFails.length > 0) {
    console.error(`❌ Semantic Drift Guard FAIL (${hardFails.length} hard failure(s))`);
    process.exit(2);
  }

  console.log("✅ Semantic Drift Guard PASS");
}

main().catch((err) => {
  console.error("❌ Semantic Drift Guard ERROR");
  console.error(String((err as any)?.stack ?? err));
  process.exit(1);
});