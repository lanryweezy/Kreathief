# 🔍 KREATHIEF UX POLISH AUDIT

**Date:** February 20, 2026
**Focus:** Small improvements to EXISTING features (NO new features)
**Goal:** Make good features feel GREAT

---

## 📊 FEATURE INVENTORY

### **Core Features We Have:**
✅ AI Image Generation (Magic Panel)
✅ Text Tools (fonts, effects, AI rewrite)
✅ Shape Tools (colors, effects, image fill)
✅ Image Tools (BG remove, upscale, enhance, filters)
✅ Layers Panel (reorder, group, lock, hide)
✅ Uploads Panel (drag-drop, PSD import)
✅ Mockup Studio (18 templates)
✅ Text Effects Panel (transforms, shadows, 3D)
✅ Export Modal (PNG, JPG, WebP, SVG, PDF, PSD)
✅ Canvas Tools (size picker, BG color, filters)
✅ Draw Panel (brushes, pencil, eraser)
✅ Brand Kit (colors, fonts, logos)
✅ Templates Panel
✅ Auto-save (10s debounce)
✅ Keyboard shortcuts
✅ Undo/Redo

---

## 🎯 SMALL IMPROVEMENTS (High Impact, Low Effort)

### **1. Layers Panel - Missing Quality of Life** ⭐⭐⭐

**Current Issues:**
- ❌ No "Rename Layer" on double-click
- ❌ No layer search/filter
- ❌ No "Select All" / "Deselect All"
- ❌ No layer color coding
- ❌ Group names show as "Group" (not editable)

**Quick Fixes:**

```typescript
// A. Double-click to rename
onDoubleClick={() => {
  const newName = prompt('Rename layer:', layer.name);
  if (newName) onUpdate({ name: newName });
}}

// B. Add layer count badge
<div className="text-[9px] text-gray-500">
  {layers.length} layer{layers.length !== 1 ? 's' : ''}
</div>

// C. Show selection count in multi-select
{selectedLayerIds.length > 1 && (
  <span className="text-[9px] text-purple-400">
    {selectedLayerIds.length} selected
  </span>
)}
```

**Impact:** ⭐⭐⭐⭐⭐
**Effort:** 2 hours

---

### **2. Uploads Panel - Better Drag & Drop** ⭐⭐⭐

**Current Issues:**
- ❌ No visual feedback when dragging OVER the panel
- ❌ No file type validation messages
- ❌ No upload progress indicator
- ❌ No "click to add" hint on hover

**Quick Fixes:**

```typescript
// A. Better drag overlay
{isDragging && (
  <div className="absolute inset-0 bg-[#7d2ae8]/20 border-2 border-[#7d2ae8] rounded-lg pointer-events-none z-50">
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-white font-bold text-lg drop-shadow-lg">
        Drop to upload
      </span>
    </div>
  </div>
)}

// B. File type validation
if (!file.type.startsWith('image/')) {
  addToast('Please upload image files only (PNG, JPG, WebP)', 'warning');
  return;
}

// C. Upload progress (if file is large)
const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
// Update progress during FileReader
reader.onprogress = (e) => {
  if (e.lengthComputable) {
    setUploadProgress(prev => ({ ...prev, [file.name]: (e.loaded / e.total) * 100 }));
  }
};
```

**Impact:** ⭐⭐⭐⭐
**Effort:** 3 hours

---

### **3. Export Modal - Missing Presets** ⭐⭐⭐

**Current Issues:**
- ❌ No "Transparent Background" toggle for PNG
- ❌ No scale multiplier (1x, 2x, 3x)
- ❌ No "Export Selected Layers Only" option
- ❌ Filename is always "design.png" (not customizable)

**Quick Fixes:**

```typescript
// A. Transparent background toggle
<label className="flex items-center gap-2 text-xs text-gray-300">
  <input
    type="checkbox"
    checked={transparentBg}
    onChange={(e) => setTransparentBg(e.target.checked)}
    className="accent-[#7d2ae8]"
  />
  Transparent Background
</label>

// B. Scale multiplier
<div className="flex gap-2">
  {[1, 2, 3].map((scale) => (
    <button
      key={scale}
      onClick={() => setExportScale(scale)}
      className={`px-3 py-1.5 text-xs font-bold rounded ${
        exportScale === scale
          ? 'bg-[#7d2ae8] text-white'
          : 'bg-white/5 text-gray-400 hover:bg-white/10'
      }`}
    >
      {scale}x
    </button>
  ))}
</div>

// C. Custom filename
<input
  type="text"
  value={filename}
  onChange={(e) => setFilename(e.target.value)}
  placeholder="design-name"
  className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white"
/>
// Then use: link.download = `${filename}.${format}`
```

