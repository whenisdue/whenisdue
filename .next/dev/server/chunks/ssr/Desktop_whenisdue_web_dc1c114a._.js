module.exports = [
"[project]/Desktop/whenisdue/web/lib/admin-session.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearAdminSession",
    ()=>clearAdminSession,
    "createAdminSession",
    ()=>createAdminSession,
    "getAdminSession",
    ()=>getAdminSession,
    "requireAdminSession",
    ()=>requireAdminSession
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$server$2d$only$2f$empty$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/compiled/server-only/empty.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$sign$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/jose/dist/webapi/jwt/sign.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/jose/dist/webapi/jwt/verify.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/headers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
;
;
;
;
const SESSION_COOKIE = 'admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 // 24 hours (Conservative TTL)
;
function getSessionSecret() {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) throw new Error('Missing ADMIN_SESSION_SECRET');
    return new TextEncoder().encode(secret);
}
async function createAdminSession() {
    const secret = getSessionSecret();
    const token = await new __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$sign$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SignJWT"]({
        sub: 'admin',
        role: 'admin'
    }).setProtectedHeader({
        alg: 'HS256'
    }).setIssuedAt().setExpirationTime(`${SESSION_TTL_SECONDS}s`).sign(secret);
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: ("TURBOPACK compile-time value", "development") === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_TTL_SECONDS
    });
}
async function clearAdminSession() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.delete(SESSION_COOKIE);
}
async function getAdminSession() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    try {
        const secret = getSessionSecret();
        const { payload } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jwtVerify"])(token, secret);
        if (payload.sub !== 'admin' || payload.role !== 'admin') return null;
        return {
            sub: 'admin',
            role: 'admin'
        };
    } catch  {
        return null;
    }
}
async function requireAdminSession() {
    const session = await getAdminSession();
    if (!session) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])('/admin/login');
    }
    return session;
}
}),
"[project]/Desktop/whenisdue/web/lib/prisma.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/Desktop/whenisdue/web/node_modules/@prisma/client)");
;
const globalForPrisma = /*TURBOPACK member replacement*/ __turbopack_context__.g;
const prisma = globalForPrisma.prisma || new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
    log: [
        'error'
    ]
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = prisma;
}),
"[project]/Desktop/whenisdue/web/lib/validation.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "adminEventSchema",
    ()=>adminEventSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/Desktop/whenisdue/web/node_modules/@prisma/client)");
;
;
const baseEventFields = {
    id: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    title: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1, "Title is required").max(200, "Title is too long"),
    slug: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1, "Slug is required").max(200, "Slug is too long").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case (e.g., my-event-name)"),
    category: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].nativeEnum(__TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__["EventCategory"], {
        error: "Category is required"
    }),
    description: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(5000, "Description is too long").optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal("")),
    trending: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional().default(false),
    dateLabel: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(""))
};
// 1. EXACT DATE SCHEMA
const exactSchema = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    ...baseEventFields,
    dateStatus: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(__TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__["EventDateStatus"].EXACT),
    localDate: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Local Date is required for EXACT events"),
    localTime: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Local Time is required for EXACT events"),
    timeZone: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Time Zone is required for EXACT events"),
    displayMonth: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    displayYear: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
// 2. TBA SCHEMA
const tbaSchema = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    ...baseEventFields,
    dateStatus: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(__TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__["EventDateStatus"].TBA),
    localDate: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    localTime: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    timeZone: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    displayMonth: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    displayYear: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
// 3. TBD MONTH SCHEMA
const tbdMonthSchema = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    ...baseEventFields,
    dateStatus: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(__TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__["EventDateStatus"].TBD_MONTH),
    localDate: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    localTime: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    timeZone: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    displayMonth: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).max(12),
    displayYear: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(2000).max(2100)
});
const adminEventSchema = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].discriminatedUnion("dateStatus", [
    exactSchema,
    tbaSchema,
    tbdMonthSchema
]);
}),
"[project]/Desktop/whenisdue/web/lib/dates.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseLocalDateTimeToUtcDate",
    ()=>parseLocalDateTimeToUtcDate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$luxon$2f$build$2f$es6$2f$luxon$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/luxon/build/es6/luxon.mjs [app-rsc] (ecmascript)");
