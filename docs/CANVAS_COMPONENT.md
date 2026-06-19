# Canvas Component Documentation

## Overview

**File:** `components/Canvas.tsx`  
**Size:** 2,557 lines  
**Complexity:** Very High  
**Purpose:** Main canvas rendering and interaction engine

---

## Core Responsibilities

The Canvas component is the heart of Kreathief's design editor. It handles:

1. **Layer Rendering** - Visual display of all layer types (text, shapes, images, vectors)
2. **User Interactions** - Mouse/touch input for selection, manipulation, and editing
3. **Transform Controls** - Resize, rotation, and positioning handles
4. **Drawing Tools** - Freehand drawing with multiple brush types
5. **Vector Editing** - Path point manipulation and bezier curve control
6. **Snapping & Guides** - Grid alignment and smart guides
7. **Multi-selection** - Group operations on multiple layers
8. **Context Menus** - Right-click actions per layer type
9. **Animation Preview** - Keyframe animation visualization

---

## Component Architecture

### State Management

```typescript
// Core state from Zustand store
const artboards = useStore((state) => state.artboards);
const activeArtboardId = useStore((state) => state.activeArtboardId);
const layers = useMemo(() => activeArtboard?.layers || [], [activeArtboard]);
const selectedLayerIds = useStore((state) => state.selectedLayerIds);
const canvasSize = useStore((state) => state.canvasSize);
const zoom = useStore((state) => state.zoom);
```

### Memoization Strategy

The component uses extensive memoization to optimize performance:

```typescript
// Memoized layer computations
const effectiveLayers = useMemo(() => layers.map((l: Layer) => getEffectiveLayer(l)), [layers, getEffectiveLayer]);

// Memoized snap line calculations
const getSnapLines = useCallback(
  (layers) => {
    // Complex geometry calculations
  },
  [canvasSize, zoom]
);

// Memoized handle positions
const resizeHandles = useMemo(() => calculateResizeHandles(selectedBounds), [selectedBounds, zoom]);
```

---

## Key Functions

### 1. Layer Selection & Hit Detection

```typescript
/**
 * Determines which layer was clicked based on mouse position
 * Uses reverse z-index order (top-most layers first)
 *
 * @param x - Mouse X coordinate in canvas space
 * @param y - Mouse Y coordinate in canvas space
 * @returns Topmost layer ID at position, or null
 */
const getLayerAtPoint = useCallback(
  (x: number, y: number): string | null => {
    // Iterate through layers in reverse order (top to bottom)
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (layer.hidden || layer.locked) continue;

      // Check if point is within layer bounds
      if (isPointInLayer(x, y, layer)) {
        return layer.id;
      }
    }
    return null;
  },
  [layers]
);
```

### 2. Transform Operations

#### Resize Handler

```typescript
/**
 * Handles resize drag operations
 * Updates layer dimensions based on mouse movement and resize handle
 *
 * @param handle - Which corner/edge is being dragged (n, ne, e, se, s, sw, w, nw)
 * @param deltaX - Mouse movement in X direction
 * @param deltaY - Mouse movement in Y direction
 * @param shiftKey - Whether shift key is held (constrains aspect ratio)
 */
const handleResize = useCallback(
  (handle: ResizeHandle, deltaX: number, deltaY: number, shiftKey: boolean) => {
    // Calculate new dimensions based on handle position
    // Apply constraints (min size, aspect ratio)
    // Snap to grid if enabled
    // Update layer via store action
  },
  [zoom, canvasSize, showGrid]
);
```

#### Rotation Handler

