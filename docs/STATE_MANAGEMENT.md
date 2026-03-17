# State Management Guide

## Overview

Kreathief uses **Zustand** for global state management, organized into 8 focused slices.

---

## Store Architecture

### Store Slices

```typescript
// store/useStore.ts - Main store composition
export const useStore = create<StoreState>()((set, get, store) => ({
  ...createUISlice(set, get, store),        // UI state (370 lines)
  ...createCanvasSlice(set, get, store),    // Canvas props (43 lines)
  ...createDrawingSlice(set, get, store),   // Drawing tools (39 lines)
  ...createLayerSlice(set, get, store),     // Layer CRUD (994 lines) ⚠️
  ...createProjectSlice(set, get, store),   // Projects (269 lines)
  ...createHistorySlice(set, get, store),   // Undo/redo (145 lines)
  ...createAISlice(set, get, store),        // AI features (263 lines)
  ...createBrandSlice(set, get, store),     // Brand kits (57 lines)
  
  reset: () => { /* Reset all state */ },
}));
```

### Slice Responsibilities

| Slice | Lines | Purpose | Key Actions |
|-------|-------|---------|-------------|
| `UISlice` | 370 | Modals, toasts, tabs, panels | `setActiveTab`, `addToast`, `openModal` |
| `CanvasSlice` | 43 | Canvas size, zoom, bg color | `setCanvasSize`, `setZoom`, `setZoomToFit` |
| `DrawingSlice` | 39 | Brush settings, eraser | `setBrushType`, `setBrushColor`, `setBrushSize` |
| `LayerSlice` | 994 | Layer operations | `addLayer`, `deleteLayer`, `groupSelected` |
| `ProjectSlice` | 269 | Project save/load | `saveProject`, `loadProject`, `deleteProject` |
| `HistorySlice` | 145 | Undo/redo stack | `undo`, `redo`, `saveToHistory` |
| `AISlice` | 263 | AI generation state | `generateImage`, `enhancePrompt`, `analyzeDesign` |
| `BrandSlice` | 57 | Brand kits | `addBrandKit`, `applyBrandColors`, `updateFonts` |

---

## Usage Patterns

### Basic Usage in Components

```typescript
import { useStore } from '../store/useStore';

// Read state
const layers = useStore((state) => state.layers);
const zoom = useStore((state) => state.zoom);

// Call actions
const setZoom = useStore((state) => state.setZoom);
const addLayer = useStore((state) => state.addLayer);

handleZoomChange = (newZoom) => {
  setZoom(newZoom);
};

handleAddLayer = () => {
  addLayer({
    id: uuidv4(),
    type: 'text',
    x: 100,
    y: 100,
    // ... other properties
  });
};
```

### Selecting Multiple Values

```typescript
// Good - Select only what you need
const { layers, selectedLayerIds, zoom } = useStore(state => ({
  layers: state.layers,
  selectedLayerIds: state.selectedLayerIds,
  zoom: state.zoom,
}));

// Better - Use selectors for derived state
const visibleLayers = useStore(state => 
  state.layers.filter(l => !l.hidden)
);

const selectedLayers = useStore(state => 
  state.layers.filter(l => state.selectedLayerIds.includes(l.id))
);
```

---

## State Normalization Issues

### Current Problems

#### 1. ❌ Layer Slice Too Large (994 lines)

**Problem:** Handles too many responsibilities

**Current Code:**
```typescript
// store/slices/layerSlice.ts - Does everything
export const createLayerSlice = (set, get, store) => ({
  // Basic CRUD
  addLayer,
  updateLayer,
  deleteLayer,
  
  // Grouping logic
  groupSelected,
  ungroupSelected,
  
  // Auto-layout calculations
  applyAutoLayout,
  
  // Layer ordering
  bringToFront,
  sendToBack,
  
  // Selection management
  selectLayer,
  addToSelection,
  removeFromSelection,
  
  // ... 50+ more functions
});
```

**Solution:** Split into focused modules

```typescript
// Proposed structure
store/slices/
  layerSlice.ts          // Core CRUD only (200 lines)
  layerGroupingSlice.ts  // Group operations (150 lines)
  layerOrderingSlice.ts  // Z-index management (100 lines)
  layerSelectionSlice.ts // Selection logic (150 lines)
  layerAutoLayoutSlice.ts // Auto-layout (200 lines)
```

#### 2. ❌ No State Selectors

**Problem:** Components re-render unnecessarily

**Current Code:**
```typescript
// Component subscribes to entire layers array
const layers = useStore((state) => state.layers);

// This causes re-render even if unrelated layer property changes
```

**Better Approach:**
```typescript
// Create selector utilities
export const layerSelectors = {
  all: (state) => state.layers,
  
  byId: (id) => (state) => 
    state.layers.find(l => l.id === id),
  
  byType: (type) => (state) => 
    state.layers.filter(l => l.type === type),
  
  visible: (state) => 
    state.layers.filter(l => !l.hidden),
  
  selected: (state) => 
    state.layers.filter(l => 
      state.selectedLayerIds.includes(l.id)
    ),
};

// Usage
const textLayers = useStore(layerSelectors.byType('text'));
const selectedLayers = useStore(layerSelectors.selected);
```

#### 3. ❌ Duplicate Calculations

**Problem:** Same computations repeated across components

**Example:**
```typescript
// In Canvas.tsx
const selectedBounds = useMemo(() => {
  const selected = layers.filter(l => 
    selectedLayerIds.includes(l.id)
  );
  return calculateBounds(selected);
}, [layers, selectedLayerIds]);

// In FloatingToolbar.tsx - SAME CALCULATION!
const bounds = useMemo(() => {
  const selected = layers.filter(l => 
    selectedLayerIds.includes(l.id)
  );
  return calculateBounds(selected);
}, [layers, selectedLayerIds]);
```

