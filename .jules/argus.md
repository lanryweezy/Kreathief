## 2026-06-09 - Replaced silent catch block in Serverless PDF Export

**Learning:** The Serverless API route in `services/exportService.ts` caught an error with a plain `console.error` instead of structured logger which drops context like requested color profiles and parameters.
**Action:** Add structured `log.error` to include `fileName, options, width, height` on PDF generation fallback

## 2026-06-10 - Replaced unstructured console errors across services and APIs

**Learning:** Found widespread use of `console.error` and `console.warn` in `store/slices/projectSlice.ts`, `services/geminiService.ts`, `api/fal.ts`, `api/gemini.ts`, and `services/exportService.ts`. This dropped critical context (like `projectId`, `prompt`, `action`, `endpoint`) during API errors, making production debugging difficult.
**Action:** Replaced unstructured console logging with `log.error` and `log.warn`, ensuring that all relevant local context variables are explicitly passed in the logging payload.

## 2026-06-11 - Replaced unstructured console.error in export-cmyk API

**Learning:** The CMYK export API route was using a generic `console.error` which swallowed request parameters like URL and bleed size, hiding the actual data causing conversion errors. Using the structured logger `log.error` with the payload fields ensures these errors are visible and debuggable in production.
**Action:** Replaced unstructured console error with `log.error` and declared payload variables outside the try block to preserve them in the error context.

## 2026-06-12 - Replaced unstructured console errors across Third-party APIs

**Learning:** The Third-party proxy API routes (`api/freepik.ts`, `api/iconscout.ts`, `api/streamline.ts`, `api/unsplash.ts`, `api/vecteezy.ts`) caught errors using a plain `console.error('API Route Error:', error)` that omitted context about the specific query URL failing, preventing proper root-cause analysis during production failures.
**Action:** Replaced these unstructured `console.error` calls with `log.error('API Route Error', error, { url: req.url });`, passing the `req.url` to the logging context payload to illuminate which endpoint queries are causing server faults.

## 2026-06-13 - Replaced unstructured console errors across components

**Learning:** Found widespread use of `console.error` in various components (`CommandPalette.tsx`, `DesignSuggestions.tsx`, `GlyphPalette.tsx`, `TexturesPanel.tsx`, `DrawPanel.tsx`, `PaletteGenerator.tsx`, `Editor.tsx`, `DesignQualityScorer.tsx`, `SmartContentGenerator.tsx`, `AIAssistant.tsx`, `CanvasLayerItemWrapper.tsx`, `ErrorBoundary.tsx`). This drops critical context (like `error` details and relevant states) during failures, making production debugging difficult.
**Action:** Replaced unstructured console logging with `log.error`, ensuring that all relevant local context variables are explicitly passed in the logging payload.
