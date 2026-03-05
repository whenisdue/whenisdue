// @ts-nocheck
/* MonitorEngine.ts
 *
 * Phase 15 — Deliverable 2 (File 1)
 * Monitor Engine (fail-closed, deterministic guardrails, low false-positive posture)
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

type Severity = "INFO" | "WARN" | "CRITICAL";
type AlarmType = "ROLLBACK" | "SPLIT_VIEW" | "ANCHOR_DRIFT" | "SIGNATURE_INVALID" | "STALE_KEY" | "INCOMPLETE_EVIDENCE";

type TrustContract = {
  schemaVersion: number;
  logId: string;
  sthPublicKey: {
    kty: "OKP";
    crv: "Ed25519";
    x: string; 
  };
  trustContractHash?: string; 
};

type SignedTreeHead = {
  logId: string;
  treeSize: number;
  rootHash: string; 
  timestampUtc: string; 
  signature: string; 
};

type WitnessAnchor = {
  anchorType: "DNS" | "GITHUB";
  observedTreeSize: number;
  observedRootHash: string;
  observedAtUtc: string;
  signature?: string;
};

type MonitorStatus = {
  observedTreeSize: number;
  observedRootHash: string;
  trustContractHash: string;
  dnsWitnessHash: string | null;
  githubWitnessHash: string | null;
  signatureValidationStatus: "VALID" | "INVALID" | "UNKNOWN";
  monotonicityStatus: "HEALTHY" | "VIOLATION";
  anchorConsistencyStatus: "CONSISTENT" | "INCONSISTENT" | "UNKNOWN";
  lastCheckUtc: string;
  monitorIdentity: string;
};

type Alarm = {
  alarmId: string; 
  alarmType: AlarmType;
  severity: Severity;
  detectionTimestamp: string; 
  monitorIdentity: string;
  evidence: any[];
  signedByMonitorKey: "SIGNED" | "UNSIGNED";
  signature?: {
    alg: "Ed25519";
    value: string; 
  };
};

function assert(condition: any, msg: string): asserts condition {
  if (!condition) throw new Error(`MonitorEngine: ${msg}`);
}

function isIsoUtc(s: string): boolean {
  if (typeof s !== "string") return false;
  if (!s.endsWith("Z")) return false;
  const t = Date.parse(s);
  return Number.isFinite(t);
}

function nowIsoUtc(): string {
  return new Date().toISOString();
}

function toInt(n: any, fallback = 0): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.trunc(x);
}

function sha256Hex(buf: Buffer | string): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function base64ToBuf(b64: string): Buffer {
  return Buffer.from(b64, "base64");
}

function base64UrlToBuf(b64u: string): Buffer {
  const pad = (4 - (b64u.length % 4)) % 4;
  const b64 = (b64u + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

function jcsCanonicalize(value: any): string {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "number") {
    assert(Number.isFinite(value), "Non-finite number in JCS canonicalization");
    return JSON.stringify(value);
  }
  if (t === "string" || t === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map((v) => jcsCanonicalize(v)).join(",") + "]";
  }
  if (t === "object") {
    const keys = Object.keys(value).sort();
    return (
      "{" +
      keys
        .map((k) => {
          const v = (value as any)[k];
          assert(typeof k === "string", "Invalid key type");
          return JSON.stringify(k) + ":" + jcsCanonicalize(v);
        })
        .join(",") +
      "}"
    );
  }
  throw new Error("Unsupported type in JCS canonicalization");
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "accept": "application/json,text/plain;q=0.9,*/*;q=0.1",
      "user-agent": "WhenIsDue-Monitor/1.0",
    },
    // @ts-ignore
    cache: "no-store",
  });

  assert(res.ok, `Fetch failed (${res.status}) for ${url}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${url}`);
  }
}

