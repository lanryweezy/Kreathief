## 2026-06-09 - Replaced silent catch block in Serverless PDF Export
**Learning:** The Serverless API route in `services/exportService.ts` caught an error with a plain `console.error` instead of structured logger which drops context like requested color profiles and parameters.
**Action:** Add structured `log.error` to include `fileName, options, width, height` on PDF generation fallback
## 2026-06-10 - Replaced unstructured console errors across services and APIs
**Learning:** Found widespread use of `console.error` and `console.warn` in `store/slices/projectSlice.ts`, `services/geminiService.ts`, `api/fal.ts`, `api/gemini.ts`, and `services/exportService.ts`. This dropped critical context (like `projectId`, `prompt`, `action`, `endpoint`) during API errors, making production debugging difficult.
**Action:** Replaced unstructured console logging with `log.error` and `log.warn`, ensuring that all relevant local context variables are explicitly passed in the logging payload.
