const fs = require('fs');
const file = 'c:/Users/USER/Desktop/Kreathief/store/slices/aiSlice.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. generateImage credit deduction
content = content.replace(
  `  generateImage: async () => {
    const { prompt, aspectRatio, quality, addImageLayer, selectedImageModel, useBrandInPrompts, styleReference } =
      get();
    if (!prompt) {
      return;
    }`,
  `  generateImage: async () => {
    const { prompt, aspectRatio, quality, addImageLayer, selectedImageModel, useBrandInPrompts, styleReference } =
      get();
    if (!prompt) {
      return;
    }
    if (!get().deductCredit?.(1)) {
      return;
    }`
);

// 2. onRmBg credit deduction
content = content.replace(
  `  onRmBg: async (id) => {
    const { artboards, activeArtboardId, updateLayer, saveToHistory } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    const layer = artboard?.layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }`,
  `  onRmBg: async (id) => {
    const { artboards, activeArtboardId, updateLayer, saveToHistory } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    const layer = artboard?.layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }
    if (!get().deductCredit?.(1)) {
      return;
    }`
);

// 3. onMagicExpand credit deduction
content = content.replace(
  `  onMagicExpand: async (id) => {
    const { artboards, activeArtboardId, updateLayer, saveToHistory, addToast } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    const layer = artboard?.layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }`,
  `  onMagicExpand: async (id) => {
    const { artboards, activeArtboardId, updateLayer, saveToHistory, addToast } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    const layer = artboard?.layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }
    if (!get().deductCredit?.(1)) {
      return;
    }`
);

// 4. onUpscale credit deduction
content = content.replace(
  `  onUpscale: async (id) => {
    const { artboards, activeArtboardId, updateLayer, saveToHistory, addToast } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    const layer = artboard?.layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }`,
  `  onUpscale: async (id) => {
    const { artboards, activeArtboardId, updateLayer, saveToHistory, addToast } = get();
    const artboard = artboards.find((a: any) => a.id === activeArtboardId);
    const layer = artboard?.layers.find((l: Layer) => l.id === id) as ImageLayer;
    if (!layer || layer.type !== 'image') {
      return;
    }
    if (!get().deductCredit?.(1)) {
      return;
    }`
);

fs.writeFileSync(file, content);
console.log('Patched aiSlice.ts with credit checks');
