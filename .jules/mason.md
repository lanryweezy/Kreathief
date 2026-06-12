## 2026-06-09 - Unused specific error formatters removed\n**Learning:** The codebase previously contained context-specific error messaging wrappers (like `getExportErrorMessage` and `getSaveErrorMessage`) that wrapped `getErrorDetails` with custom strings. However, these were never actually consumed by the UI components (which either used `getAIErrorMessage` or raw `getErrorDetails`), meaning they were dead code.\n**Action:** Prioritize checking if highly specific utility functions (especially those that look like boilerplate wrappers) are actually imported before trying to refactor or consolidate them; often they can just be deleted.

## 2026-06-09 - Unused `formatErrorMessage` removed
**Learning:** Found another unused error formatting function (`formatErrorMessage`) in `utils/errorMessages.ts` which just formatted `getErrorDetails` output into a string. The codebase seems to have a pattern of creating specific wrappers for `getErrorDetails` without ever consuming them.
**Action:** When finding dead code, grep for similar patterns in the same file or directory, as developers often copy-paste or write multiple similar utilities at once and leave them unused.

## 2026-06-11 - Consolidate duplicate function export
**Learning:** Found an alias `rgbToCmyk` pointing to `rgbToCMYK` in `utils/colorUtils.ts`. There was a mix of usage in the codebase.
**Action:** Removed the duplicate alias export and updated `components/ColorPicker.tsx` to use the standard `rgbToCMYK` function directly to improve naming consistency and reduce cognitive load.

## 2026-06-12 - Re-evaluating Dead Code vs. Architecture
**Learning:** Found a utility file `utils/canvasUtils.ts` containing core domain primitives (`buildFilterString`, `getLayerStyle`, `isTextLayer`) that were fully tested but never integrated. Initially tried to delete it as dead code. However, the correct approach was to realize this was an abandoned but sound architecture.
**Action:** Don't blindly delete unused code if it represents a strong domain primitive that the rest of the codebase desperately needs (e.g. replacing massive inline template strings with `buildFilterString`). Instead, delete the true duplication (like generic `debounce` functions), keep the core primitives, and integrate them progressively.
