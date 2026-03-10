import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

const SECRET = process.env.TTF_SECRET || "development-fallback-secret-key";

export function generateTtfToken(): string {
  const issuedAtMs = Date.now();
  const nonce = randomBytes(8).toString("base64url");
  const payload = `${issuedAtMs}.${nonce}`;
  const mac = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function verifyTtfToken(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [issuedAtMsStr, nonce, macB64] = parts;
    const payload = `${issuedAtMsStr}.${nonce}`;

    const expected = createHmac("sha256", SECRET).update(payload).digest();
    const actual = Buffer.from(macB64, "base64url");

    if (expected.length !== actual.length) return null;
    if (!timingSafeEqual(expected, actual)) return null;

    const issuedAtMs = Number(issuedAtMsStr);
    return Number.isFinite(issuedAtMs) ? issuedAtMs : null;
  } catch {
    return null;
  }
}