**Impact:** ⭐⭐⭐⭐⭐
**Effort:** 2 hours

---

### **4. Text Panel - Font Preview Missing** ⭐⭐

**Current Issues:**
- ❌ Font names don't show in their actual font
- ❌ No "Preview on your text" feature
- ❌ No recently used fonts section
- ❌ No font size quick-select buttons

**Quick Fixes:**

```typescript
// A. Show fonts in their own font family
<button
  style={{ fontFamily: font }}
  className="w-full text-left px-3 py-2 hover:bg-[#7d2ae8]/20 rounded"
>
  <span className="text-sm">{font}</span>
  <span className="text-[9px] text-gray-500 block">Aa Bb Cc</span>
</button>

// B. Recently used fonts (store in localStorage)
const [recentFonts, setRecentFonts] = useState<string[]>([]);

const handleFontSelect = (font: string) => {
  const updated = [font, ...recentFonts.filter(f => f !== font)].slice(0, 5);
  setRecentFonts(updated);
  localStorage.setItem('recent_fonts', JSON.stringify(updated));
  onUpdateTextLayer({ fontFamily: font });
};

// Then show at top:
{recentFonts.length > 0 && (
  <div className="mb-4">
    <h4 className="text-[9px] text-gray-500 uppercase mb-2">Recently Used</h4>
    <div className="flex gap-2 flex-wrap">
      {recentFonts.map(font => (
        <button
          key={font}
          onClick={() => handleFontSelect(font)}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs"
          style={{ fontFamily: font }}
        >
          {font}
        </button>
      ))}
    </div>
  </div>
)}

// C. Font size quick buttons
<div className="flex gap-1 mb-2">
  {[12, 16, 24, 36, 48, 72].map(size => (
    <button
      key={size}
      onClick={() => onUpdateTextLayer({ fontSize: size })}
      className="w-8 h-8 text-[9px] bg-white/5 hover:bg-white/10 rounded"
    >
      {size}
    </button>
  ))}
</div>
```

**Impact:** ⭐⭐⭐⭐
**Effort:** 3 hours

---

### **5. Canvas Tools - Missing Zoom Controls** ⭐⭐⭐

**Current Issues:**
- ❌ No zoom percentage display
- ❌ No "Fit to Screen" button
- ❌ No zoom presets (50%, 100%, 200%)
- ❌ No reset zoom button

**Quick Fixes:**

```typescript
// A. Zoom percentage display
<div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1.5">
  <Icons.Zoom className="w-3.5 h-3.5 text-gray-400" />
  <span className="text-xs font-bold text-white">{Math.round(zoom * 100)}%</span>
</div>

// B. Zoom presets dropdown
<Dropdown
  anchorRef={zoomButtonRef}
  isOpen={showZoomMenu}
  onClose={() => setShowZoomMenu(false)}
>
  <div className="bg-[#1e1e1e] rounded-lg p-2 min-w-[120px]">
    {[0.25, 0.5, 0.75, 1, 1.5, 2].map((z) => (
      <button
        key={z}
        onClick={() => { setZoom(z); setShowZoomMenu(false); }}
        className={`w-full text-left px-3 py-1.5 text-xs rounded ${
          zoom === z ? 'bg-[#7d2ae8] text-white' : 'text-gray-300 hover:bg-white/5'
        }`}
      >
        {z * 100}%
      </button>
    ))}
    <div className="border-t border-white/10 my-1"></div>
    <button
      onClick={() => { setZoomToFit(); setShowZoomMenu(false); }}
      className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 rounded"
    >
      Fit to Screen
    </button>
  </div>
</Dropdown>

// C. Keyboard shortcuts for zoom
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === '0') {
      e.preventDefault();
      setZoom(1); // Reset to 100%
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '=') {
      e.preventDefault();
      setZoom(z => Math.min(z + 0.1, 3));
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '-') {
      e.preventDefault();
      setZoom(z => Math.max(z - 0.1, 0.1));
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

**Impact:** ⭐⭐⭐⭐⭐
**Effort:** 2 hours

---

### **6. Image Tools - Filter Improvements** ⭐⭐

**Current Issues:**
- ❌ Filter presets don't show preview
- ❌ No "Reset All Filters" button
- ❌ No before/after comparison
- ❌ Filter intensity is global (can't adjust per filter)

**Quick Fixes:**

```typescript
// A. Reset button
<button
  onClick={() => handleUpdateLayer({ filters: DEFAULT_FILTERS })}
  className="text-[9px] text-gray-400 hover:text-white underline"
