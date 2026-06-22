# Vector Editing Quick Start Guide

## 🚀 Getting Started with Vector Tools

Kreathief now includes professional-grade vector editing capabilities. This guide will get you started in under 5 minutes.

---

## 📍 Accessing Vector Tools

### Method 1: Sidebar

1. Click the **"Vector Edit"** button in the left sidebar (pen with sparkles icon)
2. The Vector Editing Panel opens on the right

### Method 2: Keyboard Shortcut

Press `Ctrl+Shift+V` to instantly open the Vector Editing Panel

### Method 3: Tool Switcher

Press `Shift+P` to activate the Pen Tool for vector drawing

---

## ✏️ Creating Your First Vector Path

### Using the Pen Tool

1. **Activate**: Press `Shift+P` or click the Pen icon
2. **Draw**:
   - Click to add straight points
   - Click & drag to create curves
   - Handles appear for curve control
3. **Close Path**: Click the first point or press `Enter`
4. **Cancel**: Press `Escape` to discard

### Visual Cues

- 🟣 **Purple dashed line**: Your current path
- ⚪ **White circles**: Anchor points
- ⚪ **White handles**: Curve controls
- 🟣 **Filled first point**: Click to close the loop
- ⏺️ **Pulsing ring**: Path can be closed

---

## 🛠️ Editing Vector Paths

### Path Operations

Select a vector path, then open the Vector Editing Panel:

#### Quick Actions

- **Close Path**: Convert open path to closed shape
- **Reverse**: Flip the direction of the path
- **Duplicate**: Copy the selected path
- **Delete**: Remove the path

#### Point Types

Convert all points to:

- **Sharp**: Corner points (no curves)
- **Smooth**: Curved points with auto handles
- **Symmetric**: Perfect curves with mirrored handles

---

## 🎨 Path Effects

### Simplify Path

Reduce complexity while maintaining shape:

- **Tolerance**: 0.5-10px (higher = more simplification)
- **Use When**: Path has too many points
- **Result**: Cleaner, more manageable paths

### Offset Path

Expand or contract your path:

- **Distance**: -50 to +50px
- **Positive**: Makes shape bigger
- **Negative**: Makes shape smaller
- **Use When**: Need padding or inset shapes

### Round Corners

Add smooth corners to sharp paths:

- **Radius**: 0-100px
- **Use When**: Softening angular shapes
- **Result**: Rounded corners at all points

---

## 🔀 Boolean Operations

Combine multiple vector paths into one:

### Requirements

- Select **2 or more** vector paths
- Open Boolean Operations tab

### Operations

#### Union (Ctrl+Alt+U)

Merge all shapes into one

```
[Shape A] + [Shape B] = [Combined Shape]
```

#### Subtract (Ctrl+Alt+S)

Remove overlap from first shape

```
[Shape A] - [Shape B] = [Shape A with hole]
```

#### Intersect (Ctrl+Alt+I)

Keep only overlapping area

```
[Shape A] ∩ [Shape B] = [Overlap only]
```

#### Exclude (Ctrl+Alt+X)

Remove overlapping areas

```
[Shape A] ⊕ [Shape B] = [Non-overlapping parts]
```

---

## 🔄 Transform Tools

### Flip

- **Horizontal**: Mirror left-right
- **Vertical**: Mirror top-bottom

### Rotate

- **Slider**: 0-360° precise control
- **Quick Rotate**: 90° increments
- **Shortcut**: Hold and drag rotation handle

### Scale

- **Width**: 10-200%
- **Height**: 10-200%
- **Independent**: Scale each axis separately

### Outline Stroke

Convert stroke outline into a filled path:

- **Use When**: Need to edit stroke as shape
- **Result**: Stroke becomes editable path

---

## ⌨️ Keyboard Shortcuts

### Tools

- `P` - Pen Tool (Draw mode)
- `Shift+P` - Pen Tool (Vector mode)
- `V` - Select Tool
- `Escape` - Cancel current operation

