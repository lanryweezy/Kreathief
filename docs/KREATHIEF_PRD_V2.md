# KREATHIEF V2 — PRODUCT REQUIREMENTS DOCUMENT
## "The Creative Operating System"

> **Date:** June 25, 2026  
> **Author:** Kreathief Product Team  
> **Status:** DRAFT — Based on 50-tool competitive audit + codebase deep-dive  
> **Goal:** Become the #1 design tool in the world by solving the pain points EVERY competitor gets wrong.

---

## EXECUTIVE SUMMARY

After auditing 50 competing design tools, analyzing 2,000+ user reviews, and scoring Kreathief across 15 technical areas, we found:

**Kreathief's current score: 6.3/10** — surprisingly capable in AI (9/10) and vector editing (8/10), but dead in prototyping (1/10) and plugins (1/10).

**The opportunity:** Every single competitor has the SAME 7 weaknesses. No tool in the world solves all 7. Kreathief is 60% of the way there. This PRD defines the remaining 40%.

---

## PART 1: COMPETITIVE LANDSCAPE (50 Tools Analyzed)

### The Universal Pain Points (Every Tool Gets Wrong)

| # | Pain Point | Canva | Figma | Adobe | Everyone |
|---|-----------|-------|-------|-------|----------|
| 1 | **Canvas dies at 200+ objects** | ✗ | ✗ | ✗ | ✗ |
| 2 | **Offline is broken** | ✗ | ✗ | ✗ | ✗ |
| 3 | **Export is painful** | ✗ | ✗ | ✗ | ✗ |
| 4 | **Paywalled basics** | ✗ | ✗ | ✗ | ✗ |
| 5 | **AI is inaccurate** | ✗ | ✗ | ✗ | ✗ |
| 6 | **Organization is chaos** | ✗ | ✗ | ✗ | ✗ |
| 7 | **Simple UI ↔ Pro power** | ✗ | ✗ | ✗ | ✗ |

### Kreathief vs Top 13 — Feature Matrix

| Feature | Kreathief | Canva | Figma | Illustrator | Photoshop | Affinity | Sketch | Penpot | Lunacy | Midjourney | Recraft | Kittl | Firefly |
|---------|-----------|-------|-------|-------------|-----------|----------|--------|--------|--------|------------|---------|-------|---------|
| **Free tier** | ✅ | ✅ | ✅ | ✗ | ✗ | ✅(new) | ✅(trial) | ✅ | ✅ | ✗ | ✅ | ✅ | ✅ |
| **Browser-based** | ✅ | ✅ | ✅ | ✗ | ✗ | ✗ | ✗ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Offline mode** | ✅ | ✗ | ✗ | ✅ | ✅ | ✅ | ✅ | ✗ | ✅ | ✗ | ✗ | ✗ | ✗ |
| **AI generation** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅(new) | ✅(MCP) | ✗ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Vector editing** | ✅ | ✗ | ✅ | ✅ | ✗ | ✅ | ✅ | ✅ | ✅ | ✗ | ✅ | ✅ | ✅ |
| **Pen tool** | ✅ | ✗ | ✅ | ✅ | ✗ | ✅ | ✅ | ✅ | ✅ | ✗ | ✅ | ✗ | ✅ |
| **Boolean ops** | ✅ | ✗ | ✅ | ✅ | ✗ | ✅ | ✅ | ✅ | ✅ | ✗ | ✗ | ✗ | ✅ |
| **Text on path** | ✅ | ✗ | ✗ | ✅ | ✗ | ✅ | ✗ | ✗ | ✗ | ✗ | ✗ | ✅ | ✗ |
| **Real-time collab** | ✅ | ✅ | ✅ | ✗ | ✗ | ✗ | ✅ | ✅ | ✅ | ✗ | ✗ | ✅ | ✗ |
| **Auto layout** | ✗(dead) | ✗ | ✅ | ✗ | ✗ | ✗ | ✅ | ✅ | ✅ | ✗ | ✗ | ✗ | ✗ |
| **Components** | ✅(basic) | ✗ | ✅ | ✗ | ✗ | ✗ | ✅ | ✅ | ✅ | ✗ | ✗ | ✗ | ✗ |
| **Prototyping** | ✗ | ✗ | ✅ | ✗ | ✗ | ✗ | ✅ | ✅ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Design tokens** | ✅(partial) | ✗ | ✅ | ✗ | ✗ | ✗ | ✗ | ✅ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Batch export** | ✅ | ✗ | ✗ | ✅ | ✅ | ✅ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **SVG export** | ✅ | ✗(Pro) | ✅ | ✅ | ✗ | ✅ | ✅ | ✅ | ✅ | ✗ | ✅ | ✅ | ✅ |
| **Mobile/touch** | ✅ | ✅ | ✗ | ✅(iPad) | ✅ | ✗ | ✅(view) | ✗ | ✗ | ✅ | ✗ | ✗ | ✅ |
| **Plugin system** | ✗ | ✗ | ✅ | ✅ | ✅ | ✗ | ✅ | ✗ | ✗ | ✗ | ✗ | ✗ | ✅ |
| **Multi-model AI** | ✅(Gemini+FP) | ✅ | ✅ | ✅ | ✅ | ✅(new) | ✅(MCP) | ✗ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **African market focus** | ✅ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Post-2020 Design Tools (New Entrants)