>
  Reset Filters
</button>

// B. Before/After comparison (hold to preview)
const [showingOriginal, setShowingOriginal] = useState(false);

<button
  onMouseDown={() => setShowingOriginal(true)}
  onMouseUp={() => setShowingOriginal(false)}
  onMouseLeave={() => setShowingOriginal(false)}
  className="text-[9px] text-gray-400 hover:text-white"
>
  Hold to compare
</button>

// Then in rendering:
<img
  src={showingOriginal ? originalSrc : processedSrc}
  className="transition-opacity duration-100"
/>

// C. Show filter preview on hover
<div className="relative group">
  <button onClick={() => applyPreset(preset)}>
    {preset.name}
  </button>
  {/* Preview tooltip */}
  <div className="absolute top-full left-0 mt-2 hidden group-hover:block w-32">
    <canvas ref={previewCanvas} className="rounded border border-white/10" />
  </div>
</div>
```

**Impact:** ⭐⭐⭐
**Effort:** 4 hours

---

### **7. Mockup Panel - UX Polish** ⭐⭐⭐

**Current Issues:**
- ❌ No search for mockups
- ❌ No "Favorites" system
- ❌ Mockup names overlap on small screens
- ❌ No loading state when generating composite
- ❌ No "Download All" for multiple mockups

**Quick Fixes:**

```typescript
// A. Search input
<input
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Search mockups..."
  className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white mb-3"
/>

// Then filter:
const filtered = mockups.filter(m =>
  m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  m.category.toLowerCase().includes(searchQuery.toLowerCase())
);

// B. Favorites system
const [favorites, setFavorites] = useState<string[]>(
  JSON.parse(localStorage.getItem('mockup_favorites') || '[]')
);

const toggleFavorite = (id: string) => {
  const updated = favorites.includes(id)
    ? favorites.filter(f => f !== id)
    : [...favorites, id];
  setFavorites(updated);
  localStorage.setItem('mockup_favorites', JSON.stringify(updated));
};

// Show heart icon on mockup cards:
<button onClick={() => toggleFavorite(mockup.id)}>
  {favorites.includes(mockup.id)
    ? <Icons.Heart className="w-3 h-3 text-red-500 fill-current" />
    : <Icons.Heart className="w-3 h-3 text-gray-500" />
  }
</button>

// C. Better loading state
{isGenerating && (
  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-[#7d2ae8] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      <span className="text-xs text-white font-bold">Generating mockup...</span>
    </div>
  </div>
)}
```

**Impact:** ⭐⭐⭐⭐
**Effort:** 3 hours

---

### **8. Draw Panel - Brush Improvements** ⭐⭐

**Current Issues:**
- ❌ No brush size preview
- ❌ No pressure sensitivity toggle
- ❌ No "Smoothness" setting
- ❌ Brush cursor doesn't match size

**Quick Fixes:**

```typescript
// A. Brush size preview circle
<div className="flex items-center gap-3">
  <div
    className="rounded-full bg-white border border-white/20"
    style={{
      width: brushSize,
      height: brushSize,
      opacity: brushOpacity,
      backgroundColor: brushColor,
    }}
  />
  <input
    type="range"
    min="1"
    max="100"
    value={brushSize}
    onChange={(e) => setBrushSize(parseInt(e.target.value))}
    className="flex-1"
  />
</div>

// B. Pressure sensitivity toggle
<label className="flex items-center justify-between text-xs">
  <span className="text-gray-400">Pressure Sensitivity</span>
  <input
    type="checkbox"
    checked={pressureSensitive}
    onChange={(e) => setPressureSensitive(e.target.checked)}
    className="accent-[#7d2ae8]"
  />
</label>

// C. Custom cursor
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const updateCursor = (e: MouseEvent) => {
    const cursor = document.getElementById('brush-cursor');
    if (cursor) {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
      cursor.style.width = `${brushSize}px`;
      cursor.style.height = `${brushSize}px`;
    }
  };

  canvas.addEventListener('mousemove', updateCursor);
  return () => canvas.removeEventListener('mousemove', updateCursor);
}, [brushSize]);
```

**Impact:** ⭐⭐⭐
**Effort:** 3 hours

---

### **9. Color Picker - Missing Features** ⭐⭐

**Current Issues:**
- ❌ No eyedropper tool
- ❌ No color history (beyond recent)
- ❌ No palette export/import
- ❌ No color harmony suggestions

**Quick Fixes:**

```typescript
// A. Eyedropper (native API)
const pickColor = async () => {
  try {
    const eyeDropper = new (window as any).EyeDropper();
    const result = await eyeDropper.open();
    onChange(result.sRGBHex);
    addToRecent(result.sRGBHex);
  } catch (e) {
    addToast('Eyedropper not supported in this browser', 'warning');
  }
};

