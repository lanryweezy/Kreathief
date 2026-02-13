# Required App Features for Professional Templates

## Overview
To support the professional templates and compete with Canva, the app needs to implement 15 key features. This document details each feature, its implementation requirements, and impact.

---

## 1. GRADIENT FILLS 🔴 CRITICAL

### What It Is
Linear and radial gradients that fill shapes and backgrounds with smooth color transitions.

### Why Needed
- Creates visual depth and sophistication
- Used in 100% of templates for backgrounds
- Essential for modern design

### Implementation Details
```typescript
// Add to ShapeLayer type
interface Gradient {
  type: 'linear' | 'radial';
  angle?: number; // 0-360 degrees for linear
  colors: Array<{ color: string; position: number }>;
  startX?: number; // for radial
  startY?: number;
  endX?: number;
  endY?: number;
}

// Update ShapeLayer
export interface ShapeLayer {
  // ... existing properties
  gradient?: Gradient;
  backgroundGradient?: Gradient;
}
```

### Canvas Implementation
```typescript
// In canvas rendering
if (shape.gradient) {
  const gradient = ctx.createLinearGradient(
    shape.x, shape.y,
    shape.x + shape.width, shape.y + shape.height
  );
  shape.gradient.colors.forEach(stop => {
    gradient.addColorStop(stop.position, stop.color);
  });
  ctx.fillStyle = gradient;
}
```

### UI Changes Needed
- Gradient picker in color panel
- Angle slider for linear gradients
- Color stop editor
- Gradient presets

### Estimated Effort
- Backend: 4-6 hours
- UI: 3-4 hours
- Testing: 2 hours

---

## 2. TEXT SHADOWS 🔴 CRITICAL

### What It Is
Drop shadows, glows, and blur effects applied to text layers.

### Why Needed
- Improves text readability over backgrounds
- Adds depth and hierarchy
- Used in 95% of templates

### Implementation Details
```typescript
// Already partially in TextLayer, needs enhancement
export interface TextLayer {
  // ... existing properties
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
    opacity?: number;
  };
  textGlow?: {
    color: string;
    blur: number;
    opacity: number;
  };
}
```

### Canvas Implementation
```typescript
// In text rendering
if (textLayer.shadow) {
  ctx.shadowColor = textLayer.shadow.color;
  ctx.shadowBlur = textLayer.shadow.blur;
  ctx.shadowOffsetX = textLayer.shadow.offsetX;
  ctx.shadowOffsetY = textLayer.shadow.offsetY;
}
ctx.fillText(textLayer.text, textLayer.x, textLayer.y);
ctx.shadowColor = 'transparent'; // Reset
```

### UI Changes Needed
- Shadow color picker
- Blur slider (0-50)
- Offset X/Y sliders
- Opacity slider
- Shadow presets

### Estimated Effort
- Backend: 2-3 hours
- UI: 2-3 hours
- Testing: 1 hour

---

## 3. SHAPE STROKES/BORDERS 🔴 CRITICAL

### What It Is
Outline/border styling on rectangles, circles, and other shapes.

### Why Needed
- Creates frames and decorative elements
- Used in Quote Graphic, Webinar Cover
- Essential for modern design patterns

### Implementation Details
```typescript
// Add to ShapeLayer
export interface ShapeLayer {
  // ... existing properties
  stroke?: {
    color: string;
    width: number;
    opacity?: number;
    dashArray?: number[]; // for dashed lines
  };
}
```

### Canvas Implementation
```typescript
// In shape rendering
if (shape.stroke) {
  ctx.strokeStyle = shape.stroke.color;
  ctx.lineWidth = shape.stroke.width;
  ctx.globalAlpha = shape.stroke.opacity || 1;
  if (shape.stroke.dashArray) {
    ctx.setLineDash(shape.stroke.dashArray);
  }
  ctx.stroke();
  ctx.setLineDash([]); // Reset
}
```

### UI Changes Needed
- Stroke color picker
- Width slider (0-20)
- Opacity slider
- Dash pattern selector
- Stroke presets

### Estimated Effort
- Backend: 2-3 hours
- UI: 2-3 hours
- Testing: 1 hour

---

## 4. BOX SHADOWS ON SHAPES 🔴 CRITICAL

### What It Is
Drop shadows applied to rectangular and circular shapes.

### Why Needed
- Creates depth and elevation
- Used in 80% of templates
- Essential for card-based layouts