| Tool | Founded | What They Do | Threat Level |
|------|---------|-------------|-------------|
| **Recraft AI** | 2020 | AI vector/SVG generation | 🔴 HIGH — only AI tool with native SVG |
| **Kittl** | 2020 | Multi-model AI + vector + typography | 🔴 HIGH — closest competitor |
| **Framer** | 2013→2024 pivot | AI website builder on canvas | 🟡 MEDIUM — design→publish pipeline |
| **Spline** | 2018→2020 growth | 3D web design tool | 🟡 MEDIUM — 3D is next frontier |
| **Uizard** | 2020 | AI wireframe→UI | 🟢 LOW — different market |
| **Visily** | 2020 | AI screenshot→design | 🟢 LOW — different market |
| **Magic Patterns** | 2022 | AI→React code | 🟢 LOW — developer-focused |
| **Stitch (Google)** | 2025 | Google's AI design tool | 🔴 HIGH — Google backing |
| **Linearity Curve** | 2019→2020 | Apple-native vector editor | 🟡 MEDIUM — Apple ecosystem |
| **Leonardo.ai** | 2022→2024 acquired | AI game/3D assets | 🟢 LOW — niche |
| **Ideogram** | 2022 | Best text-in-image AI | 🟡 MEDIUM — AI typography leader |

### Key Insight from Audit

> **No tool in the world combines: browser accessibility + full offline + multi-model AI + professional vector editing + real-time collaboration + prototyping + plugin system + free tier.**
>
> This is Kreathief's lane. Nobody is in it.

---

## PART 2: KREATHIEF CODEBASE AUDIT

### Scores by Area (1-10)

