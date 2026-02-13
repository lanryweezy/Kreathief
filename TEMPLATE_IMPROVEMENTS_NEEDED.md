# Template Improvements & Required App Features

## Features Currently NOT Supported by App (Need Implementation)

### 1. **Gradient Fills** ⚠️ CRITICAL
- **What**: Linear and radial gradients on shapes and backgrounds
- **Used in**: Multiple templates for backgrounds, overlays, and visual depth
- **Example**: Gradient backgrounds, gradient text fills
- **Implementation needed**: Add gradient support to ShapeLayer and TextLayer

### 2. **Text Shadows & Glows** ⚠️ CRITICAL
- **What**: Drop shadows, glows, and blur effects on text
- **Used in**: Headlines, titles for depth and readability
- **Example**: Text with shadow: `{ color: '#000000', blur: 10, offsetX: 2, offsetY: 2 }`
- **Implementation needed**: Extend TextLayer shadow support

### 3. **Stroke/Border on Shapes** ⚠️ CRITICAL
- **What**: Outline/border styling on rectangles and circles
- **Used in**: Quote graphics, borders, decorative frames
- **Example**: `stroke: { color: '#7d2ae8', width: 4, opacity: 0.5 }`
- **Implementation needed**: Add stroke property to ShapeLayer

### 4. **Box Shadows on Shapes** ⚠️ CRITICAL
- **What**: Drop shadows on rectangles and other shapes
- **Used in**: Cards, buttons, depth effects
- **Example**: `shadow: { color: '#000000', blur: 40, offsetX: 0, offsetY: 20 }`
- **Implementation needed**: Extend shadow support to all shape types

### 5. **Blend Modes** ⚠️ IMPORTANT
- **What**: Layer blend modes (multiply, screen, overlay, etc.)
- **Used in**: Overlays, background effects, visual hierarchy
- **Example**: `blendMode: 'multiply'` or `'screen'`
- **Implementation needed**: Add CSS blend-mode support to canvas rendering

### 6. **Text Styling Enhancements** ⚠️ IMPORTANT
- **What**: Italic text, text decoration (underline, line-through)
- **Used in**: Quote graphics, emphasis, professional styling
- **Example**: `fontStyle: 'italic'`, `textDecoration: 'underline'`
- **Implementation needed**: Ensure full CSS text styling support

### 7. **Opacity/Transparency** ⚠️ IMPORTANT
- **What**: Individual layer opacity control
- **Used in**: Background circles, overlays, subtle effects
- **Example**: `opacity: 0.05` for subtle backgrounds
- **Implementation needed**: Ensure opacity is properly rendered on all layer types

### 8. **Rounded Corners on Rectangles** ⚠️ IMPORTANT
- **What**: Border radius on rectangular shapes
- **Used in**: Cards, buttons, modern design
- **Example**: `cornerRadius: 32` for rounded cards
- **Implementation needed**: Ensure cornerRadius renders correctly

### 9. **Multiple Text Layers with Different Styles** ⚠️ IMPORTANT
- **What**: Multiple text elements with different fonts, sizes, colors
- **Used in**: All templates for hierarchy
- **Implementation needed**: Ensure proper text layer management

### 10. **Canvas Background Colors** ⚠️ IMPORTANT
- **What**: Custom background colors for canvas
- **Used in**: All templates
- **Example**: `canvasBackgroundColor: '#ffffff'` or `'#0a0a0a'`
- **Implementation needed**: Ensure background color rendering

### 11. **Canvas Filters** ⚠️ MEDIUM
- **What**: Brightness, contrast, saturation, blur on entire canvas
- **Used in**: Some templates for overall mood
- **Example**: `canvasFilters: { brightness: 110, contrast: 120 }`
- **Implementation needed**: Add canvas-level filter support

### 12. **Letter Spacing** ⚠️ MEDIUM
- **What**: Custom spacing between letters in text
- **Used in**: Headlines, professional typography
- **Example**: `letterSpacing: 2` or `letterSpacing: -1`
- **Implementation needed**: Ensure letter-spacing CSS property works

### 13. **Line Height** ⚠️ MEDIUM
- **What**: Vertical spacing between lines of text
- **Used in**: Multi-line text, readability
- **Example**: `lineHeight: 1.6`
- **Implementation needed**: Ensure line-height CSS property works

### 14. **Text Transform** ⚠️ MEDIUM
- **What**: Uppercase, lowercase, capitalize text
- **Used in**: Headers, professional styling
- **Example**: `textTransform: 'uppercase'`
- **Implementation needed**: Add text-transform CSS support

### 15. **Negative Coordinates** ⚠️ MEDIUM
- **What**: Shapes positioned outside canvas bounds (for overflow effects)
- **Used in**: Background circles, decorative elements
- **Example**: `x: -200, y: -200` for circles extending beyond canvas
- **Implementation needed**: Ensure canvas handles negative coordinates

---

## Summary of Required Features by Priority

### 🔴 CRITICAL (Must Have)
1. Gradient fills
2. Text shadows
3. Shape strokes/borders
4. Box shadows on shapes
5. Blend modes

### 🟠 IMPORTANT (Should Have)
6. Text styling (italic, underline)
7. Opacity/transparency
8. Rounded corners
9. Multiple text layers
10. Canvas background colors

### 🟡 MEDIUM (Nice to Have)
11. Canvas filters
12. Letter spacing
13. Line height
14. Text transform
15. Negative coordinates

---

## Templates Using Each Feature

### Gradients
- All templates (backgrounds, overlays)

### Text Shadows
- Instagram Post, Story/Reel, YouTube Thumbnail, LinkedIn Post, Presentation, TikTok Ad, Pinterest Pin, Business Card, Twitter Header, Event Poster, Podcast Cover, Product Showcase, Webinar Cover, Quote Graphic

### Shape Strokes
- Quote Graphic, Webinar Cover

### Box Shadows
- Instagram Post, LinkedIn Post, Presentation, TikTok Ad, Pinterest Pin, Business Card, Podcast Cover

### Blend Modes
- Multiple templates for overlay effects

### Opacity
- All templates (background circles, overlays)

### Rounded Corners
- All templates (cards, buttons, modern design)

### Letter Spacing
- All templates (professional typography)

### Line Height
- All templates (text readability)

### Text Transform
- All templates (uppercase headers)

### Negative Coordinates
- All templates (background decorative elements)

---

## Implementation Roadmap

### Phase 1: Critical Features (Week 1)
- [ ] Add gradient support to ShapeLayer
- [ ] Implement text shadows
- [ ] Add stroke property to ShapeLayer
- [ ] Implement box shadows on shapes
- [ ] Add blend mode support

### Phase 2: Important Features (Week 2)
- [ ] Enhance text styling (italic, underline)
- [ ] Ensure opacity works on all layers
- [ ] Verify rounded corners rendering
- [ ] Test multiple text layers
- [ ] Verify canvas background colors

### Phase 3: Medium Features (Week 3)
- [ ] Add canvas filters
- [ ] Ensure letter spacing works
- [ ] Ensure line height works
- [ ] Add text transform support
- [ ] Handle negative coordinates

---

## Testing Checklist

- [ ] All templates render without errors
- [ ] Shadows appear correctly
- [ ] Gradients display smoothly
- [ ] Strokes/borders render properly
- [ ] Blend modes work as expected
- [ ] Opacity values apply correctly
- [ ] Text styling displays properly
- [ ] Canvas background colors apply
- [ ] Rounded corners render correctly
- [ ] Negative coordinates don't break layout
