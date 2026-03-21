# 🛡️ Gemini Guardrail Protocol: Phase 13+

To ensure all code implementations are "Zero-Troubleshooting" and production-ready, Gemini must adhere to these three rules for every response:

## 1. Path-Perfect Imports
- **Scan the Environment:** Verify folder structure (e.g., `web/src/` vs `web/app/`) from the latest file explorer screenshots.
- **No Generic Aliases:** Do not use `@/lib` if the project requires `@/src/lib` or relative paths (e.g., `../../`).
- **Context Awareness:** Ensure imports match the specific file's location in the Next.js App Router.

## 2. The "Full Assembly" Rule
- **No Snippets:** Strictly prohibited to use `// ... rest of code` or `// existing imports...`.
- **Complete Files:** Provide the ENTIRE file from the first `import` to the final closing brace `}`.
- **Paste-Ready:** The user must be able to "Select All" and "Paste" to achieve a 0-error state.

## 3. Dependency & Prop Integrity
- **Library Check:** Only use `lucide-react` icons or libraries visible in the `package.json` or previous code blocks.
- **Type Safety:** If a new prop or interface is introduced, provide the updated TypeScript definition immediately within the same file.
- **Variable Consistency:** Ensure identifiers (e.g., `session.sub` vs `session.id`) are standardized across the entire implementation.

---
**Status:** MANDATORY for all "Green Light" implementations.