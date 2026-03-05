(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__f2b15f93._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
;
function middleware(req) {
    const { pathname, origin } = req.nextUrl;
    const res = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    // Always expose trust manifest (lightweight, safe for all pages)
    res.headers.append("Link", `<${origin}/.well-known/whenisdue-trust.json>; rel="describedby"; type="application/json"`);
    const pathParts = pathname.split("/").filter(Boolean);
    // Detect tracker pages which use the /[category]/[slug] pattern
    if (pathParts.length === 2) {
        const slug = pathParts[1];
        // Machine mirror for tracker page
        const mirrorUrl = `${origin}/v1/api/tracker/${slug}.json`;
        res.headers.append("Link", `<${mirrorUrl}>; rel="alternate"; type="application/json"`);
    }
    return res;
}
const config = {
    matcher: [
        /*
     * Apply to all non-static routes except:
     * - /_next
     * - /api
     * - static assets (.json, .txt, .png, etc.)
     */ "/((?!_next|api|.*\\..*).*)"
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__f2b15f93._.js.map