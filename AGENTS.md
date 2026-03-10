# Codex Agent Rules: WhenIsDue (High Fidelity)

## 1. STOP-OR-ASK PROTOCOL
- If a requested field or API isn’t in the referenced `@schema.prisma`, **STOP and ASK**.
- If a Next.js 15 feature or Tailwind class is ambiguous, ask: "Has this API changed in this version?"
- Being "helpful" by guessing is a failure. Accuracy > Speed.

## 2. CONTEXT CAPSULES & BOUNDARIES
- **Explicit Context:** Only use files explicitly referenced via `@`. If a required type or file is missing, prompt: "I need @path/to/file for context."
- **Next.js 15 Rules:** Pages/Layouts are Server Components by default. Do NOT add `'use client'` unless hooks are strictly required.
- **Security:** Data fetching and `.env` variables stay on the server. Never expose secrets to the client.

## 3. PRISMA & DATA INTEGRITY
- **Fidelity:** Always cross-check `@schema.prisma` before generating any `prisma.` call. 
- **No Hallucinations:** Do not invent fields. Use exactly what is in the schema.

## 4. UI & STYLE DISCIPLINE
- **Design System:** Use ONLY the `zinc` and `emerald` Tailwind palette. 
- **No Extra Bloat:** Do not introduce new CSS frameworks or external UI libraries.
- **Minimal Diffs:** Never delete existing comments, logs, or logic. Only append or modify the specific lines requested.