## 2026-08-25 - Removed Unsafe Type Casts in smartResize

**Learning:** `smartResize.ts` heavily relied on unsafe `(layer as any).width` and `(layer as any).height` type casting, which masked potential TypeScript errors and bypassed standard `Layer` interface definitions. In addition, the file contained unused variables (`srcAspect`, `tgtAspect`) which triggered ESLint warnings.
**Action:** When finding unsafe type escapes like `as any` in utilities, replace them by utilizing the correct properties mapped to the `Layer` and `TextLayer` interfaces. Removing unused variables ensures a cleaner build and prevents linting failures.
