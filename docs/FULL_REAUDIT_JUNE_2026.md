# Kreathief Full Re-Audit — June 26, 2026

## Codebase Stats
- **438 files** | **94,673 lines** | **50 services** | **182 components** | **19 hooks** | **22 store slices**
- **65 test files** | **6% test coverage** | **2 TODO/FIXME** | **535 `as any` casts** | **28 createObjectURL / 14 revoke (14 leaks)**

---

## CRITICAL: App Crashes on Load

**Error:** "Maximum update depth exceeded" — infinite React re-render loop.
**Status:** PRE-EXISTING — crashes with original code too (verified via git stash test).
**Root Cause:** Unknown — needs React DevTools Profiler to identify the component cycling.
**Impact:** App is unusable in E2E tests and potentially in production.

---

## 1. STABILITY SCORES

| Area | Score | Issues |
|------|-------|--------|
| **App Startup** | 2/10 | Crashes with infinite loop on load |
| **Canvas Rendering** | 7/10 | Viewport culling works, 300-layer cap, but no bitmap caching |
| **State Management** | 6/10 | Zustand works but 535 `as any` casts hide type errors |
| **History (Undo/Redo)** | 7/10 | Fixed batch leak, deep clone, selection preservation. Pre-existing infinite loop may mask issues |
| **Export System** | 8/10 | All 6 formats working. PSD rotation/groups/gradients fixed. SVG XSS fixed |
| **AI Services** | 7/10 | Multi-agent pipeline works. 14 URL memory leaks in freepikService |
| **Collaboration** | 6/10 | Basic cursors/presence work. No CRDT, no conflict resolution |
| **Offline** | 7/10 | IndexedDB + Supabase hybrid. Sync queue works |
| **Mobile/Touch** | 6/10 | Touch hooks exist. Drawing on mobile broken (no touch event listeners on canvas) |
| **Testing** | 2/10 | 65 test files but 6% coverage. E2E tests crash on load |
| **Accessibility** | 5/10 | ARIA labels exist on modals. No screen reader testing. No focus management |
| **Performance** | 5/10 | Viewport culling exists. No bitmap caching. No requestAnimationFrame batching |

---

## 2. CRITICAL BUGS (Fix Immediately)

### BUG 1: App crashes on load — "Maximum update depth exceeded"
- **Impact:** App completely unusable
- **Status:** Pre-existing, not from our changes
- **Fix:** Need React DevTools Profiler to find the cycling component

### BUG 2: 14 URL memory leaks (createObjectURL without revoke)
- **Files:** freepikService.ts (7), storageService.ts (2), ElementsPanel.tsx (4), MockupPanel.tsx (2), PaletteGenerator.tsx (1), VectorizerPanel.tsx (1)
- **Impact:** Browser tab memory grows unbounded, eventually crashes
- **Fix:** Add `setTimeout(() => URL.revokeObjectURL(url), 300000)` after each createObjectURL

### BUG 3: 535 `as any` casts
- **Impact:** Type safety completely bypassed. Runtime errors hidden until crash
- **Fix:** Gradually remove casts, add proper types

### BUG 4: Eraser draws on empty overlay canvas
- **File:** useDrawingMode.ts:176
- **Impact:** Eraser tool does nothing visible
- **Fix:** Need canvas compositing redesign

### BUG 5: Touch drawing completely broken on mobile
- **File:** useCanvasInteractions.ts — only registers mousemove/mouseup
- **Impact:** Mobile users cannot draw or drag layers
- **Fix:** Add touch event listeners (reverted due to infinite loop investigation)

### BUG 6: Eyedropper samples wrong canvas
- **File:** useDrawingMode.ts:144
- **Impact:** Always picks black/transparent instead of actual color
- **Fix:** Already partially fixed (samples from artboard canvas)

### BUG 7: Pressure sensitivity always 0.5
- **File:** useDrawingMode.ts:198
- **Impact:** Stylus/tablet users get no pressure variation
- **Fix:** Need PointerEvent migration

---

## 3. HIGH-PRIORITY IMPROVEMENTS

### Performance
| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 1 | No bitmap caching for static layers | Use OffscreenCanvas to cache rendered layers | 3-5 days |
| 2 | No requestAnimationFrame batching | Batch render calls for smoother FPS | 1-2 days |
| 3 | Sequential image loading in export | Parallelize image loads | 1 day |
| 4 | 300ms delay between batch exports | Remove artificial delay | 1 hour |
| 5 | Enhanced mockups library 779 lines eagerly imported | Lazy load | 1 hour |