```typescript
/**
 * Handles rotation drag operations
 * Calculates angle from layer center to mouse position
 * Snaps to 15° increments when shift is held
 *
 * @param layerId - ID of layer being rotated
 * @param centerX - Center X coordinate for rotation calculation
 * @param centerY - Center Y coordinate for rotation calculation
 * @param mouseX - Current mouse X position
 * @param mouseY - Current mouse Y position
 */
const handleRotate = useCallback(
  (layerId: string, centerX: number, centerY: number, mouseX: number, mouseY: number) => {
    const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
    const degrees = (angle * 180) / Math.PI + 90;

    // Snap to nearest 15° if shift held
    const snapped = shiftKey ? Math.round(degrees / 15) * 15 : degrees;

    updateLayerRotation(layerId, snapped);
  },
  [shiftKey]
);
```

### 3. Drawing System

```typescript
/**
 * Manages freehand drawing mode
 * Creates vector paths based on mouse/touch movement
 * Supports multiple brush types (pen, marker, highlighter, eraser)
 *
 * Brush Characteristics:
 * - Pen: Thin, consistent stroke
 * - Marker: Medium width, slight transparency
 * - Highlighter: Wide, high transparency
 * - Eraser: Removes content
 */
const handleDrawStart = useCallback(
  (x: number, y: number) => {
    if (!drawingMode) return;

    // Create new path layer
    const newPath: VectorPath = {
      id: uuidv4(),
      type: 'path',
      points: [{ x, y }],
      brushType: currentBrush,
      color: brushColor,
      strokeWidth: brushSize,
    };

    addLayer(newPath);
    setIsDrawing(true);
  },
  [drawingMode, currentBrush, brushColor, brushSize]
);

const handleDrawMove = useCallback(
  (x: number, y: number) => {
    if (!isDrawing) return;

    // Add point to current path
    // Throttle points for performance (every 2px)
    // Update path in store
  },
  [isDrawing, throttleDistance]
);
```

### 4. Vector Path Editing

```typescript
/**
 * Enters path editing mode for vector layers
 * Displays control points and bezier handles
 * Allows point manipulation and curve adjustment
 *
 * @param pathId - ID of vector path to edit
 */
const enterPathEditMode = useCallback(
  (pathId: string) => {
    setEditingPathId(pathId);
    const path = layers.find((l) => l.id === pathId) as VectorPath;

    // Display all control points
    // Calculate bezier handles for smooth points
    setSelectedPathPoints(path.points.map((_, i) => i));
  },
  [layers]
);

/**
 * Updates path point position during edit
 * Recalculates bezier curves between points
 *
 * @param pointIndex - Index of point being moved
 * @param newX - New X coordinate
 * @param newY - New Y coordinate
 */
const updatePathPoint = useCallback(
  (pointIndex: number, newX: number, newY: number) => {
    const path = editingPath;
    if (!path) return;

    const updatedPoints = [...path.points];
    updatedPoints[pointIndex] = { x: newX, y: newY };

    // Update adjacent bezier handles for smooth interpolation
    const updatedPath = { ...path, points: updatedPoints };
    onUpdatePath?.(updatedPath);
  },
  [editingPath, onUpdatePath]
);
```

### 5. Snapping System

```typescript
/**
 * Calculates snap lines and target positions
 * Checks against:
 * - Grid lines (if enabled)
 * - Other layer edges
 * - Canvas center
 * - Golden ratio guides (if enabled)
 *
 * @param layerBounds - Bounding box of layer being moved
 * @param otherLayers - All other layers to check against
 * @returns Snap result with offset and visual guides
 */
const calculateSnapping = useCallback(
  (layerBounds: Bounds, otherLayers: Layer[]): SnapResult | null => {
    const snaps: SnapTarget[] = [];

    // Check grid snapping
    if (showGrid) {
      const gridSnap = snapToGrid(layerBounds.x, GRID_SIZE);
      if (Math.abs(layerBounds.x - gridSnap) < SNAP_THRESHOLD) {
        snaps.push({ type: 'grid', position: gridSnap });
      }
    }

    // Check layer edge alignment
    otherLayers.forEach((other) => {
      const otherBounds = getLayerBounds(other);

      // Check left edge alignment
      if (Math.abs(layerBounds.left - otherBounds.left) < SNAP_THRESHOLD) {
        snaps.push({
          type: 'edge',
          side: 'left',
          position: otherBounds.left,
        });
      }

      // Check center alignment
      const layerCenter = layerBounds.left + layerBounds.width / 2;
      const otherCenter = otherBounds.left + otherBounds.width / 2;
      if (Math.abs(layerCenter - otherCenter) < SNAP_THRESHOLD) {
        snaps.push({
          type: 'center',
          position: otherCenter,
        });
      }
    });

    return snaps.length > 0 ? { snaps, apply: applySnaps(snaps) } : null;
  },
  [showGrid, SNAP_THRESHOLD, GRID_SIZE]
);
```