### Implementation Details
```typescript
// Already in ShapeLayer, needs verification
export interface ShapeLayer {
  // ... existing properties
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
    spread?: number;
  };
}
```

### Canvas Implementation
```typescript
// In shape rendering
if (shape.shadow) {
  ctx.shadowColor = shape.shadow.color;
  ctx.shadowBlur = shape.shadow.blur;
  ctx.shadowOffsetX = shape.shadow.offsetX;
  ctx.shadowOffsetY = shape.shadow.offsetY;
}
// Draw shape
ctx.shadowColor = 'transparent'; // Reset
```

### UI Changes Needed
- Shadow color picker
- Blur slider (0-50)
- Offset X/Y sliders
- Spread slider
- Shadow presets

### Estimated Effort
- Backend: 1-2 hours (mostly verification)
- UI: 2-3 hours
- Testing: 1 hour

---

## 5. BLEND MODES 🔴 CRITICAL

### What It Is
Layer blend modes (multiply, screen, overlay, etc.) for visual effects.

### Why Needed
- Creates sophisticated visual effects
- Used in overlay and background interactions
- Essential for professional designs

### Implementation Details
```typescript
// Add to all layer types
export interface TextLayer {
  // ... existing properties
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn';
}

export interface ShapeLayer {
  // ... existing properties
  blendMode?: string; // same options
}

export interface ImageLayer {
  // ... existing properties
  blendMode?: string; // same options
}
```

### Canvas Implementation
```typescript
// In rendering
ctx.globalCompositeOperation = layer.blendMode || 'source-over';
// Draw layer
ctx.globalCompositeOperation = 'source-over'; // Reset
```

### UI Changes Needed
- Blend mode dropdown
- Visual preview of each mode
- Blend mode presets

### Estimated Effort
- Backend: 1-2 hours
- UI: 2-3 hours
- Testing: 1 hour

---

## 6. ENHANCED TEXT STYLING 🟠 IMPORTANT

### What It Is
Italic text, underline, line-through, and other text decorations.

### Why Needed
- Improves design variety
- Used in quotes and emphasis
- Professional typography

### Implementation Details
```typescript
// Already in TextLayer, needs verification
export interface TextLayer {
  // ... existing properties
  fontStyle?: 'normal' | 'italic' | 'oblique';
  textDecoration?: 'none' | 'underline' | 'line-through' | 'overline';
}
```

### Canvas Implementation
```typescript
// In text rendering
ctx.font = `${textLayer.fontStyle || 'normal'} ${textLayer.fontWeight} ${textLayer.fontSize}px ${textLayer.fontFamily}`;
ctx.fillText(textLayer.text, textLayer.x, textLayer.y);

if (textLayer.textDecoration === 'underline') {
  ctx.strokeStyle = textLayer.color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(textLayer.x, textLayer.y + 5);
  ctx.lineTo(textLayer.x + textLayer.width, textLayer.y + 5);
  ctx.stroke();
}
```

### UI Changes Needed
- Italic toggle button
- Underline toggle button
- Line-through toggle button
- Text decoration presets

### Estimated Effort
- Backend: 1-2 hours
- UI: 1-2 hours
- Testing: 1 hour

---

## 7. OPACITY CONTROL 🟠 IMPORTANT

### What It Is
Individual layer opacity/transparency control.

### Why Needed
- Used in 100% of templates
- Essential for layering and depth
- Already partially implemented

### Implementation Details
```typescript
// Already in all layer types
export interface TextLayer {
  opacity: number; // 0-1
}

export interface ShapeLayer {
  opacity: number; // 0-1
}

export interface ImageLayer {
  opacity: number; // 0-1
}
```

### Canvas Implementation
```typescript
// In rendering
ctx.globalAlpha = layer.opacity;
// Draw layer
ctx.globalAlpha = 1; // Reset
```

### UI Changes Needed
- Opacity slider (0-100%)
- Opacity input field
- Opacity presets

### Estimated Effort
- Backend: 0-1 hours (mostly verification)
- UI: 1-2 hours
- Testing: 1 hour

---

## 8. ROUNDED CORNERS 🟠 IMPORTANT

### What It Is
Border radius on rectangular shapes.

### Why Needed
- Used in 100% of templates
- Modern design standard
- Already implemented

### Implementation Details
```typescript
// Already in ShapeLayer
export interface ShapeLayer {
  cornerRadius: number; // pixels
}
```

