// @ts-nocheck
/* eslint-disable no-restricted-syntax */
/**
 * Phase 17 — Deliverable 4: RFC 3161 Timestamp Anchors + 10-Year LTV Track
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import crypto from "node:crypto";

type TimestampMeta = {
  specVersion: "rfc3161-anchor/1";
  artifactId: string;
  hashAlgorithm: "sha256";
  imprintHex: string;
  tsa: {
    url: string;
    responseSha256: string;
    responseBytes: number;
    certChain?: {
      keyId: string;
      pemUrl: string;
      sha256: string;
    };
    ocsp?: {
      keyId: string;
      derUrl: string;
      sha256: string;
    };
  };
  files: {
    tsrUrl: string;
    metaUrl: string;
  };
};

function main() {
  const args = parseArgs(process.argv.slice(2));
  const imprintHex = (args["--imprintHex"] || "").trim().toLowerCase();
  const artifactId = (args["--artifactId"] || "").trim();
  const tsaListCsv = (args["--tsaList"] || "").trim();
  const outDir = (args["--outDir"] || "").trim();
  const certOutDir = (args["--certOutDir"] || "").trim();
  const ocspOutDir = (args["--ocspOutDir"] || "").trim();
  const metaOut = (args["--metaOut"] || "").trim();

  if (!isSha256Hex(imprintHex)) throw new Error("Invalid --imprintHex (must be 64 hex chars)");
  if (!artifactId) throw new Error("Missing --artifactId");
  if (!tsaListCsv) throw new Error("Missing --tsaList");
  if (!outDir) throw new Error("Missing --outDir");
  if (!certOutDir) throw new Error("Missing --certOutDir");
  if (!ocspOutDir) throw new Error("Missing --ocspOutDir");
  if (!metaOut) throw new Error("Missing --metaOut");

  const tsaUrls = tsaListCsv.split(",").map((s) => s.trim()).filter(Boolean);
  if (tsaUrls.length < 1) throw new Error("--tsaList must contain at least 1 URL");

  const safeOutDir = normalizeRelPath(outDir);
  const safeCertDir = normalizeRelPath(certOutDir);
  const safeOcspDir = normalizeRelPath(ocspOutDir);
  const safeMetaOut = normalizeRelPath(metaOut);

  ensureDir(safeOutDir);
  ensureDir(safeCertDir);
  ensureDir(safeOcspDir);
  ensureDir(path.dirname(safeMetaOut));

  const tsq = buildTsq(imprintHex);

  const fileBase = stableFileBase(artifactId);
  const tsrPath = path.posix.join(safeOutDir.replace(/\\/g, "/"), `${fileBase}.tsr`);
  const tsrAbs = path.resolve(process.cwd(), tsrPath);

  const MAX_RETRIES_PER_TSA = 3;

  let chosenTsaUrl: string | null = null;
  let tsrDer: Buffer | null = null;

  for (const tsaUrl of tsaUrls) {
    for (let attempt = 1; attempt <= MAX_RETRIES_PER_TSA; attempt++) {
      try {
        const der = awaitTimestamp(tsaUrl, tsq);
        minimalSanityCheck(der);
        chosenTsaUrl = tsaUrl;
        tsrDer = der;
        break;
      } catch (e) {
        if (attempt === MAX_RETRIES_PER_TSA) {
        }
      }
    }
    if (tsrDer) break;
  }

  if (!chosenTsaUrl || !tsrDer) {
    throw new Error("All TSAs failed to produce a valid RFC3161 response (fail-closed)");
  }

  writeBinaryAtomic(tsrAbs, tsrDer);

  const capture = tryExtractCertsAndOcsp(tsrDer);

  let certRef: TimestampMeta["tsa"]["certChain"] | undefined;
  let ocspRef: TimestampMeta["tsa"]["ocsp"] | undefined;

  if (capture?.certsPem && capture.certsPem.trim().length > 0) {
    const keyId = sha256Hex(Buffer.from(capture.certsPem, "utf8")).slice(0, 16);
    const certPath = path.posix.join(safeCertDir.replace(/\\/g, "/"), `${keyId}.pem`);
    writeTextAtomic(path.resolve(process.cwd(), certPath), capture.certsPem);
    certRef = {
      keyId,
      pemUrl: toPosixUrlPath(certPath),
      sha256: sha256Hex(Buffer.from(capture.certsPem, "utf8")),
    };
  }

  if (capture?.ocspDer && capture.ocspDer.byteLength > 0) {
    const keyId = sha256Hex(capture.ocspDer).slice(0, 16);
    const ocspPath = path.posix.join(safeOcspDir.replace(/\\/g, "/"), `${keyId}.ocsp.der`);
    writeBinaryAtomic(path.resolve(process.cwd(), ocspPath), capture.ocspDer);
    ocspRef = {
      keyId,
      derUrl: toPosixUrlPath(ocspPath),
      sha256: sha256Hex(capture.ocspDer),
    };
  }

  const meta: TimestampMeta = {
    specVersion: "rfc3161-anchor/1",
    artifactId,
    hashAlgorithm: "sha256",
    imprintHex,
    tsa: {
      url: chosenTsaUrl,
      responseSha256: sha256Hex(tsrDer),
      responseBytes: tsrDer.byteLength,
      ...(certRef ? { certChain: certRef } : {}),
      ...(ocspRef ? { ocsp: ocspRef } : {}),
    },
    files: {
      tsrUrl: toPosixUrlPath(tsrPath),
      metaUrl: toPosixUrlPath(safeMetaOut),
    },
  };

  writeJsonAtomic(path.resolve(process.cwd(), safeMetaOut), meta);

  // eslint-disable-next-line no-console
  console.log(`OK: TSA=${chosenTsaUrl}`);
  // eslint-disable-next-line no-console
  console.log(`OK: TSR=${tsrPath}`);
  // eslint-disable-next-line no-console
  console.log(`OK: META=${safeMetaOut}`);
}

function buildTsq(imprintHex: string): Buffer {
  const imprint = Buffer.from(imprintHex, "hex");
  if (imprint.byteLength !== 32) throw new Error("imprint must be 32 bytes");

  const sha256AlgId = derSeq([
    derOid("2.16.840.1.101.3.4.2.1"),
    derNull(),
  ]);

  const messageImprint = derSeq([
    sha256AlgId,
    derOctetString(imprint),
  ]);

  const tsq = derSeq([
    derInteger(1),
    messageImprint,
    derBoolean(true),
  ]);

  return tsq;
}

function awaitTimestamp(tsaUrl: string, tsqDer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const u = new URL(tsaUrl);
    if (u.protocol !== "https:") return reject(new Error("TSA URL must be https"));

    const req = https.request(
      {
        method: "POST",
        hostname: u.hostname,
        path: u.pathname + (u.search || ""),
        port: u.port ? Number(u.port) : 443,
        headers: {
          "Content-Type": "application/timestamp-query",
          "Accept": "application/timestamp-reply",
          "Content-Length": String(tsqDer.byteLength),
          "User-Agent": "whenisdue-rfc3161/1",
        },
        timeout: 20_000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
        res.on("end", () => {
          const body = Buffer.concat(chunks);
          if (res.statusCode !== 200) {
            return reject(new Error(`TSA HTTP ${res.statusCode}`));
          }
          if (body.byteLength < 32) {
            return reject(new Error("TSA reply too small"));
          }
          resolve(body);
        });
      },
    );

    req.on("error", (e) => reject(e));
    req.on("timeout", () => {
      req.destroy(new Error("TSA request timeout"));
    });

    req.write(tsqDer);
    req.end();
  });
}

function minimalSanityCheck(tsrDer: Buffer) {
  if (tsrDer.byteLength < 64) throw new Error("TSR too small");
  if (tsrDer[0] !== 0x30) throw new Error("TSR not a DER SEQUENCE");
  const hasOidPkcs7 = tsrDer.includes(Buffer.from([0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x07, 0x02])); 
  if (!hasOidPkcs7) {
  }
}

function tryExtractCertsAndOcsp(tsrDer: Buffer): { certsPem?: string; ocspDer?: Buffer } | null {
  const certDer = findLikelyX509Cert(tsrDer);
  const certsPem = certDer ? derToPem(certDer, "CERTIFICATE") : undefined;
  const ocsp = findLikelyOcsp(tsrDer);

  if (!certsPem && !ocsp) return null;
  return { certsPem, ocspDer: ocsp || undefined };
}

function findLikelyX509Cert(buf: Buffer): Buffer | null {
  const marker = Buffer.from([0x06, 0x03, 0x55, 0x04, 0x03]);
  const idx = buf.indexOf(marker);
  if (idx < 0) return null;

  const start = lastIndexOfByte(buf, 0x30, idx);
  if (start < 0) return null;

  const slice = carveDerObject(buf, start);
  if (!slice) return null;

  if (slice.byteLength < 256 || slice.byteLength > 16_384) return null;

  return slice;
}

function findLikelyOcsp(buf: Buffer): Buffer | null {
  const ocspOid = Buffer.from([0x06, 0x09, 0x2b, 0x06, 0x01, 0x05, 0x05, 0x07, 0x30, 0x01, 0x01]);
  const idx = buf.indexOf(ocspOid);
  if (idx < 0) return null;

  const start = lastIndexOfByte(buf, 0x30, idx);
  if (start < 0) return null;

  const slice = carveDerObject(buf, start);
  if (!slice) return null;
  if (slice.byteLength < 64 || slice.byteLength > 64_000) return null;
  return slice;
}

function lastIndexOfByte(buf: Buffer, byte: number, from: number): number {
  for (let i = Math.min(from, buf.length - 1); i >= 0; i--) {
    if (buf[i] === byte) return i;
  }
  return -1;
}

function carveDerObject(buf: Buffer, offset: number): Buffer | null {
  if (offset < 0 || offset >= buf.length) return null;
  const tag = buf[offset];
  if (tag !== 0x30) return null; 
  const lenInfo = readDerLength(buf, offset + 1);
  if (!lenInfo) return null;
  const { length, headerBytes } = lenInfo;
  const total = 1 + headerBytes + length;
  if (offset + total > buf.length) return null;
  return buf.subarray(offset, offset + total);
}

function readDerLength(buf: Buffer, offset: number): { length: number; headerBytes: number } | null {
  if (offset >= buf.length) return null;
  const b = buf[offset];
  if (b < 0x80) {
    return { length: b, headerBytes: 1 };
  }
  const n = b & 0x7f;
  if (n === 0 || n > 4) return null;
  if (offset + 1 + n > buf.length) return null;
  let len = 0;
  for (let i = 0; i < n; i++) {
    len = (len << 8) | buf[offset + 1 + i];
  }
  return { length: len, headerBytes: 1 + n };
}

function derToPem(der: Buffer, label: string): string {
  const b64 = der.toString("base64");
  const lines = b64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----\n`;
}

/* ------------------------------ DER Helpers ------------------------------ */

