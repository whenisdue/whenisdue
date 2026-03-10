import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = process.env.TTF_SECRET || "fallback-secret";

export function generateUnsubscribeToken(subscriptionId: string): string {
  const payload = Buffer.from(JSON.stringify({ 
    sub: subscriptionId, 
    exp: Date.now() + (1000 * 60 * 60 * 24 * 90) // 90 days
  })).toString("base64url");
  
  const hmac = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${hmac}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const [payloadB64, signature] = token.split(".");
    const expectedHmac = createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
    
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac))) return null;
    
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (Date.now() > payload.exp) return null;
    
    return payload.sub;
  } catch {
    return null;
  }
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}