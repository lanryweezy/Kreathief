# Code Quality Improvements Implementation Guide

## Overview

This document outlines the implementation of four critical code quality improvements:
1. ✅ Configuration Management
2. ✅ Logging Strategy  
3. ⏳ State Normalization
4. ⏳ Code Documentation

---

## 1. Configuration Management ✅ COMPLETE

### What Was Done

Created a centralized configuration system in `config/index.ts` that:
- Consolidates all environment variables
- Provides type-safe access to configuration
- Validates required credentials at runtime
- Organizes settings by domain (APIs, storage, canvas, performance, etc.)

### File Structure
```
config/
  index.ts          # Main configuration file
```

### Usage Examples

#### Before (Hardcoded Values)
```typescript
// ❌ BAD - Scattered throughout codebase
const DB_NAME = 'kreathief_db';
const DB_VERSION = 3;
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const autoSaveInterval = 10000;
```

#### After (Centralized Config)
```typescript
// ✅ GOOD - Import from config
import { storage, ai, performance } from '../config';

const DB_NAME = storage.indexedDB.name;
const DB_VERSION = storage.indexedDB.version;
const apiKey = ai.gemini.apiKey;
const autoSaveInterval = performance.autoSaveInterval;
```

### Migration Steps

1. **Identify hardcoded values** in your services:
   ```bash
   grep -r "import.meta.env.VITE_" services/ components/
   grep -r "const.*=.*'[0-9]'" utils/ services/
   ```

2. **Add to config** if they're application-wide constants

3. **Update imports** gradually, starting with services

4. **Test thoroughly** - config changes affect many files

### Configuration Categories

| Category | Purpose | Example Keys |
|----------|---------|-------------|
| `app` | Application metadata | name, version, environment |
| `supabase` | Database credentials | url, anonKey, schema |
| `ai` | AI service settings | gemini.apiKey, model |
| `apis` | External API configs | unsplash, streamline, freepik |
| `storage` | Storage settings | indexedDB, localStorage keys |
| `canvas` | Canvas defaults | dimensions, zoom limits |
| `performance` | Performance tuning | autoSaveInterval, debounceDelay |
| `ui` | UI preferences | toastDuration, sidebar widths |
| `features` | Feature flags | enableAI, enableBetaFeatures |
| `security` | Security settings | sessionTimeout, passwordMinLength |

---

## 2. Logging Strategy ✅ COMPLETE

### What Was Done

Enhanced logging capabilities with:
- Structured logging utility (`utils/log.ts`)
- Drop-in replacement for `console.log`
- Automatic performance timing
- Error tracking with context
- User action tracking

### File Structure
```
services/
  logger.ts         # Core logging service (enhanced)
utils/
  log.ts           # Convenience wrapper
```

### Usage Examples

#### Basic Logging
```typescript
import { log } from '../utils/log';

// Instead of console.log
log.info('User logged in', { userId: user.id });

// Error handling
try {
  await saveProject(project);
} catch (error) {
  log.error('Failed to save project', error, { projectId: project.id });
}

// Debug info (only in dev mode)
log.debug('Canvas rendered', { layers: layers.length, zoom });
```

#### Performance Timing
```typescript
// Manual timing
const end = log.timer('exportImage');
await exportService.exportPNG(canvas);
end(); // Automatically logs duration

// Or async wrapper
const loggedExport = log.wrapAsync('exportPNG', exportService.exportPNG);
await loggedExport(canvas);
```

#### User Action Tracking
```typescript
// Track what users do
log.action('create_text_layer', { 
  font: 'Inter', 
  size: 24,
  position: { x: 100, y: 100 }
});

log.action('save_project', { 
  projectId, 
  layerCount: layers.length,
  duration: Date.now() - startTime
});
```

#### Function Wrapping
```typescript
import { wrap, wrapAsync } from '../utils/log';

// Wrap sync functions
const processImage = wrap('processImage', (img) => {
  // ... image processing
  return processed;
});

// Wrap async functions
const fetchData = wrapAsync('fetchData', async (url) => {
  const response = await fetch(url);
  return response.json();
});
```

### Migration Steps

1. **Import the log utility**:
   ```typescript
   import { log } from '../utils/log';
   ```