function derSeq(parts: Buffer[]): Buffer {
  const body = Buffer.concat(parts);
  return Buffer.concat([Buffer.from([0x30]), derLen(body.byteLength), body]);
}
function derInteger(n: number): Buffer {
  if (!Number.isInteger(n) || n < 0) throw new Error("derInteger expects non-negative int");
  const bytes: number[] = [];
  let x = n;
  do {
    bytes.unshift(x & 0xff);
    x = Math.floor(x / 256);
  } while (x > 0);

  if (bytes[0] & 0x80) bytes.unshift(0x00);

  const body = Buffer.from(bytes);
  return Buffer.concat([Buffer.from([0x02]), derLen(body.byteLength), body]);
}
function derOctetString(b: Buffer): Buffer {
  return Buffer.concat([Buffer.from([0x04]), derLen(b.byteLength), b]);
}
function derNull(): Buffer {
  return Buffer.from([0x05, 0x00]);
}
function derBoolean(v: boolean): Buffer {
  return Buffer.from([0x01, 0x01, v ? 0xff : 0x00]);
}
function derOid(oid: string): Buffer {
  const parts = oid.split(".").map((s) => Number(s));
  if (parts.length < 2) throw new Error("Invalid OID");
  const first = 40 * parts[0] + parts[1];
  const out: number[] = [first];

  for (let i = 2; i < parts.length; i++) {
    const val = parts[i];
    if (!Number.isFinite(val) || val < 0) throw new Error("Invalid OID part");
    const stack: number[] = [];
    let x = val;
    stack.unshift(x & 0x7f);
    x >>= 7;
    while (x > 0) {
      stack.unshift(0x80 | (x & 0x7f));
      x >>= 7;
    }
    out.push(...stack);
  }

  const body = Buffer.from(out);
  return Buffer.concat([Buffer.from([0x06]), derLen(body.byteLength), body]);
}
function derLen(n: number): Buffer {
  if (n < 0x80) return Buffer.from([n]);
  const bytes: number[] = [];
  let x = n;
  while (x > 0) {
    bytes.unshift(x & 0xff);
    x >>= 8;
  }
  if (bytes.length > 4) throw new Error("DER length too large");
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}