### 6. Multi-Selection System

```typescript
/**
 * Manages selection of multiple layers
 * Shows unified bounding box around all selected items
 * Enables group operations (move, resize, distribute)
 *
 * Selection Modes:
 * - Single click: Select one layer
 * - Ctrl+click: Toggle layer in selection
 * - Shift+click: Range select
 * - Drag select: Box selection
 */
const handleMultiSelectStart = useCallback(
  (e: MouseEvent, layerId: string) => {
    if (e.ctrlKey || e.metaKey) {
      // Toggle selection
      if (selectedLayerIds.includes(layerId)) {
        removeLayerFromSelection(layerId);
      } else {
        addLayerToSelection(layerId);
      }
    } else if (e.shiftKey) {
      // Range select - find layers between
      const lastIndex = selectedLayerIds[selectedLayerIds.length - 1];
      const range = getLayersBetween(lastIndex, layerId);
      setSelection(range);
    } else {
      // Single select
      setSelection([layerId]);
    }
  },
  [selectedLayerIds]
);

/**
 * Calculates combined bounding box for multi-selection
 * Used for transform handles and alignment operations
 */
const getMultiSelectionBounds = useMemo(() => {
  if (selectedLayerIds.length === 0) return null;

  const selectedLayers = layers.filter((l) => selectedLayerIds.includes(l.id));

  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  selectedLayers.forEach((layer) => {
    const bounds = getLayerBounds(layer);
    minX = Math.min(minX, bounds.left);
    minY = Math.min(minY, bounds.top);
    maxX = Math.max(maxX, bounds.right);
    maxY = Math.max(maxY, bounds.bottom);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}, [layers, selectedLayerIds]);
```

### 7. Context Menu System

```typescript
/**
 * Displays context menu on right-click
 * Menu items vary by layer type and selection
 *
 * @param e - Mouse event
 * @param layerId - Target layer ID
 */
const handleContextMenu = useCallback(
  (e: React.MouseEvent, layerId: string) => {
    e.preventDefault();

    // Select layer if not already selected
    if (!selectedLayerIds.includes(layerId)) {
      setSelection([layerId]);
    }

    // Determine menu items based on layer type
    const layer = layers.find((l) => l.id === layerId);
    const menuItems: ContextMenuItem[] = [];

    if (layer?.type === 'text') {
      menuItems.push(
        { label: 'Edit Text', action: () => startTextEditing(layerId) },
        { label: 'Change Font', action: () => openFontPicker() },
        { separator: true }
      );
    }

    if (selectedLayerIds.length > 1) {
      menuItems.push(
        { label: 'Group', action: groupSelected, shortcut: 'Ctrl+G' },
        { label: 'Align', submenu: getAlignmentOptions() },
        { label: 'Distribute', submenu: getDistributionOptions() }
      );
    }

    // Common items
    menuItems.push(
      { label: 'Duplicate', action: duplicateSelected, shortcut: 'Ctrl+D' },
      { label: 'Delete', action: deleteSelected, shortcut: 'Delete' },
      { separator: true },
      { label: 'Bring to Front', action: bringToFront },
      { label: 'Send to Back', action: sendToBack }
    );

    showContextMenu(e.clientX, e.clientY, menuItems);
  },
  [layers, selectedLayerIds]
);
```

