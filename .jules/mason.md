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

## 2026-06-15 - Use generateLayerId for AI Backgrounds

**Learning:** Found manual UUID polyfill logic (`(crypto as any).randomUUID ? (crypto as any).randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('')`) used for creating new AI background image layers in `store/tools.ts`. The codebase already has a well-defined domain primitive for this (`generateLayerId`) which handles UUID generation and prefixes it properly for layer types.
**Action:** Always check for and use `generateLayerId` from `utils/layers/layerUtils.ts` instead of manually generating identifiers when creating new layers to maintain consistency across the architecture.
\n## 2026-06-17 - Refactoring debounce timing function hooks in React\n**Learning:** Implementing or helpers returning cancelled closures with in React has known memory-leak and unmounting-crash antipatterns. A reviewer highlighted that React does not guarantee cache retention for memoized variables, posing a risk of lost references.\n**Action:** Use directly for managing unmount-safe custom wrappers instead of if closure dependencies dynamically regenerate.

## 2026-06-17 - React stateful closures in useMemo vs useRef

**Learning:** Using `useMemo` to store stateful closures (like a `debounce` wrapper with a `.cancel()` method attached) is considered a React anti-pattern because React does not guarantee that memoized values will be retained permanently. If the cache clears, the timer is lost, potentially causing memory leaks or double-executions. Furthermore, dynamically depending on functions (like `onUpdateLayers`) can recreate the memoized instance, which could crash the application during cleanup if `.cancel()` isn't present or falls out of sync.
**Action:** Always prefer `useRef` over `useMemo` when persisting a customized timing closure across renders, as refs provide a stable, mutable container that does not depend on React's rendering lifecycle heuristics.

## 2026-06-19 - Remove unused duplicate constants

**Learning:** Found unused filter presets (`DEFAULT_FILTERS_CONST` and `EFFECT_PRESETS`) in `constants.ts`. The actual application relies on `DEFAULT_LAYER_FILTERS`, `DEFAULT_CANVAS_FILTERS`, and `CANVAS_EFFECT_PRESETS` in context-specific locations (`store/slices/layer/utils.ts`, `store/slices/canvasSlice.ts`, and `components/toolbar/ToolbarConstants.ts`).
**Action:** When finding unused global constants, grep for similar names or domain structures. They are often relics from earlier iterations or duplicates of context-specific definitions, and can be safely deleted without call-site updates.

## 2026-06-21 - Standardized layer ID generation constraints

**Learning:** A refactor replacing inline duplication of logic with `cloneLayer(structuredClone(layer))` was rejected because it inherently changed the underlying ID structure of the copied item. The codebase relied heavily on string interpolation based IDs (`${type}_${Date.now()}`) during copy operations. Additionally, changing the depth of clone by adding `structuredClone` (even if presumably safer) was marked as an observable behavior change, which violates strict refactoring constraints.
**Action:** Always maintain the exact mechanism of ID generation and exact clone depth during refactoring. If a shared utility uses a slightly different generation mechanism or depth, do not use it unless you are certain the specific differences are completely benign, or wait for an opportunity to harmonize the utility itself without altering caller behavior. Avoid standardizing ID generation if it alters strings emitted.

## 2026-06-20 - Unused duplicate components removed

**Learning:** The codebase contained an unused `components/ContrastChecker.tsx` that duplicated utility functions (`getLuminance`, `getContrastRatio`) already present in `utils/colorUtils.ts`. The actual UI component being used was `components/panels/ContrastChecker.tsx` which correctly imported the utilities.
**Action:** Found and removed dead duplicate code components. Often when multiple files have similar names across directories (e.g. `components/` vs `components/panels/`), one of them is an unused relic that can be cleanly removed to eliminate structural debt and confusion.

## 2026-06-21 - Unused duplicate components removed

**Learning:** The codebase contained an unused `components/CommentsPanel.tsx` that duplicated functionality of `components/panels/CommentsPanel.tsx`.
**Action:** Removed dead duplicate code component `components/CommentsPanel.tsx`. Often when multiple files have similar names across directories (e.g. `components/` vs `components/panels/`), one of them is an unused relic that can be cleanly removed to eliminate structural debt and confusion.