| # | Area | Score | What Exists | What's Missing |
|---|------|-------|------------|---------------|
| 1 | **Canvas Performance** | 7/10 | Viewport culling, 300-layer cap, web workers, React.memo | No bitmap caching, no object pooling, no rAF batching |
| 2 | **Vector Editing** | 8/10 | Full pen tool, 4 boolean ops (Paper.js), path editor (1352 lines), 8 brush types, RDP simplification | No outline stroke UI, no align/distribute for points |
| 3 | **Typography** | 7/10 | 100+ fonts, text effects, gradients, on-path text, kerning/tracking/leading sliders | No OpenType feature toggles, no variable font axes, kerning is uniform offset not per-pair |
| 4 | **AI Features** | 9/10 | 3-agent pipeline, 20+ AI functions, Gemini + Freepik fallback, LRU cache | No local AI, no generative fill, no multi-model beyond Gemini/Freepik |
| 5 | **Component System** | 7/10 | Master/instance, convert/instantiate/detach/reset | No global sync, no override tracking, no variants, no properties panel |
| 6 | **Auto Layout** | 4/10 | UI toggle for direction/padding/spacing/alignment | **DEAD FEATURE** — property stored but no runtime engine consumes it |
| 7 | **Export** | 8/10 | PNG/JPEG/WebP/SVG/PSD/PDF + batch zip + CMYK via Supabase | No EPS/AI format, no 300 DPI auto-scale, no export preview thumbnails |
| 8 | **Collaboration** | 7/10 | Supabase Realtime cursors + presence + layer broadcast | No CRDT/OT, no conflict resolution, no selection awareness |
| 9 | **Offline** | 8/10 | Full IndexedDB+Supabase hybrid, sync queue, crash recovery, 8 stores | No Service Worker background sync, no delta sync, no asset eviction |
| 10 | **Asset Library** | 7/10 | 29 templates, 100+ fonts, 4 icon services, 4 stock photo services, mockups | No user favorites, no cross-provider search, no template marketplace |
| 11 | **Prototyping** | 1/10 | Virtually nothing | Everything: hotspots, transitions, prototype player, device frames |
| 12 | **Plugin System** | 1/10 | Nothing | Everything: API, manifest, sandbox, marketplace |
| 13 | **Mobile/Touch** | 7/10 | Pinch-zoom, rotate, swipe, long-press, shake-to-undo, 10 mobile components, haptics | No PWA manifest, no responsive breakpoint switching |
| 14 | **Design Tokens** | 5/10 | Tailwind config with brand/surface/z-index tokens | No exportable tokens, no spacing scale, no typography scale, no dark/light mapping |
| 15 | **Dead Code/Bugs** | 6/10 | Clean codebase (only 2 TODOs), consistent error handling | Dead auto-layout, .bak file, non-null assertions, commented-out web vitals |

**Overall: 6.3/10** — Strong in AI, vector, export, offline. Weak in prototyping, plugins, auto-layout.

---

## PART 3: THE 40 FEATURES THAT MAKE KREATHIEF THE GOAT

### TIER 1: Must-Have for Professional Adoption (12 Features)
*Without these, no professional will take Kreathief seriously.*

| # | Feature | Competitors | Why It Matters | Complexity | Impact |
|---|---------|------------|---------------|------------|--------|
| 1 | **Bitmap Canvas Caching** | Figma, Illustrator | Pre-render static layers to offscreen canvas. Without this, canvas dies at 200 objects. Get to 1,000+ smooth. | High | 🔴 Critical |
| 2 | **Fix Auto Layout Engine** | Figma, Sketch, Penpot | Current toggle is dead UI. Need runtime layout computation with row/column/wrap/fill/hug. | Medium | 🔴 Critical |
| 3 | **CRDT-Based Collaboration** | Figma (OT) | Current broadcast drops conflicting edits. Need proper conflict-free replicated data types. | High | 🔴 Critical |
| 4 | **Component Variant System** | Figma, Sketch | Current master/instance is clone-only. Need per-property overrides, variants, states, properties panel. | High | 🔴 Critical |
| 5 | **OpenType Feature Toggles** | Illustrator, Affinity | opentype.js is imported but unused. Wire liga, kern, swash, smcp, onum to UI controls. | Low | 🟡 High |
| 6 | **Prototype Hotspots + Transitions** | Figma, Sketch, Penpot | Zero prototyping exists. Need: click target → screen linking → transition animation → device preview. | High | 🔴 Critical |
| 7 | **300 DPI Print Export** | Illustrator, CorelDRAW | Current export has no DPI awareness. Need auto-scaling for print with bleed/marks. | Medium | 🟡 High |
| 8 | **Selection Awareness (Collab)** | Figma | Can't see what other users have selected. Need colored selection borders with user labels. | Medium | 🟡 High |
| 9 | **Version History Timeline** | Figma, Google Docs | No version history UI. Need visual timeline with thumbnails, diff view, one-click restore. | Medium | 🟡 High |
| 10 | **Global Component Sync** | Figma, Sketch | Changing master doesn't propagate to instances. Need live sync with property diff tracking. | High | 🔴 Critical |
| 11 | **Drag-and-Drop File Import** | All | Only useFileHandler.ts exists. Need native drag-drop from OS file manager to canvas. | Low | 🟡 High |
| 12 | **Keyboard Shortcut Overlay** | Figma, Canva | Hold `?` or `Cmd+/` to see floating shortcut cheat sheet. 200 lines of code. | Low | 🟡 High |

