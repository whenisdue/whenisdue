module.exports = [
"[project]/Desktop/whenisdue/web/lib/prisma.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/Desktop/whenisdue/web/node_modules/@prisma/client)");
;
const prismaClientSingleton = ()=>{
    return new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]().$extends({
        query: {
            event: {
                async findMany ({ args, query }) {
                    // Global "95% Safety" Filter: Never show archived events to the public
                    args.where = {
                        ...args.where,
                        isArchived: false
                    };
                    return query(args);
                },
                async findFirst ({ args, query }) {
                    args.where = {
                        ...args.where,
                        isArchived: false
                    };
                    return query(args);
                }
            }
        }
    });
};
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
if ("TURBOPACK compile-time truthy", 1) globalThis.prismaGlobal = prisma;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/Desktop/whenisdue/web/lib/ttf.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateTtfToken",
    ()=>generateTtfToken,
    "verifyTtfToken",
    ()=>verifyTtfToken
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
;
const SECRET = process.env.TTF_SECRET || "development-fallback-secret-key";
function generateTtfToken() {
    const issuedAtMs = Date.now();
    const nonce = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomBytes"])(8).toString("base64url");
    const payload = `${issuedAtMs}.${nonce}`;
    const mac = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["createHmac"])("sha256", SECRET).update(payload).digest("base64url");
    return `${payload}.${mac}`;
}
function verifyTtfToken(token) {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const [issuedAtMsStr, nonce, macB64] = parts;
        const payload = `${issuedAtMsStr}.${nonce}`;
        const expected = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["createHmac"])("sha256", SECRET).update(payload).digest();
        const actual = Buffer.from(macB64, "base64url");
        if (expected.length !== actual.length) return null;
        if (!(0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["timingSafeEqual"])(expected, actual)) return null;
        const issuedAtMs = Number(issuedAtMsStr);
        return Number.isFinite(issuedAtMs) ? issuedAtMs : null;
    } catch  {
        return null;
    }
}
}),
"[project]/Desktop/whenisdue/web/lib/rate-limit.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "checkRateLimit",
    ()=>checkRateLimit,
    "getClientIp",
    ()=>getClientIp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/headers.js [app-rsc] (ecmascript)");