2. **Replace console statements** gradually:
   ```typescript
   // Find all console.log
   console.log('Saving project...'); 
   
   // Replace with structured logging
   log.info('Saving project...', { projectId });
   ```

3. **Add context** to make logs more useful:
   ```typescript
   // Before
   console.error('Export failed');
   
   // After
   log.error('Export failed', error, { 
     format: 'PNG', 
     size: '1920x1080',
     layerCount: layers.length 
   });
   ```

### Log Levels Guide

| Level | When to Use | Shows in Dev | Shows in Prod |
|-------|-------------|--------------|---------------|
| `debug` | Detailed troubleshooting | ✅ | ❌ |
| `info` | General information | ✅ | ✅ |
| `warn` | Unexpected but handled | ✅ | ✅ |
| `error` | Something broke | ✅ | ✅ |

---

## 3. State Normalization ⏳ IN PROGRESS

### Current State Architecture

The app uses Zustand with 8 slices:
- `UISlice` - UI state (modals, toasts, tabs)
- `CanvasSlice` - Canvas properties
- `DrawingSlice` - Drawing tools state
- `LayerSlice` - Layer management (994 lines!)
- `ProjectSlice` - Project data
- `HistorySlice` - Undo/redo
- `AISlice` - AI generation state
- `BrandSlice` - Brand kits

### Recommended Improvements

#### Problem: Layer Slice is Too Large

At 994 lines, the layer slice handles too many responsibilities.

**Solution: Split into focused modules**

```typescript
// store/slices/layerSlice.ts (keep core CRUD)
export const createLayerSlice = (set, get, store) => ({
  addLayer,
  updateLayer,
  deleteLayer,
  reorderLayers,
  // ... basic operations only
});

// store/slices/layerGroupingSlice.ts (extract grouping logic)
export const createLayerGroupingSlice = (set, get, store) => ({
  groupSelected,
  ungroupSelected,
  setGroupId,
  // ... grouping operations
});

// store/slices/layerAutoLayoutSlice.ts (extract auto-layout)
export const createLayerAutoLayoutSlice = (set, get, store) => ({
  applyAutoLayout,
  updateAutoLayoutSettings,
  // ... layout calculations
});
```

#### Problem: No State Selectors

Components subscribe to entire slices instead of specific values.

**Solution: Create selector utilities**

```typescript
// store/selectors/layerSelectors.ts
export const layerSelectors = {
  // Get all layers
  all: (state) => state.layers,
  
  // Get selected layers
  selected: (state) => 
    state.layers.filter(l => state.selectedLayerIds.includes(l.id)),
  
  // Get visible layers only
  visible: (state) => 
    state.layers.filter(l => !l.hidden),
    
  // Get layers by type
  byType: (type) => (state) => 
    state.layers.filter(l => l.type === type),
};

// Usage in components
const visibleLayers = useStore(layerSelectors.visible);
const textLayers = useStore(layerSelectors.byType('text'));
```

#### Problem: Duplicate State Logic

Same calculations repeated across components.

**Solution: Memoized selectors**

```typescript
import { createSelector } from 'reselect';

export const selectVisibleTextLayers = createSelector(
  [layerSelectors.byType('text'), (state) => state.layers],
  (textLayers, allLayers) => 
    textLayers.filter(l => !l.hidden)
);
```

### Migration Steps

1. **Audit current usage**:
   ```bash
   grep -r "useStore" components/ | wc -l
   ```

2. **Create selectors** for commonly used queries

3. **Extract large slices** into focused modules

4. **Add tests** for complex selectors

5. **Document** which selectors to use where

---

## 4. Code Documentation ⏳ IN PROGRESS

### JSDoc Standards

#### Function Documentation

```typescript
/**
 * Exports the current canvas as a PNG image
 * 
 * @param options - Export configuration options
 * @param options.format - Image format (PNG, JPEG, WebP)
 * @param options.quality - Image quality (0-100, default: 100)
 * @param options.scale - Scale factor (1x, 2x, 3x)
 * @returns Promise resolving to Blob containing the image data
 * 
 * @throws {ExportError} If export fails due to memory constraints
 * @throws {ValidationError} If options are invalid
 * 
 * @example
 * const blob = await exportCanvas({
 *   format: 'PNG',
 *   quality: 95,
 *   scale: 2
 * });
 */
export const exportCanvas = async (options: ExportOptions): Promise<Blob> => {
  // Implementation
};
```

