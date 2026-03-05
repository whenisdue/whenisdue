module.exports = [
"[project]/Desktop/whenisdue/web/app/favicon.ico.mjs { IMAGE => \"[project]/Desktop/whenisdue/web/app/favicon.ico (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/Desktop/whenisdue/web/app/favicon.ico.mjs { IMAGE => \"[project]/Desktop/whenisdue/web/app/favicon.ico (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript)"));
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/Desktop/whenisdue/web/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/Desktop/whenisdue/web/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AnswerBlock",
    ()=>AnswerBlock
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
;
function AnswerBlock({ binding }) {
    const isConflict = binding.scoreIdentityTuple.verdict === 'CONFLICT';
    // Strict normalizer to prevent AnswerText byte-mismatch errors
    const normalizedAnswerText = binding.answerText.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').replace(/ {2,}/g, ' ');
    // 1. Generate the exact FAQPage JSON-LD schema
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": binding.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": normalizedAnswerText
                }
            }
        ]
    };
    // 2. Render the Server-Side HTML
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        id: "wid-answerblock",
        className: "border border-gray-300 rounded-lg p-6 my-8 bg-white shadow-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("script", {
                type: "application/ld+json",
                "data-wid": "faq",
                dangerouslySetInnerHTML: {
                    __html: JSON.stringify(faqSchema)
                }
            }, void 0, false, {
                fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                "data-wid": "question",
                className: "text-2xl font-bold mb-4 text-gray-900",
                children: binding.question
            }, void 0, false, {
                fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, this),
            isConflict && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-red-100 text-red-800 font-bold px-4 py-3 mb-4 rounded border border-red-300 uppercase tracking-wide text-sm",
                children: "Conflict Active. Do Not Cite."
            }, void 0, false, {
                fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                lineNumber: 43,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                "data-wid": "answerText",
                className: "text-lg text-gray-800 whitespace-pre-wrap leading-relaxed mb-6",
                children: normalizedAnswerText
            }, void 0, false, {
                fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                lineNumber: 49,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-6 pt-4 border-t border-gray-100 text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-semibold block text-gray-900",
                                children: "Event Date:"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                                lineNumber: 56,
                                columnNumber: 11
                            }, this),
                            binding.eventTime.display,
                            " (",
                            binding.eventTime.timezone,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                        lineNumber: 55,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-semibold block text-gray-900",
                                children: "Status:"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                                lineNumber: 60,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: binding.status === 'CONFIRMED' ? 'text-green-700 font-medium' : 'text-amber-700 font-medium',
                                children: binding.status
                            }, void 0, false, {
                                fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                                lineNumber: 61,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                        lineNumber: 59,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-semibold block text-gray-900",
                                children: "Last Verified (UTC):"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                                lineNumber: 66,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("time", {
                                dateTime: binding.lastVerifiedUtc,
                                children: binding.lastVerifiedUtc
                            }, void 0, false, {
                                fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                                lineNumber: 67,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                        lineNumber: 65,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-semibold block text-gray-900",
                                children: "Trust Breakdown:"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                                lineNumber: 70,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: binding.refs.explainUrl,
                                className: "text-blue-600 hover:text-blue-800 underline",
                                children: "Verify Cryptographic Proof"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                                lineNumber: 71,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                        lineNumber: 69,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                lineNumber: 54,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("link", {
                rel: "whenisdue-ai-trust-summary",
                href: binding.refs.trustSummaryUrl
            }, void 0, false, {
                fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                lineNumber: 78,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("link", {
                rel: "whenisdue-ai-proof-bundle",
                href: binding.refs.proofBundleUrl
            }, void 0, false, {
                fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                lineNumber: 79,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("link", {
                rel: "whenisdue-trust-verdict",
                href: binding.refs.trustVerdictUrl
            }, void 0, false, {
                fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
                lineNumber: 80,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx",
        lineNumber: 29,
        columnNumber: 5
    }, this);
}
}),
"[project]/Desktop/whenisdue/web/app/geo-test/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>GeoTestPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$components$2f$geo$2f$AnswerBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/components/geo/AnswerBlock.tsx [app-rsc] (ecmascript)");
;
;
function GeoTestPage() {
    // This is the strict, deterministic binding object.
    // In production, this data is passed down from your database/CMS.
    const mockBinding = {
        version: "1.0.0",
        id: "snap-benefits-california-2026",
        origin: "https://whenisdue.com",
        canonicalUrl: "https://whenisdue.com/federal/snap-california",
        question: "When are SNAP benefits deposited in California?",
        answerText: "In California, CalFresh (SNAP) benefits are deposited onto EBT cards during the first 10 days of the month, based on the last digit of your case number.",
        answerTextSha256: "sha256:dummyhash1234567890abcdef1234567890abcdef1234567890abcdef12345",
        eventTime: {
            kind: "DATE_TIME",
            timezone: "PT",
            display: "First 10 days of every month",
            isoUtc: "2026-03-01T08:00:00Z"
        },
        status: "CONFIRMED",
        lastVerifiedUtc: "2026-03-03T00:00:00Z",
        scoreIdentityTuple: {
            verdict: "PASS",
            trustScore: 98,
            citeabilityScore: 95,
            tupleHash: "sha256:anothummyhash1234567890abcdef1234567890abcdef1234567890abcdef1"
        },
        refs: {
            trustSummaryUrl: "https://whenisdue.com/api/ai/trust-summary/snap-benefits-california-2026",
            proofBundleUrl: "https://whenisdue.com/api/ai/proof-bundle/snap-benefits-california-2026?profile=FAST&encoding=application/json",
            explainUrl: "https://whenisdue.com/api/ai/explain/snap-benefits-california-2026",
            trustVerdictUrl: "https://whenisdue.com/verify/trustVerdict/snap-benefits-california-2026.json"
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "max-w-4xl mx-auto p-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-3xl font-extrabold mb-6",
                children: "GEO Surface Test Page"
            }, void 0, false, {
                fileName: "[project]/Desktop/whenisdue/web/app/geo-test/page.tsx",
                lineNumber: 40,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mb-8 text-gray-600",
                children: "Below is the SSR Answer Block. If you inspect the DOM, you will see the invisible JSON-LD schema and the AI link tags bound perfectly to the visible text."
            }, void 0, false, {
                fileName: "[project]/Desktop/whenisdue/web/app/geo-test/page.tsx",
                lineNumber: 41,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$components$2f$geo$2f$AnswerBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AnswerBlock"], {
                binding: mockBinding
            }, void 0, false, {
                fileName: "[project]/Desktop/whenisdue/web/app/geo-test/page.tsx",
                lineNumber: 46,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/whenisdue/web/app/geo-test/page.tsx",
        lineNumber: 39,
        columnNumber: 5
    }, this);
}
}),
"[project]/Desktop/whenisdue/web/app/geo-test/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/Desktop/whenisdue/web/app/geo-test/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__17635163._.js.map