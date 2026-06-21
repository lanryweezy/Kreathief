## 2026-06-17 - [Canvas Text Style vs Export Text Style]

**Surface pair:** Canvas Editor and Export Service (PNG/JPG Blob/PSD generator)
**Root cause:** The export utility (`drawTextLayerToContext` in `exportService.ts`) blindly rendered `TextLayer` instances using a single `fillText` call. It entirely ignored multiline text wrapping (`\n`), `textAlign`, `letterSpacing`, and `lineHeight`. In contrast, the Canvas editor correctly applied these styles to DOM elements (`LayerContent.tsx`).
**Fix:** Extracted text layout calculations into a shared resolver (`renderMultilineText` in `utils/textRendering.ts`) that handles word wrapping, line height calculation, letter spacing, and horizontal alignment. `exportService.ts` now calls this shared resolver, eliminating divergence.
**Learning:** Text properties like wrapping, line height, letter spacing, and alignment cannot be applied automatically via simple Canvas API calls like `fillText` without custom layout loops. Always extract rendering implementations into a shared source of truth rather than patching them per-surface to prevent drift.
## 2026-06-18 - Missing text style properties in canvas rendering
**Surface pair:** Canvas Editor and Export Pipeline
**Root cause:** `components/canvas/LayerItems.tsx` was not applying all formatting properties from the `TextLayer` state to the inline `style` of the `contentEditable` div. Specifically, properties such as `fontWeight`, `fontStyle`, `letterSpacing`, `lineHeight`, `textDecoration`, and `textTransform` were ignored during canvas rendering but were explicitly respected and applied by `renderMultilineText` (used in `exportWorker.ts` and `exportService.ts`).
**Fix:** Consolidated canvas rendering to map all text styling fields correctly from the state to inline styles within `TextLayerItem` in `components/canvas/LayerItems.tsx`.
**Learning:** Always verify that every new design state property introduced for text is mapped not only to the canvas `div` element but also accurately tracked in the `renderMultilineText` utility.
## 2026-06-18 - Missing text style properties in canvas rendering & Independent filter implementation
**Surface pair:** Canvas Editor and Export Pipeline
**Root cause:**
1. `components/canvas/LayerItems.tsx` was not applying all formatting properties from the `TextLayer` state to the inline `style` of the `contentEditable` div. Properties like `fontWeight`, `fontStyle`, `letterSpacing`, `lineHeight`, `textDecoration`, and `textTransform` were missing from the inline display but respected by `exportWorker.ts`.
2. The `AdjustmentLayerItem` in `LayerItems.tsx` manually constructed its `backdropFilter` CSS string, independent of the `buildFilterString` utility used by exports. This meant any updates or new filter properties (like `invert`) were prone to divergence.
**Fix:**
1. Mapped all text styling fields correctly from the `TextLayer` state to inline styles within `TextLayerItem`.
2. Updated `buildFilterString` in `utils/layers/styleUtils.ts` to include the `invert` property, and refactored `AdjustmentLayerItem` to derive its `backdropFilter` directly from `buildFilterString`.
**Learning:** Always verify that every new design state property introduced for text and filters is mapped to a single source of truth (`buildFilterString` and `renderMultilineText`) instead of redefining inline properties directly in the canvas elements.
## 2026-06-21 - [Shape Rendering consistency between Canvas and SVG Export/Workers]
**Surface pair:** Canvas Editor and Export Pipeline (SVG Export, Export Worker, Mask Worker)
**Root cause:** The shape rendering logic diverged because `exportService.ts`, `exportWorker.ts`, and `mask.worker.ts` all hardcoded custom math and explicit lists of `polygon` points for shapes. Because `exportService.ts` manually generated SVG shapes, it broke completely on non-basic shapes like `hexagon` or `heart`.
**Fix:** Consolidated shape coordinate generation. All surfaces now import and rely on the single source of truth `getLayerClipPath` in `utils/layerRendering.ts` to output shape boundaries. `exportService.ts` dynamically parses this standard `clip-path` into its `<polygon points="..." />` string for identical SVG rendering.
**Learning:** To ensure identical visual formatting and clipping of complex shapes (like stars, hexagons, arrows) across the canvas and export/mask workers, use the shared `getLayerClipPath` utility from `utils/layerRendering.ts` rather than hardcoding SVG polygons or CSS `clip-path` definitions independently.
