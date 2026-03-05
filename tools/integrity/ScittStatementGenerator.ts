// @ts-nocheck
/* eslint-disable no-restricted-syntax */
/**
 * SCITT-lite Statement Generator (COSE_Sign1, detached payload)
 */

import crypto from "node:crypto";

export type ScittLiteStatementInput =
  | {
      kid: string; 
      privateKeyPem: string; 
      jsonValue: unknown; 
      externalAad?: Uint8Array; 
      contentType?: string; 
    }
  | {
      kid: string;
      privateKeyPem: string;
      canonicalJsonBytes: Uint8Array; 
      externalAad?: Uint8Array;
      contentType?: string;
    };

export type ScittLiteStatementResult = {
  coseSign1Bytes: Uint8Array;
  payloadHashHex: string;
  payloadHashB64: string;
  protectedHeaders: {
    alg: -8;
    kid: string;
    cty: string;
  };
};

export function sha256(bytes: Uint8Array): Uint8Array {
  const h = crypto.createHash("sha256");
  h.update(bytes);
  return new Uint8Array(h.digest());
}

export function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

export function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

export function generateScittLiteStatement(input: ScittLiteStatementInput): ScittLiteStatementResult {
  const kid = input.kid;
  if (typeof kid !== "string" || kid.length < 1) throw new Error("kid must be a non-empty string");
  if (typeof input.privateKeyPem !== "string" || input.privateKeyPem.length < 32) {
    throw new Error("privateKeyPem must be a non-empty PEM string");
  }

  const cty = (input as any).contentType ?? "application/json";
  if (typeof cty !== "string" || cty.length < 1) throw new Error("contentType must be a non-empty string");

  const externalAad: Uint8Array = (input as any).externalAad ?? new Uint8Array(0);

  const canonicalBytes: Uint8Array =
    "canonicalJsonBytes" in input
      ? input.canonicalJsonBytes
      : utf8Encode(strictStableJsonCanonicalize(input.jsonValue));

  const payloadHash = sha256(canonicalBytes);

  const protectedMap = new Map<CborKey, CborValue>();
  protectedMap.set(1, -8);
  protectedMap.set(4, kid);
  protectedMap.set(3, cty);

  const protectedBytes = cborEncode(protectedMap); 
  const protectedBstr = protectedBytes; 

  const unprotected = new Map<CborKey, CborValue>();

  const sigStructure: CborValue = [
    "Signature1",
    protectedBstr,
    externalAad,
    payloadHash,
  ];

  const toBeSigned = cborEncode(sigStructure);

  const signature = ed25519Sign(toBeSigned, input.privateKeyPem);

  const coseSign1: CborValue = [
    protectedBstr,
    unprotected,
    payloadHash,
    signature,
  ];

  const coseBytes = cborEncode(coseSign1);

  return {
    coseSign1Bytes: coseBytes,
    payloadHashHex: toHex(payloadHash),
    payloadHashB64: toBase64(payloadHash),
    protectedHeaders: { alg: -8, kid, cty },
  };
}

export function verifyScittLiteStatement(args: {
  coseSign1Bytes: Uint8Array;
  publicKeyPem: string; 
  expectedKid?: string;
  expectedContentType?: string;
  externalAad?: Uint8Array;
}): {
  ok: boolean;
  payloadHashHex?: string;
  kid?: string;
  cty?: string;
  reason?: string;
} {
  try {
    const externalAad = args.externalAad ?? new Uint8Array(0);

    const decoded = cborDecode(args.coseSign1Bytes);
    if (!Array.isArray(decoded) || decoded.length !== 4) return { ok: false, reason: "coseSign1: invalid array" };

    const [protectedBstr, unprotected, payload, signature] = decoded as any[];

    if (!(protectedBstr instanceof Uint8Array)) return { ok: false, reason: "coseSign1: protected not bstr" };
    if (!(payload instanceof Uint8Array) || payload.length !== 32) return { ok: false, reason: "coseSign1: payload not 32-byte hash" };
    if (!(signature instanceof Uint8Array)) return { ok: false, reason: "coseSign1: signature not bstr" };

    const protectedMapVal = cborDecode(protectedBstr);
    if (!(protectedMapVal instanceof Map)) return { ok: false, reason: "protected: not a map" };

    const alg = protectedMapVal.get(1);
    const kid = protectedMapVal.get(4);
    const cty = protectedMapVal.get(3);

    if (alg !== -8) return { ok: false, reason: "protected: alg must be -8 (EdDSA)" };
    if (typeof kid !== "string") return { ok: false, reason: "protected: kid must be string" };
    if (typeof cty !== "string") return { ok: false, reason: "protected: cty must be string" };

    if (args.expectedKid && kid !== args.expectedKid) return { ok: false, reason: "protected: kid mismatch" };
    if (args.expectedContentType && cty !== args.expectedContentType) return { ok: false, reason: "protected: cty mismatch" };

    const sigStructure: CborValue = ["Signature1", protectedBstr, externalAad, payload];
    const toBeSigned = cborEncode(sigStructure);

    const ok = ed25519Verify(toBeSigned, signature, args.publicKeyPem);
    if (!ok) return { ok: false, reason: "signature invalid" };

    return {
      ok: true,
      payloadHashHex: toHex(payload),
      kid,
      cty,
    };
  } catch (e: any) {
    return { ok: false, reason: e?.message ?? "verify error" };
  }
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

/* ----------------------------- UTF-8 helpers ------------------------------ */

function utf8Encode(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, "utf8"));
}

/* ------------------ Strict stable JSON canonicalization ------------------- */

export function strictStableJsonCanonicalize(value: unknown): string {
  const normalized = normalizeJsonValue(value);
  return stableStringify(normalized);
}

function normalizeJsonValue(value: unknown): any {
  if (value === null) return null;

  const t = typeof value;
  if (t === "string" || t === "boolean") return value;

  if (t === "number") {
    if (!Number.isFinite(value)) throw new Error("Non-finite number not allowed in canonical JSON");
    if (Object.is(value, -0)) return 0;
    return value;
  }

  if (Array.isArray(value)) return value.map((v) => normalizeJsonValue(v));

  if (t === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, any> = {};
    const keys = Object.keys(obj).sort(); 
    for (const k of keys) {
      const v = (obj as any)[k];
      if (v === undefined) throw new Error(`Undefined not allowed in canonical JSON (key: ${k})`);
      out[k] = normalizeJsonValue(v);
    }
    return out;
  }

  throw new Error(`Unsupported JSON value type for canonicalization: ${t}`);
}

function stableStringify(v: any): string {
  if (v === null) return "null";
  const t = typeof v;
  if (t === "string") return JSON.stringify(v);
  if (t === "boolean") return v ? "true" : "false";
  if (t === "number") {
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) {
    let s = "[";
    for (let i = 0; i < v.length; i++) {
      if (i) s += ",";
      s += stableStringify(v[i]);
    }
    s += "]";
    return s;
  }
  const keys = Object.keys(v);
  let s = "{";
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (i) s += ",";
    s += JSON.stringify(k);
    s += ":";
    s += stableStringify(v[k]);
  }
  s += "}";
  return s;
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
    if (!Number.isInteger(value)) throw new Error("CBOR encoder only supports integers in this module");
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
  const len = a.length;
  for (let i = 0; i < len; i++) {
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