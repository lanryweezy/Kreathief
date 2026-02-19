import { StateCreator } from 'zustand';
import { BrandKit, TextLayer, Layer } from '../../types';

export interface BrandSlice {
  brandKits: BrandKit[];
  addBrandKit: (kit: BrandKit) => void;
  deleteBrandKit: (id: string) => void;
  updateBrandKit: (id: string, updates: Partial<BrandKit>) => void;
  applyBrandColors: (colors: string[]) => void;
  applyBrandFonts: (heading: string, body: string) => void;
}

export const createBrandSlice: StateCreator<any, [], [], BrandSlice> = (set, get) => ({
  brandKits: [],
  addBrandKit: (kit) => set((state: any) => ({ brandKits: [...state.brandKits, kit] })),
  deleteBrandKit: (id) => set((state: any) => ({ brandKits: state.brandKits.filter((k: BrandKit) => k.id !== id) })),
  updateBrandKit: (id, updates) =>
    set((state: any) => ({
      brandKits: state.brandKits.map((k: BrandKit) => (k.id === id ? { ...k, ...updates } : k)),
    })),
  applyBrandColors: (colors) => {
    if (!colors || colors.length === 0) {
      return;
    }
    get().saveToHistory?.();

    const background = colors[0];
    const primary = colors[2] || colors[1] || colors[0];
    const secondary = colors[1] || colors[0];
    const accent = colors[3] || colors[2] || colors[1];

    set((state: any) => ({
      canvasBackgroundColor: background,
      layers: state.layers.map((l: Layer, i: number) => {
        if (['rectangle', 'circle', 'triangle', 'path', 'star'].includes(l.type)) {
          const colors_pool = [primary, accent, secondary];
          return { ...l, color: colors_pool[i % colors_pool.length] };
        }
        if (l.type === 'text') {
          const tl = l as TextLayer;
          const color = tl.fontSize > 30 ? primary : accent;
          return { ...l, color };
        }
        return l;
      }),
    }));
  },
  applyBrandFonts: (heading, body) => {
    get().saveToHistory?.();
    const { layers, updateLayer } = get();
    layers.forEach((l: Layer) => {
      if (l.type === 'text') {
        updateLayer(l.id, { fontFamily: (l as TextLayer).fontWeight === '700' ? heading : body });
      }
    });
  },
});