### Canvas Implementation
```typescript
// In shape rendering
ctx.beginPath();
ctx.roundRect(shape.x, shape.y, shape.width, shape.height, shape.cornerRadius);
ctx.fill();
```

### UI Changes Needed
- Corner radius slider (0-100)
- Corner radius input field
- Corner radius presets

### Estimated Effort
- Backend: 0-1 hours (verification)
- UI: 1-2 hours
- Testing: 1 hour

---

## 9. MULTIPLE TEXT LAYERS 🟠 IMPORTANT

### What It Is
Support for multiple text elements with different styles.

### Why Needed
- Used in 100% of templates
- Essential for hierarchy
- Already implemented

### Implementation Details
```typescript
// Already in HistoryState
export interface HistoryState {
  textLayers: TextLayer[];
  // ... other properties
}
```

### Canvas Implementation
```typescript
// In rendering
textLayers.forEach(textLayer => {
  // Render each text layer
});
```

### UI Changes Needed
- Text layer management panel
- Text layer selection
- Text layer reordering
- Text layer visibility toggle

### Estimated Effort
- Backend: 0 hours (already done)
- UI: 2-3 hours
- Testing: 1 hour

---

## 10. CANVAS BACKGROUND COLORS 🟠 IMPORTANT

### What It Is
Custom background colors for the canvas.

### Why Needed
- Used in 100% of templates
- Essential feature
- Already implemented

### Implementation Details
```typescript
// Already in HistoryState
export interface HistoryState {
  canvasBackgroundColor: string;
  // ... other properties
}
```

### Canvas Implementation
```typescript
// In rendering
ctx.fillStyle = state.canvasBackgroundColor;
ctx.fillRect(0, 0, canvas.width, canvas.height);
```

### UI Changes Needed
- Background color picker
- Background color presets
- Background color input field

### Estimated Effort
- Backend: 0 hours (already done)
- UI: 1-2 hours
- Testing: 1 hour

---

## 11. CANVAS FILTERS 🟡 MEDIUM

### What It Is
Brightness, contrast, saturation, blur on entire canvas.

### Why Needed
- Used in some templates for mood
- Enhancement feature
- Already partially implemented

### Implementation Details
```typescript
// Already in HistoryState
export interface HistoryState {
  canvasFilters: {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    opacity: number;
    vignette: number;
    sepia: number;
    grayscale: number;
  };
}
```

### Canvas Implementation
```typescript
// In rendering
const filters = state.canvasFilters;
ctx.filter = `
  brightness(${filters.brightness}%)
  contrast(${filters.contrast}%)
  saturate(${filters.saturation}%)
  blur(${filters.blur}px)
  grayscale(${filters.grayscale}%)
  sepia(${filters.sepia}%)
`;
```

### UI Changes Needed
- Filter sliders for each effect
- Filter presets
- Filter reset button

### Estimated Effort
- Backend: 1-2 hours
- UI: 2-3 hours
- Testing: 1 hour

---

## 12. LETTER SPACING 🟡 MEDIUM

### What It Is
Custom spacing between letters in text.

### Why Needed
- Professional typography control
- Used in 100% of templates
- Already implemented

### Implementation Details
```typescript
// Already in TextLayer
export interface TextLayer {
  letterSpacing: number; // pixels
}
```

### Canvas Implementation
```typescript
// In text rendering
ctx.letterSpacing = textLayer.letterSpacing;
ctx.fillText(textLayer.text, textLayer.x, textLayer.y);
```

### UI Changes Needed
- Letter spacing slider (-5 to 10)
- Letter spacing input field
- Letter spacing presets

### Estimated Effort
- Backend: 0-1 hours (verification)
- UI: 1-2 hours
- Testing: 1 hour

---

## 13. LINE HEIGHT 🟡 MEDIUM

### What It Is
Vertical spacing between lines of text.

### Why Needed
- Text readability control
- Used in 100% of templates
- Already implemented

### Implementation Details
```typescript
// Already in TextLayer
export interface TextLayer {
  lineHeight: number; // multiplier (1.0 = 100%)
}
```

### Canvas Implementation
```typescript
// In text rendering
const lines = textLayer.text.split('\n');
lines.forEach((line, index) => {
  const y = textLayer.y + (index * textLayer.fontSize * textLayer.lineHeight);
  ctx.fillText(line, textLayer.x, y);
});
```

### UI Changes Needed
- Line height slider (0.8 to 2.0)
- Line height input field
- Line height presets

