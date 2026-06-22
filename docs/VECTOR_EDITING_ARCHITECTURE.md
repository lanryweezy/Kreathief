# Vector Editing Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────┐    ┌──────────────┐    ┌─────────────────────┐  │
│  │  Sidebar  │───▶│ SidePanel    │───▶│ VectorEditingPanel  │  │
│  │  (Nav)    │    │  (Routing)   │    │  - Path Ops         │  │
│  └───────────┘    └──────────────┘    │  - Boolean Ops      │  │
│                                        │  - Path Effects     │  │
│                                        │  - Transforms       │  │
│  ┌───────────┐    ┌──────────────┐    └─────────────────────┘  │
│  │  Canvas   │───▶│   PenTool    │                              │
│  │  (View)   │    │   (Overlay)  │                              │
│  └───────────┘    └──────────────┘                              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │               Editor (Keyboard Shortcuts)                   │ │
│  │  Ctrl+Shift+V │ Ctrl+Alt+U/S/I/X │ P │ Shift+P            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                       STATE MANAGEMENT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Zustand Store                         │    │
│  │                                                          │    │
│  │  ├─ uiSlice         (activeTab, isPenMode, zoom)        │    │
│  │  ├─ layerSlice      (CRUD operations, selection)        │    │
│  │  ├─ aiSlice         (path operations: simplify, offset) │    │
│  │  ├─ canvasSlice     (pan, zoom, background)             │    │
│  │  └─ historySlice    (undo/redo)                         │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │         pathOperationsService.ts                       │     │
│  │                                                        │     │
│  │  • simplifyPath(path, tolerance)                      │     │
│  │  • offsetPath(path, distance)                         │     │
│  │  • smoothPath(path, factor)                           │     │
│  │  • strokeToPath(path, width)                          │     │
│  │  • reversePath(path)                                  │     │
│  │  • flattenPath(path)                                  │     │
│  │  • splitPath(path, index)                             │     │
│  │  • applyCornerRounding(path, radius)                  │     │
│  │  • getPathLength(path)                                │     │
│  │  • getPointAtDistance(path, distance)                 │     │
│  │                                                        │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │         Utility Modules                                │     │
│  │                                                        │     │
│  │  • vectorUtils.ts      (path serialization, utils)    │     │
│  │  • booleanOperations.ts (union, subtract, etc.)       │     │
│  │  • bezierMath.ts       (curve calculations)           │     │
│  │                                                        │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
└───────────────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              Type Definitions (types.ts)               │     │
│  │                                                        │     │
│  │  VectorPath {                                         │     │
│  │    points: VectorPoint[]                              │     │
│  │    isClosed: boolean                                  │     │
│  │  }                                                    │     │
│  │                                                        │     │
│  │  VectorPoint {                                        │     │
│  │    id: string                                         │     │
│  │    x: number, y: number                               │     │
│  │    handleIn?: { x, y }                                │     │
│  │    handleOut?: { x, y }                               │     │
│  │    type: 'sharp' | 'smooth' | 'symmetric'             │     │
│  │  }                                                    │     │
│  │                                                        │     │
│  │  ShapeLayer extends LayerBase {                       │     │
│  │    type: 'path'                                       │     │
│  │    pathData: string        (SVG d attribute)          │     │
│  │    vectorPath?: VectorPath (editable structure)       │     │
│  │    viewBox?: string                                   │     │
│  │  }                                                    │     │
│  │                                                        │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Path Creation Flow

```
User Action (Click/Drag)
         │
         ▼
    PenTool Component
    - Captures mouse events
    - Builds VectorPath structure
    - Shows live preview
         │
         ▼
   onPathComplete callback
         │
         ▼
    Store Action (addShapeLayer)
         │
         ▼
    Layer Slice
    - Creates ShapeLayer
    - Sets type: 'path'
    - Stores vectorPath + pathData
         │
         ▼
    Canvas Renderer
    - Reads from store
    - Renders SVG path
```

### Path Editing Flow

```
User Selection (Click Layer)
         │
         ▼
    Store (setSelectedLayerIds)
         │
         ▼
  VectorEditingPanel
  - Reads selectedLayer
  - Checks if type === 'path'
  - Shows editing UI
         │
         ▼
  User Action (Click Button)
         │
         ▼
  pathOperationsService
  - Performs calculation
  - Returns modified VectorPath
         │
         ▼
  Store Action (updateLayer)
         │
         ▼
  Layer Slice
  - Updates vectorPath
  - Regenerates pathData
  - Saves to history
         │
         ▼
  Canvas Renderer
  - Re-renders updated path
```

