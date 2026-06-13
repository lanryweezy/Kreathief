## 2026-06-09 - Unused specific error formatters removed\n**Learning:** The codebase previously contained context-specific error messaging wrappers (like `getExportErrorMessage` and `getSaveErrorMessage`) that wrapped `getErrorDetails` with custom strings. However, these were never actually consumed by the UI components (which either used `getAIErrorMessage` or raw `getErrorDetails`), meaning they were dead code.\n**Action:** Prioritize checking if highly specific utility functions (especially those that look like boilerplate wrappers) are actually imported before trying to refactor or consolidate them; often they can just be deleted.

## 2026-06-09 - Unused `formatErrorMessage` removed

**Learning:** Found another unused error formatting function (`formatErrorMessage`) in `utils/errorMessages.ts` which just formatted `getErrorDetails` output into a string. The codebase seems to have a pattern of creating specific wrappers for `getErrorDetails` without ever consuming them.
**Action:** When finding dead code, grep for similar patterns in the same file or directory, as developers often copy-paste or write multiple similar utilities at once and leave them unused.

## 2026-06-11 - Consolidate duplicate function export

**Learning:** Found an alias `rgbToCmyk` pointing to `rgbToCMYK` in `utils/colorUtils.ts`. There was a mix of usage in the codebase.
**Action:** Removed the duplicate alias export and updated `components/ColorPicker.tsx` to use the standard `rgbToCMYK` function directly to improve naming consistency and reduce cognitive load.

## 2026-06-12 - Split canvasUtils into modular layers directory

**Learning:** Monolithic utility files like `canvasUtils.ts` often accumulate structural debt as a "grab bag" for unrelated helpers. By explicitly splitting it into focused modules (`styleUtils.ts`, `typeGuards.ts`, `layerUtils.ts`) under a unified `utils/layers/` index, we establish a cleaner, single-responsibility architecture for the layers engine while preventing circular dependencies and huge import surface areas.
**Action:** When a utility file grows to encompass distinct domains (e.g., typing vs. styling vs. structural transforms), migrate it to a modular directory with a clean `index.ts` export instead of letting the monolith grow. Keep the original file as a proxy export to prevent breaking existing imports while gradually transitioning dependents.
## 2026-06-13 - Remove unused duplicate timing functions
**Learning:** Found duplicate implementations of `debounce` and `throttle` in `utils/canvasUtils.ts` and `utils/mobileOptimizations.ts` (with `ForMobile` suffixes). The entire codebase actually uses the single source of truth in `utils/debounce.ts`. The duplicates were entirely dead code, demonstrating a tendency for developers to write domain-specific timing helpers before realizing a shared utility already exists.
**Action:** Always check for existing usage before extracting or moving utility functions. Often, duplicated code is completely unused and can be safely deleted without any call-site updates.