/* ------------------------------ IO Helpers ------------------------------ */

function writeBinaryAtomic(absPath: string, buf: Buffer) {
  ensureDir(path.dirname(absPath));
  const tmp = absPath + ".tmp";
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, absPath);
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

/* ------------------------------ Utilities ------------------------------ */

function stableFileBase(artifactId: string): string {
  const s = artifactId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const h = sha256Hex(Buffer.from(artifactId, "utf8")).slice(0, 12);
  const base = `${s}_${h}`;
  return base.length > 120 ? base.slice(0, 120) : base;
}

function toPosixUrlPath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\.\//, "/").replace(/^public\//, "/");
}

function isSha256Hex(s: string): boolean {
  return /^[0-9a-f]{64}$/i.test(s);
}

function sha256Hex(buf: Buffer | Uint8Array): string {
  const h = crypto.createHash("sha256");
  h.update(buf);
  return h.digest("hex");
}

function normalizeRelPath(p: string): string {
  const s = p.replace(/\\/g, "/").trim();
  if (s.length < 1) throw new Error("Empty path");
  if (s.startsWith("/")) throw new Error(`Absolute path not allowed: ${s}`);
  if (s.includes("..")) throw new Error(`Parent traversal not allowed: ${s}`);
  return s;
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

main().catch((e) => {
  console.error(`FAIL: ${(e as Error).message}`);
  process.exit(1);
});