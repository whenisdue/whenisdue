module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

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
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/app/.well-known/whenisdue-trust.json/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "runtime",
    ()=>runtime
]);
// @ts-nocheck
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
;
const runtime = "nodejs";
function safeReadJson(absPath) {
    try {
        if (!__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(absPath)) return null;
        const raw = __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].readFileSync(absPath, "utf-8");
        const parsed = JSON.parse(raw);
        return parsed ?? null;
    } catch  {
        return null;
    }
}
function isoNowUtc() {
    return new Date().toISOString();
}
async function GET() {
    // 1) Prefer pre-built trust contract (CI-owned, signed, deterministic).
    const prebuiltPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), "public", ".well-known", "whenisdue-trust.json");
    const prebuilt = safeReadJson(prebuiltPath);
    if (prebuilt) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(prebuilt, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache, must-revalidate"
            }
        });
    }
    // 2) Fallback: synthesize from other public artifacts (best-effort).
    const originPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), "public", ".well-known", "whenisdue-origin.json");
    const checkpointPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), "public", ".well-known", "registry-checkpoint.json");
    const sthPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), "public", "transparency", "sth", "latest.json");
    const origin = safeReadJson(originPath) || {};
    const checkpoint = safeReadJson(checkpointPath) || {};
    const sth = safeReadJson(sthPath) || {};
    const issuer = typeof origin.iss === "string" ? origin.iss : "https://whenisdue.com";
    const did = "did:web:whenisdue.com";
    // Prefer transparency STH root hash; fall back to registry checkpoint rootHash.
    const rootHash = typeof sth.root_hash === "string" && sth.root_hash || typeof sth.rootHash === "string" && sth.rootHash || typeof checkpoint.rootHash === "string" && checkpoint.rootHash || null;
    // Prefer transparency STH tree size; fall back to checkpoint.treeSize.
    const treeSize = (Number.isFinite(sth.tree_size) ? sth.tree_size : null) ?? (Number.isFinite(sth.treeSize) ? sth.treeSize : null) ?? (Number.isFinite(checkpoint.treeSize) ? checkpoint.treeSize : null) ?? null;
    const timestamp = typeof sth.timestamp === "string" && sth.timestamp || typeof checkpoint.generatedAt === "string" && checkpoint.generatedAt || isoNowUtc();
    const witnesses = {
        dns: typeof origin.dnsWitness === "string" ? origin.dnsWitness : null,
        github: typeof origin.githubWitness === "string" ? origin.githubWitness : null
    };
    const fallbackProof = origin.proof && typeof origin.proof === "object" ? origin.proof : null;
    const synthesized = {
        context: `${issuer}/v1/trust-contract`,
        id: did,
        issuer,
        registryId: typeof origin.registryId === "string" ? origin.registryId : "urn:whenisdue:registry:global",
        version: typeof checkpoint.version_id === "string" ? checkpoint.version_id : typeof checkpoint.version === "string" ? checkpoint.version : "registry-current",
        sth: {
            tree_size: treeSize,
            root_hash: rootHash,
            timestamp
        },
        witnesses,
        discovery: {
            llms: `${issuer}/llms.txt`,
            transparency: `${issuer}/transparency`,
            origin: `${issuer}/.well-known/whenisdue-origin.json`
        },
        proof: fallbackProof || {
            type: "DataIntegrityProof",
            cryptosuite: "eddsa-jcs-2022",
            verificationMethod: `${did}#key-1`,
            proofValue: null
        }
    };
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(synthesized, {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, must-revalidate"
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__2ed44296._.js.map