## 2024-05-18 - Shape Definitions
**Learning:** Found massive duplication of shape polygon definitions across `exportWorker.ts`, `mask.worker.ts`, and `layerRendering.ts`. Extracting to a registry or central dictionary is highly justified because adding a new shape requires updating three distinct areas.
**Action:** Extract a `getShapeDefinition` hook/registry into a shared `utils/layers/shapeRegistry.ts` (or similar) to centralize shape logic.
