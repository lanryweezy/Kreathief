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

## 2026-06-15 - Replaced unstructured console errors across store slices

**Learning:** Found use of `console.error` in `store/slices/historySlice.ts` (`[Resilience] Session mirror failed`). This dropped critical context (like `projectId`) during session mirror save errors, making production debugging of project synchronization difficult.
**Action:** Replaced unstructured console logging with `log.error`, ensuring that `projectId` is passed in the logging payload.

## 2026-06-18 - Typescript definitions for AnalyticsService.track

**Learning:** When adding new tracking events using `analyticsService.track()`, the event name MUST be explicitly added to the `AnalyticsEvent` union type in `services/analyticsService.ts` to prevent TypeScript compilation errors.
**Action:** Always verify `AnalyticsEvent` includes the desired tracking event string.

## 2026-06-18 - Missing metrics for business-critical events

**Learning:** Important business events like signups, sign-ins, and sign-outs were missing operational metrics or tracking. Failures during these operations were logged but not aggregated into metrics.
**Action:** Added `analyticsService.track()` calls in `services/authService.ts` for these operations, including their success status and error messages on failure, to enable monitoring of authentication success rates.

## 2026-06-16 - Replaced unstructured console errors across complex store slices

**Learning:** Found widespread use of `console.error` in `store/slices/agentSlice.ts`, `store/slices/aiSlice.ts`, and `store/slices/layer/crudSlice.ts`. This dropped critical context (like `intent`, `prompt`, `aspectRatio`, `quality`, `layerId`, `options`, etc) during complex state management failures, making production debugging difficult.
**Action:** Replaced unstructured console logging with `log.error`, ensuring that all relevant local context variables are explicitly passed in the logging payload.

## 2026-06-19 - Added Structured Logs to Empty/Swallowed Catch Blocks

**Learning:** Found several places where `try/catch` blocks either entirely swallowed errors (like `JSON.parse` failures in BrandPanel or `localStorage.setItem` in MagicPanel) or omitted crucial context (like the prompt `text` in AIAssistant). This pattern leads to silent failures where features silently break for users but no error trace is generated for the engineering team.
**Action:** Addressed these by strictly adding `log.error` or `log.warn` calls with relevant scoped variables passed as contextual payloads, without altering any adjacent business logic.

## 2026-06-20 - Add structured logging to silent JSON parsing errors

**Learning:** Found an empty `catch` block swallowing `JSON.parse` errors in `components/modals/CommunityModal.tsx`. When a community template state fails to parse, it quietly fails and drops the operation, but no log trace is generated for debugging.
**Action:** Replaced the empty catch block with a structured `log.error` call passing the template ID as context (`templateId: template.id`) so parsing failures can be investigated in production without altering the error handling flow.

## 2024-05-18 - Unlogged Local Parse Failures Hide State Corruption

**Learning:** Returning default empty values or `NaN` inside `catch` blocks for UI component logic (like `JSON.parse` in `CommunityModal` or mathematical evaluations in `ToolbarShared`) fails silently. While preventing an immediate UI crash, it completely obscures bad data states and logic errors from production logs.
**Action:** Always include a structured `log.error` call before falling back to default values in catch blocks, ensuring the error object and relevant context (like the bad JSON string or evaluation expression) are recorded.

## 2024-05-27 - Silent History Corruption in State Time Travel

**Learning:** Found an empty catch block in `undo` and `redo` operations (`store/slices/historySlice.ts`) when applying JSON patches to reconstruct history states. While a toast notification was presented to the user, the actual failure (often due to `fast-json-patch` applying misaligned diffs) was silently swallowed. Without logs, we had no way of knowing _why_ the patch failed or the context of the history stack when the corruption occurred.
**Action:** Added structured logging to capture `action`, `snapshotIdx`, and the history lengths when an `applyPatch` operation fails so that we can reproduce the state corruption.

## 2026-07-11 - Modernized Identifier Generation in Unit Tests

**Learning:** Found pre-existing unit tests in `tests/unit/utils/layers.test.ts` that expected a legacy ID format (`prefix_timestamp_hash`). After migrating the application to `crypto.randomUUID()`, these tests failed because the new format (`prefix_uuid`) didn't match the hardcoded regex in the test file.
**Action:** Updated unit test regex patterns to correctly validate the standard UUIDv4 format, ensuring test suite alignment with the new identifier hardening strategy.
