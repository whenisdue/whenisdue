// @ts-nocheck
/* eslint-disable no-restricted-syntax */
/**
 * SCITT-lite Receipt Generator (COSE_Sign1 over Merkle inclusion proof)
 */

import crypto from "node:crypto";

/* ----------------------------- Types ----------------------------- */

export type ScittLiteReceiptInput = {
  kid: string; 
  privateKeyPem: string; 

  sth: {
    treeSize: number; 
    rootHashHex: string; 
  };

  leafHashHex: string; 

  inclusion: {
    hashAlgId?: number; 
    leafIndex: number; 
    siblingHashesHex: string[]; 
  };

  externalAad?: Uint8Array; 
};

export type ScittLiteReceiptResult = {
  receiptCoseBytes: Uint8Array;
  receiptContentsBytes: Uint8Array;
  receiptContentsHashHex: string;
  protectedHeaders: {
    alg: -8;
    kid: string;
    cty: "application/scitt-receipt+cose";
  };
};

/* ----------------------------- Public API ----------------------------- */

export function generateScittLiteReceipt(input: ScittLiteReceiptInput): ScittLiteReceiptResult {
  if (typeof input.kid !== "string" || input.kid.length < 1) throw new Error("kid must be non-empty");
  if (typeof input.privateKeyPem !== "string" || input.privateKeyPem.length < 32) throw new Error("privateKeyPem invalid");

  const treeSize = toUint(input.sth.treeSize, "sth.treeSize");
  const rootHash = hexTo32(input.sth.rootHashHex, "sth.rootHashHex");
  const leafHash = hexTo32(input.leafHashHex, "leafHashHex");

  const hashAlgId = input.inclusion.hashAlgId ?? -16;
  if (!Number.isInteger(hashAlgId)) throw new Error("inclusion.hashAlgId must be int");
  const leafIndex = toUint(input.inclusion.leafIndex, "inclusion.leafIndex");

  const siblings: Uint8Array[] = input.inclusion.siblingHashesHex.map((h, idx) => hexTo32(h, `inclusion.siblingHashesHex[${idx}]`));

  const proof: CborValue = [hashAlgId, leafIndex, siblings];

  const receiptContents: CborValue = [1, treeSize, rootHash, leafHash, proof];

  const receiptContentsBytes = cborEncode(receiptContents);
  const receiptContentsHash = sha256(receiptContentsBytes);

  const protectedMap = new Map<CborKey, CborValue>();
  protectedMap.set(1, -8);
  protectedMap.set(4, input.kid);
  protectedMap.set(3, "application/scitt-receipt+cose");

  const protectedBytes = cborEncode(protectedMap);

  const unprotected = new Map<CborKey, CborValue>();

  const externalAad = input.externalAad ?? new Uint8Array(0);

  const sigStructure: CborValue = ["Signature1", protectedBytes, externalAad, receiptContentsHash];
  const toBeSigned = cborEncode(sigStructure);

  const signature = ed25519Sign(toBeSigned, input.privateKeyPem);

  const coseSign1: CborValue = [protectedBytes, unprotected, receiptContentsHash, signature];
  const receiptCoseBytes = cborEncode(coseSign1);

  return {
    receiptCoseBytes,
    receiptContentsBytes,
    receiptContentsHashHex: toHex(receiptContentsHash),
    protectedHeaders: { alg: -8, kid: input.kid, cty: "application/scitt-receipt+cose" },
  };
}

export function verifyScittLiteReceipt(args: {
  receiptCoseBytes: Uint8Array;
  publicKeyPem: string;
  receiptContentsBytes?: Uint8Array;
  expectedKid?: string;
  externalAad?: Uint8Array;
}): {
  ok: boolean;
  kid?: string;
  payloadHashHex?: string;
  reason?: string;
} {
  try {
    const externalAad = args.externalAad ?? new Uint8Array(0);

    const decoded = cborDecode(args.receiptCoseBytes);
    if (!Array.isArray(decoded) || decoded.length !== 4) return { ok: false, reason: "coseSign1: invalid array" };

    const [protectedBstr, _unprotected, payload, signature] = decoded as any[];

    if (!(protectedBstr instanceof Uint8Array)) return { ok: false, reason: "protected not bstr" };
    if (!(payload instanceof Uint8Array) || payload.length !== 32) return { ok: false, reason: "payload not 32-byte hash" };
    if (!(signature instanceof Uint8Array)) return { ok: false, reason: "signature not bstr" };

    const protectedMapVal = cborDecode(protectedBstr);
    if (!(protectedMapVal instanceof Map)) return { ok: false, reason: "protected: not a map" };

    const alg = protectedMapVal.get(1);
    const kid = protectedMapVal.get(4);
    const cty = protectedMapVal.get(3);

    if (alg !== -8) return { ok: false, reason: "protected: alg must be -8" };
    if (typeof kid !== "string") return { ok: false, reason: "protected: kid must be string" };
    if (cty !== "application/scitt-receipt+cose") return { ok: false, reason: "protected: cty mismatch" };
    if (args.expectedKid && kid !== args.expectedKid) return { ok: false, reason: "protected: kid mismatch" };

    if (args.receiptContentsBytes) {
      const recomputed = sha256(args.receiptContentsBytes);
      if (!equalBytes(recomputed, payload)) return { ok: false, reason: "payload hash does not match receiptContentsBytes" };
    }

    const sigStructure: CborValue = ["Signature1", protectedBstr, externalAad, payload];
    const toBeSigned = cborEncode(sigStructure);

    const ok = ed25519Verify(toBeSigned, signature, args.publicKeyPem);
    if (!ok) return { ok: false, reason: "signature invalid" };

    return { ok: true, kid, payloadHashHex: toHex(payload) };
  } catch (e: any) {
    return { ok: false, reason: e?.message ?? "verify error" };
  }
}

