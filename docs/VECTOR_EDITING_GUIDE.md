# Advanced Vector Editing Tools

## Overview

Kreathief now includes professional-grade vector editing capabilities that rival Adobe Illustrator. This guide covers all the advanced vector tools available in the application.

## Table of Contents

1. [Pen Tool](#pen-tool)
2. [Vector Editing Panel](#vector-editing-panel)
3. [Boolean Operations](#boolean-operations)
4. [Path Effects](#path-effects)
5. [Point Manipulation](#point-manipulation)
6. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Pen Tool

### Activating the Pen Tool

- **Keyboard**: Press `P`
- **UI**: Click the Pen tool icon in the toolbar

### Creating Paths

1. **Add Points**: Click on the canvas to add anchor points
2. **Create Curves**: Click and drag to create Bézier curves with handles
3. **Close Path**: Click on the first point to create a closed shape
4. **Complete Path**: Press `Enter` to finish the path

### Point Types

- **Sharp**: No handles, creates sharp corners
- **Smooth**: Handles move together, maintaining smooth curves
- **Symmetric**: Handles are mirrored and equal length

### Tips

- Hold `Shift` while dragging to constrain handle angles to 45° increments
- Press `Esc` to cancel the current path
- Click on an existing path to edit it

---

## Vector Editing Panel

Access the Vector Editing Panel by selecting a vector layer and opening the right sidebar.

### Tabs

#### 1. Path Operations

**Path Info**

- View number of points in the path
- Check if path is open or closed

**Operations**

- **Open/Close**: Toggle between open and closed paths
- **Reverse**: Reverse the direction of the path
- **Duplicate**: Create a copy of the selected path
- **Delete**: Remove the selected path

**Convert Points**

- Convert all points to Sharp, Smooth, or Symmetric

#### 2. Boolean Operations

Combine multiple vector shapes using boolean operations. **Requires 2+ selected paths**.

- **Union** (+): Combine shapes into one
- **Subtract** (−): Remove overlap from first shape
- **Intersect** (∩): Keep only overlapping area
- **Exclude** (⊕): Remove overlapping area

**How to Use**:

1. Select 2 or more vector layers
2. Open Vector Editing Panel
3. Click Boolean Operations tab
4. Choose your operation

#### 3. Path Effects

**Simplify Path**

- Reduces the number of points while maintaining shape
- Tolerance: 0.5-10px (higher = more simplification)
- Use case: Clean up hand-drawn paths or reduce file size

**Offset Path**

- Expand or contract path by a specified distance
- Distance: -50px to +50px
- Positive values expand, negative values contract
- Use case: Create outlines, padding, or borders

**Round Corners**

- Apply corner rounding to all sharp points
- Radius: 0-100px
- Use case: Soften sharp edges, create rounded rectangles

#### 4. Transform

**Flip**

- Horizontal: Mirror path left-to-right
- Vertical: Mirror path top-to-bottom

**Rotate**

- Angle: 0-360°
- Quick Rotate: 90° clockwise button

**Scale**

- Width: 10-200%
- Height: 10-200%
- Use case: Resize paths proportionally or distort

**Outline Stroke**

- Convert stroke to filled path
- Creates an outline of the stroke width
- Use case: Export to formats that don't support strokes

---

## Boolean Operations

### Union

Combines two or more paths into a single path.

```
[Shape A] ∪ [Shape B] = [Combined Shape]
```

**Example Use Cases**:

- Merge multiple shapes into one logo
- Create complex silhouettes from simple shapes
- Combine letters for typography effects

### Subtract

Removes the overlap of the second shape from the first.

```
[Shape A] − [Shape B] = [Shape A with hole]
```

**Example Use Cases**:

- Create cutouts or windows
- Make donut shapes (circle - smaller circle)
- Remove unwanted areas

### Intersect

Keeps only the overlapping area between shapes.

```
[Shape A] ∩ [Shape B] = [Overlap only]
```

**Example Use Cases**:

- Create Venn diagram overlaps
- Extract specific portions of shapes
- Mask effects

### Exclude

Removes the overlapping area, keeping only non-overlapping parts.

```
[Shape A] ⊕ [Shape B] = [Non-overlapping areas]
```

**Example Use Cases**:

- Create complex cutout patterns
- Inverse overlap effects
- Pattern design

---

## Path Effects

### Simplify

Intelligently reduces path complexity while preserving shape.

**Algorithm**: Uses Douglas-Peucker algorithm via Paper.js
**Best Practices**:

- Start with tolerance of 2-3px
- Increase gradually until desired simplification
- Check preview before applying

### Offset

Creates a parallel path at a specified distance.

**How it Works**:

- Positive values: Path expands outward
- Negative values: Path contracts inward
- Maintains curves and angles

**Use Cases**:

1. **Outlines**: +5px offset for stroke effect
2. **Padding**: +10px for button borders
3. **Inset**: -5px for inner shadows
4. **Borders**: Create concentric shapes

### Round Corners

Applies bezier curve rounding to sharp corners.

**Parameters**:

- **Global Radius**: Applied to all corners
- **Per-Point Radius**: Override per anchor point

**Formula**: Uses quadratic bezier control points
**Best Practices**:

- Start with 5-10px for subtle rounding
- Use 20-50px for prominent rounded corners
- Max radius is limited by shortest adjacent segment

---

## Point Manipulation

### Selecting Points

- Click on an anchor point to select it
- Selected points show larger circles
- Hover to see point type label

### Moving Points

- Click and drag anchor points to new positions
- Points snap to other points (when snap is enabled)
- Use arrow keys for precise 1px movements

### Editing Handles

- Drag handle endpoints to adjust curve shape
- **Sharp points**: No handles visible
- **Smooth points**: Handles move together, opposite angles
- **Symmetric points**: Handles are equal length and opposite

### Adding Points

- Click on a path segment to add a new point
- New point inherits curve from surrounding points
- Automatically calculates optimal handle positions

### Deleting Points

- Select point and press `Delete` or `Backspace`
- Or click the Delete button in the point controls
- Minimum 2 points required for a valid path

### Converting Point Types

1. Hover over a point
2. Point controls appear
3. Click Sharp, Smooth, or Symmetric
4. Handles adjust automatically

---

## Keyboard Shortcuts

### Pen Tool

| Shortcut          | Action                 |
| ----------------- | ---------------------- |
| `P`               | Activate Pen Tool      |
| Click             | Add point              |
| Click + Drag      | Add point with handles |
| Click first point | Close path             |
| `Enter`           | Complete path          |
| `Esc`             | Cancel path            |

### Point Editing

| Shortcut               | Action                |
| ---------------------- | --------------------- |
| Click point            | Select point          |
| `Delete` / `Backspace` | Delete selected point |
| Arrow keys             | Move point 1px        |
| `Shift` + Arrow        | Move point 10px       |

### Path Operations

| Shortcut               | Action              |
| ---------------------- | ------------------- |
| `Ctrl` + `D`           | Duplicate path      |
| `Ctrl` + `J`           | Join selected paths |
| `Ctrl` + `Shift` + `O` | Convert to outlines |

### Boolean Operations

| Shortcut             | Action    |
| -------------------- | --------- |
| `Ctrl` + `Alt` + `U` | Union     |
| `Ctrl` + `Alt` + `S` | Subtract  |
| `Ctrl` + `Alt` + `I` | Intersect |
| `Ctrl` + `Alt` + `X` | Exclude   |

---

## Advanced Techniques

### Creating Complex Shapes

1. Start with basic shapes (circles, rectangles)
2. Use boolean operations to combine
3. Refine with path editing
4. Apply effects for final touches

### Logo Design Workflow

1. Sketch rough outline with Pen Tool
2. Simplify to reduce points
3. Round corners for smooth look
4. Use boolean operations for complex elements
5. Convert strokes to paths for export

### Icon Design

1. Create on 24x24 or 32x32 grid
2. Use simplified paths (fewer points = cleaner icons)
3. Align points to pixel grid
4. Export as SVG with optimized paths

### Pattern Creation

1. Create base element
2. Duplicate and rotate
3. Use boolean operations to create cutouts
4. Offset paths to create borders
5. Group and repeat

---

## Troubleshooting

### Path Won't Close

- Ensure you click exactly on the first point
- Look for the circle indicator around first point
- Or press `Enter` to manually complete

### Boolean Operation Not Available

- Select 2 or more vector layers
- Ensure layers are actually vector paths (not images)
- Check that layers are on the same artboard

### Simplify Removes Too Much Detail

- Reduce tolerance value
- Try 0.5-1px for detailed paths
- Use 5-10px for rough sketches

### Offset Creates Weird Artifacts

- Check for self-intersecting paths
- Simplify path first
- Try smaller offset distances
- Consider splitting complex paths

### Handles Won't Move Independently

- Point type is set to Smooth or Symmetric
- Change to Sharp for independent handles
- Or hold `Alt` while dragging (coming soon)

---

## API Reference

### PathOperationsService

```typescript
// Simplify path
simplifyPath(path: VectorPath, tolerance: number): VectorPath

// Offset path
offsetPath(path: VectorPath, distance: number): VectorPath

// Smooth path curves
smoothPath(path: VectorPath, factor: number): VectorPath

// Flatten (remove all curves)
flattenPath(path: VectorPath): VectorPath

// Reverse direction
reversePath(path: VectorPath): VectorPath

// Apply corner rounding
applyCornerRounding(path: VectorPath, radius: number): VectorPath
```

### BooleanOperations

```typescript
// Union (combine)
union(pathA: VectorPath, pathB: VectorPath): VectorPath

// Subtract (difference)
subtract(pathA: VectorPath, pathB: VectorPath): VectorPath

// Intersect (overlap only)
intersect(pathA: VectorPath, pathB: VectorPath): VectorPath

// Exclude (XOR)
exclude(pathA: VectorPath, pathB: VectorPath): VectorPath
```

### VectorUtils

```typescript
// Parse SVG path data
parsePath(d: string): VectorPath

// Serialize to SVG path data
serializePath(path: VectorPath): string

// Insert point at position
insertPointToPath(path: VectorPath, x: number, y: number): VectorPath

// Get path bounds
getBounds(path: VectorPath): { x, y, width, height }

// Join two paths
joinPaths(pathA: VectorPath, pathB: VectorPath): VectorPath
```

---

## Best Practices

1. **Start Simple**: Begin with basic shapes before complex paths
2. **Use Grids**: Enable snap-to-grid for precise alignment
3. **Fewer Points**: Simpler paths are easier to edit and render faster
4. **Save Often**: Complex boolean operations can be hard to undo
5. **Test Export**: Check SVG export to ensure paths are clean
6. **Name Layers**: Use descriptive names for complex projects
7. **Group Related**: Keep related vector elements grouped

---

## Coming Soon

- [ ] Pen Tool pressure sensitivity for variable width strokes
- [ ] Path smoothing with AI
- [ ] Shape builder tool (interactive boolean operations)
- [ ] Corner widgets (drag to round corners)
- [ ] Knife tool (split paths)
- [ ] Scissors tool (cut segments)
- [ ] Anchor point averaging
- [ ] Path direction indicators
- [ ] Compound paths (paths with holes)
- [ ] Export optimization (remove redundant points)

---

## Feedback

Found a bug or have a feature request? [Open an issue](https://github.com/kreathief/kreathief/issues) or contact support@kreathief.app

---

**Last Updated**: December 2024  
**Version**: 1.0.0
