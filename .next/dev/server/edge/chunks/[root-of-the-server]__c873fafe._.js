(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__c873fafe._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/Desktop/whenisdue/web/lib/prisma.ts [app-edge-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$2f$default$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/@prisma/client/default.js [app-edge-route] (ecmascript)");
;
const prismaClientSingleton = ()=>{
    return new __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f40$prisma$2f$client$2f$default$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["PrismaClient"]().$extends({
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
"[project]/Desktop/whenisdue/web/app/[category]/[slug]/opengraph-image.tsx [app-edge-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "alt",
    ()=>alt,
    "contentType",
    ()=>contentType,
    "default",
    ()=>Image,
    "runtime",
    ()=>runtime,
    "size",
    ()=>size
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$react$2d$server$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/compiled/react/jsx-dev-runtime.react-server.js [app-edge-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$og$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/esm/api/og.js [app-edge-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$og$2f$image$2d$response$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/esm/server/og/image-response.js [app-edge-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/lib/prisma.ts [app-edge-route] (ecmascript)");
;
;
;
const runtime = 'edge';
const alt = 'WhenIsDue Countdown';
const size = {
    width: 1200,
    height: 630
};
const contentType = 'image/png';
// 1. Module-Scope Font Fetch (Reused across warm isolates)
const fontDataPromise = fetch(new URL('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf')).then((res)=>res.arrayBuffer());
async function Image({ params }) {
    const { slug } = await params;
    const event = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["prisma"].event.findUnique({
        where: {
            slug: slug.toLowerCase()
        },
        select: {
            title: true,
            category: true,
            dueAt: true
        }
    });
    if (!event) return new Response('Not Found', {
        status: 404
    });
    // 2. Bucket the State
    const daysRemaining = event.dueAt ? Math.max(0, Math.ceil((event.dueAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : "TBA";
    // 3. Grapheme-Safe Truncation (Prevents splitting emoji or CJK characters)
    const seg = new Intl.Segmenter('en', {
        granularity: 'grapheme'
    });
    // FIX: Using Array.from() instead of the spread operator (...) to satisfy TypeScript
    const graphemes = Array.from(seg.segment(event.title)).map((x)=>x.segment);
    const safeTitle = graphemes.length > 55 ? graphemes.slice(0, 52).join('') + '...' : event.title;
    const fontData = await fontDataPromise;
    const image = new __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$og$2f$image$2d$response$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["ImageResponse"](/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$react$2d$server$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            backgroundImage: 'radial-gradient(circle at 50% 50%, #10b98120 0%, #000 100%)',
            padding: '80px',
            fontFamily: '"Inter"'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$react$2d$server$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    fontSize: 24,
                    fontWeight: 900,
                    color: '#10b981',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    marginBottom: 30
                },
                children: event.category
            }, void 0, false, {
                fileName: "[project]/Desktop/whenisdue/web/app/[category]/[slug]/opengraph-image.tsx",
                lineNumber: 55,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$react$2d$server$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    fontSize: 76,
                    fontWeight: 900,
                    color: '#fff',
                    textAlign: 'center',
                    lineHeight: 1.1,
                    marginBottom: 60
                },
                children: safeTitle
            }, void 0, false, {
                fileName: "[project]/Desktop/whenisdue/web/app/[category]/[slug]/opengraph-image.tsx",
                lineNumber: 68,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$react$2d$server$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    backgroundColor: '#111',
                    border: '2px solid #222',
                    borderRadius: '32px',
                    padding: '30px 80px',
                    alignItems: 'center'
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$react$2d$server$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$react$2d$server$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            style: {
                                fontSize: 96,
                                fontWeight: 900,
                                color: '#10b981',
                                lineHeight: 1,
                                marginBottom: 10
                            },
                            children: daysRemaining
                        }, void 0, false, {
                            fileName: "[project]/Desktop/whenisdue/web/app/[category]/[slug]/opengraph-image.tsx",
                            lineNumber: 90,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$react$2d$server$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            style: {
                                fontSize: 24,
                                fontWeight: 700,
                                color: '#666',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em'
                            },
                            children: daysRemaining === 'TBA' ? 'Status' : 'Days Remaining'
                        }, void 0, false, {
                            fileName: "[project]/Desktop/whenisdue/web/app/[category]/[slug]/opengraph-image.tsx",
                            lineNumber: 93,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/whenisdue/web/app/[category]/[slug]/opengraph-image.tsx",
                    lineNumber: 89,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/whenisdue/web/app/[category]/[slug]/opengraph-image.tsx",
                lineNumber: 81,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$react$2d$server$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: 'absolute',
                    bottom: 60,
                    display: 'flex',
                    fontSize: 24,
                    fontWeight: 900,
                    color: '#444',
                    letterSpacing: '0.1em'
                },
                children: "WHENISDUE.COM"
            }, void 0, false, {
                fileName: "[project]/Desktop/whenisdue/web/app/[category]/[slug]/opengraph-image.tsx",
                lineNumber: 100,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/whenisdue/web/app/[category]/[slug]/opengraph-image.tsx",
        lineNumber: 40,
        columnNumber: 7
    }, this), {
        ...size,
        fonts: [
            {
                name: 'Inter',
                data: fontData,
                weight: 900,
                style: 'normal'
            }
        ]
    });
    // 4. Aggressive Edge Caching with SWR
    image.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    // Cache at the CDN for 1 hour, serve stale up to 24 hours while regenerating
    image.headers.set('CDN-Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return image;
}
}),
"[project]/Desktop/whenisdue/web/app/[category]/[slug]/opengraph-image--route-entry.js [app-edge-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/esm/api/server.js [app-edge-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f5b$category$5d2f5b$slug$5d2f$opengraph$2d$image$2e$tsx__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/app/[category]/[slug]/opengraph-image.tsx [app-edge-route] (ecmascript)");
;
;
if (typeof __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f5b$category$5d2f5b$slug$5d2f$opengraph$2d$image$2e$tsx__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["default"] !== 'function') {
    throw new Error('Default export is missing in "./opengraph-image.tsx"');
}
async function GET(_, ctx) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f5b$category$5d2f5b$slug$5d2f$opengraph$2d$image$2e$tsx__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["default"])({
        params: ctx.params
    });
}
;
}),
"[project]/Desktop/whenisdue/web/app/[category]/[slug]/opengraph-image--route-entry.js [app-edge-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f5b$category$5d2f5b$slug$5d2f$opengraph$2d$image$2d2d$route$2d$entry$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["GET"],
    "alt",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f5b$category$5d2f5b$slug$5d2f$opengraph$2d$image$2e$tsx__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["alt"],
    "contentType",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f5b$category$5d2f5b$slug$5d2f$opengraph$2d$image$2e$tsx__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["contentType"],
    "runtime",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f5b$category$5d2f5b$slug$5d2f$opengraph$2d$image$2e$tsx__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["runtime"],
    "size",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f5b$category$5d2f5b$slug$5d2f$opengraph$2d$image$2e$tsx__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["size"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f5b$category$5d2f5b$slug$5d2f$opengraph$2d$image$2d2d$route$2d$entry$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/app/[category]/[slug]/opengraph-image--route-entry.js [app-edge-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$app$2f5b$category$5d2f5b$slug$5d2f$opengraph$2d$image$2e$tsx__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/app/[category]/[slug]/opengraph-image.tsx [app-edge-route] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__c873fafe._.js.map