/* ----------------------------- Utilities ----------------------------- */

function toUint(n: number, label: string): number {
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) throw new Error(`${label} must be a non-negative integer`);
  return n;
}

function sha256(bytes: Uint8Array): Uint8Array {
  const h = crypto.createHash("sha256");
  h.update(bytes);
  return new Uint8Array(h.digest());
}

function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

function hexTo32(hex: string, label: string): Uint8Array {
  if (typeof hex !== "string") throw new Error(`${label} must be hex string`);
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length !== 64) throw new Error(`${label} must be 32-byte hex (64 chars)`);
  if (!/^[0-9a-fA-F]+$/.test(clean)) throw new Error(`${label} contains non-hex characters`);
  return new Uint8Array(Buffer.from(clean, "hex"));
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/* ----------------------------- Ed25519 helpers ----------------------------- */

function ed25519Sign(message: Uint8Array, privateKeyPem: string): Uint8Array {
  const keyObj = crypto.createPrivateKey(privateKeyPem);
  const sig = crypto.sign(null, Buffer.from(message), keyObj);
  return new Uint8Array(sig);
}

function ed25519Verify(message: Uint8Array, signature: Uint8Array, publicKeyPem: string): boolean {
  const keyObj = crypto.createPublicKey(publicKeyPem);
  return crypto.verify(null, Buffer.from(message), keyObj, Buffer.from(signature));
}

/* ---------------------------- Minimal CBOR ---------------------------- */

type CborValue = number | string | Uint8Array | CborValue[] | Map<CborKey, CborValue> | null | boolean;
type CborKey = number | string;

function cborEncode(value: CborValue): Uint8Array {
  const chunks: Uint8Array[] = [];
  encodeAny(value, chunks);
  return concatChunks(chunks);
}

function encodeAny(value: CborValue, out: Uint8Array[]): void {
  if (value === null) {
    out.push(Uint8Array.from([0xf6]));
    return;
  }
  if (typeof value === "boolean") {
    out.push(Uint8Array.from([value ? 0xf5 : 0xf4]));
    return;
  }
  if (typeof value === "number") {
    if (!Number.isInteger(value)) throw new Error("CBOR encoder supports integers only");
    encodeInt(value, out);
    return;
  }
  if (typeof value === "string") {
    encodeText(value, out);
    return;
  }
  if (value instanceof Uint8Array) {
    encodeBytes(value, out);
    return;
  }
  if (Array.isArray(value)) {
    encodeArray(value, out);
    return;
  }
  if (value instanceof Map) {
    encodeMap(value, out);
    return;
  }
  throw new Error("Unsupported CBOR type");
}

function encodeInt(n: number, out: Uint8Array[]): void {
  if (n >= 0) encodeMajorWithValue(0, n, out);
  else encodeMajorWithValue(1, -1 - n, out);
}

function encodeBytes(b: Uint8Array, out: Uint8Array[]): void {
  encodeMajorWithValue(2, b.length, out);
  out.push(b);
}

function encodeText(s: string, out: Uint8Array[]): void {
  const b = Buffer.from(s, "utf8");
  encodeMajorWithValue(3, b.length, out);
  out.push(new Uint8Array(b));
}

function encodeArray(arr: CborValue[], out: Uint8Array[]): void {
  encodeMajorWithValue(4, arr.length, out);
  for (const item of arr) encodeAny(item, out);
}

