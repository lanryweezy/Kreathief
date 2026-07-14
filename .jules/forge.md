## 2024-06-22 - Vitest and Testing Context

**Learning:** This codebase uses Vitest, but currently runs Vitest without the usual Vue/React integrations causing an issue with coverage generation if not properly run against specifically added tests. For testing `utils/colorUtils.ts`, we need to add cases handling edge color configurations: lengths of hex strings missing '#' padding, specific boundary behaviors for gamut tests (`isWithinCMYKGamut`, `getClosestCMYKSafeColor`), WCAG contrast checks spanning the three boundaries (Large AA, AA), and HSL RGB derivations mapping exactly to the color space conditionals (`h` calculation logic).
**Action:** When creating tests or ensuring 100% coverage on utils files, carefully isolate branch conditions (e.g., all boundaries for RGB/HSL transformations, all boundaries for WCAG, and conditional `if` gaps for strings mapping back to RGB limits) in tests. Then combine tests within the main unit test file for simplicity.

>> 2023-10-xx: Forge metadata rules require stringent verification for JSON payload correctness. Tools like `jq` or short `cjs` scripts are essential for mass-editing attributes in large directory structures without human oversight failures, especially character count constraints limit like `seoMetadata.title` (60 max).
## 2024-07-01 - layoutUtils Coverage
**Learning:** The `utils/layoutUtils.ts` file contains pure math utilities that dictate canvas layout, distribution, alignment, and semantic constraints but previously lacked robust coverage. Unit tests can achieve nearly 100% coverage (98.67%) without UI components, significantly de-risking the core layout engine.
**Action:** Prioritize pure utility testing for math-heavy layout functions using `describe` blocks divided by concern (e.g., `alignLayers`, `distributeLayers`). Test arrays should map precisely to the returned layout coordinate updates.

## 2026-07-04 - Vitest and global navigator properties
**Learning:** When mocking `global.navigator` properties like `userAgent` in Vitest environments, direct assignment throws a 'Cannot set property... which has only a getter' error. Additionally, when using `vi.runAllTimersAsync()` to test async retry or timeout logic, unhandled rejection warnings can occur if the pending promise isn't caught.
**Action:** Use `Object.defineProperty(global.navigator, 'propertyName', { value: '...', configurable: true })` to mock getter-only properties on the navigator object. Explicitly catch pending promises (e.g., `promise.catch(() => {})`) before advancing timers in Vitest to prevent false positive unhandled errors.

## 2026-07-08 - Search utils test coverage
**Learning:** Testing Levenshtein or fuzzy match behaviors (e.g., `fuzzyMatch` in `utils/search.ts`) requires exact match of maximum permissible distances (0, 1, 2) allowed for their string lengths (<=2, <=5, >5).
**Action:** When testing Levenshtein or fuzzy match behaviors, test query strings must exactly match the maximum permissible distances (0, 1, 2) allowed for their string lengths (<=2, <=5, >5). Strictly comment and annotate the specific distance being triggered in tests to prevent future developers from breaking assertions by 'fixing' typos.

## 2026-07-12 - Vitest hanging in bash session and ImageData mocking
**Learning:** In the headless bash session, `vitest` running without explicit `run` commands defaults to watch mode, timing out and causing false failures. Also, `ImageData` natively relies on the DOM; in a Node/jsdom testing environment, constructing it with `new ImageData()` can be brittle, and simulating its interface using type coercion (`{ data: new Uint8ClampedArray(...), width: W, height: H } as unknown as ImageData`) allows pure function math to be tested reliably.
**Action:** Always append `run` when executing `vitest` via shell (e.g., `npx vitest run <file>`). Use structural typing and `Uint8ClampedArray` to mock `ImageData` payloads when testing image color processing logic.

## 2024-07-06 - Levenshtein threshold test structure
**Learning:** Testing logic for Levenshtein-based search thresholds (e.g., `fuzzyMatch` in `search.ts`) requires matching the exact test query strings to the maximum permissible distances (0, 1, 2) allowed for their string lengths (<=2, <=5, >5) respectively, making string formulation for tests highly constrained to trigger specific boundary conditions (e.g. insertions vs substitutions).
**Action:** When testing Levenshtein or fuzzy match behaviors, strictly comment and annotate the specific distance being triggered and why, to prevent future developers from breaking test assertions while "fixing" typos in strings meant to be incorrect for testing.
