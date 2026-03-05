module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/Desktop/whenisdue/web/components/countdown/Countdown.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Countdown
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function toInt(value, fallback = 0) {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.trunc(n);
}
function formatPretty(dt) {
    try {
        return new Intl.DateTimeFormat(undefined, {
            weekday: "short",
            year: "numeric",
            month: "long",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }).format(dt);
    } catch  {
        return dt.toISOString();
    }
}
function plural(n, word) {
    return n === 1 ? word : `${word}s`;
}
function diffParts(nowMs, targetMs) {
    const raw = targetMs - nowMs;
    const isPast = raw <= 0;
    const abs = Math.abs(raw);
    const totalSeconds = Math.floor(abs / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor(totalSeconds % (24 * 3600) / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const seconds = totalSeconds % 60;
    return {
        isPast,
        totalMs: abs,
        days,
        hours,
        minutes,
        seconds
    };
}
function Countdown({ targetIso }) {
    // Heartbeat (drives all time calculations)
    const [nowMs, setNowMs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>Date.now());
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const id = window.setInterval(()=>setNowMs(Date.now()), 250);
        return ()=>window.clearInterval(id);
    }, []);
    const targetDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const dt = new Date(targetIso);
        return Number.isFinite(dt.getTime()) ? dt : null;
    }, [
        targetIso
    ]);
    const parts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!targetDate) return null;
        return diffParts(nowMs, targetDate.getTime());
    }, [
        nowMs,
        targetDate
    ]);
    if (!targetDate || !parts) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-[164px] flex flex-col justify-center",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-5xl font-semibold tracking-tight",
                    children: "—"
                }, void 0, false, {
                    fileName: "[project]/Desktop/whenisdue/web/components/countdown/Countdown.tsx",
                    lineNumber: 82,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-3 text-sm opacity-75",
                    children: "Computing…"
                }, void 0, false, {
                    fileName: "[project]/Desktop/whenisdue/web/components/countdown/Countdown.tsx",
                    lineNumber: 83,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Desktop/whenisdue/web/components/countdown/Countdown.tsx",
            lineNumber: 81,
            columnNumber: 7
        }, this);
    }
    const days = Number.isFinite(parts.days) ? toInt(parts.days, 0) : 0;
    const hours = Number.isFinite(parts.hours) ? toInt(parts.hours, 0) : 0;
    const minutes = Number.isFinite(parts.minutes) ? toInt(parts.minutes, 0) : 0;
    const seconds = Number.isFinite(parts.seconds) ? toInt(parts.seconds, 0) : 0;
    const safeDays = parts.isPast ? 0 : days;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-[164px] flex flex-col justify-center",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-6xl sm:text-7xl font-semibold tracking-tight",
                children: [
                    safeDays,
                    " ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "opacity-90",
                        children: plural(safeDays, "day")
                    }, void 0, false, {
                        fileName: "[project]/Desktop/whenisdue/web/components/countdown/Countdown.tsx",
                        lineNumber: 100,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/whenisdue/web/components/countdown/Countdown.tsx",
                lineNumber: 98,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4 text-2xl sm:text-3xl font-medium tracking-tight opacity-90 tabular-nums",
                "aria-label": `${hours} ${plural(hours, "hour")}, ${minutes} ${plural(minutes, "minute")}, ${seconds} ${plural(seconds, "second")}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "sm:hidden whitespace-nowrap",
                        children: [
                            hours,
                            "h ",
                            minutes,
                            "m ",
                            seconds,
                            "s"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/whenisdue/web/components/countdown/Countdown.tsx",
                        lineNumber: 112,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "hidden sm:inline",
                        children: [
                            hours,
                            " ",
                            plural(hours, "hour"),
                            ", ",
                            minutes,
                            " ",
                            plural(minutes, "minute"),
                            ", ",
                            seconds,
                            " ",
                            plural(seconds, "second")
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/whenisdue/web/components/countdown/Countdown.tsx",
                        lineNumber: 116,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/whenisdue/web/components/countdown/Countdown.tsx",
                lineNumber: 104,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-2 text-sm opacity-70",
                children: parts.isPast ? "This has started." : "Time remaining."
            }, void 0, false, {
                fileName: "[project]/Desktop/whenisdue/web/components/countdown/Countdown.tsx",
                lineNumber: 123,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2 text-sm opacity-80",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "opacity-60",
                            children: "Until"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/whenisdue/web/components/countdown/Countdown.tsx",
                            lineNumber: 128,
                            columnNumber: 11
                        }, this),
                        " ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "font-medium opacity-90",
                            children: formatPretty(targetDate)
                        }, void 0, false, {
                            fileName: "[project]/Desktop/whenisdue/web/components/countdown/Countdown.tsx",
                            lineNumber: 129,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/whenisdue/web/components/countdown/Countdown.tsx",
                    lineNumber: 127,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/whenisdue/web/components/countdown/Countdown.tsx",
                lineNumber: 126,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/whenisdue/web/components/countdown/Countdown.tsx",
        lineNumber: 96,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

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
"[project]/Desktop/whenisdue/web/components/federal/NextPaymentAnswerBlock.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>NextPaymentAnswerBlock
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/navigation.js [app-ssr] (ecmascript)");
"use client";
;
;
;
function NextPaymentAnswerBlock({ dates }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const [copied, setCopied] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [todayDateOnly, setTodayDateOnly] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const g = searchParams.get("g");
    const m = searchParams.get("m");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Determine user's local "today" without timezone hydration mismatch
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        setTodayDateOnly(`${year}-${month}-${day}`);
    }, []);
    const groups = Array.from(new Set(dates.map((d)=>d.group || "Unknown"))).sort((a, b)=>a === "SSI" ? -1 : b === "SSI" ? 1 : a.localeCompare(b));
    const months = Array.from(new Set(dates.map((d)=>d.month || "Unknown")));
    const filteredDates = dates.filter((d)=>{
        if (g && d.group !== g) return false;
        if (m && d.month !== m) return false;
        return true;
    });
    const upcomingDates = filteredDates.filter((d)=>todayDateOnly ? d.date >= todayDateOnly : true).sort((a, b)=>a.date.localeCompare(b.date));
    const nextPayment = upcomingDates.length > 0 ? upcomingDates[0] : null;
    const handleFilter = (key, val)=>{
        const params = new URLSearchParams(searchParams.toString());
        if (val) params.set(key, val);
        else params.delete(key);
        router.replace(`${pathname}?${params.toString()}`, {
            scroll: false
        });
    };
    const copyLink = ()=>{
        const url = `${window.location.origin}${pathname}?${searchParams.toString()}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(()=>setCopied(false), 2000);
    };
    if (!todayDateOnly) return null; // Avoid hydration flash
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2",
                        children: "Next Scheduled Payment"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/whenisdue/web/components/federal/NextPaymentAnswerBlock.tsx",
                        lineNumber: 68,
                        columnNumber: 9
                    }, this),
                    nextPayment ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-2xl font-bold text-slate-900",
                                children: new Date(nextPayment.date).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                    timeZone: "UTC"
                                })
                            }, void 0, false, {
                                fileName: "[project]/Desktop/whenisdue/web/components/federal/NextPaymentAnswerBlock.tsx",
                                lineNumber: 71,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-sm font-medium text-slate-600 mt-1",
                                children: [
                                    "Group: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-slate-800",
                                        children: nextPayment.group || "All"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/whenisdue/web/components/federal/NextPaymentAnswerBlock.tsx",
                                        lineNumber: 75,
                                        columnNumber: 22
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/whenisdue/web/components/federal/NextPaymentAnswerBlock.tsx",
                                lineNumber: 74,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/whenisdue/web/components/federal/NextPaymentAnswerBlock.tsx",
                        lineNumber: 70,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-lg font-medium text-slate-600",
                        children: filteredDates.length === 0 ? "No matching dates for this selection." : "No upcoming dates in this schedule."
                    }, void 0, false, {
                        fileName: "[project]/Desktop/whenisdue/web/components/federal/NextPaymentAnswerBlock.tsx",
                        lineNumber: 79,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/whenisdue/web/components/federal/NextPaymentAnswerBlock.tsx",
                lineNumber: 67,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full md:w-auto flex flex-col sm:flex-row gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        className: "bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5",
                        value: g || "",
                        onChange: (e)=>handleFilter("g", e.target.value),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "All Groups"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/whenisdue/web/components/federal/NextPaymentAnswerBlock.tsx",
                                lineNumber: 92,
                                columnNumber: 11
                            }, this),
                            groups.map((group)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: group,
                                    children: group
                                }, group, false, {
                                    fileName: "[project]/Desktop/whenisdue/web/components/federal/NextPaymentAnswerBlock.tsx",
                                    lineNumber: 93,
                                    columnNumber: 32
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/whenisdue/web/components/federal/NextPaymentAnswerBlock.tsx",
                        lineNumber: 87,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        className: "bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5",
                        value: m || "",
                        onChange: (e)=>handleFilter("m", e.target.value),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "All Months"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/whenisdue/web/components/federal/NextPaymentAnswerBlock.tsx",
                                lineNumber: 101,
                                columnNumber: 11
                            }, this),
                            months.map((month)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: month,
                                    children: month
                                }, month, false, {
                                    fileName: "[project]/Desktop/whenisdue/web/components/federal/NextPaymentAnswerBlock.tsx",
                                    lineNumber: 102,
                                    columnNumber: 32
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/whenisdue/web/components/federal/NextPaymentAnswerBlock.tsx",
                        lineNumber: 96,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: copyLink,
                        className: "bg-slate-900 text-white hover:bg-slate-800 text-sm font-medium rounded-lg px-4 py-2.5 transition-colors text-center",
                        children: copied ? "Copied!" : "Copy Link"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/whenisdue/web/components/federal/NextPaymentAnswerBlock.tsx",
                        lineNumber: 105,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/whenisdue/web/components/federal/NextPaymentAnswerBlock.tsx",
                lineNumber: 86,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/whenisdue/web/components/federal/NextPaymentAnswerBlock.tsx",
        lineNumber: 64,
        columnNumber: 5
    }, this);
}
}),
"[project]/Desktop/whenisdue/web/components/federal/SnapNextBenefitBlock.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SnapNextBenefitBlock
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/navigation.js [app-ssr] (ecmascript)");
"use client";
;
;
;
function SnapNextBenefitBlock({ dates, eventId }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const [copied, setCopied] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [todayDateOnly, setTodayDateOnly] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const g = searchParams.get("g");
    const m = searchParams.get("m");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Determine user's local "today" without timezone hydration mismatch
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        setTodayDateOnly(`${year}-${month}-${day}`);
    }, []);
    // Filter groups dynamically based on selected month (handles CT rule switch automatically)
    const availableDatesForMonth = m ? dates.filter((d)=>d.month === m) : dates;
    const groups = Array.from(new Set(availableDatesForMonth.map((d)=>d.group || "Unknown"))).sort((a, b)=>a.localeCompare(b));
    const months = Array.from(new Set(dates.map((d)=>d.month || "Unknown")));
    const filteredDates = dates.filter((d)=>{
        if (g && d.group !== g) return false;
        if (m && d.month !== m) return false;
        return true;
    });
    const upcomingDates = filteredDates.filter((d)=>todayDateOnly ? d.date >= todayDateOnly : true).sort((a, b)=>a.date.localeCompare(b.date));
    const nextPayment = upcomingDates.length > 0 ? upcomingDates[0] : null;
    const handleFilter = (key, val)=>{
        const params = new URLSearchParams(searchParams.toString());
        if (val) params.set(key, val);
        else params.delete(key);
        // If month changes, and the current group isn't valid for the new month (e.g., CT), clear group
        if (key === 'm') {
            const validGroupsForNewMonth = new Set(dates.filter((d)=>d.month === val || !val).map((d)=>d.group));
            if (g && !validGroupsForNewMonth.has(g)) {
                params.delete('g');
            }
        }
        router.replace(`${pathname}?${params.toString()}`, {
            scroll: false
        });
    };
    const copyLink = ()=>{
        const url = `${window.location.origin}${pathname}?${searchParams.toString()}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(()=>setCopied(false), 2000);
    };
    if (!todayDateOnly) return null; // Avoid hydration flash
    // Determine state label
    let stateLabel = "SNAP";
    if (eventId?.includes("tx-")) stateLabel = "TX";
    if (eventId?.includes("ca-")) stateLabel = "CA";
    if (eventId?.includes("ct-")) stateLabel = "CT";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2",
                        children: "Next Benefit Availability Date"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/whenisdue/web/components/federal/SnapNextBenefitBlock.tsx",
                        lineNumber: 85,
                        columnNumber: 9
                    }, this),
                    nextPayment ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-2xl font-bold text-slate-900",
                                children: new Date(nextPayment.date).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                    timeZone: "UTC"
                                })
                            }, void 0, false, {
                                fileName: "[project]/Desktop/whenisdue/web/components/federal/SnapNextBenefitBlock.tsx",
                                lineNumber: 88,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-sm font-medium text-slate-600 mt-1",
                                children: [
                                    "State: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-slate-800 mr-2",
                                        children: stateLabel
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/whenisdue/web/components/federal/SnapNextBenefitBlock.tsx",
                                        lineNumber: 92,
                                        columnNumber: 22
                                    }, this),
                                    "Group: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-slate-800",
                                        children: nextPayment.group?.replace(/^(TX SNAP |CA CalFresh |CT SNAP )/i, '') || "All"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/whenisdue/web/components/federal/SnapNextBenefitBlock.tsx",
                                        lineNumber: 93,
                                        columnNumber: 22
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/whenisdue/web/components/federal/SnapNextBenefitBlock.tsx",
                                lineNumber: 91,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/whenisdue/web/components/federal/SnapNextBenefitBlock.tsx",
                        lineNumber: 87,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-lg font-medium text-slate-600",
                        children: filteredDates.length === 0 ? "No matching dates for this selection." : "No upcoming dates in this schedule."
                    }, void 0, false, {
                        fileName: "[project]/Desktop/whenisdue/web/components/federal/SnapNextBenefitBlock.tsx",
                        lineNumber: 97,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/whenisdue/web/components/federal/SnapNextBenefitBlock.tsx",
                lineNumber: 84,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full md:w-auto flex flex-col sm:flex-row gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        className: "bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 max-w-[200px]",
                        value: g || "",
                        onChange: (e)=>handleFilter("g", e.target.value),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "All Groups"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/whenisdue/web/components/federal/SnapNextBenefitBlock.tsx",
                                lineNumber: 110,
                                columnNumber: 11
                            }, this),
                            groups.map((group)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: group,
                                    children: group.replace(/^(TX SNAP |CA CalFresh |CT SNAP )/i, '')
                                }, group, false, {
                                    fileName: "[project]/Desktop/whenisdue/web/components/federal/SnapNextBenefitBlock.tsx",
                                    lineNumber: 111,
                                    columnNumber: 32
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/whenisdue/web/components/federal/SnapNextBenefitBlock.tsx",
                        lineNumber: 105,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        className: "bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5",
                        value: m || "",
                        onChange: (e)=>handleFilter("m", e.target.value),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "All Months"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/whenisdue/web/components/federal/SnapNextBenefitBlock.tsx",
                                lineNumber: 119,
                                columnNumber: 11
                            }, this),
                            months.map((month)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: month,
                                    children: month
                                }, month, false, {
                                    fileName: "[project]/Desktop/whenisdue/web/components/federal/SnapNextBenefitBlock.tsx",
                                    lineNumber: 120,
                                    columnNumber: 32
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/whenisdue/web/components/federal/SnapNextBenefitBlock.tsx",
                        lineNumber: 114,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: copyLink,
                        className: "bg-slate-900 text-white hover:bg-slate-800 text-sm font-medium rounded-lg px-4 py-2.5 transition-colors text-center",
                        children: copied ? "Copied!" : "Copy Link"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/whenisdue/web/components/federal/SnapNextBenefitBlock.tsx",
                        lineNumber: 123,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/whenisdue/web/components/federal/SnapNextBenefitBlock.tsx",
                lineNumber: 104,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/whenisdue/web/components/federal/SnapNextBenefitBlock.tsx",
        lineNumber: 81,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f2927686._.js.map