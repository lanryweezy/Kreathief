const fs = require('fs');
const file = 'c:/Users/USER/Desktop/Kreathief/store/slices/historySlice.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add cloneLayer and cloneArtboards helper functions
const helperCode = `
// Fast, memory-efficient layer cloning that preserves immutable string references (e.g. image URLs/pathData)
// to eliminate GC thrashing and memory bloat across undo/redo stacks.
function cloneLayer(l: any): any {
  if (!l) return l;
  return {
    ...l,
    filters: l.filters ? { ...l.filters } : undefined,
    stroke: l.stroke ? { ...l.stroke } : undefined,
    shadow: l.shadow ? { ...l.shadow } : undefined,
    crop: l.crop ? { ...l.crop } : undefined,
    animation: l.animation ? { ...l.animation } : undefined,
    neonGlow: l.neonGlow ? { ...l.neonGlow } : undefined,
    pathEffects: l.pathEffects ? { ...l.pathEffects } : undefined,
    interactions: l.interactions ? [...l.interactions] : undefined,
  };
}

function cloneArtboards(artboards: Artboard[]): Artboard[] {
  if (!artboards) return [];
  return artboards.map((a: Artboard) => ({
    ...a,
    layers: a.layers ? a.layers.map(cloneLayer) : [],
  }));
}
`;

content = content.replace(
  'export const createHistorySlice: StateCreator<StoreState, [], [], HistorySlice> = (set, get) => ({',
  helperCode + '\nexport const createHistorySlice: StateCreator<StoreState, [], [], HistorySlice> = (set, get) => ({'
);

// 2. Replace structuredClone of artboards with cloneArtboards
content = content.replace(/structuredClone\(([^)]*artboards)\)/g, 'cloneArtboards($1)');

// 3. Replace structuredClone of canvasFilters and canvasSize with shallow clones
content = content.replace(/structuredClone\(([^)]*canvasFilters)\)/g, '($1 ? { ...$1 } : undefined as any)');
content = content.replace(/structuredClone\(([^)]*canvasSize)\)/g, '($1 ? { ...$1 } : undefined)');

fs.writeFileSync(file, content);
console.log('Patched historySlice with cloneArtboards');
