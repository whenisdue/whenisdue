module.exports = [
"[project]/Desktop/whenisdue/web/lib/data-service.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSeriesWithOccurrences",
    ()=>getSeriesWithOccurrences,
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/Desktop/whenisdue/web/node_modules/@prisma/client)");
;
const globalForPrisma = /*TURBOPACK member replacement*/ __turbopack_context__.g;
const prisma = globalForPrisma.prisma || new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]();
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = prisma;
async function getSeriesWithOccurrences(seriesKey) {
    // Safety Guard: stop execution if the key is missing or not a string
    if (!seriesKey || typeof seriesKey !== 'string') return null;
    return await prisma.series.findUnique({
        where: {
            seriesKey: seriesKey
        },
        include: {
            occurrences: {
                orderBy: {
                    date: 'desc'
                },
                take: 12
            }
        }
    });
}
}),
"[project]/Desktop/whenisdue/web/app/admin/actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"405d39960a80a5789360a1ff0a826d881331f3406b":"verifyAndBroadcast","607aa4d1c63dccffc450db2b4fb0c0a1b9ce8ec3ad":"deleteOccurrence"},"",""] */ __turbopack_context__.s([
    "deleteOccurrence",
    ()=>deleteOccurrence,
    "verifyAndBroadcast",
    ()=>verifyAndBroadcast
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$data$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/lib/data-service.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
async function verifyAndBroadcast(formData) {
    try {
        // 1. Save to Database
        const newOccurrence = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$data$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].occurrence.create({
            data: {
                series: {
                    connect: {
                        seriesKey: formData.seriesKey
                    }
                },
                date: new Date(formData.date),
                status: 'VERIFIED',
                verificationProof: formData.proof
            }
        });
        // 2. Prepare the Push Message
        const message = `VERIFIED: New date for ${formData.seriesKey} confirmed for ${formData.date}.`;
        // 3. Trigger Global Broadcast (Internal API call)
        await fetch(`${("TURBOPACK compile-time value", "http://localhost:3000") || 'http://localhost:3000'}/api/push/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message
            })
        });
        // 4. Refresh the UI
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/series/${formData.seriesKey}`);
        return {
            success: true
        };
    } catch (error) {
        console.error("Admin Action Failed:", error);
        return {
            success: false,
            error: "Failed to verify date."
        };
    }
}
async function deleteOccurrence(id, seriesKey) {
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$data$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].occurrence.delete({
            where: {
                id
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/series/${seriesKey}`);
        return {
            success: true
        };
    } catch (error) {
        console.error("Delete failed:", error);
        return {
            success: false
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    verifyAndBroadcast,
    deleteOccurrence
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(verifyAndBroadcast, "405d39960a80a5789360a1ff0a826d881331f3406b", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteOccurrence, "607aa4d1c63dccffc450db2b4fb0c0a1b9ce8ec3ad", null);
}),
"[project]/Desktop/whenisdue/web/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/whenisdue/web/app/admin/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$admin$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/app/admin/actions.ts [app-rsc] (ecmascript)");
;
;
}),
"[project]/Desktop/whenisdue/web/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/whenisdue/web/app/admin/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "405d39960a80a5789360a1ff0a826d881331f3406b",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$admin$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyAndBroadcast"],
    "607aa4d1c63dccffc450db2b4fb0c0a1b9ce8ec3ad",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$admin$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteOccurrence"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$admin$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/Desktop/whenisdue/web/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => "[project]/Desktop/whenisdue/web/app/admin/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$admin$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/app/admin/actions.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=Desktop_whenisdue_web_71058854._.js.map