### Boolean Operation Flow

```
User Selection (Multiple Paths)
         │
         ▼
    Store (setSelectedLayerIds)
         │
         ▼
  VectorEditingPanel
  - Checks selectedLayerIds.length >= 2
  - Enables boolean buttons
         │
         ▼
  User Click (Union/Subtract/etc.)
         │
         ▼
  handleBooleanOperation
         │
         ▼
  booleanOperations.ts
  - Uses Paper.js for calculation
  - Combines paths mathematically
         │
         ▼
  Store Action (updateLayers)
  - Removes source layers
  - Creates new combined layer
         │
         ▼
  Canvas Renderer
  - Renders result
```

---

## Component Hierarchy

```
Editor
  ├─ Header
  │   └─ (Zoom, Grid, Rulers controls)
  │
  ├─ Sidebar
  │   ├─ Magic
  │   ├─ Templates
  │   ├─ Draw
  │   ├─ Vector Edit ◄── NEW
  │   ├─ Layers
  │   └─ Brand
  │
  ├─ SidePanel
  │   ├─ MagicPanel
  │   ├─ TemplatesPanel
  │   ├─ DrawPanel
  │   ├─ VectorEditingPanel ◄── NEW
  │   │   ├─ PathOperationsPanel
  │   │   ├─ BooleanOperationsPanel
  │   │   ├─ PathEffectsPanel
  │   │   └─ PathTransformPanel
  │   ├─ LayersPanel
  │   └─ BrandPanel
  │
  └─ Canvas
      ├─ CanvasRenderer
      │   └─ (Renders all layers)
      │
      ├─ CanvasControls
      │   └─ (Selection handles, rotation)
      │
      ├─ CanvasGuides
      │   └─ (Snap lines, grid)
      │
      └─ PenTool ◄── NEW (Overlay)
          └─ (Path drawing interface)
```

---

## State Structure

```javascript
Store State
  ├─ ui
  │   ├─ activeTab: NavTab.VECTOR_EDITING
  │   ├─ isPenMode: boolean
  │   ├─ zoom: number
  │   ├─ showGrid: boolean
  │   └─ showRulers: boolean
  │
  ├─ canvas
  │   ├─ panOffset: { x, y }
  │   ├─ canvasSize: { width, height, name }
  │   └─ canvasFilters: {...}
  │
  ├─ layers
  │   ├─ artboards: Artboard[]
  │   │   └─ layers: Layer[]
  │   │       └─ ShapeLayer (type: 'path')
  │   │           ├─ pathData: string
  │   │           ├─ vectorPath: VectorPath
  │   │           ├─ x, y, width, height
  │   │           ├─ rotation, opacity
  │   │           └─ color, stroke
  │   │
  │   ├─ activeArtboardId: string
  │   └─ selectedLayerIds: string[]
  │
  ├─ history
  │   ├─ past: HistoryState[]
  │   └─ future: HistoryState[]
  │
  └─ ai
      └─ (Path operations state)
```

---

## Event Flow

### Keyboard Shortcut Flow

```
User Presses Key
       │
       ▼
useKeyboardShortcuts Hook
       │
       ├─ Ctrl+Shift+V ──▶ setActiveTab(VECTOR_EDITING)
       │
       ├─ Ctrl+Alt+U ────▶ handleBooleanOperation('union')
       │
       ├─ P ─────────────▶ setPenMode(true)
       │
       └─ Shift+P ───────▶ setPenMode(true) + setActiveTab(VECTOR_EDITING)
```

### Mouse Interaction Flow (Pen Tool)

```
Canvas Mount
    │
    ▼
PenTool Overlay
    │
    ├─ onMouseDown ──▶ Transform screen coords to canvas coords
    │                  Add VectorPoint to path
    │                  Update state
    │
    ├─ onMouseMove ──▶ If dragging: Update handleOut on last point
    │                  Show live preview
    │
    ├─ onMouseUp ────▶ Finalize point
    │                  Check if near first point
    │                  If yes: Close path and complete
    │
    └─ onKeyDown ────▶ Enter: Complete path
                       Escape: Cancel path
```

---

## Rendering Pipeline

