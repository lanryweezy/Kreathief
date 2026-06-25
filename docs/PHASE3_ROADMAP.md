# Kreathief Phase 3 Roadmap — Professionalization

## Vision

Kreathief is transitioning from "AI image editor" to "creative operating system."

**Core principle:** No new truth unless absolutely necessary. Fix entropy before adding features.

---

## The 10 Items

### 1. Performance Engine
- Benchmark: measure FPS at 100/500/1000/5000 objects
- Viewport culling: only render visible layers
- Bitmap caching: pre-render artboards to OffscreenCanvas
- Dirty region tracking: only re-render changed layers
- **Files:** CanvasLayerRenderer.tsx, Canvas.tsx, utils/performanceBenchmarks.ts

### 2. Scene Graph
- Tree structure replacing flat layers[] array
- GroupNode, FrameNode, ShapeNode, TextNode, ImageNode
- Tree traversal, serialization, backwards compatibility
- **Files:** types/sceneGraph.ts, utils/sceneGraph.ts

### 3. Selection Engine
- Selection state machine (idle → selecting → dragging → resizing → rotating)
- Smart selection (click cycles overlapping layers)
- Selection persistence across undo/redo
- Lock awareness
- **Files:** hooks/useSelectionEngine.ts, SelectionHandles.tsx

### 4. Geometry Engine
- Unified path operations library
- bezier.ts, intersections.ts, boolean.ts, offset.ts, simplify.ts, bounding.ts, measure.ts
- Consolidates pathOperationsService.ts + vectorUtils.ts
- **Files:** geometry/*.ts (6 new files)

### 5. History Command System
- Command pattern: execute() / undo() / description
- Commands: Move, Rotate, Scale, Delete, Add, Boolean, Style, Group
- O(1) undo instead of full-state snapshots
- Selection restore on undo
- **Files:** commands/*.ts, historySlice.ts

### 6. Components + Instances
- Reusable design elements with overrides
- Component library per project
- Variants (hover, pressed, disabled states)
- **Files:** types/components.ts, ComponentLibrary.tsx

### 7. Auto Layout
- Vertical/horizontal stacking with gap
- Padding, alignment, sizing (hug/fill/fixed)
- AI intent: "Keep these aligned" → auto-apply constraints
- **Files:** layout/autoLayout.ts, layout/constraints.ts

### 8. Command Palette
- Command registry with fuzzy search
- All 27+ shortcuts discoverable
- Recent commands, live preview
- **Files:** commands/registry.ts, CommandPalette.tsx

### 9. AI-Native Workflows
- AI layout engine: "Turn this into a poster"
- AI design systems: "Create a dark theme"
- AI hierarchy: "Make this more premium"
- AI refactoring: "Make this look like Apple"
- **Files:** ai/designEngine.ts, multiAgentService.ts

### 10. Signature Identity
- Distinctive color palette beyond generic purple
- Custom cursor set per tool
- Unique UI patterns (sidebar, panels)
- Signature animations and transitions
- Brand elements (logo, loading, splash)

---

## Asset Strategy (Critical Priority)

### Current State
- Stock photos: Unsplash API (limited)
- Icons: Freepik + Streamline (paid tiers)
- Templates: 3 African market + generic
- Fonts: 80+ Google Fonts
- Mockups: Basic library
- Textures: 7 presets
- Shapes: 30+ basic shapes
- Brushes: 8 types

### What's Missing
- No free stock photo integration (Pixabay, Pexels)
- No icon library beyond paid tiers
- No template marketplace
- No community-contributed assets
- No asset search across providers
- No asset favorites/collections

### Asset Strategy

#### Phase A: Free Stock Integration (Week 1)
- **Pixabay API** (free, 200 req/hr) — photos, vectors, illustrations
- **Pexels API** (free, 200 req/hr) — photos only
- **Unsplash** (already integrated) — keep as primary
- **Implementation:** Unified search across all 3 providers
- **Files:** api/pixabay.ts, api/pexels.ts, components/panels/MediaPanel.tsx

#### Phase B: Icon Library Expansion (Week 2)
- **Material Icons** (free, 2500+ icons)
- **Lucide Icons** (free, 1000+ icons)
- **Heroicons** (free, 300+ icons)
- **Phosphor Icons** (free, 6000+ icons)
- **Implementation:** Add as icon sources in ElementsPanel
- **Files:** api/materialIcons.ts, api/lucideIcons.ts, api/phosphorIcons.ts

#### Phase C: Template Marketplace (Week 3)
- **Community templates** — users submit, others use
- **AI-generated templates** — use Gemini to generate templates from prompts
- **Industry-specific packs** — African market, social media, business
- **Implementation:** Template submission + approval workflow
- **Files:** components/modals/TemplateSubmitModal.tsx, services/templateService.ts

#### Phase D: Asset Curation (Week 4)
- **Smart search** — unified search across all providers
- **Favorites/collections** — save and organize assets
- **Recently used** — track and surface frequently used assets
- **AI recommendations** — suggest assets based on current design
- **Files:** components/panels/AssetLibrary.tsx, services/assetSearch.ts

### Asset Numbers Target

| Category | Current | Target |
|----------|---------|--------|
| Stock photos | ~1M (Unsplash) | 5M+ (Unsplash + Pixabay + Pexels) |
| Icons | ~500 (Freepik) | 10,000+ (add Material, Lucide, Phosphor) |
| Templates | 3 | 100+ (community + AI-generated) |
| Fonts | 80+ | 200+ (add more Google Fonts) |
| Shapes | 30+ | 100+ (add geometric, decorative, UI) |
| Textures | 7 | 50+ (add noise, patterns, gradients) |
| Brushes | 8 | 20+ (add pencil, charcoal, spray) |
| Mockups | ~50 | 200+ (add devices, apparel, print) |

### Revenue Model for Assets
- **Free tier:** Basic assets (current)
- **Pro tier:** Premium templates, high-res exports, unlimited storage
- **Asset marketplace:** Creators sell templates, Kreathief takes 20% cut
- **AI generation:** Pay-per-use for AI image generation beyond free quota
