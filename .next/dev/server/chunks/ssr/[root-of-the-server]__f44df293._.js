module.exports = [
"[project]/Desktop/whenisdue/web/app/actions/subscribe.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"6010e7c3e53b661b9485eb900aefd8ee7a10551689":"subscribeToEvent"},"",""] */ __turbopack_context__.s([
    "subscribeToEvent",
    ()=>subscribeToEvent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/Desktop/whenisdue/web/node_modules/@prisma/client)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
// Singleton Prisma client for Serverless environments
const globalForPrisma = /*TURBOPACK member replacement*/ __turbopack_context__.g;
const prisma = globalForPrisma.prisma || new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]();
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = prisma;
async function subscribeToEvent(prevState, formData) {
    const email = formData.get('email');
    const topicKey = formData.get('topicKey');
    const turnstileToken = formData.get('cf-turnstile-response');
    // 1. Basic Validation
    if (!email || !email.includes('@')) {
        return {
            status: 'error',
            message: 'Please enter a valid email address.'
        };
    }
    // 2. Bot Protection (Turnstile Verification Mock)
    // In production, you would verify this token against Cloudflare's API
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        // 3. Database Upsert (Anonymous-first compatible)
        // Find or create the user identity
        const user = await prisma.user.upsert({
            where: {
                email
            },
            update: {},
            create: {
                email
            }
        });
        // 4. Create the Topic Subscription
        await prisma.userTopicSubscription.upsert({
            where: {
                userId_topicKey: {
                    userId: user.id,
                    topicKey: topicKey
                }
            },
            update: {
                wantsEmail: true
            },
            create: {
                userId: user.id,
                topicKey: topicKey,
                wantsEmail: true
            }
        });
        // 5. Trigger Resend API here for Double Opt-in (omitted for brevity)
        // await resend.emails.send({ ... })
        return {
            status: 'success',
            message: 'You are on the list! Watch your inbox.'
        };
    } catch (error) {
        console.error('Subscription error:', error);
        // Generic error to prevent leaking database state
        return {
            status: 'error',
            message: 'Could not subscribe right now. Please try again.'
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    subscribeToEvent
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(subscribeToEvent, "6010e7c3e53b661b9485eb900aefd8ee7a10551689", null);
}),
"[project]/Desktop/whenisdue/web/.next-internal/server/app/gaming/[slug]/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/whenisdue/web/app/actions/subscribe.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$actions$2f$subscribe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/app/actions/subscribe.ts [app-rsc] (ecmascript)");
;
}),
"[project]/Desktop/whenisdue/web/.next-internal/server/app/gaming/[slug]/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/whenisdue/web/app/actions/subscribe.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "6010e7c3e53b661b9485eb900aefd8ee7a10551689",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$actions$2f$subscribe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["subscribeToEvent"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f2e$next$2d$internal$2f$server$2f$app$2f$gaming$2f5b$slug$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$actions$2f$subscribe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/Desktop/whenisdue/web/.next-internal/server/app/gaming/[slug]/page/actions.js { ACTIONS_MODULE0 => "[project]/Desktop/whenisdue/web/app/actions/subscribe.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$actions$2f$subscribe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/app/actions/subscribe.ts [app-rsc] (ecmascript)");
}),
"[project]/Desktop/whenisdue/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/* eslint-disable import/no-extraneous-dependencies */ Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "registerServerReference", {
    enumerable: true,
    get: function() {
        return _server.registerServerReference;
    }
});
const _server = __turbopack_context__.r("[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)"); //# sourceMappingURL=server-reference.js.map
}),
"[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/Desktop/whenisdue/web/node_modules/@prisma/client)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client-4143f25833d82d12", () => require("@prisma/client-4143f25833d82d12"));

module.exports = mod;
}),
"[project]/Desktop/whenisdue/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// This function ensures that all the exported values are valid server actions,
// during the runtime. By definition all actions are required to be async
// functions, but here we can only check that they are functions.
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ensureServerEntryExports", {
    enumerable: true,
    get: function() {
        return ensureServerEntryExports;
    }
});
function ensureServerEntryExports(actions) {
    for(let i = 0; i < actions.length; i++){
        const action = actions[i];
        if (typeof action !== 'function') {
            throw Object.defineProperty(new Error(`A "use server" file can only export async functions, found ${typeof action}.\nRead more: https://nextjs.org/docs/messages/invalid-use-server-value`), "__NEXT_ERROR_CODE", {
                value: "E352",
                enumerable: false,
                configurable: true
            });
        }
    }
} //# sourceMappingURL=action-validate.js.map
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f44df293._.js.map