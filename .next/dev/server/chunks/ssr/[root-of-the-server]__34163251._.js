module.exports = [
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
"[project]/Desktop/whenisdue/web/store/useOpsStore.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useOpsStore",
    ()=>useOpsStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/zustand/esm/middleware.mjs [app-ssr] (ecmascript)");
;
;
const useOpsStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["persist"])((set, get)=>({
        drafts: {},
        activeDraftKeys: {},
        getActiveDraft: (targetId, actionType)=>{
            const key = `${actionType}::${targetId}`;
            const draftId = get().activeDraftKeys[key];
            return draftId ? get().drafts[draftId] : undefined;
        },
        createDraft: (targetId, actionType, draftId, payload)=>{
            const key = `${actionType}::${targetId}`;
            if (get().activeDraftKeys[key]) {
                throw new Error("ACTIVE_DRAFT_COLLISION: An active draft already exists. It must be superseded.");
            }
            const newDraft = {
                draftId,
                targetId,
                actionType,
                revision: 1,
                status: "ACTIVE",
                payload,
                createdAtUtc: new Date().toISOString()
            };
            set((state)=>({
                    drafts: {
                        ...state.drafts,
                        [draftId]: newDraft
                    },
                    activeDraftKeys: {
                        ...state.activeDraftKeys,
                        [key]: draftId
                    }
                }));
        },
        supersedeDraft: (targetId, actionType, newDraftId, newPayload)=>{
            const key = `${actionType}::${targetId}`;
            const currentDraftId = get().activeDraftKeys[key];
            if (!currentDraftId) throw new Error("NO_ACTIVE_DRAFT");
            const currentDraft = get().drafts[currentDraftId];
            const newDraft = {
                draftId: newDraftId,
                targetId,
                actionType,
                revision: currentDraft.revision + 1,
                status: "ACTIVE",
                payload: newPayload,
                createdAtUtc: new Date().toISOString()
            };
            set((state)=>({
                    drafts: {
                        ...state.drafts,
                        [currentDraftId]: {
                            ...currentDraft,
                            status: "ARCHIVED"
                        },
                        [newDraftId]: newDraft
                    },
                    activeDraftKeys: {
                        ...state.activeDraftKeys,
                        [key]: newDraftId
                    }
                }));
        },
        cancelDraft: (draftId)=>{
            const draft = get().drafts[draftId];
            if (!draft) return;
            const key = `${draft.actionType}::${draft.targetId}`;
            const isActive = get().activeDraftKeys[key] === draftId;
            set((state)=>{
                const nextActiveKeys = {
                    ...state.activeDraftKeys
                };
                if (isActive) delete nextActiveKeys[key];
                return {
                    drafts: {
                        ...state.drafts,
                        [draftId]: {
                            ...draft,
                            status: "CANCELLED"
                        }
                    },
                    activeDraftKeys: nextActiveKeys
                };
            });
        }
    }), {
    name: 'whenisdue-ops-storage'
}));
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[project]/Desktop/whenisdue/web/lib/crypto/draft-hasher.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateDraftId",
    ()=>generateDraftId,
    "generateSnapshotHash",
    ()=>generateSnapshotHash
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$canonicalize$2f$lib$2f$canonicalize$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/canonicalize/lib/canonicalize.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$js$2d$sha256$2f$src$2f$sha256$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/js-sha256/src/sha256.js [app-ssr] (ecmascript)");
;
;
const generateDraftId = (draftData)=>{
    // canonicalize() guarantees consistent key ordering, no extra spaces, 
    // and safe number formatting across any browser/OS.
    const canonicalString = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$canonicalize$2f$lib$2f$canonicalize$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(draftData);
    if (typeof canonicalString !== 'string') {
        throw new Error("E_CANON_HASH_MISMATCH: Failed to canonicalize draft data");
    }
    const hashHex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$js$2d$sha256$2f$src$2f$sha256$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sha256"])(canonicalString);
    return `sha256:${hashHex.toLowerCase()}`;
};
const generateSnapshotHash = (signers)=>{
    // .slice() ensures we don't mutate the original array, then we sort lexicographically
    const sortedSigners = signers.slice().sort();
    const canonicalString = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$canonicalize$2f$lib$2f$canonicalize$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(sortedSigners);
    if (typeof canonicalString !== 'string') {
        throw new Error("E_CANON_HASH_MISMATCH: Failed to canonicalize signers snapshot");
    }
    const hashHex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$js$2d$sha256$2f$src$2f$sha256$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sha256"])(canonicalString);
    return `sha256:${hashHex.toLowerCase()}`;
};
}),
"[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>KeyRotationWorkspace
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$store$2f$useOpsStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/store/useOpsStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$crypto$2f$draft$2d$hasher$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/lib/crypto/draft-hasher.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$key$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Key$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/lucide-react/dist/esm/icons/key.js [app-ssr] (ecmascript) <export default as Key>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/lucide-react/dist/esm/icons/shield-alert.js [app-ssr] (ecmascript) <export default as ShieldAlert>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$braces$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileJson$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/lucide-react/dist/esm/icons/file-braces.js [app-ssr] (ecmascript) <export default as FileJson>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/lucide-react/dist/esm/icons/lock.js [app-ssr] (ecmascript) <export default as Lock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-ssr] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/lucide-react/dist/esm/icons/download.js [app-ssr] (ecmascript) <export default as Download>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$exclamation$2d$point$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileWarning$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/lucide-react/dist/esm/icons/file-exclamation-point.js [app-ssr] (ecmascript) <export default as FileWarning>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$terminal$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TerminalSquare$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/lucide-react/dist/esm/icons/square-terminal.js [app-ssr] (ecmascript) <export default as TerminalSquare>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__ = __turbopack_context__.i("[project]/Desktop/whenisdue/web/node_modules/lucide-react/dist/esm/icons/upload.js [app-ssr] (ecmascript) <export default as Upload>");
"use client";
;
;
;
;
;
;
function KeyRotationWorkspace() {
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useParams"])();
    const kid = params.kid; // The ID of the key being rotated
    const { getActiveDraft, createDraft, supersedeDraft } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$store$2f$useOpsStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useOpsStore"])();
    const activeDraft = getActiveDraft(kid, "KEY_ROTATION");
    const [isMounted, setIsMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [newKid, setNewKid] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [newPubKey, setNewPubKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [continuityType, setContinuityType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("CONTINUITY_PROOF");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setIsMounted(true);
    }, []);
    if (!isMounted) return null;
    const handleCreateDraft = ()=>{
        if (!newKid || !newPubKey) {
            alert("Validation Error: New Key ID and Public Key are required.");
            return;
        }
        const payload = {
            schemaVersion: "1.0",
            draftType: "KEY_ROTATION_EVENT",
            actionType: "KEY_ROTATION",
            policyVersion: "v1.0.0",
            revision: 1,
            riskClass: continuityType === "RECOVERY_ROTATION" ? "EMERGENCY" : "STANDARD",
            scope: {
                serviceId: "whenisdue.com/hub",
                keyPurpose: "HUB_SIGNING_KEY",
                keyId: kid
            },
            currentKey: {
                kid: kid,
                alg: "Ed25519"
            },
            newKey: {
                kid: newKid,
                publicKey: newPubKey,
                alg: "Ed25519"
            },
            continuity: {
                continuityType: continuityType,
                continuityProofRef: continuityType === "CONTINUITY_PROOF" ? "pending-upload" : undefined,
                recoveryJustificationRef: continuityType === "RECOVERY_ROTATION" ? "incident-123" : undefined
            },
            effective: {
                effectiveNotBeforeUtc: new Date(Date.now() + 86400000).toISOString(),
                recommendedGracePeriodHours: 48
            },
            requiredSignersSnapshot: [
                "did:web:whenisdue.com:operator-1",
                "did:web:whenisdue.com:operator-2"
            ],
            createdAtUtc: new Date().toISOString()
        };
        try {
            const draftId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$crypto$2f$draft$2d$hasher$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateDraftId"])(payload);
            createDraft(kid, "KEY_ROTATION", draftId, payload);
        } catch (err) {
            alert(`Gating Failure: ${err.message}`);
        }
    };
    const handleBumpRevision = ()=>{
        if (!activeDraft) return;
        const newPayload = {
            ...activeDraft.payload,
            revision: activeDraft.revision + 1,
            createdAtUtc: new Date().toISOString()
        };
        try {
            const newDraftId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$crypto$2f$draft$2d$hasher$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateDraftId"])(newPayload);
            supersedeDraft(kid, "KEY_ROTATION", newDraftId, newPayload);
        } catch (err) {
            alert(`Gating Failure: ${err.message}`);
        }
    };
    const trunc = (s)=>s ? `${s.slice(0, 16)}...${s.slice(-8)}` : "N/A";
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
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center text-xs font-bold text-amber-600 uppercase tracking-widest mb-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$key$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Key$3e$__["Key"], {
                                            size: 14,
                                            className: "mr-1"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                            lineNumber: 91,
                                            columnNumber: 15
                                        }, this),
                                        " Key Rotation Ceremony"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                    lineNumber: 90,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-2xl font-bold text-gray-900 mb-2",
                                    children: "Rotation Workspace"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                    lineNumber: 93,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-4 text-sm font-mono mt-2 text-gray-500",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "bg-gray-100 px-2 py-1 rounded border border-gray-200",
                                        children: [
                                            "Target KID: ",
                                            kid
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                        lineNumber: 95,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                    lineNumber: 94,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                            lineNumber: 89,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-xs font-mono bg-gray-900 text-green-400 px-3 py-2 rounded flex items-center shadow-inner",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$terminal$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TerminalSquare$3e$__["TerminalSquare"], {
                                    size: 14,
                                    className: "mr-2"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                    lineNumber: 99,
                                    columnNumber: 13
                                }, this),
                                " Sterile Mode: Active"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                            lineNumber: 98,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                    lineNumber: 88,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                lineNumber: 87,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "lg:col-span-4 space-y-6",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white border border-gray-200 rounded-xl p-6 shadow-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$exclamation$2d$point$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileWarning$3e$__["FileWarning"], {
                                            size: 16,
                                            className: "mr-2 text-blue-500"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                            lineNumber: 109,
                                            columnNumber: 15
                                        }, this),
                                        " Current Key Policy"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                    lineNumber: 108,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-4 font-mono text-xs",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "block text-gray-400 mb-1",
                                                    children: "Key Purpose"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 113,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "bg-blue-50 text-blue-800 font-bold px-2 py-1 rounded border border-blue-100",
                                                    children: "HUB_SIGNING_KEY"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 114,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                            lineNumber: 112,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "block text-gray-400 mb-1",
                                                    children: "Algorithm"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 117,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "bg-gray-100 p-2 rounded block border",
                                                    children: "Ed25519"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 118,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                            lineNumber: 116,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                    lineNumber: 111,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                            lineNumber: 107,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                        lineNumber: 106,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "lg:col-span-8 space-y-6",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white border border-gray-200 rounded-xl p-6 shadow-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-between items-center border-b border-gray-200 pb-4 mb-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$braces$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileJson$3e$__["FileJson"], {
                                                    size: 16,
                                                    className: "mr-2"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 129,
                                                    columnNumber: 17
                                                }, this),
                                                " Rotation Draft Builder"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                            lineNumber: 128,
                                            columnNumber: 15
                                        }, this),
                                        activeDraft && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center border border-amber-200",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__["Lock"], {
                                                    size: 12,
                                                    className: "mr-1"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 133,
                                                    columnNumber: 19
                                                }, this),
                                                " Active Draft Lock (Rev ",
                                                activeDraft.revision,
                                                ")"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                            lineNumber: 132,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                    lineNumber: 127,
                                    columnNumber: 13
                                }, this),
                                !activeDraft ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-200",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-bold text-gray-700 uppercase mb-2",
                                                    children: "Continuity Strategy"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 141,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                    className: "w-full p-2 border rounded font-mono text-sm",
                                                    value: continuityType,
                                                    onChange: (e)=>setContinuityType(e.target.value),
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: "CONTINUITY_PROOF",
                                                            children: "Standard (Old Key Signs New Key)"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                            lineNumber: 146,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: "RECOVERY_ROTATION",
                                                            children: "Emergency (Key Compromised / Lost)"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                            lineNumber: 147,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 142,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                            lineNumber: 140,
                                            columnNumber: 17
                                        }, this),
                                        continuityType === "RECOVERY_ROTATION" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-red-50 text-red-800 p-3 rounded border border-red-200 text-xs font-bold flex items-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__["ShieldAlert"], {
                                                    size: 14,
                                                    className: "mr-2"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 152,
                                                    columnNumber: 21
                                                }, this),
                                                "WARNING: Recovery rotations require elevated Custodian approval thresholds."
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                            lineNumber: 151,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-bold text-gray-700 uppercase mb-2",
                                                    children: "New Key ID (KID)"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 157,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    className: "w-full p-2 border rounded font-mono text-sm",
                                                    placeholder: "e.g. hub-key-v2",
                                                    value: newKid,
                                                    onChange: (e)=>setNewKid(e.target.value)
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 158,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                            lineNumber: 156,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-bold text-gray-700 uppercase mb-2",
                                                    children: "New Public Key (Hex/Base64)"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 161,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    className: "w-full p-2 border rounded font-mono text-sm",
                                                    placeholder: "Paste Ed25519 public key...",
                                                    value: newPubKey,
                                                    onChange: (e)=>setNewPubKey(e.target.value)
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 162,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                            lineNumber: 160,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: handleCreateDraft,
                                            className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition shadow-sm mt-4",
                                            children: "Initialize Rotation Draft"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                            lineNumber: 164,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                    lineNumber: 139,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `rounded-lg p-5 text-white shadow-inner ${activeDraft.payload.riskClass === "EMERGENCY" ? "bg-red-900" : "bg-gray-900"}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex justify-between items-center mb-4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-xs uppercase tracking-widest text-gray-400",
                                                            children: "Deterministic DraftId"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                            lineNumber: 173,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-xs font-mono bg-black text-white px-2 py-1 rounded",
                                                            children: [
                                                                activeDraft.payload.riskClass,
                                                                " CLASS"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                            lineNumber: 174,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 172,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-mono text-sm text-green-400 break-all bg-black p-3 rounded border border-gray-800",
                                                    children: activeDraft.draftId
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 176,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-xs font-mono",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center text-gray-400",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$key$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Key$3e$__["Key"], {
                                                                size: 14,
                                                                className: "mr-2"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                                lineNumber: 179,
                                                                columnNumber: 23
                                                            }, this),
                                                            " SnapshotHash: ",
                                                            trunc((0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$lib$2f$crypto$2f$draft$2d$hasher$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateSnapshotHash"])(activeDraft.payload.requiredSignersSnapshot))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                        lineNumber: 178,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 177,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                            lineNumber: 171,
                                            columnNumber: 17
                                        }, this),
                                        activeDraft.payload.continuity.continuityType === "CONTINUITY_PROOF" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-sm font-bold text-blue-900",
                                                            children: "Upload Continuity Proof"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                            lineNumber: 188,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-xs text-blue-700 font-mono mt-1",
                                                            children: [
                                                                "Required: Signature from ",
                                                                kid
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                            lineNumber: 189,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 187,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: "bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold flex items-center hover:bg-blue-700",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {
                                                            size: 14,
                                                            className: "mr-2"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                            lineNumber: 192,
                                                            columnNumber: 23
                                                        }, this),
                                                        " Import .cose"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 191,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                            lineNumber: 186,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xs font-bold text-gray-500 uppercase tracking-wider mb-2",
                                                    children: "Clean Room JSON Payload"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 199,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                                    className: "bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono text-xs overflow-x-auto text-gray-800 h-48",
                                                    children: JSON.stringify(activeDraft.payload, null, 2)
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 200,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                            lineNumber: 198,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex gap-4 border-t border-gray-200 pt-6",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: handleBumpRevision,
                                                    className: "flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-3 px-4 rounded transition flex justify-center items-center text-sm",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                                            size: 16,
                                                            className: "mr-2"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                            lineNumber: 208,
                                                            columnNumber: 21
                                                        }, this),
                                                        " Bump Revision"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 207,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: "flex-1 bg-blue-600 border border-blue-700 text-white hover:bg-blue-700 font-bold py-3 px-4 rounded transition flex justify-center items-center text-sm shadow-sm",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$whenisdue$2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
                                                            size: 16,
                                                            className: "mr-2"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                            lineNumber: 211,
                                                            columnNumber: 21
                                                        }, this),
                                                        " Export Proposal Bundle"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                                    lineNumber: 210,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                            lineNumber: 206,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                                    lineNumber: 169,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                            lineNumber: 126,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                        lineNumber: 125,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
                lineNumber: 104,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/whenisdue/web/app/ops/keys/[kid]/page.tsx",
        lineNumber: 86,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__34163251._.js.map