;
function parseLocalDateTimeToUtcDate(localDate, localTime, timeZone) {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$luxon$2f$build$2f$es6$2f$luxon$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["IANAZone"].isValidZone(timeZone)) {
        throw new Error(`Invalid IANA timezone: "${timeZone}"`);
    }
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
    if (!dateMatch) throw new Error("Invalid localDate. Expected format: YYYY-MM-DD");
    const timeMatch = /^(\d{2}):(\d{2})$/.exec(localTime);
    if (!timeMatch) throw new Error("Invalid localTime. Expected format: HH:mm");
    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    const hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);
    const dt = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$luxon$2f$build$2f$es6$2f$luxon$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DateTime"].fromObject({
        year,
        month,
        day,
        hour,
        minute,
        second: 0,
        millisecond: 0
    }, {
        zone: timeZone
    });
    if (!dt.isValid) {
        throw new Error(`Invalid datetime: ${dt.invalidExplanation}`);
    }
    // Detect nonexistent local times (DST spring-forward gap)
    const sameWallClock = dt.year === year && dt.month === month && dt.day === day && dt.hour === hour && dt.minute === minute;
    if (!sameWallClock) {
        throw new Error(`Nonexistent local time: "${localDate} ${localTime}" (DST gap).`);
    }
    // Detect ambiguous local times (DST fall-back overlap)
    const possible = dt.getPossibleOffsets();
    if (possible.length > 1) {
        throw new Error("Ambiguous local time due to DST overlap. Please adjust the time by 1 hour.");
    }
    return dt.toUTC().toJSDate();
}
}),
"[project]/Desktop/whenisdue/web/app/admin/actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40b7117784f0ae8defa5ae5e78b5054a01aa225dd0":"deleteEvent","60a47a293c47ed30b95b60ac7e207a49accc3011b1":"toggleTrending","60deb7e038f6eb94b787aa36f58147d3fa2cee3faf":"saveEvent"},"",""] */ __turbopack_context__.s([
    "deleteEvent",
    ()=>deleteEvent,
    "saveEvent",
    ()=>saveEvent,
    "toggleTrending",
    ()=>toggleTrending
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$admin$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/lib/admin-session.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$validation$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/lib/validation.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$dates$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/lib/dates.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/Desktop/whenisdue/web/node_modules/@prisma/client)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
async function toggleTrending(id, currentStatus) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$admin$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["requireAdminSession"])();
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].event.update({
        where: {
            id
        },
        data: {
            trending: !currentStatus
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/admin');
}
async function deleteEvent(id) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$admin$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["requireAdminSession"])();
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].event.delete({
        where: {
            id
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/admin');
}
async function saveEvent(prevState, formData) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$admin$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["requireAdminSession"])();
    // Extract form data into a raw object
    const rawData = {
        id: formData.get('id'),
        title: formData.get('title'),
        slug: formData.get('slug'),
        category: formData.get('category'),
        description: formData.get('description'),
        dateStatus: formData.get('dateStatus'),
        localDate: formData.get('localDate'),
        localTime: formData.get('localTime'),
        timeZone: formData.get('timeZone'),
        displayMonth: formData.get('displayMonth'),
        displayYear: formData.get('displayYear'),
        dateLabel: formData.get('dateLabel'),
        trending: formData.get('trending') === 'true'
    };
    // Strip empty strings so Zod triggers its optional/undefined fallbacks correctly
    Object.keys(rawData).forEach((key)=>{
        if (rawData[key] === '') {
            rawData[key] = undefined;
        }
    });
    // Validate against our Strict Discriminated Union
    const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$validation$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminEventSchema"].safeParse(rawData);
    if (!parsed.success) {
        return {
            ok: false,
            message: 'Please fix the errors below.',
            fieldErrors: parsed.error.flatten().fieldErrors
        };
    }
    const data = parsed.data;
    let dueAtUtc = null;
    // If EXACT, run it through the Luxon DST-Safe Parser
    if (data.dateStatus === __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__["EventDateStatus"].EXACT) {
        try {
            dueAtUtc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$dates$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseLocalDateTimeToUtcDate"])(data.localDate, data.localTime, data.timeZone);
        } catch (error) {
            return {
                ok: false,
                message: error.message || 'Invalid date/time combination.',
                fieldErrors: {
                    localTime: [
                        'Check DST overlap or invalid time.'
                    ]
                }
            };
        }
    }
    try {
        const payload = {
            title: data.title,
            slug: data.slug,
            category: data.category,
            description: data.description || null,
            dateStatus: data.dateStatus,
            dueAt: dueAtUtc,
            timeZone: data.dateStatus === __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__["EventDateStatus"].EXACT ? data.timeZone : null,
            displayMonth: data.dateStatus === __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__["EventDateStatus"].TBD_MONTH && data.displayMonth ? Number(data.displayMonth) : null,
            displayYear: data.dateStatus === __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__["EventDateStatus"].TBD_MONTH && data.displayYear ? Number(data.displayYear) : null,
            dateLabel: data.dateLabel || null,
            trending: data.trending
        };
        if (data.id) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].event.update({
                where: {
                    id: data.id
                },
                data: payload
            });
        } else {
            await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].event.create({
                data: payload
            });
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/');
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/admin');
        return {
            ok: true,
            message: 'Event saved successfully.'
        };
    } catch (error) {
        // Handle duplicate slugs gracefully
        if (error instanceof __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__["Prisma"].PrismaClientKnownRequestError && error.code === 'P2002') {
            return {
                ok: false,
                message: 'This slug is already in use.',
                fieldErrors: {
                    slug: [
                        'Slug must be unique.'
                    ]
                }
            };
        }
        console.error(error);
        return {
            ok: false,
            message: 'An unexpected database error occurred.'
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    toggleTrending,
    deleteEvent,
    saveEvent
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(toggleTrending, "60a47a293c47ed30b95b60ac7e207a49accc3011b1", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteEvent, "40b7117784f0ae8defa5ae5e78b5054a01aa225dd0", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(saveEvent, "60deb7e038f6eb94b787aa36f58147d3fa2cee3faf", null);
}),
"[project]/Desktop/whenisdue/web/lib/recurrence.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateMonthlyBusinessDayRecurrences",
    ()=>generateMonthlyBusinessDayRecurrences
]);
const MS_PER_DAY = 24 * 60 * 60 * 1000;
function assertValidDayOfMonth(dayOfMonth) {
    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
        throw new Error(`dayOfMonth must be an integer from 1 to 31. Received: ${dayOfMonth}`);
    }
}
function utcDate(year, monthIndex, day) {
    return new Date(Date.UTC(year, monthIndex, day, 12, 0, 0, 0));
}
function addUtcDays(date, days) {
    return new Date(date.getTime() + days * MS_PER_DAY);
}
function getUtcYear(date) {
    return date.getUTCFullYear();
}
function getUtcMonth(date) {
    return date.getUTCMonth();
}
function getUtcWeekday(date) {
    return date.getUTCDay();
} // 0=Sun ... 6=Sat
function daysInUtcMonth(year, monthIndex) {
    return new Date(Date.UTC(year, monthIndex + 1, 0, 12)).getUTCDate();
}
function clampDayToMonth(year, monthIndex, desiredDay) {
    return Math.min(desiredDay, daysInUtcMonth(year, monthIndex));
}
function nthWeekdayOfMonthUtc(year, monthIndex, weekday, nth) {
    const first = utcDate(year, monthIndex, 1);
    const firstWeekday = getUtcWeekday(first);
    const offset = (weekday - firstWeekday + 7) % 7;
    const day = 1 + offset + (nth - 1) * 7;
    return utcDate(year, monthIndex, day);
}
function lastWeekdayOfMonthUtc(year, monthIndex, weekday) {
    const lastDay = daysInUtcMonth(year, monthIndex);
    const last = utcDate(year, monthIndex, lastDay);
    const lastWeekday = getUtcWeekday(last);
    const offsetBack = (lastWeekday - weekday + 7) % 7;
    return utcDate(year, monthIndex, lastDay - offsetBack);
}
function observedFixedHolidayUtc(year, monthIndex, day) {
    const actual = utcDate(year, monthIndex, day);
    const weekday = getUtcWeekday(actual);
    if (weekday === 6) return addUtcDays(actual, -1);
    if (weekday === 0) return addUtcDays(actual, 1);
    return actual;
}
function getObservedFederalHolidaysUtc(year) {
    return [
        observedFixedHolidayUtc(year, 0, 1),
        nthWeekdayOfMonthUtc(year, 0, 1, 3),
        nthWeekdayOfMonthUtc(year, 1, 1, 3),
        lastWeekdayOfMonthUtc(year, 4, 1),
        observedFixedHolidayUtc(year, 5, 19),
        observedFixedHolidayUtc(year, 6, 4),
        nthWeekdayOfMonthUtc(year, 8, 1, 1),
        nthWeekdayOfMonthUtc(year, 9, 1, 2),
        observedFixedHolidayUtc(year, 10, 11),
        nthWeekdayOfMonthUtc(year, 10, 4, 4),
        observedFixedHolidayUtc(year, 11, 25)
    ];
}
function dateKeyUtc(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}
function buildHolidaySetForYearSpan(startYear, endYear) {
    const set = new Set();
    for(let year = startYear; year <= endYear; year++){
        for (const holiday of getObservedFederalHolidaysUtc(year)){
            set.add(dateKeyUtc(holiday));
        }
    }
    return set;
}
function isWeekendUtc(date) {
    const weekday = getUtcWeekday(date);
    return weekday === 0 || weekday === 6;
}
function shiftBackwardToBusinessDayUtc(date, holidaySet) {
    let current = new Date(date.getTime());
    while(isWeekendUtc(current) || holidaySet.has(dateKeyUtc(current))){
        current = addUtcDays(current, -1);
    }
    return current;
}
function generateMonthlyBusinessDayRecurrences(options) {
    const { startDate, dayOfMonth, count = 12 } = options;
    assertValidDayOfMonth(dayOfMonth);
    const startYear = getUtcYear(startDate);
    const startMonth = getUtcMonth(startDate);
    const endYear = startYear + Math.floor((startMonth + count) / 12);
    const holidaySet = buildHolidaySetForYearSpan(startYear - 1, endYear + 1);
    const results = [];
    for(let i = 0; i < count; i++){
        const absoluteMonthIndex = startMonth + i;
        const year = startYear + Math.floor(absoluteMonthIndex / 12);
        const monthIndex = absoluteMonthIndex % 12;
        const safeDay = clampDayToMonth(year, monthIndex, dayOfMonth);
        const nominalDate = utcDate(year, monthIndex, safeDay);
        const adjustedDate = shiftBackwardToBusinessDayUtc(nominalDate, holidaySet);
        results.push(adjustedDate);
    }
    return results;
}
}),
"[project]/Desktop/whenisdue/web/app/admin/series-actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"4017a527c944b58fd906ed81bd1bb02379b2ce5bc8":"commitSeriesAction","401e4baca954dbd5d8c1e6458799a21010a0413e12":"previewSeriesDatesAction"},"",""] */ __turbopack_context__.s([
    "commitSeriesAction",
    ()=>commitSeriesAction,
    "previewSeriesDatesAction",
    ()=>previewSeriesDatesAction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$recurrence$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/lib/recurrence.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/Desktop/whenisdue/web/node_modules/@prisma/client)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$admin$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/lib/admin-session.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