### TIER 2: Competitive Parity (12 Features)
*These bring Kreathief to Figma/Canva feature level.*

| # | Feature | Competitors | Why It Matters | Complexity | Impact |
|---|---------|------------|---------------|------------|--------|
| 13 | **Plugin API + Manifest** | Figma (3,000+ plugins) | No extension system. Need: plugin manifest, sandboxed iframe, lifecycle hooks, marketplace. | High | 🔴 Critical |
| 14 | **Constraint-Based Layout** | Figma (constraints), Sketch | Need left/right/top/bottom/center anchors with responsive resizing. | Medium | 🟡 High |
| 15 | **Multi-Model AI Router** | Kittl, Playground | Only Gemini + Freepik. Add: OpenAI DALL-E, Stability SDXL, Ideogram, Recraft. User picks model. | Medium | 🟡 High |
| 16 | **Template Marketplace** | Canva (100M+) | Only 29 baked-in templates. Need community upload + import + rating + trending. | High | 🔴 Critical |
| 17 | **Asset Favorites/Collections** | Canva, Figma | No way to save favorite assets. Need: star icon, collections, recently used, smart folders. | Low | 🟡 High |
| 18 | **Cross-Provider Asset Search** | Canva | 4 stock photo providers but no unified search. Need: search all providers simultaneously. | Medium | 🟡 High |
| 19 | **Design Token Export** | Figma (JSON), Penpot (CSS) | Tokens exist in tailwind.config but can't be exported. Need: JSON, CSS variables, Sketch palette. | Low | 🟡 High |
| 20 | **Auto-Trace / Vectorize** | Illustrator, Recraft | vectorizerService.ts exists. Need: better edge detection, color quantization, one-click clean SVG. | Medium | 🟡 High |
| 21 | **Responsive Breakpoints** | Figma, Webflow | Need mobile/tablet/desktop breakpoints with responsive preview. | High | 🟡 High |
| 22 | **Text-to-HTML/CSS Export** | Webflow, Magic Patterns | Export design as clean HTML+CSS or React components. | High | 🟡 High |
| 23 | **Smart Guides + Measurement** | Figma, Illustrator | Need: alignment guides, distance measurement labels, angle indicators during transform. | Medium | 🟡 High |
| 24 | **Layer Search + Filter** | Figma, Canva | No way to search layers by name/type/color. Need: fuzzy search, type filter, locked filter. | Low | 🟡 High |

### TIER 3: Differentiation (10 Features)
*These make Kreathief uniquely better than every competitor.*

| # | Feature | Competitors | Why It Matters | Complexity | Impact |
|---|---------|------------|---------------|------------|--------|
| 25 | **AI Design Assistant (In-Canvas)** | Figma (basic), Canva (basic) | AI agent ON the canvas: select objects → "make this magazine cover" → AI rearranges/applies effects live. | High | 🔴 Critical |
| 26 | **One-Click Brand Apply** | Canva ($120/yr Brand Kit) | Upload logo + pick 3 colors → every template auto-adjusts. AI does the adaptation. | Medium | 🔴 Critical |
| 27 | **Instant Social Preview** | None do this well | Click export → see Instagram feed, story, TikTok, Twitter card, LinkedIn mockup with UI chrome. | Low | 🟡 High |
| 28 | **Native SVG AI Generation** | Recraft ($20/mo) | Only Recraft does this. Add AI→editable vector paths (not raster→vector trace). | High | 🔴 Critical |
| 29 | **AI-Powered Smart Selection** | Photoshop (Object Select) | Click on canvas → AI detects object boundaries → select/extract/move. | High | 🟡 High |
| 30 | **Generative Fill** | Photoshop, Firefly | Select area → describe what you want → AI fills it. Extend/correct/complete images. | High | 🔴 Critical |
| 31 | **Cross-Device Sync with Handoff** | None | Start design on phone → continue on desktop → present on tablet. Automatic state sync. | High | 🟡 High |
| 32 | **AI Color Palette from Image** | Coolors, Adobe Color | Upload photo → AI extracts harmonious palette with named colors (brand-ready). | Low | 🟡 Medium |
| 33 | **Voice-to-Design** | None | "Create an Instagram post for a coffee shop launch with warm tones" → full design generated. | High | 🟡 High |
| 34 | **Animation/Motion Design** | After Effects (basic), Lottie | Add keyframe animations to any element. Export as CSS, Lottie, or MP4. | High | 🟡 High |

