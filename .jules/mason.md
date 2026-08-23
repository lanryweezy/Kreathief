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

## 2024-06-29 - Removed Unused Duplicate Component Files

**Learning:** Found unused duplicate component files with similar names across directories (`components/LandingPage.tsx` vs `components/pages/LandingPage.tsx`, and `components/canvas/CropOverlay.tsx` vs `components/overlays/CropOverlay.tsx`). The unused relics were safely deleted to reduce structural debt and confusion.
**Action:** Before refactoring or changing components, always check for duplicate files across directories (like `components/` vs `components/pages/` or `components/overlays/`) to identify unused relics that can be safely removed.

## 2026-06-25 - Removed unused error handling wrappers
**Learning:** The codebase contained multiple generalized error handling wrappers in `utils/errorHandling.ts` (like `handleApiError`, `safeExecute`, `withErrorHandling`, `validateRequired`, `getErrorBoundaryFallback`, and `createError`) that were fully tested in `tests/unit/utils/errorHandling.test.ts` but had exactly zero usage in the actual application code. This is a common pattern of speculative abstraction where generalized error helpers are built but never actually consumed.
**Action:** When finding utility files with broad, speculative functions (like generic error wrappers or validation helpers), aggressively check for call sites. If they are only referenced in their own unit tests, delete them entirely instead of trying to refactor them.

## 2026-08-14 - Refactoring TypeScript interfaces carefully to remove type escapes

**Learning:** When refactoring TypeScript interfaces to remove type-escape casts like `as any`, it is critical to respect existing structural diffing constraints. In `store/slices/historySlice.ts`, removing `as any` from `__batchDepth` resolved tech debt, but modifying the fallback logic for `canvasFilters` to force compliance with a strictly-typed interface changed the runtime value from `undefined` to `{}`. Because the application uses JSON-patching (`fast-json-patch`) for its history mechanics, `{}` and `undefined` create vastly different diff outputs, corrupting undo/redo state logic.
**Action:** When updating a TypeScript interface to fix a type error or remove an `as any` cast, strictly maintain the original runtime structures and fallback values (like `undefined`). If the existing interface doesn't match the required fallback, keep the specific localized type escape (or update the interface explicitly to support it) rather than mutating the data shape to appease the compiler and silently breaking downstream diffing logic.

## 2026-08-17 - Removed Unused Duplicated Design Analysis

**Learning:** Found an entire utility file (`utils/designAnalysis.ts`) full of logic for computing WCAG contrast, layout complexity, typography coherence, and extracting color palettes that was fully dead code. The application relies on `ai/designEngine.ts` and `utils/colorUtils.ts` instead for these features. This is a common form of structural debt where domain logic gets duplicated in multiple utility silos during iteration and left behind.
**Action:** Always verify if a domain utility file is actually imported anywhere in the application or just serving as dead weight. Even files filled with complex algorithms should be safely deleted if they are totally unused relics.

## 2026-08-20 - Consolidate duplicate warp effects in warpRegistry

**Learning:** The warp registry had completely duplicate code for `arch` and `arc` effect implementations.
**Action:** Extract identically repeated plugin configurations or handler functions to a shared constant or function reference, reducing structural noise and keeping a single source of truth for the logic.
## 2026-08-22 - Consolidate fragmented Zustand subscriptions in components

**Learning:** When a component calls `useStore(selector)` multiple times consecutively for different atomic state properties, it forces Zustand to create multiple separate `useSyncExternalStore` subscriptions. This causes the component to evaluate multiple listeners on every state change, which increases CPU overhead and degrades rendering performance.
**Action:** When refactoring components that make many atomic `useStore` calls, consolidate them into a single object-returning selector wrapped in `useShallow` from `zustand/react/shallow` to preserve granular re-rendering while minimizing subscription overhead.