function readOptionalJson(filePath: string): any | null {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(filePath: string, obj: any) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function validateTrustContract(tc: any): TrustContract {
  assert(tc && typeof tc === "object", "trust contract must be object");
  assert(tc.schemaVersion === 1 || tc.schemaVersion === 2 || typeof tc.schemaVersion === "number", "trust contract schemaVersion missing");
  assert(typeof tc.logId === "string" && tc.logId.length > 0, "trust contract logId missing");
  assert(tc.sthPublicKey && typeof tc.sthPublicKey === "object", "trust contract sthPublicKey missing");
  assert(tc.sthPublicKey.kty === "OKP", "trust contract sthPublicKey.kty must be OKP");
  assert(tc.sthPublicKey.crv === "Ed25519", "trust contract sthPublicKey.crv must be Ed25519");
  assert(typeof tc.sthPublicKey.x === "string" && tc.sthPublicKey.x.length > 0, "trust contract sthPublicKey.x missing");
  return tc as TrustContract;
}

function validateSth(sth: any): SignedTreeHead {
  assert(sth && typeof sth === "object", "sth must be object");
  assert(typeof sth.logId === "string" && sth.logId.length > 0, "sth.logId missing");
  assert(Number.isFinite(sth.treeSize), "sth.treeSize must be number");
  assert(typeof sth.rootHash === "string" && sth.rootHash.length > 0, "sth.rootHash missing");
  assert(typeof sth.timestampUtc === "string" && isIsoUtc(sth.timestampUtc), "sth.timestampUtc invalid");
  assert(typeof sth.signature === "string" && sth.signature.length > 0, "sth.signature missing");
  return {
    logId: sth.logId,
    treeSize: toInt(sth.treeSize, -1),
    rootHash: sth.rootHash,
    timestampUtc: sth.timestampUtc,
    signature: sth.signature,
  };
}

function sthSigningBytes(sth: SignedTreeHead): Buffer {
  const payload = {
    logId: sth.logId,
    treeSize: sth.treeSize,
    rootHash: sth.rootHash,
    timestampUtc: sth.timestampUtc,
  };
  return Buffer.from(jcsCanonicalize(payload), "utf8");
}

function verifySthSignature(sth: SignedTreeHead, tc: TrustContract): boolean {
  try {
    const pub = base64UrlToBuf(tc.sthPublicKey.x);
    const spki = ed25519SpkiFromRaw(pub);
    const keyObj = crypto.createPublicKey({ key: spki, format: "der", type: "spki" });
    return crypto.verify(null, sthSigningBytes(sth), keyObj, base64ToBuf(sth.signature));
  } catch {
    return false;
  }
}

function ed25519SpkiFromRaw(raw32: Buffer): Buffer {
  assert(raw32.length === 32, "Ed25519 public key must be 32 bytes");
  const prefix = Buffer.from("302a300506032b6570032100", "hex");
  return Buffer.concat([prefix, raw32]);
}

function computeTrustContractHash(tc: TrustContract): string {
  const stable = {
    logId: tc.logId,
    sthPublicKey: tc.sthPublicKey,
  };
  return "sha256:" + sha256Hex(Buffer.from(jcsCanonicalize(stable), "utf8"));
}

function computeWitnessHash(w: WitnessAnchor): string {
  const stable = {
    anchorType: w.anchorType,
    observedTreeSize: w.observedTreeSize,
    observedRootHash: w.observedRootHash,
    observedAtUtc: w.observedAtUtc,
  };
  return "sha256:" + sha256Hex(Buffer.from(jcsCanonicalize(stable), "utf8"));
}

function makeAlarmId(alarmType: AlarmType, detectionTimestamp: string, monitorIdentity: string): string {
  const stable = { alarmType, detectionTimestamp, monitorIdentity };
  const hex = sha256Hex(Buffer.from(jcsCanonicalize(stable), "utf8"));
  return "urn:sha256:" + hex;
}

function signAlarmIfPossible(alarm: Alarm, signingKeyPem?: string): Alarm {
  if (!signingKeyPem) {
    return { ...alarm, signedByMonitorKey: "UNSIGNED" };
  }
  try {
    const keyObj = crypto.createPrivateKey(signingKeyPem);
    const unsigned = { ...alarm };
    delete (unsigned as any).signature;
    const bytes = Buffer.from(jcsCanonicalize(unsigned), "utf8");
    const sig = crypto.sign(null, bytes, keyObj);
    return {
      ...alarm,
      signedByMonitorKey: "SIGNED",
      signature: {
        alg: "Ed25519",
        value: sig.toString("base64"),
      },
    };
  } catch {
    return { ...alarm, signedByMonitorKey: "UNSIGNED" };
  }
}

function buildAlarm(
  alarmType: AlarmType,
  severity: Severity,
  detectionTimestamp: string,
  monitorIdentity: string,
  evidence: any[],
  signingKeyPem?: string
): Alarm {
  const alarm: Alarm = {
    alarmId: makeAlarmId(alarmType, detectionTimestamp, monitorIdentity),
    alarmType,
    severity,
    detectionTimestamp,
    monitorIdentity,
    evidence,
    signedByMonitorKey: "UNSIGNED",
  };
  return signAlarmIfPossible(alarm, signingKeyPem);
}

function chooseSeverity(alarmType: AlarmType): Severity {
  switch (alarmType) {
    case "SIGNATURE_INVALID":
    case "ROLLBACK":
    case "SPLIT_VIEW":
      return "CRITICAL";
    case "ANCHOR_DRIFT":
    case "INCOMPLETE_EVIDENCE":
    case "STALE_KEY":
      return "WARN";
    default:
      return "WARN";
  }
}

function isSplitView(primary: SignedTreeHead, witness: WitnessAnchor): boolean {
  return primary.treeSize === witness.observedTreeSize && primary.rootHash !== witness.observedRootHash;
}

function driftAmount(primary: SignedTreeHead, witness: WitnessAnchor): number {
  return primary.treeSize - witness.observedTreeSize;
}

async function run() {
  const monitorIdentity = process.env.MONITOR_IDENTITY || "did:web:monitor.whenisdue.com";
  const trustContractUrl = process.env.TRUST_CONTRACT_URL;
  const sthLatestUrl = process.env.STH_LATEST_URL;

  const dnsWitnessUrl = process.env.DNS_WITNESS_URL || "";
  const githubWitnessUrl = process.env.GITHUB_WITNESS_URL || "";

  const statusOutPath = process.env.STATUS_OUT_PATH || "monitor-status.json";
  const alarmOutPath = process.env.ALARM_OUT_PATH || "alarm.json";
  const lastStatusPath = process.env.LAST_STATUS_PATH || statusOutPath;

  const signingKeyPem = process.env.MONITOR_SIGNING_KEY_PEM || "";

  assert(typeof trustContractUrl === "string" && trustContractUrl.length > 0, "TRUST_CONTRACT_URL is required");
  assert(typeof sthLatestUrl === "string" && sthLatestUrl.length > 0, "STH_LATEST_URL is required");

  const detectionTimestamp = nowIsoUtc();

  const prior = readOptionalJson(lastStatusPath) as MonitorStatus | null;
  const priorTreeSize = prior ? toInt(prior.observedTreeSize, -1) : -1;

  let alarms: Alarm[] = [];

  let trustContract: TrustContract | null = null;
  try {
    trustContract = validateTrustContract(await fetchJson(trustContractUrl));
  } catch (e: any) {
    alarms.push(
      buildAlarm(
        "INCOMPLETE_EVIDENCE",
        chooseSeverity("INCOMPLETE_EVIDENCE"),
        detectionTimestamp,
        monitorIdentity,
        [{ kind: "trustContract", url: trustContractUrl, error: String(e?.message || e) }],
        signingKeyPem || undefined
      )
    );
  }

  const trustContractHash = trustContract ? computeTrustContractHash(trustContract) : "sha256:" + "0".repeat(64);

  let sth: SignedTreeHead | null = null;
  try {
    sth = validateSth(await fetchJson(sthLatestUrl));
  } catch (e: any) {
    alarms.push(
      buildAlarm(
        "INCOMPLETE_EVIDENCE",
        chooseSeverity("INCOMPLETE_EVIDENCE"),
        detectionTimestamp,
        monitorIdentity,
        [{ kind: "sthLatest", url: sthLatestUrl, error: String(e?.message || e) }],
        signingKeyPem || undefined
      )
    );
  }

  const observedTreeSize = sth ? sth.treeSize : priorTreeSize >= 0 ? priorTreeSize : 0;
  const observedRootHash = sth ? sth.rootHash : prior?.observedRootHash || "sha256:" + "0".repeat(64);

  let signatureValidationStatus: MonitorStatus["signatureValidationStatus"] = "UNKNOWN";
  if (sth && trustContract) {
    const ok = verifySthSignature(sth, trustContract);
    signatureValidationStatus = ok ? "VALID" : "INVALID";
    if (!ok) {
      alarms.push(
        buildAlarm(
          "SIGNATURE_INVALID",
          chooseSeverity("SIGNATURE_INVALID"),
          detectionTimestamp,
          monitorIdentity,
          [
            {
              kind: "sthSignatureInvalid",
              sth: {
                logId: sth.logId,
                treeSize: sth.treeSize,
                rootHash: sth.rootHash,
                timestampUtc: sth.timestampUtc,
              },
              trustContract: { logId: trustContract.logId, pubKeyX: trustContract.sthPublicKey.x },
            },
          ],
          signingKeyPem || undefined
        )
      );
    }
  }

  let monotonicityStatus: MonitorStatus["monotonicityStatus"] = "HEALTHY";
  if (priorTreeSize >= 0 && sth) {
    if (sth.treeSize < priorTreeSize) {
      monotonicityStatus = "VIOLATION";
      alarms.push(
        buildAlarm(
          "ROLLBACK",
          chooseSeverity("ROLLBACK"),
          detectionTimestamp,
          monitorIdentity,
          [{ kind: "rollback", priorTreeSize, newTreeSize: sth.treeSize, sth: { rootHash: sth.rootHash, timestampUtc: sth.timestampUtc } }],
          signingKeyPem || undefined
        )
      );
    }
  }

  let dnsWitness: WitnessAnchor | null = null;
  let githubWitness: WitnessAnchor | null = null;

  const witnessErrors: any[] = [];

  if (dnsWitnessUrl) {
    try {
      const w = await fetchJson(dnsWitnessUrl);
      assert(w && typeof w === "object", "DNS witness must be object");
      dnsWitness = {
        anchorType: "DNS",
        observedTreeSize: toInt(w.observedTreeSize, -1),
        observedRootHash: String(w.observedRootHash || ""),
        observedAtUtc: String(w.observedAtUtc || ""),
        signature: typeof w.signature === "string" ? w.signature : undefined,
      };
      assert(dnsWitness.observedTreeSize >= 0, "DNS witness observedTreeSize invalid");
      assert(typeof dnsWitness.observedRootHash === "string" && dnsWitness.observedRootHash.length > 0, "DNS witness observedRootHash missing");
      assert(isIsoUtc(dnsWitness.observedAtUtc), "DNS witness observedAtUtc invalid");
    } catch (e: any) {
      witnessErrors.push({ kind: "dnsWitness", url: dnsWitnessUrl, error: String(e?.message || e) });
    }
  }

  if (githubWitnessUrl) {
    try {
      const w = await fetchJson(githubWitnessUrl);
      assert(w && typeof w === "object", "GitHub witness must be object");
      githubWitness = {
        anchorType: "GITHUB",
        observedTreeSize: toInt(w.observedTreeSize, -1),
        observedRootHash: String(w.observedRootHash || ""),
        observedAtUtc: String(w.observedAtUtc || ""),
        signature: typeof w.signature === "string" ? w.signature : undefined,
      };
      assert(githubWitness.observedTreeSize >= 0, "GitHub witness observedTreeSize invalid");
      assert(typeof githubWitness.observedRootHash === "string" && githubWitness.observedRootHash.length > 0, "GitHub witness observedRootHash missing");
      assert(isIsoUtc(githubWitness.observedAtUtc), "GitHub witness observedAtUtc invalid");
    } catch (e: any) {
      witnessErrors.push({ kind: "githubWitness", url: githubWitnessUrl, error: String(e?.message || e) });
    }
  }

  if (witnessErrors.length > 0) {
    alarms.push(
      buildAlarm(
        "INCOMPLETE_EVIDENCE",
        chooseSeverity("INCOMPLETE_EVIDENCE"),
        detectionTimestamp,
        monitorIdentity,
        witnessErrors,
        signingKeyPem || undefined
      )
    );
  }

  const dnsWitnessHash = dnsWitness ? computeWitnessHash(dnsWitness) : null;
  const githubWitnessHash = githubWitness ? computeWitnessHash(githubWitness) : null;

  let anchorConsistencyStatus: MonitorStatus["anchorConsistencyStatus"] = "UNKNOWN";
  const witnesses: WitnessAnchor[] = [];
  if (dnsWitness) witnesses.push(dnsWitness);
  if (githubWitness) witnesses.push(githubWitness);

  if (sth && witnesses.length > 0) {
    anchorConsistencyStatus = "CONSISTENT";

    for (const w of witnesses) {
      if (isSplitView(sth, w)) {
        anchorConsistencyStatus = "INCONSISTENT";
        alarms.push(
          buildAlarm(
            "SPLIT_VIEW",
            chooseSeverity("SPLIT_VIEW"),
            detectionTimestamp,
            monitorIdentity,
            [
              {
                kind: "splitView",
                primary: { treeSize: sth.treeSize, rootHash: sth.rootHash, timestampUtc: sth.timestampUtc },
                witness: { anchorType: w.anchorType, treeSize: w.observedTreeSize, rootHash: w.observedRootHash, observedAtUtc: w.observedAtUtc },
              },
            ],
            signingKeyPem || undefined
          )
        );
      }
    }

    for (const w of witnesses) {
      const d = driftAmount(sth, w);
      if (Number.isFinite(d) && d > 2) {
        alarms.push(
          buildAlarm(
            "ANCHOR_DRIFT",
            chooseSeverity("ANCHOR_DRIFT"),
            detectionTimestamp,
            monitorIdentity,
            [
              {
                kind: "anchorDrift",
                anchorType: w.anchorType,
                primaryTreeSize: sth.treeSize,
                witnessTreeSize: w.observedTreeSize,
                delta: d,
              },
            ],
            signingKeyPem || undefined
          )
        );
      }
    }
  }

  const status: MonitorStatus = {
    observedTreeSize,
    observedRootHash,
    trustContractHash,
    dnsWitnessHash,
    githubWitnessHash,
    signatureValidationStatus,
    monotonicityStatus,
    anchorConsistencyStatus,
    lastCheckUtc: detectionTimestamp,
    monitorIdentity,
  };

  writeJson(statusOutPath, status);

  if (alarms.length > 0) {
    const rank = (s: Severity) => (s === "CRITICAL" ? 3 : s === "WARN" ? 2 : 1);
    alarms.sort((a, b) => {
      const ra = rank(a.severity);
      const rb = rank(b.severity);
      if (ra !== rb) return rb - ra;
      if (a.alarmType !== b.alarmType) return a.alarmType < b.alarmType ? -1 : 1;
      if (a.alarmId !== b.alarmId) return a.alarmId < b.alarmId ? -1 : 1;
      return 0;
    });
    writeJson(alarmOutPath, alarms[0]);
  } else {
    const okMarker: Alarm = buildAlarm(
      "INCOMPLETE_EVIDENCE",
      "INFO",
      detectionTimestamp,
      monitorIdentity,
      [{ kind: "noAlarms", message: "All checks passed. No alarm emitted." }],
      signingKeyPem || undefined
    );
    writeJson(alarmOutPath, okMarker);
  }
}

assert(typeof (globalThis as any).fetch === "function", "Global fetch is required (Node 18+).");

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(`MonitorEngine fatal: ${String((e as any)?.message || e)}`);
  process.exit(1);
});