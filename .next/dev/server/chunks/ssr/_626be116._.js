module.exports = [
"[project]/components/transparency/DataCatalogJsonLd.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DataCatalogJsonLd",
    ()=>DataCatalogJsonLd
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
/**
 * Phase 12 — DataCatalog Graph (JSON-LD)
 * ---------------------------------------------------------
 * Drop this component into your Next.js app and render it once
 * (e.g., in app/layout.tsx) so crawlers can discover:
 * - Stable @id nodes (Organization + DataCatalog + Dataset entities)
 * - isBasedOn / citation wiring to your transparency artifacts
 * - Links to /v1 catalog/feed/checkpoint endpoints
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$script$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/script.js [app-rsc] (ecmascript)");
;
;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "https://whenisdue.com";
function abs(pathname) {
    return `${BASE_URL}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}
function DataCatalogJsonLd() {
    const graph = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": abs("/#org"),
                "name": "WhenIsDue",
                "url": BASE_URL
            },
            {
                "@type": "DataCatalog",
                "@id": abs("/v1/registry/catalog#catalog"),
                "name": "WhenIsDue Deterministic Timing Registry",
                "description": "A deterministic, registry-backed catalog of schedules, guards, and transparency artifacts. All published data is anchored by build-fail provenance enforcement and public audit endpoints.",
                "url": abs("/v1/registry/catalog"),
                "publisher": {
                    "@id": abs("/#org")
                },
                "isBasedOn": [
                    abs("/transparency/publicMethodologyLedger.json"),
                    abs("/transparency/guardStatusManifest.json"),
                    abs("/transparency/provenanceExport.schema.json"),
                    abs("/transparency/TransparencyWhitepaper"),
                    abs("/.well-known/registry-checkpoint.json")
                ],
                "hasPart": [
                    {
                        "@id": abs("/v1/registry/feed#feed")
                    },
                    {
                        "@id": abs("/.well-known/registry-checkpoint.json#checkpoint")
                    }
                ]
            },
            {
                "@type": "DataFeed",
                "@id": abs("/v1/registry/feed#feed"),
                "name": "Registry Change Feed",
                "description": "A machine-readable feed of recent registry changes. Each entry references a diff record and the current checkpoint.",
                "url": abs("/v1/registry/feed"),
                "publisher": {
                    "@id": abs("/#org")
                },
                "isBasedOn": abs("/.well-known/registry-checkpoint.json")
            },
            {
                "@type": "DigitalDocument",
                "@id": abs("/.well-known/registry-checkpoint.json#checkpoint"),
                "name": "Registry Checkpoint (Version of Record)",
                "description": "A hashed checkpoint of current registry fingerprints.",
                "url": abs("/.well-known/registry-checkpoint.json"),
                "publisher": {
                    "@id": abs("/#org")
                }
            },
            {
                "@type": "Dataset",
                "@id": abs("/v1/registry/events#dataset"),
                "name": "events.json",
                "description": "Canonical schedule events registry used by the site.",
                "url": abs("/transparency/events.json"),
                "publisher": {
                    "@id": abs("/#org")
                },
                "isBasedOn": [
                    abs("/.well-known/registry-checkpoint.json"),
                    abs("/transparency/provenanceExport.schema.json")
                ]
            },
            {
                "@type": "Dataset",
                "@id": abs("/v1/registry/couplingSignalRegistry#dataset"),
                "name": "couplingSignalRegistry.json",
                "description": "Registry of categorical cross-program coupling explanations and anchors.",
                "url": abs("/transparency/couplingSignalRegistry.json"),
                "publisher": {
                    "@id": abs("/#org")
                },
                "isBasedOn": [
                    abs("/.well-known/registry-checkpoint.json")
                ]
            },
            {
                "@type": "Dataset",
                "@id": abs("/v1/registry/eligibilitySignalRegistry#dataset"),
                "name": "eligibilitySignalRegistry.json",
                "description": "Registry of eligibility expansion guards and deterministic windows.",
                "url": abs("/transparency/eligibilitySignalRegistry.json"),
                "publisher": {
                    "@id": abs("/#org")
                },
                "isBasedOn": [
                    abs("/.well-known/registry-checkpoint.json")
                ]
            },
            {
                "@type": "DigitalDocument",
                "@id": abs("/transparency/diffs/index.json#diff-index"),
                "name": "Registry Diff Index (MVP)",
                "description": "Chronological index of deterministic RFC 6901 diff records.",
                "url": abs("/transparency/diffs/index.json"),
                "publisher": {
                    "@id": abs("/#org")
                },
                "isBasedOn": abs("/.well-known/registry-checkpoint.json")
            }
        ]
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$script$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
        id: "whenisdue-datacatalog-graph",
        type: "application/ld+json",
        strategy: "afterInteractive",
        dangerouslySetInnerHTML: {
            __html: JSON.stringify(graph)
        }
    }, void 0, false, {
        fileName: "[project]/components/transparency/DataCatalogJsonLd.tsx",
        lineNumber: 110,
        columnNumber: 5
    }, this);
}
}),
"[project]/app/layout.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RootLayout,
    "metadata",
    ()=>metadata
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$transparency$2f$DataCatalogJsonLd$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/transparency/DataCatalogJsonLd.tsx [app-rsc] (ecmascript)");
;
;
;
const metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://whenisdue.com"),
    title: {
        default: "WhenIsDue",
        template: "%s | WhenIsDue"
    },
    description: "Simple countdown pages for upcoming events, releases, launches, and seasonal sales.",
    alternates: {
        canonical: "/"
    },
    robots: {
        index: true,
        follow: true
    }
};
function RootLayout({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("html", {
        lang: "en",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("body", {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$transparency$2f$DataCatalogJsonLd$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DataCatalogJsonLd"], {}, void 0, false, {
                    fileName: "[project]/app/layout.tsx",
                    lineNumber: 30,
                    columnNumber: 9
                }, this),
                children
            ]
        }, void 0, true, {
            fileName: "[project]/app/layout.tsx",
            lineNumber: 29,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/layout.tsx",
        lineNumber: 28,
        columnNumber: 1
    }, this);
}
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-rsc] (ecmascript)").vendored['react-rsc'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
"[project]/node_modules/next/dist/client/script.js [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__, module, exports) => {

// This file is generated by next-core EcmascriptClientReferenceModule.
const { createClientModuleProxy } = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
__turbopack_context__.n(createClientModuleProxy("[project]/node_modules/next/dist/client/script.js <module evaluation>"));
}),
"[project]/node_modules/next/dist/client/script.js [app-rsc] (client reference proxy)", ((__turbopack_context__, module, exports) => {

// This file is generated by next-core EcmascriptClientReferenceModule.
const { createClientModuleProxy } = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
__turbopack_context__.n(createClientModuleProxy("[project]/node_modules/next/dist/client/script.js"));
}),
"[project]/node_modules/next/dist/client/script.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$script$2e$js__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/script.js [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$script$2e$js__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/script.js [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$script$2e$js__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/node_modules/next/script.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/client/script.js [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=_626be116._.js.map