### Code Quality
| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 6 | 535 `as any` casts | Add proper types gradually | Ongoing |
| 7 | 14 URL memory leaks | Add revokeObjectURL after each createObjectURL | 2 hours |
| 8 | 2 dead code files (heavyWorkerService, exportWorker) | Delete | 1 hour |
| 9 | 2 duplicate matrix math implementations | Consolidate | 2 hours |
| 10 | 2 logging systems (logger.ts, log.ts) | Consolidate | 2 hours |

### Features
| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 11 | Auto-layout runtime engine not integrated | Wire computeAutoLayout into CanvasLayerRenderer | 1 day |
| 12 | Component instances don't sync with master | Wire syncComponentInstances to updateLayer | 1 day |
| 13 | No font search input in TextPanel | Already added (verify works) | Done |
| 14 | No keyboard shortcut overlay | Already exists (Cmd+/) | Done |
| 15 | Command palette already works | Verify Ctrl+K opens | Done |

---

## 4. MEDIUM-PRIORITY IMPROVEMENTS

### Architecture
| # | Issue | Impact |
|---|-------|--------|
| 16 | Flat layers[] instead of scene graph tree | Groups, masks, nesting limited |
| 17 | No CRDT for collaboration | Concurrent edits cause data loss |
| 18 | No prototyping system | Can't create interactive prototypes |
| 19 | No plugin system | Can't extend with third-party tools |
| 20 | Design tokens not exportable | Can't share tokens with developers |

### UX
| # | Issue | Impact |
|---|-------|--------|
| 21 | No export preview/thumbnail | Users don't know what they're exporting |
| 22 | No file size estimation | Users surprised by large exports |
| 23 | No export cancellation | Stuck waiting for large exports |
| 24 | No drag-and-drop from OS to canvas | Can't drop files directly |
| 25 | No layer search/filter | Hard to find layers in complex designs |

### Export
| # | Issue | Impact |
|---|-------|--------|
| 26 | No vector text in PDF | All text rasterized |
| 27 | No EPS/AI format export | Can't open in Illustrator |
| 28 | No 300 DPI auto-scale | Print export needs manual DPI setting |
| 29 | No progressive JPEG | Large JPEGs load slowly |
| 30 | No lossless WebP | Can't export quality WebP |

---

## 5. LOW-PRIORITY POLISH

| # | Issue | Impact |
|---|-------|--------|
| 31 | Duplicate color in palette (#800000) | Fixed |
| 32 | Save style callback is dead code | Users can't save text styles |
| 33 | Share modal button text misleading | "Copy Invite Text" vs "Copy Invite Link" | Fixed |
| 34 | Image reposition has no clean exit | Escape key now exits | Fixed |
| 35 | Presence heartbeat missing | Ghost users stay "online" |
| 36 | Freepik isConfigured() always returns true | Phantom fallbacks |
| 37 | No dark/light mode toggle | Dark-only UI |
| 38 | Font defaults scattered (124 hardcoded) | Should use CSS variables |
| 39 | Z-index values ad-hoc (25 different) | Semantic scale exists but unused |
| 40 | No version history visual timeline | Can't see design evolution |

---

## 6. SECURITY ISSUES

| # | Issue | Severity | File |
|---|-------|----------|------|
| 41 | SVG XSS via image href | High | exportService.ts:386 — Fixed |
| 42 | SSRF blocklist incomplete | Medium | export-cmyk.ts — Fixed |
| 43 | CMYK temp files publicly accessible | Medium | exportService.ts:70 |
| 44 | Share password unsalted SHA-256 | Medium | shareService.ts:33 |
| 45 | QA bypass persists in localStorage | Low | authService.ts:148 |
| 46 | SVG escapeXml missing single quote | Low | exportService.ts — Fixed |

---

## 7. RECOMMENDED PRIORITY ORDER

### Week 1: Fix What's Broken
1. **Find and fix the infinite loop** — React DevTools Profiler
2. **Fix 14 URL memory leaks** — Add revokeObjectURL
3. **Fix touch drawing on mobile** — Add touch event listeners
4. **Fix eraser tool** — Canvas compositing redesign

### Week 2: Stability
5. **Remove critical `as any` casts** — Focus on store slices
6. **Add error boundaries to all panels** — Prevent cascade crashes
7. **Fix export edge cases** — Empty layers, missing fonts, large canvases
8. **Add loading states** — All async operations need spinners

### Week 3: Performance
9. **Bitmap canvas caching** — OffscreenCanvas for static layers
10. **requestAnimationFrame batching** — Smooth 60fps rendering
11. **Parallel image loading** — Export and canvas rendering
12. **Lazy load heavy modules** — Mockups library, AI services

### Week 4: Features
13. **Auto-layout integration** — Wire runtime engine
14. **Component sync** — Master→instance propagation
15. **Export preview** — Thumbnail before download
16. **Layer search** — Fuzzy search in layers panel