### TIER 4: GOAT Status (6 Features)
*These are features NO competitor has. The "unfair advantages."*

| # | Feature | Competitors | Why It Matters | Complexity | Impact |
|---|---------|------------|---------------|------------|--------|
| 35 | **Design-to-Code Pipeline** | Webflow (web only) | Export ANY design as: React/Vue/Svelte components + Tailwind CSS + Figma tokens + Storybook. Not just web. | High | 🔴 Critical |
| 36 | **AI Creative OS (Agent Swarm)** | None | Multiple AI agents collaborate: Creative generates, Critic reviews, Performance scores, Brand enforcer checks compliance. User describes intent, agents execute. | High | 🔴 Critical |
| 37 | **Universal File Compatibility** | Photopea (PSD), Penpot (SVG) | Open/edit: PSD, AI, Sketch, XD, Figma, PDF, SVG, CDR. Convert between any formats. | High | 🔴 Critical |
| 38 | **Real-Time Multiplayer with CRDT** | Figma (OT) | True CRDT-based editing with branching, merging, conflict resolution. Better than Figma's OT approach. | Very High | 🔴 Critical |
| 39 | **AI-Native Asset Marketplace** | None (Canva has manual) | Creators upload designs → AI curates/organizes → users discover via AI recommendations → revenue share. | High | 🔴 Critical |
| 40 | **Offline-First AI** | None | Run AI models ON DEVICE via WebGPU/WASM. Background removal, style transfer, object detection without internet. | Very High | 🔴 Critical |

---

## PART 4: PRIORITY ROADMAP

### Phase 1: Foundation (Weeks 1-4) — "Fix the Floor"
*Quick wins that fix existing broken features.*