**Solution:** Memoized selectors with Reselect

```typescript
import { createSelector } from 'reselect';

const selectLayers = (state) => state.layers;
const selectSelectedIds = (state) => state.selectedLayerIds;

export const selectSelectedLayers = createSelector(
  [selectLayers, selectSelectedIds],
  (layers, ids) => layers.filter(l => ids.includes(l.id))
);

export const selectSelectedBounds = createSelector(
  [selectSelectedLayers],
  (selected) => calculateBounds(selected)
);

// Now used everywhere without recalculation
const bounds = useStore(selectSelectedBounds);
```

---

## Best Practices

### ✅ DO: Select Specific Values

```typescript
// Good - Specific selection
const canvasSize = useStore((state) => state.canvasSize);

// Bad - Entire slice
const canvasState = useStore((state) => state.canvasSlice);
```

### ✅ DO: Use Memoization for Derived State

```typescript
// Good - Memoized computation
const visibleTextLayers = useMemo(() => {
  return layers.filter(l => 
    l.type === 'text' && !l.hidden
  );
}, [layers]);

// Bad - Computed every render
const visibleTextLayers = layers.filter(l => 
  l.type === 'text' && !l.hidden
);
```

### ✅ DO: Batch Related Updates

```typescript
// Good - Single update
set((state) => ({
  ...state,
  x: newX,
  y: newY,
  rotation: newRotation,
}));

// Bad - Multiple separate updates
setState({ x: newX });
setState({ y: newY });
setState({ rotation: newRotation });
```

### ❌ DON'T: Store Computed Values

```typescript
// Bad - Redundant state
const selectedBounds = useStore((state) => state.selectedBounds); // ❌

// Good - Compute from base state
const selectedBounds = useMemo(() => {
  const selected = layers.filter(l => selectedIds.includes(l.id));
  return calculateBounds(selected);
}, [layers, selectedIds]); // ✅
```

### ❌ DON'T: Mutate State Directly

```typescript
// Bad - Direct mutation
const layers = useStore((state) => state.layers);
layers[0].x = 100; // ❌ DON'T DO THIS

// Good - Immutable update
const updateLayer = useStore((state) => state.updateLayer);
updateLayer(layerId, { x: 100 }); // ✅
```

---

## Performance Optimization

### Problem: Unnecessary Re-renders

**Cause:** Subscribing to entire state when only specific values needed

```typescript
// This re-renders on ANY state change
const state = useStore();

// Better - Subscribe only to needed values
const layers = useStore((state) => state.layers);

// Best - Use shallow comparison for objects
import { shallow } from 'zustand/shallow';

const canvasSize = useStore(
  (state) => state.canvasSize,
  shallow
);
```

### Solution: React.memo for Expensive Components

```typescript
// Wrap expensive components
export const CanvasLayerRenderer = React.memo(({ layer, zoom }) => {
  // Expensive rendering logic
  return <g>{/* ... */}</g>;
}, (prevProps, nextProps) => {
  // Custom comparison
  return (
    prevProps.layer.id === nextProps.layer.id &&
    prevProps.zoom === nextProps.zoom
  );
});
```

---

## Migration Plan

### Phase 1: Add Selectors (Week 1)

1. Identify commonly computed values
2. Create selector utilities
3. Update components to use selectors
4. Measure performance improvement

### Phase 2: Split Large Slices (Week 2-3)

1. Extract grouping logic from LayerSlice
2. Extract auto-layout logic
3. Extract selection management
4. Test each extraction

### Phase 3: Add Reselect (Week 4)

1. Install Reselect library
2. Convert hot paths to memoized selectors
3. Benchmark performance
4. Document patterns

### Phase 4: Optimize Further (Ongoing)

1. Add virtual scrolling for layers
2. Implement spatial indexing
3. Optimize undo/redo memory usage
4. Consider Web Workers for heavy computations

---

## Testing Strategy

### Unit Tests for Slices

```typescript
describe('Layer Slice', () => {
  it('should add layer correctly', () => {
    const { addLayer, layers } = useStore.getState();
    
    addLayer({
      id: 'test-1',
      type: 'text',
      x: 0,
      y: 0,
      // ... required properties
    });
    
    expect(useStore.getState().layers).toHaveLength(
      layers.length + 1
    );
  });
  
  it('should update layer immutably', () => {
    const { updateLayer } = useStore.getState();
    const originalLayer = { /* ... */ };
    
    updateLayer('layer-id', { x: 100 });
    
    // Original should be unchanged in history
    expect(originalLayer.x).not.toBe(100);
  });
});
```

### Integration Tests

```typescript
describe('State Management Integration', () => {
  it('should handle complete workflow', async () => {
    const { addLayer, selectLayer, deleteLayer } = useStore.getState();
    
    // Add layer
    addLayer(textLayer);
    expect(useStore.getState().layers).toHaveLength(1);
    
    // Select layer
    selectLayer(textLayer.id);
    expect(useStore.getState().selectedLayerIds).toContain(
      textLayer.id
    );
    
    // Delete layer
    deleteLayer(textLayer.id);
    expect(useStore.getState().layers).toHaveLength(0);
  });
});
```

---

## Tools & Libraries

### Current Stack

- **Zustand** - State management
- **React** - UI framework
- **TypeScript** - Type safety

### Recommended Additions

- **Reselect** - Memoized selectors
- **Immer** - Immutable updates (built into Zustand)
- **Redux DevTools** - Time travel debugging (Zustand supports this)

---

## Resources

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Reselect Documentation](https://reselect.js.org/)
- [React Performance Docs](https://react.dev/learn/render-and-commit)

---

## Questions?

See `CODE_QUALITY_IMPROVEMENTS.md` or reach out to maintainers.
