## 2026-06-09 - Unused specific error formatters removed\n**Learning:** The codebase previously contained context-specific error messaging wrappers (like `getExportErrorMessage` and `getSaveErrorMessage`) that wrapped `getErrorDetails` with custom strings. However, these were never actually consumed by the UI components (which either used `getAIErrorMessage` or raw `getErrorDetails`), meaning they were dead code.\n**Action:** Prioritize checking if highly specific utility functions (especially those that look like boilerplate wrappers) are actually imported before trying to refactor or consolidate them; often they can just be deleted.

## 2026-06-09 - Unused `formatErrorMessage` removed
**Learning:** Found another unused error formatting function (`formatErrorMessage`) in `utils/errorMessages.ts` which just formatted `getErrorDetails` output into a string. The codebase seems to have a pattern of creating specific wrappers for `getErrorDetails` without ever consuming them.
**Action:** When finding dead code, grep for similar patterns in the same file or directory, as developers often copy-paste or write multiple similar utilities at once and leave them unused.

## 2026-06-11 - Consolidate duplicate function export
**Learning:** Found an alias `rgbToCmyk` pointing to `rgbToCMYK` in `utils/colorUtils.ts`. There was a mix of usage in the codebase.
**Action:** Removed the duplicate alias export and updated `components/ColorPicker.tsx` to use the standard `rgbToCMYK` function directly to improve naming consistency and reduce cognitive load.

## 2026-06-12 - Generic Utilities as Dead Code
**Learning:** Found a massive `utils/canvasUtils.ts` file containing generic wrappers and abstractions (`buildFilterString`, `getLayerStyle`, type guards, and duplicate `debounce`/`throttle` functions) that were 100% unused by the actual application, only referenced in their own test file `tests/unit/utils/canvasUtils.test.ts`.
**Action:** When finding duplicate implementations or generic utility files, always trace imports first. If a file is an "abstract utility kitchen sink" but has zero consumers, the best refactor is pure subtraction—delete the dead code to reduce cognitive load and false patterns for the team.