| Week | Tasks | Commit Goal |
|------|-------|-------------|
| W1 | Fix sort bug (communityService:40), String() coercion (React #185), wire dead kerning/ligatures/tracking to CSS, kill .bak file, delete heavyWorkerService.ts duplicate | 5 commits |
| W2 | Bitmap canvas caching (offscreen canvas for static layers), requestAnimationFrame batching, object pooling for 1000+ layers | 3 commits |
| W3 | Fix auto-layout: runtime layout engine that actually repositions children, wrap/fill/hug modes, constraints | 4 commits |
| W4 | Keyboard shortcut overlay (`?` to show), drag-drop file import, layer search/filter | 3 commits |

### Phase 2: Professional (Weeks 5-10) — "Join the Big Leagues"
*Features that make professionals take Kreathief seriously.*

| Week | Tasks |
|------|-------|
| W5-6 | Prototype system: hotspot linking, transitions (fade/slide/zoom), device frames, prototype player |
| W7-8 | Component variants: per-property overrides, variants panel, properties panel, global master sync |
| W9-10 | CRDT collaboration: proper conflict resolution, selection awareness, version history timeline |

### Phase 3: Differentiation (Weeks 11-16) — "Why They Switch"
*Features that make Kreathief uniquely better.*

| Week | Tasks |
|------|-------|
| W11-12 | AI Design Assistant on canvas: select → describe → AI modifies live |
| W13-14 | Template marketplace: upload, discover, rating, trending, African market focus |
| W15-16 | Multi-model AI router: user picks Gemini/DALL-E/Stability/Ideogram/Recraft per task |

### Phase 4: GOAT (Weeks 17-24) — "The Unfair Advantages"
*Features no competitor has.*

| Week | Tasks |
|------|-------|
| W17-18 | Design-to-code: React/Vue/Svelte + Tailwind export from any design |
| W19-20 | Universal file compatibility: open PSD, AI, Sketch, XD, Figma files |
| W21-22 | AI Asset Marketplace: creator upload → AI curation → discovery → revenue share |
| W23-24 | Offline-first AI via WebGPU: background removal, style transfer, object detection on-device |

---

## PART 5: SUCCESS METRICS

| Metric | Current | 3-Month Target | 6-Month Target |
|--------|---------|---------------|---------------|
| Canvas object limit (smooth) | ~200 | 1,000 | 5,000 |
| Auto-layout | Dead UI | Functional | On-par with Figma |
| Prototyping | None | Basic hotspots | Full interactive prototypes |
| Components | Clone-only | Global sync + variants | On-par with Figma |
| Collaboration | Broadcast-only | CRDT conflict resolution | Better than Figma |
| AI models | 2 (Gemini, Freepik) | 5 (+DALL-E, Stability, Ideogram) | 8+ |
| Templates | 29 | 200 (community) | 1,000+ |
| Export formats | 6 | 8 (+EPS, AI) | 12+ |
| Plugin system | None | Plugin API + 10 plugins | 100+ marketplace |
| Test coverage | 6% | 40% | 70% |
| User score | 6.3/10 | 7.5/10 | 9.0/10 |

---

## PART 6: THE GOAT FORMULA

```
KREATHIEF = Browser Access (Canva ease)
           + Offline First (Lunacy independence)
           + AI Native (Midjourney power)
           + Vector Pro (Illustrator precision)
           + Collab Real-Time (Figma multiplayer)
           + Free Tier (Penpot generosity)
           + Plugin Ecosystem (Figma extensibility)
           + African Market (Unique positioning)
           + Design-to-Code (Webflow pipeline)
           + Open Source DNA (Penpot transparency)
```

**No tool in the world has all 10. Kreathief can be the first.**

---

## APPENDIX A: CODEBASE HEALTH

| Metric | Status |
|--------|--------|
| TypeScript errors | 0 |
| ESLint errors | 0 |
| Test coverage | 6% (17/370 files) |
| Dead code | Minimal (only auto-layout UI is dead) |
| Console.logs in prod | 108 (need cleanup) |
| `as any` casts | 601 (need type safety) |
| Hardcoded colors | 27 hex values in 6 files |
| Hardcoded z-index | 25 values (semantic scale exists) |
| Empty catch blocks | 17 (need proper error handling) |
| CORS fallback to localhost | Yes (production risk) |

## APPENDIX B: USER COMPLAINT SUMMARY (from 2,000+ reviews)

| Rank | Complaint | Frequency | Kreathief Advantage |
|------|-----------|-----------|-------------------|
| 1 | **Performance at scale** | 17/1502 Figma reviews | Viewport culling + workers (need bitmap caching) |
| 2 | **Premium paywalls** | 11/501 Canva reviews | Free tier with full features |
| 3 | **Limited advanced features** | 18/501 Canva reviews | Vector + pen tool + boolean ops |
| 4 | **Offline broken** | 4/1502 Figma reviews | Full IndexedDB + Supabase hybrid |
| 5 | **Steep learning curve** | 8/1502 Figma reviews | Dark-first clean UI |
| 6 | **Export painful** | Multiple | Batch export + SVG + PSD + PDF + CMYK |
| 7 | **AI inaccurate** | 4/501 Canva reviews | Multi-agent pipeline (creative + critic + performance) |
| 8 | **Generic templates** | Multiple | African market templates (unique) |
| 9 | **No precise pixel control** | Multiple | Full pen tool + path editor |
| 10 | **Organization chaos** | Multiple | Template + brand kit + favorites system |

---

*This PRD is a living document. Update as features ship.*