async function previewSeriesDatesAction(payload) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$admin$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["requireAdminSession"])();
    const startDate = new Date(`${payload.startDate}T12:00:00Z`);
    const dates = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$recurrence$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["generateMonthlyBusinessDayRecurrences"])({
        startDate,
        dayOfMonth: payload.dayOfMonth,
        count: payload.count
    });
    return dates.map((d, i)=>{
        const iso = d.toISOString().split('T')[0];
        return {
            index: i + 1,
            originalDateIso: iso,
            adjustedDateIso: iso,
            reason: "Calculated via OPM/SSA Rules"
        };
    });
}
async function commitSeriesAction(payload) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$admin$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["requireAdminSession"])();
    // 1. Upsert the Series
    const series = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].eventSeries.upsert({
        where: {
            slugBase: payload.seriesId
        },
        update: {
            title: payload.title
        },
        create: {
            title: payload.title,
            slugBase: payload.seriesId,
            category: payload.category.toUpperCase(),
            isActive: true
        }
    });
    // 2. Format and Create the individual Events
    const eventsToCreate = payload.dates.map((dateStr)=>{
        const dateObj = new Date(`${dateStr}T14:00:00Z`) // Default 14:00 UTC (10am/9am ET)
        ;
        const monthName = dateObj.toLocaleString('default', {
            month: 'long',
            timeZone: 'UTC'
        });
        const year = dateObj.getUTCFullYear();
        return {
            title: `${payload.title} - ${monthName} ${year}`,
            slug: `${payload.seriesId}-${dateStr}`,
            category: payload.category.toUpperCase(),
            seriesId: series.id,
            dueAt: dateObj,
            timeZone: 'America/New_York',
            dateStatus: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__["EventDateStatus"].EXACT,
            trending: false,
            isGenerated: true
        };
    });
    // 3. Batch Insert safely
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].event.createMany({
        data: eventsToCreate,
        skipDuplicates: true // Prevents crashing if you accidentally run the same dates twice
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/admin');
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    previewSeriesDatesAction,
    commitSeriesAction
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(previewSeriesDatesAction, "401e4baca954dbd5d8c1e6458799a21010a0413e12", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(commitSeriesAction, "4017a527c944b58fd906ed81bd1bb02379b2ce5bc8", null);
}),
"[project]/Desktop/whenisdue/web/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/whenisdue/web/app/admin/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/Desktop/whenisdue/web/app/admin/series-actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$admin$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/app/admin/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$admin$2f$series$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/app/admin/series-actions.ts [app-rsc] (ecmascript)");
;
;
;
;
;
}),
"[project]/Desktop/whenisdue/web/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/whenisdue/web/app/admin/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/Desktop/whenisdue/web/app/admin/series-actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "4017a527c944b58fd906ed81bd1bb02379b2ce5bc8",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$admin$2f$series$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["commitSeriesAction"],
    "401e4baca954dbd5d8c1e6458799a21010a0413e12",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$admin$2f$series$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["previewSeriesDatesAction"],
    "40b7117784f0ae8defa5ae5e78b5054a01aa225dd0",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$admin$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteEvent"],
    "60a47a293c47ed30b95b60ac7e207a49accc3011b1",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$admin$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["toggleTrending"],
    "60deb7e038f6eb94b787aa36f58147d3fa2cee3faf",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$admin$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["saveEvent"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$admin$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$admin$2f$series$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/Desktop/whenisdue/web/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => "[project]/Desktop/whenisdue/web/app/admin/actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/Desktop/whenisdue/web/app/admin/series-actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$admin$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/app/admin/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$admin$2f$series$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/app/admin/series-actions.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=Desktop_whenisdue_web_dc1c114a._.js.map