```
State Change (Path Updated)
         │
         ▼
    Canvas Component
         │
         ▼
  CanvasRenderer
  - Filters visible layers
  - Transforms coords with zoom/pan
         │
         ▼
  LayerContent Component
  - Reads layer.pathData
  - Renders <path d={pathData} />
         │
         ▼
  Browser SVG Engine
  - Parses path commands
  - Renders vector graphics
         │
         ▼
    Screen Output
```

---

## Service Dependencies

```
pathOperationsService
         │
         ├─ Depends on: paper.js (boolean operations)
         │               VectorUtils (serialization)
         │
         └─ Used by: Store actions (aiSlice)
                     VectorEditingPanel (UI)

vectorUtils
         │
         ├─ Pure functions (no dependencies)
         │
         └─ Used by: pathOperationsService
                     Canvas rendering
                     PenTool

booleanOperations
         │
         ├─ Depends on: paper.js
         │
         └─ Used by: Store actions
                     handleBooleanOperation
```

---

## Extension Points

### Adding New Path Operations

1. **Service Layer** (`pathOperationsService.ts`)

   ```typescript
   static newOperation(path: VectorPath, ...args): VectorPath {
     // Implementation
     return modifiedPath;
   }
   ```

2. **Store Action** (`store/slices/aiSlice.ts`)

   ```typescript
   newOperation: (tolerance: number) => {
     const path = get().getSelectedVectorPath();
     const result = PathOperationsService.newOperation(path, tolerance);
     set({ updateLayer: result });
   };
   ```

3. **UI Panel** (`VectorEditingPanel.tsx`)
   ```tsx
   <Button onClick={() => handleNewOperation()}>New Operation</Button>
   ```

### Adding New UI Tabs

1. Add tab to panel navigation
2. Create sub-panel component
3. Connect to store actions
4. Add keyboard shortcut (optional)

### Adding New Path Effects

1. Implement in `pathOperationsService`
2. Add UI controls (sliders, buttons)
3. Wire up to store action
4. Add undo/redo support

---

## Performance Considerations

### Optimization Strategies

1. **Memoization**
   - Path rendering memoized
   - Only re-render on actual changes

2. **Debouncing**
   - Slider updates debounced
   - Preview generation throttled

3. **Lazy Loading**
   - Panel components loaded on demand
   - Paper.js initialized only when needed

4. **Incremental Updates**
   - Only update changed properties
   - Avoid full layer re-render

5. **Canvas Optimization**
   - Use transforms instead of recalculating
   - Viewport culling for off-screen layers

---

## Security & Validation

### Input Validation

- Path point coordinates sanitized
- Tolerance values clamped
- Distance values bounded
- Angle values normalized (0-360)

### Error Handling

- Try-catch around path operations
- Fallback to original path on error
- Error messages to user
- Console logging for debugging

### State Integrity

- History snapshots before mutations
- Undo/redo maintains consistency
- Type checking at runtime
- Invalid paths rejected

---

## Testing Strategy

### Unit Tests (Recommended)

```javascript
// pathOperationsService.test.ts
describe('PathOperationsService', () => {
  test('simplifyPath reduces points', () => {
    const path = createComplexPath();
    const simplified = PathOperationsService.simplifyPath(path, 2.5);
    expect(simplified.points.length).toBeLessThan(path.points.length);
  });
});
```

### Integration Tests

```javascript
// VectorEditingPanel.test.tsx
describe('VectorEditingPanel', () => {
  test('boolean operations disabled without selection', () => {
    render(<VectorEditingPanel />);
    const unionBtn = screen.getByText('Union');
    expect(unionBtn).toBeDisabled();
  });
});
```

### E2E Tests

```javascript
// vector-editing.e2e.ts
test('create and edit vector path', async ({ page }) => {
  await page.click('[data-testid="pen-tool"]');
  await page.click('.canvas', { position: { x: 100, y: 100 } });
  await page.click('.canvas', { position: { x: 200, y: 100 } });
  await page.keyboard.press('Enter');
  expect(await page.locator('.layer[data-type="path"]').count()).toBe(1);
});
```

---

## Deployment Checklist

- [ ] All TypeScript errors resolved
- [ ] Components imported correctly
- [ ] Store actions connected
- [ ] Keyboard shortcuts registered
- [ ] UI rendering verified
- [ ] Path operations tested
- [ ] Boolean operations tested
- [ ] Undo/redo working
- [ ] Documentation complete
- [ ] Performance acceptable
- [ ] Browser compatibility checked

---

## Conclusion

This architecture provides a solid foundation for professional vector editing capabilities while maintaining clean separation of concerns and extensibility for future enhancements.
