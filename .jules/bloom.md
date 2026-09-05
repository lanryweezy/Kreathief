## 2026-09-05 - Specific error messaging for palette extraction

**Learning:** When errors occurred during color palette extraction (e.g. from corrupt or unsupported image formats in `PaletteGenerator`), the error was only logged silently to the console (`log.error`), leaving users without any feedback on why their interaction failed. While the codebase contained a robust `getErrorDetails` utility and `addToast` for actionable errors, they were not utilized here.
**Action:** Replaced silent failure in `PaletteGenerator`'s `catch` block with `getErrorDetails` and an `addToast` notification. This ensures users receive specific, actionable guidance without changing the component's interface or logic structure.