#### Complex Type Documentation

```typescript
/**
 * Represents a design layer on the canvas
 * 
 * Layers are the fundamental building blocks of designs.
 * Each layer has common properties (position, rotation, opacity)
 * and type-specific properties (text content, shape path, image source).
 * 
 * @template T - The layer type discriminator
 */
export interface Layer<T extends LayerType = LayerType> {
  /** Unique identifier for this layer */
  id: string;
  
  /** Type of layer (text, shape, image, vector) */
  type: T;
  
  /** X position in canvas coordinates */
  x: number;
  
  /** Y position in canvas coordinates */
  y: number;
  
  /** Width of the layer in pixels */
  width: number;
  
  /** Height of the layer in pixels */
  height: number;
  
  /** Rotation angle in degrees */
  rotation: number;
  
  /** Opacity value (0-1) */
  opacity: number;
  
  /** Whether layer is visible */
  hidden: boolean;
  
  /** Whether layer is locked from editing */
  locked: boolean;
}
```

#### Component Documentation

```typescript
/**
 * Main canvas rendering component
 * 
 * Handles all canvas interactions including:
 * - Layer selection and manipulation
 * - Resize and rotation handles
 * - Drawing and vector editing
 * - Snap-to-grid and alignment guides
 * - Touch gestures and keyboard shortcuts
 * 
 * @example
 * <Canvas
 *   zoom={zoom}
 *   layers={layers}
 *   selectedLayerId={selectedId}
 *   onSelectLayer={handleSelect}
 * />
 * 
 * @remarks
 * This component uses requestAnimationFrame for smooth rendering.
 * Avoid passing new object references as props on every render.
 */
export const Canvas: React.FC<CanvasProps> = ({ ... }) => {
  // Implementation
};
```

### Files Needing Documentation Priority

Based on complexity and size:

1. **Canvas.tsx** (2557 lines) - CRITICAL
2. **Editor.tsx** (1690 lines) - HIGH  
3. **store/slices/layerSlice.ts** (994 lines) - HIGH
4. **services/geminiService.ts** (652 lines) - MEDIUM
5. **utils/booleanOperations.ts** - MEDIUM
6. **utils/vectorUtils.ts** - MEDIUM

### Documentation Template

Create `.md` files alongside complex code:

```markdown
# Canvas Component Architecture

## Overview
The Canvas component handles all visual rendering and user interaction.

## Key Responsibilities
- Layer rendering order
- Hit detection for selection
- Transform controls (resize, rotate)
- Drawing tools
- Vector path editing

## Performance Optimizations
- Memoized layer computations
- Debounced event handlers
- Selective re-rendering

## Known Issues
- Re-renders all layers on any change
- No virtual scrolling for 1000+ layers
```

---

## Next Steps

### Immediate (This Week)

1. ✅ **Config System** - DONE
2. ✅ **Logging Utility** - DONE  
3. ⏳ **Update geminiService** to use new logging
4. ⏳ **Update storageService** to use config
5. ⏳ **Document Canvas.tsx** main functions

### Short Term (This Month)

6. Split layerSlice into smaller modules
7. Add selectors for common queries
8. Document all service functions
9. Add JSDoc to utility functions
10. Create architecture documentation

### Long Term (Next Quarter)

11. Consider Redux Toolkit if state gets more complex
12. Add automated documentation generation (TypeDoc)
13. Implement runtime type checking (Zod)
14. Set up error reporting (Sentry)
15. Add performance monitoring dashboards

---

## Tools & Libraries Added

| Tool | Purpose | Status |
|------|---------|--------|
| `config/index.ts` | Centralized configuration | ✅ Complete |
| `utils/log.ts` | Logging wrapper | ✅ Complete |
| Enhanced `logger.ts` | Structured logging | ✅ Complete |
| Selectors (planned) | State normalization | ⏳ Planned |
| JSDoc comments | Documentation | ⏳ In Progress |

---

## Questions or Issues?

Refer to:
- TypeScript types for config structure
- Logger examples in `utils/log.ts`
- Zustand docs for state management best practices
- TypeScript Handbook for JSDoc syntax
