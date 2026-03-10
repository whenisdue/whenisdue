import { prisma } from "./prisma";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };
const ipBuckets = new Map<string, Bucket>();

const BURST_WINDOW_MS = 60_000;
const BURST_LIMIT = 5; // Max 5 requests per minute per IP
const DAILY_LIMIT = 20; // Max 20 requests per day per IP

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-vercel-forwarded-for") ?? h.get("x-forwarded-for") ?? h.get("x-real-ip");
  return xff ? xff.split(",")[0].trim() : "unknown";
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip + ":" + (process.env.IP_HASH_SECRET || "secret")).digest("hex");
}

function getUtcDayStart(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function checkRateLimit(routeKey: string): Promise<boolean> {
  const ip = await getClientIp();
  const now = Date.now();

  // 1. In-Memory Burst Check (Protects Postgres from getting hammered)
  const current = ipBuckets.get(ip);
  if (!current || current.resetAt <= now) {
    ipBuckets.set(ip, { count: 1, resetAt: now + BURST_WINDOW_MS });
  } else {
    if (current.count >= BURST_LIMIT) return false;
    current.count += 1;
    ipBuckets.set(ip, current);
  }

  // Intermittent memory cleanup
  if (Math.random() < 0.05) {
    // FIX: Using Array.from() to satisfy TS without changing compiler config
    for (const [key, bucket] of Array.from(ipBuckets.entries())) {
      if (bucket.resetAt <= now) ipBuckets.delete(key);
    }
  }

  // 2. Postgres Durable Daily Quota Check
  const ipHash = hashIp(ip);
  const windowStart = getUtcDayStart();

  try {
    const rl = await prisma.ipRateLimit.upsert({
      where: { ipHash_routeKey_windowStart: { ipHash, routeKey, windowStart } },
      update: { requestCount: { increment: 1 }, lastSeenAt: new Date() },
      create: { ipHash, routeKey, windowStart, requestCount: 1 }
    });
    return rl.requestCount <= DAILY_LIMIT;
  } catch {
    // If DB fails (e.g. pool exhausted), default to allowing it based on the memory check
    return true;
  }
}