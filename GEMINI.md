# Gemini Code Assist Rules: WhenIsDue (High Fidelity)

## 1. STOP-OR-ASK PROTOCOL
- **Absolute Rule:** If a Prisma field or API is not present in the attached `@` context, you MUST stop and ask.
- **No Guessing:** If you encounter a Next.js 15 pattern you are unsure of, state: "I am uncertain of this Next.js 15 API. Please clarify.".
- **Validation:** Accuracy is prioritized over speed. Do not provide "placeholder" code.

## 2. CONTEXT CAPSULES (THE @ SYSTEM)
- **Explicit Loading:** Always use `@path/to/file` to pull in types and schemas.
- **Boundary Discipline:** - Server Components: No React hooks or browser APIs.
    - Client Components: Mark with `'use client'`. 
    - Database: Never import `@/lib/prisma` into a Client Component.

## 3. PRISMA & SCHEMA FIDELITY
- **Pre-Flight Check:** You must load `@web/prisma/schema.prisma` before generating any database logic.
- **Exact Matching:** Every field name must match the schema exactly. If `slugBase` is in the schema, do not use `slug`.

## 4. UI & DESIGN SYSTEM
- **Palette:** Use ONLY the `zinc` and `emerald` Tailwind system.
- **No Bloat:** Do not suggest new UI libraries (Radix, Shadcn, etc.) unless explicitly asked.
- **Persistence:** Do not delete existing comments, logs, or debug logic during diffs.