// @ts-nocheck
/* eslint-disable no-console */
/**
 * CrossDomainAnchorEngine.ts
 *
 * Phase 19 — Deliverable 4 (File 1)
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

type HashAlg = "sha256";

export type AnchorDomain = "DNSSEC_TXT" | "BTC_OP_RETURN" | "ETH_CALLDATA" | "RFC3161_TSA";

export type SignedTreeHead = {
  origin: string;
  treeSize: number;
  rootHash: string; 
  timestamp: string; 
  signature: string;
};

export type CrossDomainAnchorInput = {
  logId: string; 
  registryId: string; 
  version: string; 
  epoch: string; 
  trustContractVersion: string; 
  sth: SignedTreeHead;
  diffRootHash: string; 
  prevAnchor?: {
    anchorId: string;
    anchorHash: string; 
  };
  signer: {
    keyId: string; 
    privateKeyHex: string;
  };
  refs?: Partial<{
    dnsHost: string; 
    btcTxId: string;
    ethTxHash: string;
    rfc3161TokenUrl: string; 
  }>;
};

export type CrossDomainAnchorRecord = {
  anchorId: string; 
  logId: string;
  registryId: string;
  version: string;
  epoch: string; 
  hashAlgorithm: HashAlg;
  preimageHash: string; 
  sthHash: string; 
  diffRootHash: string; 
  trustContractVersion: string;
  prev?: {
    anchorId: string;
    anchorHash: string; 
  };
  publishTargets: {
    dnssecTxt?: {
      host: string;
      valueSha256: string; 
    };
    btcOpReturn?: {
      payloadHex: string; 
    };
    ethCalldata?: {
      payloadHex: string;
    };
    rfc3161?: {
      tokenUrl: string;
    };
  };
  createdAtUtc: string; 
  canonicalAnchorHash: string; 
  signature: {
    type: "Ed25519";
    keyId: string;
    value: string; 
  };
};

function toInt(x: any): number {
  const n = typeof x === "number" ? x : Number(x);
  if (!Number.isFinite(n)) throw new Error(`Invalid integer: ${String(x)}`);
  return Math.trunc(n);
}

function mustIsoUtc(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid timestamp: ${s}`);
  if (!s.endsWith("Z")) throw new Error(`Timestamp must be UTC (Z): ${s}`);
  return s;
}

function normalizeSha256(x: string): string {
  if (typeof x !== "string") throw new Error("hash must be string");
  const v = x.trim();
  const hex = v.startsWith("sha256:") ? v.slice("sha256:".length) : v;
  if (!/^[a-f0-9]{64}$/i.test(hex)) throw new Error(`Invalid sha256 hex: ${x}`);
  return `sha256:${hex.toLowerCase()}`;
}

function sha256Hex(buf: Buffer | string): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function jcsCanonicalize(value: any): string {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "number") {
    if (!Number.isFinite(value)) throw new Error("Non-finite number in JCS");
    if (Object.is(value, -0)) return "0";
    return String(value);
  }
  if (t === "boolean") return value ? "true" : "false";
  if (t === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map((v) => jcsCanonicalize(v)).join(",") + "]";
  }
  if (t === "object") {
    const keys = Object.keys(value).sort((a, b) => a.localeCompare(b));
    return (
      "{" +
      keys
        .map((k) => {
          const v = (value as any)[k];
          if (typeof v === "undefined") throw new Error("Undefined not allowed in JCS");
          return JSON.stringify(k) + ":" + jcsCanonicalize(v);
        })
        .join(",") +
      "}"
    );
  }
  throw new Error(`Unsupported type in JCS: ${t}`);
}

function uuidV5(namespaceHex32: string, name: string): string {
  if (!/^[a-f0-9]{32}$/i.test(namespaceHex32)) throw new Error("namespaceHex32 must be 16-byte hex");
  const ns = Buffer.from(namespaceHex32, "hex");
  const nameBuf = Buffer.from(name, "utf8");
  const hash = crypto.createHash("sha1").update(Buffer.concat([ns, nameBuf])).digest(); 
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const b = hash.subarray(0, 16);
  const hex = b.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

function ed25519SignBase64(message: Buffer, privateKeyHex: string): string {
  const priv = Buffer.from(privateKeyHex, "hex");

  if (privateKeyHex.startsWith("pem:")) {
    const pem = Buffer.from(privateKeyHex.slice(4), "base64").toString("utf8");
    const sig = crypto.sign(null, message, pem);
    return sig.toString("base64");
  }
  throw new Error(
    "ed25519SignBase64 requires signer.privateKeyHex as 'pem:<base64(PEM)>' to remain dependency-free in Node crypto."
  );
}

function buildSthCore(sth: SignedTreeHead): Record<string, any> {
  return {
    origin: String(sth.origin),
    treeSize: toInt(sth.treeSize),
    rootHash: normalizeSha256(sth.rootHash),
    timestamp: mustIsoUtc(String(sth.timestamp)),
  };
}

function buildPreimage(sthCore: Record<string, any>, diffRootHash: string, trustContractVersion: string): string {
  const preimageObj = {
    sth: sthCore,
    diffRootHash: normalizeSha256(diffRootHash),
    trustContractVersion: String(trustContractVersion),
  };
  const jcs = jcsCanonicalize(preimageObj);
  return sha256Hex(Buffer.from(jcs, "utf8"));
}

function ensureOpReturnPayload(hexPayload: string): string {
  const clean = hexPayload.toLowerCase().replace(/^0x/, "");
  if (!/^[a-f0-9]*$/.test(clean) || clean.length % 2 !== 0) throw new Error("payloadHex must be even-length hex");
  const bytes = Buffer.from(clean, "hex");
  if (bytes.length > 80) throw new Error(`BTC OP_RETURN payload exceeds 80 bytes: ${bytes.length}`);
  return clean;
}

function buildChainPayloadHex(preimageHex: string, sthHashHex: string, epoch: string): string {
  if (!/^[a-f0-9]{64}$/.test(preimageHex)) throw new Error("preimageHex invalid");
  if (!/^[a-f0-9]{64}$/.test(sthHashHex)) throw new Error("sthHashHex invalid");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(epoch)) throw new Error("epoch must be YYYY-MM-DD");
  const magic = Buffer.from("WID1", "ascii");
  const pre = Buffer.from(preimageHex, "hex");
  const sth = Buffer.from(sthHashHex, "hex");
  const ep = Buffer.from(epoch, "ascii");
  const buf = Buffer.concat([magic, pre, sth, ep]);
  return buf.toString("hex");
}

function buildDnsTxtValue(params: {
  version: string;
  epoch: string;
  preimageHex: string;
  sthHashHex: string;
  signerKeyId: string;
}): string {
  const parts = [
    ["v", "wid1"],
    ["ver", params.version],
    ["epoch", params.epoch],
    ["pre", params.preimageHex],
    ["sth", params.sthHashHex],
    ["kid", params.signerKeyId],
  ].map(([k, v]) => `${k}=${v}`);
  return parts.join("; ");
}

export class CrossDomainAnchorEngine {
  static generate(input: CrossDomainAnchorInput): {
    anchorRecord: CrossDomainAnchorRecord;
    dnsTxtValue: string;
    chainPayloads: { btcOpReturnHex: string; ethCalldataHex: string };
  } {
    const sthCore = buildSthCore(input.sth);
    const sthCoreJcs = jcsCanonicalize(sthCore);
    const sthHashHex = sha256Hex(Buffer.from(sthCoreJcs, "utf8"));

    const preimageHex = buildPreimage(sthCore, input.diffRootHash, input.trustContractVersion);

    const ANCHOR_NS = "f2d2c0f7a1b44f8c9a2e1b7d3c5a9e1f";
    const anchorName = `${input.logId}|${input.registryId}|${input.version}|${input.epoch}|${preimageHex}|${sthHashHex}`;
    const anchorId = uuidV5(ANCHOR_NS, anchorName);

    const btcPayloadHex = ensureOpReturnPayload(buildChainPayloadHex(preimageHex, sthHashHex, input.epoch));
    const ethPayloadHex = buildChainPayloadHex(preimageHex, sthHashHex, input.epoch);

    const dnsHost = input.refs?.dnsHost || "_anchor.registry.whenisdue.com";
    const dnsTxtValue = buildDnsTxtValue({
      version: input.version,
      epoch: input.epoch,
      preimageHex,
      sthHashHex,
      signerKeyId: input.signer.keyId,
    });
    const dnsTxtSha = sha256Hex(Buffer.from(dnsTxtValue, "utf8"));

    const unsignedRecord = {
      anchorId,
      logId: String(input.logId),
      registryId: String(input.registryId),
      version: String(input.version),
      epoch: String(input.epoch),
      hashAlgorithm: "sha256" as const,
      preimageHash: `sha256:${preimageHex}`,
      sthHash: `sha256:${sthHashHex}`,
      diffRootHash: normalizeSha256(input.diffRootHash),
      trustContractVersion: String(input.trustContractVersion),
      prev: input.prevAnchor
        ? {
            anchorId: String(input.prevAnchor.anchorId),
            anchorHash: normalizeSha256(input.prevAnchor.anchorHash),
          }
        : undefined,
      publishTargets: {
        dnssecTxt: {
          host: dnsHost,
          valueSha256: `sha256:${dnsTxtSha}`,
        },
        btcOpReturn: {
          payloadHex: btcPayloadHex,
        },
        ethCalldata: {
          payloadHex: ethPayloadHex,
        },
        rfc3161: input.refs?.rfc3161TokenUrl ? { tokenUrl: String(input.refs.rfc3161TokenUrl) } : undefined,
      },
      createdAtUtc: new Date().toISOString(),
    };

    const unsignedJcs = jcsCanonicalize(unsignedRecord);
    const canonicalAnchorHashHex = sha256Hex(Buffer.from(unsignedJcs, "utf8"));

    const sigMsg = Buffer.from(unsignedJcs, "utf8");
    const sigB64 = ed25519SignBase64(sigMsg, input.signer.privateKeyHex);

    const anchorRecord: CrossDomainAnchorRecord = {
      ...(unsignedRecord as any),
      canonicalAnchorHash: canonicalAnchorHashHex,
      signature: {
        type: "Ed25519",
        keyId: input.signer.keyId,
        value: sigB64,
      },
    };

    return {
      anchorRecord,
      dnsTxtValue,
      chainPayloads: {
        btcOpReturnHex: btcPayloadHex,
        ethCalldataHex: ethPayloadHex,
      },
    };
  }

  static writeOutputs(opts: {
    outDir: string;
    result: ReturnType<typeof CrossDomainAnchorEngine.generate>;
  }): void {
    fs.mkdirSync(opts.outDir, { recursive: true });
    const { anchorRecord, dnsTxtValue, chainPayloads } = opts.result;

    fs.writeFileSync(path.join(opts.outDir, "anchorRecord.json"), JSON.stringify(anchorRecord, null, 2) + "\n", "utf8");
    fs.writeFileSync(path.join(opts.outDir, "dnsTxtValue.txt"), dnsTxtValue + "\n", "utf8");
    fs.writeFileSync(
      path.join(opts.outDir, "chainPayloads.json"),
      JSON.stringify(
        {
          btcOpReturnHex: chainPayloads.btcOpReturnHex,
          ethCalldataHex: chainPayloads.ethCalldataHex,
        },
        null,
        2
      ) + "\n",
      "utf8"
    );
  }
}