---

## Performance Optimizations

### 1. Selective Re-rendering

```typescript
// Only re-render when relevant state changes
const shouldRender = useMemo(() => {
  return layersChanged || zoomChanged || selectionChanged || canvasSizeChanged;
}, [layers, zoom, selectedLayerIds, canvasSize]);
```

### 2. Layer Culling

```typescript
// Skip rendering off-screen layers
const visibleLayers = useMemo(() => {
  return layers.filter((layer) => {
    const bounds = getLayerBounds(layer);
    return !isOutsideViewport(bounds, viewportMargin);
  });
}, [layers, viewport]);
```

### 3. Event Delegation

```typescript
// Single event listener for all layer interactions
const handleContainerMouseDown = useCallback(
  (e: MouseEvent) => {
    const layerId = getLayerAtPoint(e.offsetX, e.offsetY);

    if (layerId) {
      handleLayerMouseDown(e, layerId);
    } else {
      handleBackgroundMouseDown(e);
    }
  },
  [layers, zoom]
);
```

---

## Known Issues & Limitations

### Current Limitations

1. **No Virtual Scrolling**
   - All layers render even if off-screen
   - Performance degrades with 1000+ layers
   - **Fix Needed:** Implement virtual scrolling with spatial indexing

2. **Full Canvas Re-renders**
   - Any state change triggers full redraw
   - Inefficient for large projects
   - **Fix Needed:** Dirty rectangle tracking

3. **Memory Leaks**
   - Event listeners not always cleaned up
   - Large undo history consumes memory
   - **Fix Needed:** Better cleanup and memory management

### Browser Compatibility

- ✅ Chrome/Edge (Best performance)
- ✅ Firefox (Good performance)
- ⚠️ Safari (Some gesture issues)
- ❌ IE (Not supported)

---

## Testing Guidelines

### Unit Tests Needed

```typescript
describe('Canvas Component', () => {
  it('should select layer on click', () => {
    // Test implementation
  });

  it('should show resize handles when layer selected', () => {
    // Test implementation
  });

  it('should snap to grid when enabled', () => {
    // Test implementation
  });

  it('should handle multi-selection correctly', () => {
    // Test implementation
  });
});
```

### Performance Tests

```typescript
// Measure render time with different layer counts
const benchmarkRender = async () => {
  const scenarios = [10, 100, 500, 1000];

  for (const count of scenarios) {
    const layers = generateTestLayers(count);
    const start = performance.now();
    render(<Canvas layers={layers} />);
    await waitForRender();
    const duration = performance.now() - start;

    console.log(`Render ${count} layers: ${duration.toFixed(2)}ms`);
  }
};
```

---

## Future Improvements

### Short Term

1. **Add JSDoc to all exported functions**
2. **Split into sub-components:**
   - `CanvasRenderer` - Pure rendering
   - `CanvasInteractions` - Event handling
   - `CanvasControls` - Transform handles
   - `CanvasGuides` - Grid, rulers, snap lines

### Medium Term

3. **Implement virtual scrolling**
4. **Add WebGL acceleration** for filters
5. **Optimize for touch devices**
6. **Add collaborative cursors**

### Long Term

7. **Migrate to React Three Fiber** for 3D support
8. **Implement WebGPU** for advanced effects
9. **Add real-time collaboration**
10. **Support infinite canvas**

---

## Related Files

- `components/CanvasLayerRenderer.tsx` - Individual layer rendering
- `components/canvas/MultiSelectionHandles.tsx` - Multi-select UI
- `components/canvas/CanvasConstants.ts` - Configuration constants
- `utils/geometryOracle.ts` - Spatial calculations
- `utils/vectorUtils.ts` - Vector math helpers
- `store/slices/layerSlice.ts` - Layer state management

---

## Questions?

See `CODE_QUALITY_IMPROVEMENTS.md` for overall architecture or reach out to the maintainers.
