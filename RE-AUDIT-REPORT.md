# Kreathief Full Re-Audit Report
**Date:** 2026-06-26
**Scope:** Store/State, Services/API/Security, UI/Components/UX

---

## CRITICAL (Fix Immediately)

| # | Issue | File | Impact |
|---|-------|------|--------|
| 1 | **OpenRouter API key exposed to client bundle** | `services/openRouterService.ts:58,141` | Key visible in DevTools + built JS. Must use server proxy. |
| 2 | **CommandPalette crashes on search** | `components/modals/CommandPalette.tsx:509` | `Icon` variable undefined in search branch → runtime crash |
| 3 | **`reset()` is incomplete** | `store/useStore.ts:48-104` | 30+ state fields not reset (mode, crop, comments, etc.) |
| 4 | **`runBatched` doesn't call endBatch on sync throw** | `store/batch.ts:7-15` | Batch depth permanently incremented → saveToHistory never saves again |
| 5 | **`addToast` called with wrong shape** | `store/slices/projectSlice.ts:186` | Toast displays `[object Object]` instead of message |
| 6 | **Keyboard shortcut `'v'` bound 3 times** | `Editor.tsx:310,219,524` | Conflicting priority — select/paste/flip all on 'v' |

## HIGH (Fix Before Launch)

| # | Issue | File | Impact |
|---|-------|------|--------|
| 7 | **XSS via dangerouslySetInnerHTML** | `components/panels/ElementsPanel.tsx:492` | SVG data injected as HTML — arbitrary code execution |
| 8 | **SSRF incomplete hostname blocklist** | `api/export-cmyk.ts:86-110` | DNS rebinding, IPv6 bypass |
| 9 | **OpenRouter proxy has no model allowlist** | `api/openrouter.ts:56` | Attacker can call any expensive model |
| 10 | **5 non-functional CTA buttons** | `LandingPage.tsx:81`, `FinalCTA.tsx:62`, etc. | "Sign In", "Watch Demo", "Claim Account" do nothing |
| 11 | **Group name always "Group 1"** | `store/slices/layer/groupingSlice.ts:17` | Counter checks new UUID that never matches |
| 12 | **`addShapeLayer` ID collision** | `store/slices/layer/crudSlice.ts:329` | Uses `Date.now()` — two shapes in same ms = same ID |
| 13 | **`canvasFilters` reset on image upload** | `hooks/useFileHandler.ts:96-108` | Destroys custom filter settings |
| 14 | **vectorizeLayer deletes original before confirming** | `store/slices/aiSlice.ts:140,182` | If fallback fails, both original and vector lost |
| 15 | **`isMobile` computed once on mount** | `Editor.tsx:121` | Never updates on resize/rotation |
| 16 | **`CreateProjectModal` spinner never resets** | `components/modals/CreateProjectModal.tsx:46` | `setIsCreating(true)` never reset to false |
| 17 | **Store exposed on window in production** | `Editor.tsx:72-78` | `(window as any).useStore = useStore` |
| 18 | **Share modal "invite" is fake** | `components/modals/ShareModal.tsx:57` | "In a real app" comment — misleading |
| 19 | **Group/Ungroup buttons are no-ops** | `components/panels/TransformPanel.tsx:348` | Shows success toast but does nothing |
| 20 | **QA bypass flags leaked via config endpoint** | `api/config.ts:27-47` | Any unauthenticated caller can detect QA mode |

## MEDIUM (Fix Before Scale)

### Bugs
| # | Issue | File |
|---|-------|------|
| 21 | `applyAgentVariant` missing try/finally around batch | `store/slices/agentSlice.ts:147` |
| 22 | Nested `set()` inside `set()` updater | `store/slices/uiSlice.ts:405` |
| 23 | `aiAssistantSlice` accesses `window` at module load | `store/slices/aiAssistantSlice.ts:39` |
| 24 | Autosave recovery references legacy format | `hooks/useEditorLogic.ts:94` |
| 25 | Community sort order inverted | `services/communityService.ts:40` |
| 26 | `useContextualPanels` duplicate tab | `hooks/useContextualPanels.ts:36` |
| 27 | `ExportModal` failed artboards never populated | `components/modals/ExportModal.tsx:228` |
| 28 | `PresentationModal` stale closure | `components/modals/PresentationModal.tsx:93` |

