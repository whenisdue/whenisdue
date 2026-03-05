module.exports = [
"[project]/Desktop/whenisdue/web/app/verify/conflicts/useConflictsData.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useConflictDetail",
    ()=>useConflictDetail,
    "useConflictsDirectory",
    ()=>useConflictsDirectory
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
;
function useConflictsDirectory() {
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        kind: "LOADING",
        step: "FETCH_INDEX"
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let isMounted = true;
        const load = async ()=>{
            const reasons = [];
            let indexData = null;
            let quarantineData = null;
            try {
                setState({
                    kind: "LOADING",
                    step: "FETCH_INDEX"
                });
                try {
                    const res = await fetch("/integrity/conflicts/index.json", {
                        cache: "no-store"
                    });
                    if (res.ok) indexData = await res.json();
                    else reasons.push({
                        code: "CONFLICT_INDEX_UNAVAILABLE",
                        detail: `HTTP ${res.status}`
                    });
                } catch (e) {
                    reasons.push({
                        code: "CONFLICT_INDEX_UNAVAILABLE"
                    });
                }
                setState({
                    kind: "LOADING",
                    step: "FETCH_QUARANTINE"
                });
                try {
                    const qRes = await fetch("/integrity/conflicts/quarantine.json", {
                        cache: "no-store"
                    });
                    if (qRes.ok) quarantineData = await qRes.json();
                    else reasons.push({
                        code: "QUARANTINE_UNAVAILABLE",
                        detail: `HTTP ${qRes.status}`
                    });
                } catch (e) {
                    reasons.push({
                        code: "QUARANTINE_UNAVAILABLE"
                    });
                }
                setState({
                    kind: "LOADING",
                    step: "COMPUTE"
                });
                // Parse Table
                const rawConflicts = Array.isArray(indexData?.conflicts) ? indexData.conflicts : [];
                const table = rawConflicts.map((c)=>({
                        conflictId: c.conflictId || "UNKNOWN",
                        conflictType: c.conflictType || "UNKNOWN",
                        severity: c.severity || "RED",
                        detectedAtUtc: c.detectedAtUtc,
                        detectedBy: c.detectedBy,
                        logId: c.logId,
                        href: `/verify/conflicts/${c.conflictId}`
                    }));
                // Deterministic Sort: RED first, then date desc, then ID asc
                table.sort((a, b)=>{
                    if (a.severity !== b.severity) return a.severity === "RED" ? -1 : 1;
                    const dA = a.detectedAtUtc || "";
                    const dB = b.detectedAtUtc || "";
                    if (dA !== dB) return dB.localeCompare(dA);
                    return a.conflictId.localeCompare(b.conflictId);
                });
                // Compute Banner
                const activeRedCount = table.filter((c)=>c.severity === "RED").length;
                const activeAmberCount = table.filter((c)=>c.severity === "AMBER").length;
                const qRed = quarantineData?.global?.activeRedConflict === true;
                const banner = {
                    light: activeRedCount > 0 || qRed ? "RED" : activeAmberCount > 0 ? "AMBER" : "GREEN",
                    activeRedCount,
                    activeAmberCount,
                    updatedAtUtc: indexData?.updatedAtUtc || new Date().toISOString(),
                    message: activeRedCount > 0 || qRed ? "CRITICAL: Active RED conflicts detected." : "No active critical conflicts."
                };
                if (isMounted) setState({
                    kind: "READY",
                    banner,
                    table,
                    quarantine: quarantineData,
                    reasons
                });
            } catch (err) {
                if (isMounted) setState({
                    kind: "FAILED",
                    banner: {
                        light: "AMBER",
                        activeRedCount: 0,
                        activeAmberCount: 0,
                        message: "Failed to load directory."
                    },
                    reasons,
                    error: {
                        code: "UNKNOWN",
                        message: err.message
                    }
                });
            }
        };
        load();
        return ()=>{
            isMounted = false;
        };
    }, []);
    return state;
}
function useConflictDetail(conflictId) {
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        kind: "LOADING",
        step: "FETCH_PROOF"
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let isMounted = true;
        const load = async ()=>{
            const reasons = [];
            let proof = null;
            let quarantine = null;
            try {
                setState({
                    kind: "LOADING",
                    step: "FETCH_PROOF"
                });
                const res = await fetch(`/integrity/conflicts/${conflictId}.json`, {
                    cache: "no-store"
                });
                if (!res.ok) {
                    if (isMounted) setState({
                        kind: "FAILED",
                        conflictId,
                        reasons: [
                            {
                                code: "CONFLICT_PROOF_UNAVAILABLE"
                            }
                        ],
                        error: {
                            code: "404",
                            message: "Proof not found"
                        }
                    });
                    return;
                }
                proof = await res.json();
                setState({
                    kind: "LOADING",
                    step: "FETCH_QUARANTINE"
                });
                try {
                    const qRes = await fetch("/integrity/conflicts/quarantine.json", {
                        cache: "no-store"
                    });
                    if (qRes.ok) quarantine = await qRes.json();
                } catch (e) {
                    reasons.push({
                        code: "QUARANTINE_UNAVAILABLE"
                    });
                }
                // Compute Verdict
                const isRed = proof.severity === "RED" || proof.conflictType !== "UNKNOWN";
                const verdict = {
                    severity: isRed ? "RED" : "AMBER",
                    light: isRed ? "RED" : "AMBER",
                    label: "VALIDATED_CONFLICT",
                    conflictType: proof.conflictType || "UNKNOWN",
                    canonicalConflictHash: proof.canonicalConflictHash,
                    collapseRuleApplies: isRed,
                    message: isRed ? "Active RED conflict: citeability collapses to 0." : "Indeterminate conflict state."
                };
                // Compute Compare
                const compare = {
                    sthA: {
                        treeSize: proof.sthA?.treeSize,
                        rootHash: proof.sthA?.rootHash,
                        signature: proof.sthA?.signature,
                        signatureStatus: "UNVERIFIED"
                    },
                    sthB: {
                        treeSize: proof.sthB?.treeSize,
                        rootHash: proof.sthB?.rootHash,
                        signature: proof.sthB?.signature,
                        signatureStatus: "UNVERIFIED"
                    },
                    highlights: [],
                    divergenceRule: proof.conflictType === "EQUIVOCATION" ? "SAME_SIZE_DIFF_ROOT" : proof.conflictType === "ROLLBACK" ? "ROLLBACK" : "UNKNOWN"
                };
                if (compare.sthA.treeSize === compare.sthB.treeSize && compare.sthA.rootHash !== compare.sthB.rootHash) {
                    compare.highlights.push({
                        field: "rootHash",
                        note: "Root hashes diverge at identical tree size."
                    });
                }
                const impact = {
                    quarantinedMirrors: quarantine?.quarantine?.mirrors ? Object.keys(quarantine.quarantine.mirrors) : [],
                    quorumInvalidated: verdict.collapseRuleApplies,
                    impactNotes: [
                        verdict.collapseRuleApplies ? "Quorum globally invalidated." : "Quorum remains active."
                    ]
                };
                const exportData = {
                    proofUrl: `/integrity/conflicts/${conflictId}.json`,
                    offlineSteps: [
                        "Download conflictProof.json",
                        "Extract STH-A and STH-B",
                        "Verify signatures using network public key",
                        "Compute canonical conflict hash to verify match"
                    ]
                };
                if (isMounted) setState({
                    kind: "READY",
                    conflictId,
                    verdict,
                    compare,
                    impact,
                    export: exportData,
                    reasons,
                    raw: {
                        conflictProof: proof,
                        quarantine
                    }
                });
            } catch (err) {
                if (isMounted) setState({
                    kind: "FAILED",
                    conflictId,
                    reasons,
                    error: {
                        code: "ERR",
                        message: err.message
                    }
                });
            }
        };
        load();
        return ()=>{
            isMounted = false;
        };
    }, [
        conflictId
    ]);
    return state;
}
}),
"[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ConflictsDirectoryPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$verify$2f$conflicts$2f$useConflictsData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/app/verify/conflicts/useConflictsData.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-ssr] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/lucide-react/dist/esm/icons/shield-alert.js [app-ssr] (ecmascript) <export default as ShieldAlert>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/lucide-react/dist/esm/icons/activity.js [app-ssr] (ecmascript) <export default as Activity>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$braces$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileJson$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/lucide-react/dist/esm/icons/file-braces.js [app-ssr] (ecmascript) <export default as FileJson>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rss$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Rss$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/lucide-react/dist/esm/icons/rss.js [app-ssr] (ecmascript) <export default as Rss>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
"use client";
;
;
;
;
function ConflictsDirectoryPage() {
    const state = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f$verify$2f$conflicts$2f$useConflictsData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useConflictsDirectory"])();
    if (state.kind === "LOADING") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-8 text-center font-mono text-gray-500 animate-pulse",
        children: [
            "Loading Directory... (",
            state.step,
            ")"
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
        lineNumber: 10,
        columnNumber: 40
    }, this);
    if (state.kind === "FAILED") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-8 text-red-500 font-bold text-center",
        children: [
            "Failed to load: ",
            state.error.message
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
        lineNumber: 11,
        columnNumber: 39
    }, this);
    const { banner, table, quarantine } = state;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gray-50 text-gray-900 pb-12 font-sans",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white border-b border-gray-200 pt-8 pb-6 px-6 mb-8",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-6xl mx-auto flex justify-between items-end",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-2xl font-bold text-gray-900 mb-2 flex items-center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                                            className: "mr-3 text-red-500"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                            lineNumber: 21,
                                            columnNumber: 15
                                        }, this),
                                        " Integrity Conflicts"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                    lineNumber: 20,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-gray-500",
                                    children: "Public registry of active divergence, rollbacks, and equivocations."
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                    lineNumber: 23,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                            lineNumber: 19,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-4 text-xs font-mono",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: "/integrity/conflicts/index.json",
                                    target: "_blank",
                                    className: "flex items-center text-blue-600 hover:underline",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$braces$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileJson$3e$__["FileJson"], {
                                            size: 14,
                                            className: "mr-1"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                            lineNumber: 26,
                                            columnNumber: 131
                                        }, this),
                                        " index.json"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                    lineNumber: 26,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: "/integrity/conflicts/feed.xml",
                                    target: "_blank",
                                    className: "flex items-center text-orange-500 hover:underline",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rss$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Rss$3e$__["Rss"], {
                                            size: 14,
                                            className: "mr-1"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                            lineNumber: 27,
                                            columnNumber: 131
                                        }, this),
                                        " RSS Feed"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                    lineNumber: 27,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                            lineNumber: 25,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                    lineNumber: 18,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                lineNumber: 17,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-6xl mx-auto px-4 space-y-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `p-4 rounded-lg border flex items-center justify-between text-white shadow-sm ${banner.light === "RED" ? "bg-red-600 border-red-700" : banner.light === "AMBER" ? "bg-amber-500 border-amber-600" : "bg-green-600 border-green-700"}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-3",
                                children: [
                                    banner.light === "GREEN" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__["Activity"], {
                                        size: 24
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                        lineNumber: 38,
                                        columnNumber: 41
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__["ShieldAlert"], {
                                        size: 24
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                        lineNumber: 38,
                                        columnNumber: 66
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "font-bold text-lg",
                                                children: banner.message
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                lineNumber: 40,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-xs opacity-80 font-mono mt-1",
                                                children: [
                                                    "UTC: ",
                                                    banner.updatedAtUtc
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                lineNumber: 41,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                        lineNumber: 39,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                lineNumber: 37,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-6 text-center font-mono",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-2xl font-black",
                                                children: banner.activeRedCount
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                lineNumber: 45,
                                                columnNumber: 18
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-xs uppercase opacity-80",
                                                children: "RED"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                lineNumber: 45,
                                                columnNumber: 84
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                        lineNumber: 45,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-2xl font-black",
                                                children: banner.activeAmberCount
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                lineNumber: 46,
                                                columnNumber: 18
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-xs uppercase opacity-80",
                                                children: "AMBER"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                lineNumber: 46,
                                                columnNumber: 86
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                        lineNumber: 46,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                lineNumber: 44,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-4 border-b border-gray-200 bg-gray-50",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-sm font-bold text-gray-700 uppercase tracking-wider",
                                    children: "Active Conflict Proofs"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                    lineNumber: 53,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                lineNumber: 52,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                className: "w-full text-left text-sm font-mono",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                        className: "bg-gray-100 text-gray-500 text-xs border-b border-gray-200",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "p-4",
                                                    children: "Severity"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                    lineNumber: 57,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "p-4",
                                                    children: "Type"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                    lineNumber: 57,
                                                    columnNumber: 52
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "p-4",
                                                    children: "Conflict ID"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                    lineNumber: 57,
                                                    columnNumber: 81
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "p-4",
                                                    children: "Detected (UTC)"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                    lineNumber: 57,
                                                    columnNumber: 117
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "p-4",
                                                    children: "Action"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                    lineNumber: 57,
                                                    columnNumber: 156
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                            lineNumber: 57,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                        lineNumber: 56,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                        className: "divide-y divide-gray-100",
                                        children: table.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                colSpan: 5,
                                                className: "p-8 text-center text-gray-500 italic",
                                                children: "No active conflicts."
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                lineNumber: 61,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                            lineNumber: 61,
                                            columnNumber: 17
                                        }, this) : table.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                className: "hover:bg-gray-50 transition",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "p-4",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `px-2 py-1 rounded text-xs font-bold ${c.severity === "RED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`,
                                                            children: c.severity
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                            lineNumber: 65,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                        lineNumber: 64,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "p-4 font-bold text-gray-700",
                                                        children: c.conflictType
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                        lineNumber: 69,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "p-4 text-gray-500",
                                                        children: [
                                                            c.conflictId.slice(0, 18),
                                                            "..."
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                        lineNumber: 70,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "p-4 text-gray-500",
                                                        children: c.detectedAtUtc
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                        lineNumber: 71,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "p-4",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                            href: c.href,
                                                            className: "text-blue-600 hover:underline font-bold",
                                                            children: "Inspect →"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                            lineNumber: 73,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                        lineNumber: 72,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, c.conflictId, true, {
                                                fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                                lineNumber: 63,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                        lineNumber: 59,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                                lineNumber: 55,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                        lineNumber: 51,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/whenisdue/web/app/verify/conflicts/page.tsx",
        lineNumber: 16,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=Desktop_whenisdue_web_app_verify_conflicts_96bbb5f4._.js.map