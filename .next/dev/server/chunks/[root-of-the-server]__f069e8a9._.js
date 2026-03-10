module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/Desktop/whenisdue/web/lib/prisma.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/Desktop/whenisdue/web/app/api/track/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
// web/app/api/track/route.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
;
;
// Process-local throttle (Friction, not absolute distributed security)
const burstMap = new Map();
function isThrottled(ipHash, eventId) {
    const key = `${ipHash}:${eventId}`;
    const now = Date.now();
    const record = burstMap.get(key);
    if (!record || now >= record.resetAt) {
        burstMap.set(key, {
            count: 1,
            resetAt: now + 10000
        }); // 10-second window
        return false;
    }
    record.count += 1;
    return record.count > 5; // Max 5 clicks per 10s per IP per event
}
async function POST(req) {
    // Layer 1: Browser-Origin Friction
    const origin = req.headers.get('origin');
    if (origin && !origin.includes(process.env.NEXT_PUBLIC_SITE_URL || 'localhost')) {
        return new Response(null, {
            status: 403
        });
    }
    // Layer 2: Payload Validation
    let body;
    try {
        body = await req.json();
    } catch  {
        return new Response(null, {
            status: 400
        });
    }
    if (!body.events || !Array.isArray(body.events)) {
        return new Response(null, {
            status: 400
        });
    }
    // Layer 3: Pseudonymous IP Hashing
    const rawIp = req.headers.get('x-forwarded-for') || 'unknown';
    const salt = process.env.TELEMETRY_SALT || 'local-dev-salt';
    const ipHash = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].createHash('sha256').update(rawIp + salt).digest('hex');
    // Layer 4: Background Telemetry (after() is for telemetry, not truth)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["after"])(async ()=>{
        for (const event of body.events){
            if (!event.eventId) continue;
            // Check process-local burst limit
            if (isThrottled(ipHash, event.eventId)) {
                console.warn(`Throttled click from IP Hash ${ipHash.substring(0, 8)} for event ${event.eventId}`);
                continue;
            }
            try {
                // Phase 1: Atomic Increment for single hot fields
                await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].eventClickStat.upsert({
                    where: {
                        eventId: event.eventId
                    },
                    update: {
                        clickCount1h: {
                            increment: 1
                        },
                        totalClicks: {
                            increment: 1
                        },
                        lastClickAt: new Date()
                    },
                    create: {
                        eventId: event.eventId,
                        clickCount1h: 1,
                        totalClicks: 1,
                        lastClickAt: new Date()
                    }
                });
            } catch (error) {
                console.error("Telemetry Prisma write failed:", error);
            }
        }
    });
    // Layer 5: Status Code Discipline
    return new Response(null, {
        status: 202
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f069e8a9._.js.map