;
;
;
const ipBuckets = new Map();
const BURST_WINDOW_MS = 60_000;
const BURST_LIMIT = 5; // Max 5 requests per minute per IP
const DAILY_LIMIT = 20; // Max 20 requests per day per IP
async function getClientIp() {
    const h = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["headers"])();
    const xff = h.get("x-vercel-forwarded-for") ?? h.get("x-forwarded-for") ?? h.get("x-real-ip");
    return xff ? xff.split(",")[0].trim() : "unknown";
}
function hashIp(ip) {
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["createHash"])("sha256").update(ip + ":" + (process.env.IP_HASH_SECRET || "secret")).digest("hex");
}
function getUtcDayStart() {
    const d = new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
async function checkRateLimit(routeKey) {
    const ip = await getClientIp();
    const now = Date.now();
    // 1. In-Memory Burst Check (Protects Postgres from getting hammered)
    const current = ipBuckets.get(ip);
    if (!current || current.resetAt <= now) {
        ipBuckets.set(ip, {
            count: 1,
            resetAt: now + BURST_WINDOW_MS
        });
    } else {
        if (current.count >= BURST_LIMIT) return false;
        current.count += 1;
        ipBuckets.set(ip, current);
    }
    // Intermittent memory cleanup
    if (Math.random() < 0.05) {
        // FIX: Using Array.from() to satisfy TS without changing compiler config
        for (const [key, bucket] of Array.from(ipBuckets.entries())){
            if (bucket.resetAt <= now) ipBuckets.delete(key);
        }
    }
    // 2. Postgres Durable Daily Quota Check
    const ipHash = hashIp(ip);
    const windowStart = getUtcDayStart();
    try {
        const rl = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].ipRateLimit.upsert({
            where: {
                ipHash_routeKey_windowStart: {
                    ipHash,
                    routeKey,
                    windowStart
                }
            },
            update: {
                requestCount: {
                    increment: 1
                },
                lastSeenAt: new Date()
            },
            create: {
                ipHash,
                routeKey,
                windowStart,
                requestCount: 1
            }
        });
        return rl.requestCount <= DAILY_LIMIT;
    } catch  {
        // If DB fails (e.g. pool exhausted), default to allowing it based on the memory check
        return true;
    }
}
}),
"[project]/Desktop/whenisdue/web/actions/request-event.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"006b57b4e8eac937cb521f43d0a25fdb68cf9efa3a":"getFreshTtf","608f59a82b627b5750a9f43a4f9d2f96f0b1103d7c":"submitEventRequest"},"",""] */ __turbopack_context__.s([
    "getFreshTtf",
    ()=>getFreshTtf,
    "submitEventRequest",
    ()=>submitEventRequest
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$ttf$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/lib/ttf.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$rate$2d$limit$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/lib/rate-limit.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
async function getFreshTtf() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$ttf$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["generateTtfToken"])();
}
const schema = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    title: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
    date: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(100).optional(),
    source: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(300).refine((val)=>!val || val.startsWith('http'), {
        message: "If provided, source must be a valid URL starting with http/https"
    }).optional(),
    ttf: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Session invalid"),
    company_fax: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(100).optional()
});
async function submitEventRequest(prev, formData) {
    const rawFields = {
        title: String(formData.get("title") || ""),
        date: String(formData.get("date") || ""),
        source: String(formData.get("source") || ""),
        ttf: String(formData.get("ttf") || ""),
        company_fax: String(formData.get("company_fax") || "")
    };
    const parsed = schema.safeParse(rawFields);
    if (!parsed.success) {
        const flat = parsed.error.flatten();
        return {
            ok: false,
            fieldErrors: flat.fieldErrors,
            formErrors: flat.formErrors,
            fields: rawFields
        };
    }
    const data = parsed.data;
    // 1. Invisible Honeypot Check (Silently drop bots so they don't know they failed)
    if (data.company_fax && data.company_fax.length > 0) {
        return {
            ok: true,
            message: "Thank you! Your request has been sent for review."
        };
    }
    // 2. Cryptographic Time-To-Fill Check
    const issuedAtMs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$ttf$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyTtfToken"])(data.ttf);
    if (!issuedAtMs) {
        return {
            ok: false,
            formErrors: [
                "Session expired. Please close and reopen the form."
            ],
            fields: rawFields
        };
    }
    const elapsedMs = Date.now() - issuedAtMs;
    if (elapsedMs < 3000) {
        // Submitted under 3 seconds - silent drop
        return {
            ok: true,
            message: "Thank you! Your request has been sent for review."
        };
    }
    // 3. Hybrid Rate Limit Check
    const isAllowed = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$rate$2d$limit$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["checkRateLimit"])("submit_event");
    if (!isAllowed) {
        return {
            ok: false,
            formErrors: [
                "You are doing that too much. Please try again later."
            ],
            fields: rawFields
        };
    }
    const ip = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$rate$2d$limit$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getClientIp"])();
    const ipHash = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["createHash"])("sha256").update(ip + ":" + (process.env.IP_HASH_SECRET || "secret")).digest("hex");
    // 4. DB Insert
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].eventSubmission.create({
            data: {
                submittedTitle: data.title,
                submittedDate: data.date || null,
                submittedSource: data.source || null,
                submitterIpHash: ipHash
            }
        });
        // 5. Non-Blocking Notification via after()
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["after"])(async ()=>{
            const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
            if (webhookUrl) {
                await fetch(webhookUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        content: `🚨 **New Event Request**\n**Title:** ${data.title}\n**Date:** ${data.date || "N/A"}\n**Source:** ${data.source || "N/A"}`
                    })
                }).catch(()=>console.error("Webhook failed silently."));
            }
        });
        return {
            ok: true,
            message: "Thank you! Your request has been sent for review."
        };
    } catch (error) {
        console.error("Submission error:", error);
        return {
            ok: false,
            formErrors: [
                "An internal error occurred. Please try again."
            ],
            fields: rawFields
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getFreshTtf,
    submitEventRequest
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getFreshTtf, "006b57b4e8eac937cb521f43d0a25fdb68cf9efa3a", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(submitEventRequest, "608f59a82b627b5750a9f43a4f9d2f96f0b1103d7c", null);
}),
"[project]/Desktop/whenisdue/web/app/actions/admin.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"401435293c787011f0c4c843056450f0e7b38b34af":"rejectSubmission","4050134ca2b526b456cc6d3d30a167993b59aa2d28":"approveSubmission"},"",""] */ __turbopack_context__.s([
    "approveSubmission",
    ()=>approveSubmission,
    "rejectSubmission",
    ()=>rejectSubmission
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
async function rejectSubmission(id) {
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].eventSubmission.update({
        where: {
            id
        },
        data: {
            status: "REJECTED"
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/requests");
}
async function approveSubmission(id) {
    const submission = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].eventSubmission.findUnique({
        where: {
            id
        }
    });
    if (!submission) return;
    // Generate a simple slug from the title
    const slug = submission.submittedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    // Use a transaction to ensure atomicity
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction([
        // 1. Mark as approved
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].eventSubmission.update({
            where: {
                id
            },
            data: {
                status: "APPROVED"
            }
        }),
        // 2. Create the actual live Event
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].event.create({
            data: {
                title: submission.submittedTitle,
                slug: `${slug}-${Date.now()}`,
                category: "TECH",
                dateStatus: "TBA"
            }
        })
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/requests");
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    rejectSubmission,
    approveSubmission
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(rejectSubmission, "401435293c787011f0c4c843056450f0e7b38b34af", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(approveSubmission, "4050134ca2b526b456cc6d3d30a167993b59aa2d28", null);
}),
"[project]/Desktop/whenisdue/web/.next-internal/server/app/admin/requests/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/whenisdue/web/actions/request-event.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/Desktop/whenisdue/web/app/actions/admin.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$actions$2f$request$2d$event$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/actions/request-event.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$actions$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/app/actions/admin.ts [app-rsc] (ecmascript)");
;
;
;
;
}),
"[project]/Desktop/whenisdue/web/.next-internal/server/app/admin/requests/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/whenisdue/web/actions/request-event.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/Desktop/whenisdue/web/app/actions/admin.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "006b57b4e8eac937cb521f43d0a25fdb68cf9efa3a",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$actions$2f$request$2d$event$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFreshTtf"],
    "401435293c787011f0c4c843056450f0e7b38b34af",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$actions$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["rejectSubmission"],
    "4050134ca2b526b456cc6d3d30a167993b59aa2d28",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$actions$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["approveSubmission"],
    "608f59a82b627b5750a9f43a4f9d2f96f0b1103d7c",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$actions$2f$request$2d$event$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["submitEventRequest"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$requests$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$actions$2f$request$2d$event$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$actions$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/Desktop/whenisdue/web/.next-internal/server/app/admin/requests/page/actions.js { ACTIONS_MODULE0 => "[project]/Desktop/whenisdue/web/actions/request-event.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/Desktop/whenisdue/web/app/actions/admin.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$actions$2f$request$2d$event$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/actions/request-event.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$actions$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/app/actions/admin.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__bb956f17._.js.map