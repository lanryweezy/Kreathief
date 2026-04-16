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
  addBrandKit: (kit) => set((state: any) => ({
    brandKits: [...state.brandKits, kit],
    hasUnsavedChanges: true
  })),
  deleteBrandKit: (id) => set((state: any) => ({
    brandKits: state.brandKits.filter((k: BrandKit) => k.id !== id),
    hasUnsavedChanges: true
  })),
  updateBrandKit: (id, updates) =>
    set((state: any) => ({
      brandKits: state.brandKits.map((k: BrandKit) => (k.id === id ? { ...k, ...updates } : k)),
      hasUnsavedChanges: true
    })),
  applyBrandColors: (colors: string[]) => {
    if (!colors || colors.length === 0) {return;}
    get().saveToHistory?.();

    // WCAG Contrast Utilities
    const getLuminance = (hex: string) => {
      const rgb = hex.replace(/^#/, '').match(/.{2}/g)?.map(x => parseInt(x, 16) / 255) || [0, 0, 0];
      const res = rgb.map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
      return 0.2126 * res[0] + 0.7152 * res[1] + 0.0722 * res[2];
    };

    const getContrast = (c1: string, c2: string) => {
      const l1 = getLuminance(c1) + 0.05;
      const l2 = getLuminance(c2) + 0.05;
      return l1 > l2 ? l1 / l2 : l2 / l1;
    };

    const getBestContrast = (bg: string, pool: string[]) => {
      return pool.reduce((best, current) => 
        getContrast(bg, current) > getContrast(bg, best) ? current : best
      );
    };

    const background = colors[0];
    const colorPool = colors.slice(1).length > 0 ? colors.slice(1) : colors;

    set((state: any) => ({
      canvasBackgroundColor: background,
      artboards: state.artboards.map((artboard: any) => ({
        ...artboard,
        backgroundColor: background,
        layers: artboard.layers.map((l: Layer) => {
          if (l.type === 'text') {
            return { ...l, color: getBestContrast(background, colorPool) };
          }
          if (['rectangle', 'circle', 'triangle', 'path', 'star'].includes(l.type)) {
            // Use a diverse but legible choice for shapes
            return { ...l, color: colorPool[Math.floor(Math.random() * colorPool.length)] };
          }
          return l;
        })
      }))
    }));
  },
  applyBrandFonts: (heading, body) => {
    get().saveToHistory?.();
    const { artboards, updateLayer } = get();
    artboards.forEach((artboard: any) => {
      artboard.layers.forEach((l: Layer) => {
        if (l.type === 'text') {
          updateLayer(l.id, { fontFamily: (l as TextLayer).fontWeight === '700' ? heading : body });
        }
      });
    });
  },
});
