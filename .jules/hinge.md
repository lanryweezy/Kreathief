## 2024-07-04 - Layer Export Strategy Registry

**Learning:** Adding new layer types to the export process previously required touching `exportService.ts` in at least 5 different places due to hardcoded `if-else` chains switching on `layer.type`. This proved to be a significant extension bottleneck.
**Action:** Extract this logic into a `LayerExportStrategy` interface and a `layerExportStrategies` registry map. Future layer types can now self-register without touching the core export pipelines.

## 2024-07-25 - AssetSearchProvider Registry

**Learning:** The `searchAllProviders` method in `services/assetSearch.ts` used hard-coded `if` statements and manual unrolling of responses to search across multiple providers (Unsplash, Pixabay, Pexels). This design required editing the core search loop and extending the `NormalizedAsset.provider` union type for every new integration, making it difficult to maintain and scale.
**Action:** Introduced an `AssetSearchProvider` registry. The `NormalizedAsset.provider` field was relaxed to `string`, and providers now self-register using `registerSearchProvider`. The main loop dynamically iterates over registered providers, delegating search and parsing logic to the implementations, thus decoupling core logic from specific integrations.