// Add button:
<button onClick={pickColor} title="Pick color from screen">
  <Icons.EyeDropper className="w-4 h-4" />
</button>

// B. Save/load palette
const savePalette = () => {
  const name = prompt('Palette name:');
  if (!name) return;
  const palettes = JSON.parse(localStorage.getItem('color_palettes') || '[]');
  palettes.push({ name, colors: documentColors });
  localStorage.setItem('color_palettes', JSON.stringify(palettes));
  addToast('Palette saved!', 'success');
};

const loadPalette = (paletteName: string) => {
  const palettes = JSON.parse(localStorage.getItem('color_palettes') || '[]');
  const palette = palettes.find(p => p.name === paletteName);
  if (palette) {
    palette.colors.forEach(color => addLayerColor(color));
  }
};
```

**Impact:** ⭐⭐⭐⭐
**Effort:** 2 hours

---

### **10. Keyboard Shortcuts - Discoverability** ⭐⭐⭐

**Current Issues:**
- ❌ No shortcuts overlay/help
- ❌ No way to customize shortcuts
- ❌ Shortcuts not shown in tooltips
- ❌ No "Press ? for shortcuts" hint

**Quick Fixes:**

```typescript
// A. Shortcuts overlay (already have ShortcutOverlay component!)
// Just make it accessible:
<button
  onClick={() => setShowShortcuts(true)}
  className="fixed bottom-4 right-4 bg-[#1e1e1e] border border-white/10 rounded-full p-3 hover:bg-[#252627]"
  title="Keyboard Shortcuts"
>
  <Icons.Keyboard className="w-5 h-5 text-gray-400" />
</button>

// B. Show shortcuts in tooltips
<IconButton
  onClick={handleDelete}
  title="Delete (Del)"
  // Tooltip shows: "Delete" + "⌘ Del"
/>

// C. Global "?" shortcut
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === '?' && !isInputFocused()) {
      e.preventDefault();
      setShowShortcuts(true);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

**Impact:** ⭐⭐⭐⭐⭐
**Effort:** 1 hour

---

## 📋 PRIORITY ORDER

### **Week 1 (Quick Wins - 1 day each):**
1. ✅ Export Modal improvements (transparent BG, scale, filename)
2. ✅ Layers Panel (rename, count badge, multi-select indicator)
3. ✅ Keyboard Shortcuts discoverability
4. ✅ Canvas Tools zoom controls

### **Week 2 (Medium Effort - 2-3 days each):**
5. ✅ Uploads Panel drag & drop polish
6. ✅ Text Panel font preview & recents
7. ✅ Mockup Panel search & favorites
8. ✅ Color Picker eyedropper

### **Week 3 (Nice to Have):**
9. ✅ Image Tools filter improvements
10. ✅ Draw Panel brush preview

---

## 🎯 SUCCESS METRICS

**Before:**
- Users export at 1x resolution by default
- Users don't know keyboard shortcuts exist
- Layers panel feels cluttered
- Uploads feel "meh"

**After:**
- Users export at 2x/3x with transparent BG
- Users press "?" to see shortcuts
- Layers panel feels polished
- Uploads feel smooth and responsive

---

## 💡 IMPLEMENTATION NOTES

**All improvements are:**
- ✅ Small changes (< 4 hours each)
- ✅ No new dependencies
- ✅ No breaking changes
- ✅ Backwards compatible
- ✅ Can be shipped incrementally

**None of these require:**
- ❌ New features
- ❌ Backend changes
- ❌ API integrations
- ❌ Database migrations
- ❌ Major refactoring

---

**Start with the Export Modal improvements - highest impact, lowest effort!**