### Performance
| # | Issue | File |
|---|-------|------|
| 29 | Component sync O(n²) per layer update | `store/slices/layer/crudSlice.ts:386` |
| 30 | `CanvasLayerItemWrapper` creates Map per instance | `components/CanvasLayerItemWrapper.tsx:98` |
| 31 | `useSmartInteraction` runs every render | `hooks/useSmartInteraction.ts:23` |
| 32 | `useAIAssistant` triggers on every artboard change | `hooks/useAIAssistant.ts:30` |
| 33 | `CommandPalette` subscribes to entire store | `components/modals/CommandPalette.tsx:25` |

### Security
| # | Issue | File |
|---|-------|------|
| 34 | Rate limiting broken on serverless (in-memory Maps) | All API routes |
| 35 | Freepik proxy forwards raw payload | `api/freepik.ts:210` |
| 36 | Material Icons fetches full CSS on cold start | `api/materialIcons.ts:24` |
| 37 | Share IDs weak (8 char base36) | `services/shareService.ts:132` |
| 38 | No auth on any API route | All API routes |
| 39 | Missing security headers on API responses | All API routes |

### Memory Leaks
| # | Issue | File |
|---|-------|------|
| 40 | `autoSaveTimer` module-level, never cleaned on unmount | `store/slices/projectSlice.ts:45` |
| 41 | Toast timers not cleaned on unmount | `store/slices/uiSlice.ts:219` |
| 42 | `useAIAssistant` debounce not cancelled on cleanup | `hooks/useAIAssistant.ts:12` |
| 43 | Non-image blob URLs never revoked | `store/slices/uiSlice.ts:170` |
| 44 | 5 timer leaks in ExportModal | `components/modals/ExportModal.tsx` |
| 45 | 2 timer leaks in ShareModal | `components/modals/ShareModal.tsx` |
| 46 | Blob URLs in ElementsPanel never revoked | `components/panels/ElementsPanel.tsx:222` |
| 47 | Blob URLs in PaletteGenerator never revoked | `components/panels/PaletteGenerator.tsx:72` |

### Accessibility
| # | Issue | File |
|---|-------|------|
| 48 | `MagneticButton` missing role/keyboard support | `components/landing/LandingUtils.tsx:7` |
| 49 | 10+ dialogs missing `role="dialog"` | Multiple modals |
| 50 | Range inputs missing `aria-label` | Multiple panels |
| 51 | Keyboard nav doesn't close overlays | `ShortcutOverlay.tsx:77` |

### Dead Code
| # | Issue | File |
|---|-------|------|
| 52 | `handleConvertToPath` is a no-op | `store/slices/aiSlice.ts:453` |
| 53 | `altTextForImages` is a no-op | `store/tools.ts:113` |
| 54 | `useSmartInteraction` suggestions all no-ops | `hooks/useSmartInteraction.ts:30` |
| 55 | `(window as any).toggleShapeBuilder` debug artifact | `hooks/useEditorLogic.ts:356` |
| 56 | `.displayName` after `React.memo()` in 3 files | Multiple components |

---

## FIX ORDER

### Phase 1: Stability (This Week)
1. Fix OpenRouter key exposure — route through server proxy
2. Fix CommandPalette crash
3. Fix `reset()` completeness
4. Fix `runBatched` try/finally
5. Fix `addToast` argument shape
6. Fix keyboard shortcut conflicts
7. Fix `CreateProjectModal` spinner stuck
8. Fix `addShapeLayer` ID collision → use uuidv4()

### Phase 2: Security (Next Week)
1. Add XSS sanitization for SVG data
2. Add model allowlist to OpenRouter proxy
3. Fix SSRF in CMYK export
4. Add auth to API routes
5. Remove QA bypass from config endpoint
6. Remove `window.useStore` from production
7. Add security headers to API responses

### Phase 3: UX Polish (Week 3)
1. Wire up all CTA buttons on landing page
2. Fix ShareModal invite flow
3. Fix Group/Ungroup no-ops
4. Fix ExportModal failure toast
5. Fix community sort order
6. Fix `isMobile` reactivity
7. Add error boundaries to all modals

### Phase 4: Performance (Week 4)
1. Optimize component sync O(n²)
2. Lift `layerMap` to parent in CanvasLayerItemWrapper
3. Fix CommandPalette store subscription
4. Add `useShallow` to all store hooks
5. Memoize Dashboard miniature renders
6. Lazy-load SidePanel imports

### Phase 5: Code Quality (Ongoing)
1. Remove dead code (no-op functions, debug artifacts)
2. Fix all memory/timer leaks
3. Add aria-labels to all interactive elements
4. Remove all `as any` casts
5. Add error boundaries to all modals
