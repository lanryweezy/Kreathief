## 2024-06-18 - Extracted `AnalyticsProvider` Interface from Hardcoded Service

**Learning:** The `AnalyticsService` previously hardcoded calls to Plausible and Google Analytics inside its `track` method, which would require touching the core file every time a new analytics channel was added. By extracting these into self-registering `AnalyticsProvider` implementations, we allow new channels to be added additively.
**Action:** Always look for multiple hardcoded integrations (like multiple analytics providers or notification channels) as a clear signal for a registry pattern.

## 2024-06-20 - Centralized Hardcoded Shape Polygons into `ShapeRegistry`

**Learning:** Massive `switch` statements containing identical CSS polygon strings were duplicated across the codebase (`getLayerClipPath` in UI rendering and `getShapeDefinition` in the export worker). Adding a new shape previously required modifying multiple core files that shouldn't need to change. By extracting these into a unified `ShapeRegistry`, we created a single extension point.
**Action:** Identical `switch` blocks scattered across different modules representing the same concept (e.g., shape types) are a strong signal that a registry or strategy pattern should be introduced.

## 2024-06-20 - Extracted Text Warp Effects into `WarpRegistry`

**Learning:** A massive `switch` statement for applying text wrap effects (`arch`, `wave`, `flag`, etc.) was deeply coupled inside the `renderWarpedText` loop in `textRendering.ts`. Extracting it into a `WarpRegistry` enables third-party or additive plugins to introduce entirely new text visual effects without needing to edit the core typography pipeline.
**Action:** When iteration inside rendering loops uses pure math mappings on a context (`ctx.translate`, `ctx.rotate`), extract the transformation into a strategy registry that accepts `progress` and `intensity` so the behavior becomes infinitely extensible.