function encodeMap(map: Map<CborKey, CborValue>, out: Uint8Array[]): void {
  const entries: Array<{ key: CborKey; val: CborValue; encKey: Uint8Array }> = [];
  for (const [k, v] of map.entries()) {
    if (typeof k !== "string" && typeof k !== "number") throw new Error("CBOR map key must be string or number");
    const encKey = cborEncodeKey(k);
    entries.push({ key: k, val: v, encKey });
  }
  entries.sort((a, b) => compareCborKeyBytes(a.encKey, b.encKey));

  encodeMajorWithValue(5, entries.length, out);
  for (const e of entries) {
    out.push(e.encKey);
    encodeAny(e.val, out);
  }
}

function cborEncodeKey(k: CborKey): Uint8Array {
  if (typeof k === "number") {
    if (!Number.isInteger(k)) throw new Error("CBOR key number must be int");
    const chunks: Uint8Array[] = [];
    encodeInt(k, chunks);
    return concatChunks(chunks);
  }
  const chunks: Uint8Array[] = [];
  encodeText(k, chunks);
  return concatChunks(chunks);
}

function compareCborKeyBytes(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== b.length) return a.length - b.length;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    if (d !== 0) return d;
  }
  return 0;
}

function encodeMajorWithValue(major: number, value: number, out: Uint8Array[]): void {
  if (value < 0) throw new Error("CBOR major value must be >= 0");
  if (value < 24) {
    out.push(Uint8Array.from([(major << 5) | value]));
    return;
  }
  if (value <= 0xff) {
    out.push(Uint8Array.from([(major << 5) | 24, value]));
    return;
  }
  if (value <= 0xffff) {
    out.push(Uint8Array.from([(major << 5) | 25, (value >> 8) & 0xff, value & 0xff]));
    return;
  }
  if (value <= 0xffffffff) {
    out.push(
      Uint8Array.from([
        (major << 5) | 26,
        (value >>> 24) & 0xff,
        (value >>> 16) & 0xff,
        (value >>> 8) & 0xff,
        value & 0xff,
      ]),
    );
    return;
  }
  if (!Number.isSafeInteger(value)) throw new Error("CBOR value too large");
  const hi = Math.floor(value / 2 ** 32);
  const lo = value >>> 0;
  out.push(
    Uint8Array.from([
      (major << 5) | 27,
      (hi >>> 24) & 0xff,
      (hi >>> 16) & 0xff,
      (hi >>> 8) & 0xff,
      hi & 0xff,
      (lo >>> 24) & 0xff,
      (lo >>> 16) & 0xff,
      (lo >>> 8) & 0xff,
      lo & 0xff,
    ]),
  );
}

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

/* --------------------------- Minimal CBOR decoder -------------------------- */

function cborDecode(bytes: Uint8Array): any {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let i = 0;

  const read = (): any => {
    if (i >= dv.byteLength) throw new Error("CBOR decode: truncated");
    const first = dv.getUint8(i++);
    const major = first >> 5;
    const addl = first & 0x1f;

    const readLen = (): number => {
      if (addl < 24) return addl;
      if (addl === 24) return dv.getUint8(i++);
      if (addl === 25) {
        const v = dv.getUint16(i);
        i += 2;
        return v;
      }
      if (addl === 26) {
        const v = dv.getUint32(i);
        i += 4;
        return v;
      }
      if (addl === 27) {
        const hi = dv.getUint32(i);
        const lo = dv.getUint32(i + 4);
        i += 8;
        const v = hi * 2 ** 32 + lo;
        if (!Number.isSafeInteger(v)) throw new Error("CBOR decode: uint64 too large");
        return v;
      }
      throw new Error("CBOR decode: indefinite lengths not supported");
    };

    if (major === 0) return readLen();
    if (major === 1) return -1 - readLen();
    if (major === 2) {
      const len = readLen();
      const b = bytes.subarray(i, i + len);
      i += len;
      return new Uint8Array(b);
    }
    if (major === 3) {
      const len = readLen();
      const b = bytes.subarray(i, i + len);
      i += len;
      return Buffer.from(b).toString("utf8");
    }
    if (major === 4) {
      const len = readLen();
      const arr: any[] = [];
      for (let j = 0; j < len; j++) arr.push(read());
      return arr;
    }
    if (major === 5) {
      const len = readLen();
      const map = new Map<any, any>();
      for (let j = 0; j < len; j++) {
        const k = read();
        const v = read();
        map.set(k, v);
      }
      return map;
    }
    if (major === 7) {
      if (addl === 20) return false;
      if (addl === 21) return true;
      if (addl === 22) return null;
      throw new Error("CBOR decode: unsupported simple value");
    }
    throw new Error("CBOR decode: unsupported major type");
  };

  const val = read();
  if (i !== dv.byteLength) throw new Error("CBOR decode: trailing bytes");
  return val;
}