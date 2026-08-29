## 2024-07-04 - Layer Export Strategy Registry

**Learning:** Adding new layer types to the export process previously required touching `exportService.ts` in at least 5 different places due to hardcoded `if-else` chains switching on `layer.type`. This proved to be a significant extension bottleneck.
**Action:** Extract this logic into a `LayerExportStrategy` interface and a `layerExportStrategies` registry map. Future layer types can now self-register without touching the core export pipelines.

## 2024-07-25 - AssetSearchProvider Registry

**Learning:** The `searchAllProviders` method in `services/assetSearch.ts` used hard-coded `if` statements and manual unrolling of responses to search across multiple providers (Unsplash, Pixabay, Pexels). This design required editing the core search loop and extending the `NormalizedAsset.provider` union type for every new integration, making it difficult to maintain and scale.
**Action:** Introduced an `AssetSearchProvider` registry. The `NormalizedAsset.provider` field was relaxed to `string`, and providers now self-register using `registerSearchProvider`. The main loop dynamically iterates over registered providers, delegating search and parsing logic to the implementations, thus decoupling core logic from specific integrations.

## 2024-08-16 - AIActionHandler Registry

**Learning:** The `executeAction` hook inside `useAIDesignAssistant` relied on a hard-coded switch statement to handle different AI action types (`modify`, `delete`, `create`, `arrange`). This would require touching the core hook every time a new AI capability was added.
**Action:** Introduced an `AIActionHandler` interface and a `aiActionHandlers` registry map. AI actions now self-register using `registerAIActionHandler`, decoupling the core execution logic from the specific action implementations.

## 2026-08-18 - Boolean Operation Strategy Registry

**Learning:** The boolean operations (union, subtract, intersect, exclude) were implemented using hard-coded switch statements in multiple places (`utils/booleanOperations.ts` and `hooks/useEditorLogic.ts`). This duplicate switch statement meant any new boolean operation would require modifying the core logic and React hook.
**Action:** Extracted this into a `booleanOperationStrategies` map registry, allowing future vector math logic to register new boolean operations without touching the core processing pipelines.

## 2024-08-22 - Fallback Photo Provider Registry

**Learning:** The `getFallbackPhotos` function in `services/fallbackPhotos.ts` used a hard-coded switch statement to parse data for 4 different providers (`unsplash`, `pixabay`, `pexels`, `vecteezy`). Adding a new fallback provider would require modifying this central function.
**Action:** Introduced a `FallbackPhotoAdapter` registry pattern (`fallbackPhotoAdapters`). The `provider` argument type was relaxed to `string`, and providers now self-register using `registerFallbackPhotoAdapter`. This allows new fallback providers to be added without touching the core `getFallbackPhotos` logic.
