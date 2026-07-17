## 2024-07-04 - Layer Export Strategy Registry

**Learning:** Adding new layer types to the export process previously required touching `exportService.ts` in at least 5 different places due to hardcoded `if-else` chains switching on `layer.type`. This proved to be a significant extension bottleneck.
**Action:** Extract this logic into a `LayerExportStrategy` interface and a `layerExportStrategies` registry map. Future layer types can now self-register without touching the core export pipelines.