### Estimated Effort
- Backend: 0-1 hours (verification)
- UI: 1-2 hours
- Testing: 1 hour

---

## 14. TEXT TRANSFORM 🟡 MEDIUM

### What It Is
Uppercase, lowercase, capitalize text.

### Why Needed
- Typography control
- Used in 100% of templates
- Already implemented

### Implementation Details
```typescript
// Already in TextLayer
export interface TextLayer {
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}
```

### Canvas Implementation
```typescript
// In text rendering
let displayText = textLayer.text;
if (textLayer.textTransform === 'uppercase') {
  displayText = displayText.toUpperCase();
} else if (textLayer.textTransform === 'lowercase') {
  displayText = displayText.toLowerCase();
}
ctx.fillText(displayText, textLayer.x, textLayer.y);
```

### UI Changes Needed
- Text transform dropdown
- Text transform presets
- Live preview

### Estimated Effort
- Backend: 0-1 hours (verification)
- UI: 1-2 hours
- Testing: 1 hour

---

## 15. NEGATIVE COORDINATES 🟡 MEDIUM

### What It Is
Elements positioned outside canvas bounds.

### Why Needed
- Background decorative elements
- Overflow effects
- Used in 100% of templates

### Implementation Details
```typescript
// Already supported in coordinate system
// Just needs proper clipping/rendering
```

### Canvas Implementation
```typescript
// In rendering
ctx.save();
ctx.beginPath();
ctx.rect(0, 0, canvas.width, canvas.height);
ctx.clip();
// Draw all layers (including those with negative coordinates)
ctx.restore();
```

### UI Changes Needed
- Coordinate input fields that accept negative values
- Visual guides for canvas bounds
- Overflow preview toggle

### Estimated Effort
- Backend: 1-2 hours
- UI: 1-2 hours
- Testing: 1 hour

---

## Summary Table

| Feature | Priority | Backend Hours | UI Hours | Total | Status |
|---------|----------|---------------|----------|-------|--------|
| Gradient Fills | 🔴 | 5 | 3.5 | 8.5 | ❌ |
| Text Shadows | 🔴 | 2.5 | 2.5 | 5 | ⚠️ |
| Shape Strokes | 🔴 | 2.5 | 2.5 | 5 | ❌ |
| Box Shadows | 🔴 | 1.5 | 2.5 | 4 | ⚠️ |
| Blend Modes | 🔴 | 1.5 | 2.5 | 4 | ❌ |
| Text Styling | 🟠 | 1.5 | 1.5 | 3 | ⚠️ |
| Opacity | 🟠 | 0.5 | 1.5 | 2 | ✅ |
| Rounded Corners | 🟠 | 0.5 | 1.5 | 2 | ✅ |
| Multiple Text | 🟠 | 0 | 2.5 | 2.5 | ✅ |
| Canvas BG | 🟠 | 0 | 1.5 | 1.5 | ✅ |
| Canvas Filters | 🟡 | 1.5 | 2.5 | 4 | ⚠️ |
| Letter Spacing | 🟡 | 0.5 | 1.5 | 2 | ✅ |
| Line Height | 🟡 | 0.5 | 1.5 | 2 | ✅ |
| Text Transform | 🟡 | 0.5 | 1.5 | 2 | ✅ |
| Negative Coords | 🟡 | 1.5 | 1.5 | 3 | ⚠️ |

**Total Effort: ~50 hours**
- Backend: ~22 hours
- UI: ~28 hours

---

## Implementation Roadmap

### Week 1: Critical Features
- [ ] Gradient Fills (8.5 hours)
- [ ] Text Shadows (5 hours)
- [ ] Shape Strokes (5 hours)
- [ ] Box Shadows (4 hours)
- [ ] Blend Modes (4 hours)
**Total: 26.5 hours**

### Week 2: Important Features
- [ ] Text Styling (3 hours)
- [ ] Canvas Filters (4 hours)
- [ ] Negative Coordinates (3 hours)
**Total: 10 hours**

### Week 3: Polish & Testing
- [ ] Testing & bug fixes (10 hours)
- [ ] Performance optimization (4 hours)
**Total: 14 hours**

---

## Success Criteria

- ✅ All 27 templates render without errors
- ✅ All visual effects display correctly
- ✅ Performance remains smooth (60 FPS)
- ✅ UI is intuitive and discoverable
- ✅ Templates match Canva quality
- ✅ Users can easily customize templates
