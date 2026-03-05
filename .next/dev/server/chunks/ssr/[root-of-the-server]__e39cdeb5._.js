module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SeriesPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
// --- Cryptographic Helper for Web Push ---
// The browser's PushManager requires the VAPID public key to be converted into a Uint8Array.
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for(let i = 0; i < rawData.length; ++i){
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
const mockPageBinding = {
    seriesKey: "ssa-ssdi-payments",
    canonicalName: "Social Security Disability Insurance (SSDI) Payments",
    entityName: "Social Security Administration",
    generatedAtUtc: "2026-03-04T00:00:00Z",
    binding: {
        isCollapsed: false,
        scoreIdentityTuple: {
            verdict: "PASS",
            trustScore: 99,
            citeabilityScore: 98,
            tupleHash: "sha256:dummy"
        }
    },
    distributionBinding: {
        windowModel: "DAY_OF_YEAR",
        n: 24,
        p10: 3,
        p50: 3,
        p90: 4
    },
    latestRecordBinding: {
        id: "ssdi-payment-march-2026"
    },
    derivedClaims: [
        "Historically, SSDI payments occur on the 3rd of the month.",
        "Method: HISTORICAL_DISTRIBUTION_ONLY. Statistics summarize observed past occurrences."
    ],
    refs: {
        seriesUrl: "https://whenisdue.com/series/ssa-ssdi-payments"
    }
};
function SeriesPage({ params }) {
    const isPass = mockPageBinding.binding.scoreIdentityTuple?.verdict === "PASS";
    // State to manage button UI
    const [subStatus, setSubStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('idle');
    // --- The Core Web Push Subscription Logic ---
    const handleSubscribe = async ()=>{
        setSubStatus('loading');
        try {
            // 1. Check if the browser supports Service Workers and Web Push
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                alert('Web Push is not supported in this browser. Try Chrome or Safari.');
                setSubStatus('error');
                return;
            }
            // 2. Register the background listener (sw.js)
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;
            // 3. Grab the VAPID key from our .env.local file
            const vapidPublicKey = ("TURBOPACK compile-time value", "BJOn-I-W8u5T7QADc0l_z_vHmKeNZS7JROl9SfRrTjIvjzGu-p4gbH9WF7Jczwycmx9Exa41NQqGba_tHQ1Vm8Y");
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            // 4. Request permission & generate the cryptographic subscription
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });
            // 5. Send the encrypted routing data to our SQLite database via the API
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscription)
            });
            if (!response.ok) {
                throw new Error('Server rejected the subscription payload.');
            }
            setSubStatus('success');
            console.log("Successfully securely saved to SQLite Database!");
        } catch (error) {
            console.error('Subscription failed:', error);
            setSubStatus('error');
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "max-w-4xl mx-auto p-8 font-sans bg-black min-h-screen text-white",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "mb-10 border-b border-gray-800 pb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-4xl font-extrabold text-white mb-2",
                        children: mockPageBinding.canonicalName
                    }, void 0, false, {
                        fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                        lineNumber: 92,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-lg text-gray-300 mb-4 font-sans",
                        children: [
                            "Administered by the ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-semibold text-white",
                                children: mockPageBinding.entityName
                            }, void 0, false, {
                                fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                                lineNumber: 94,
                                columnNumber: 31
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                        lineNumber: 93,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: `px-3 py-1 text-sm font-bold rounded ${isPass ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100'}`,
                            children: [
                                "Trust Verdict: ",
                                mockPageBinding.binding.scoreIdentityTuple?.verdict
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                            lineNumber: 97,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                        lineNumber: 96,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                lineNumber: 91,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    backgroundColor: '#1e3a8a',
                    padding: '20px',
                    borderRadius: '10px',
                    marginBottom: '30px',
                    textAlign: 'center'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        style: {
                            color: 'white',
                            margin: '0 0 10px 0'
                        },
                        children: "Enable Lock-Screen Alerts"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                        lineNumber: 105,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            color: '#bfdbfe',
                            marginBottom: '20px'
                        },
                        children: "Get notified the moment a date is verified."
                    }, void 0, false, {
                        fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                        lineNumber: 106,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleSubscribe,
                        disabled: subStatus === 'loading' || subStatus === 'success',
                        style: {
                            backgroundColor: subStatus === 'success' ? '#10b981' : 'white',
                            color: subStatus === 'success' ? 'white' : '#1e3a8a',
                            padding: '10px 30px',
                            borderRadius: '50px',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: subStatus === 'success' ? 'default' : 'pointer',
                            transition: 'all 0.3s ease'
                        },
                        children: [
                            subStatus === 'idle' && "NOTIFY ME",
                            subStatus === 'loading' && "SECURING CONNECTION...",
                            subStatus === 'success' && "✓ SUBSCRIBED",
                            subStatus === 'error' && "ERROR - TRY AGAIN"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                        lineNumber: 108,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                lineNumber: 104,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-bold text-white mb-4",
                        children: "Verified Past Occurrences"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                        lineNumber: 130,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border border-gray-700 rounded-lg overflow-hidden bg-gray-900",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: "w-full text-left",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    className: "bg-gray-800 border-b border-gray-700 text-gray-100 text-xs uppercase tracking-wider",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "p-4",
                                                children: "Event Date"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                                                lineNumber: 135,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "p-4 text-right",
                                                children: "Action"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                                                lineNumber: 136,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                                        lineNumber: 134,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                                    lineNumber: 133,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: "border-b border-gray-800 hover:bg-gray-800 transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "p-4 text-gray-300 font-mono",
                                                children: "2026-03-03"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                                                lineNumber: 141,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "p-4 text-right",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "inline-block bg-blue-600 text-white text-[10px] font-black py-2 px-4 rounded uppercase tracking-widest",
                                                    children: "Verify Proof"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                                                    lineNumber: 143,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                                                lineNumber: 142,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                                        lineNumber: 140,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                                    lineNumber: 139,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                            lineNumber: 132,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                        lineNumber: 131,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
                lineNumber: 129,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/whenisdue/web/app/series/[seriesKey]/page.tsx",
        lineNumber: 90,
        columnNumber: 5
    }, this);
}
}),
"[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        if ("TURBOPACK compile-time truthy", 1) {
            if ("TURBOPACK compile-time truthy", 1) {
                module.exports = __turbopack_context__.r("[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)");
            } else //TURBOPACK unreachable
            ;
        } else //TURBOPACK unreachable
        ;
    }
} //# sourceMappingURL=module.compiled.js.map
}),
"[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
"[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].React; //# sourceMappingURL=react.js.map
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e39cdeb5._.js.map