### Panels

- `Ctrl+Shift+V` - Vector Editing Panel
- `L` - Layers Panel
- `I` - AI Assistant

### Boolean Operations

- `Ctrl+Alt+U` - Union
- `Ctrl+Alt+S` - Subtract
- `Ctrl+Alt+I` - Intersect
- `Ctrl+Alt+X` - Exclude

### Pen Tool (while drawing)

- `Enter` - Complete path
- `Escape` - Cancel path
- Click first point - Close path

### General

- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Ctrl+D` - Duplicate
- `Delete` - Delete selected

---

## 💡 Pro Tips

### 1. Drawing Smooth Curves

When using the Pen Tool:

- Click without dragging for corners
- Click and drag ~30% of the distance to the next point for smooth curves
- Hold Shift while dragging to constrain handle angles

### 2. Simplifying Complex Paths

If your path has too many points:

1. Select the path
2. Open Path Effects → Simplify
3. Start with tolerance = 2.5px
4. Increase if you want more aggressive simplification

### 3. Creating Custom Shapes

1. Draw basic shape with Pen Tool
2. Use Boolean operations to combine with primitives
3. Apply Round Corners for polished look
4. Use Offset to add borders

### 4. Converting Raster to Vector

1. Import image
2. Use Image Trace (Vectorizer panel)
3. Clean up with Simplify Path
4. Edit individual paths as needed

### 5. Creating Icon Sets

1. Create base shape
2. Duplicate (Ctrl+D)
3. Apply Boolean operations for variations
4. Use consistent corner radius
5. Export as SVG

---

## 🎯 Common Workflows

### Workflow 1: Logo Design

```
1. Pen Tool → Draw base shape
2. Duplicate → Create variations
3. Boolean Union → Combine elements
4. Round Corners → Polish edges
5. Export → SVG for scaling
```

### Workflow 2: Icon Creation

```
1. Pen Tool → Draw outline
2. Simplify → Clean up points
3. Offset → Create border
4. Round Corners → Soften edges
5. Export → Multiple sizes
```

### Workflow 3: Shape Modification

```
1. Select path → Open Vector Panel
2. Path Operations → Convert points to Smooth
3. Path Effects → Offset +5px for border
4. Transform → Rotate 45°
5. Boolean → Combine with other shapes
```

### Workflow 4: Text to Shape

```
1. Add text layer
2. Right-click → Convert to Outlines
3. Boolean → Combine letters
4. Simplify → Reduce complexity
5. Edit → Individual path manipulation
```

---

## 🐛 Troubleshooting

### Path Won't Close

- **Cause**: Not clicking near first point
- **Solution**: Look for pulsing ring, click inside it

### Boolean Operation Grayed Out

- **Cause**: Less than 2 paths selected
- **Solution**: Select multiple vector layers

### Path Looks Jagged After Simplify

- **Cause**: Tolerance too high
- **Solution**: Reduce tolerance to 1-2px

### Can't Edit Path

- **Cause**: Layer might be locked or grouped
- **Solution**: Check Layers panel, unlock/ungroup

### Handles Not Appearing

- **Cause**: Point type is "Sharp"
- **Solution**: Convert to "Smooth" or "Symmetric"

---

## 📚 Next Steps

Once you're comfortable with basics:

1. **Experiment with Boolean Operations**: Combine shapes creatively
2. **Master the Pen Tool**: Practice drawing smooth curves
3. **Try Path Effects**: Explore simplify, offset, and rounding
4. **Create Icon Library**: Build reusable vector assets
5. **Export Workflow**: Learn SVG export for scalability

---

## 🆘 Need Help?

- **In-App**: Press `I` for AI Assistant
- **Keyboard Shortcuts**: Press `?` for full list
- **Documentation**: Check `VECTOR_EDITING_INTEGRATION.md` for technical details

---

## 🎉 You're Ready!

You now have professional vector editing tools at your fingertips. Start creating amazing vector graphics!

**Happy Designing! ✨**
