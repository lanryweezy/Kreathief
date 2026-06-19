import { StateCreator } from 'zustand';
import { BrandKit, Layer, Artboard } from '../../types';

export interface BrandSlice {
  brandKits: BrandKit[];
  activeBrandKitId: string | null;
  addBrandKit: (kit: BrandKit) => void;
  deleteBrandKit: (id: string) => void;
  updateBrandKit: (id: string, updates: Partial<BrandKit>) => void;
  applyBrandColors: (colors: string[], kitId?: string) => void;
  applyBrandFonts: (heading: string, body: string, kitId?: string) => void;
  setActiveBrandKit: (id: string | null) => void;
  syncLayersWithTokens: () => void;
}

export const createBrandSlice: StateCreator<any, [], [], BrandSlice> = (set, get) => ({
  brandKits: [
    {
      id: 'automotive_procurement',
      name: 'Automotive Procurement (SAP Ariba, Coupa)',
      colors: ['#0b1a30', '#008080', '#ff5722', '#e0e6ed'],
      fonts: ['Space Grotesk', 'Inter'],
      logos: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=100&q=80'],
    },
  ],
  activeBrandKitId: 'automotive_procurement',

  setActiveBrandKit: (id) => set({ activeBrandKitId: id }),

  addBrandKit: (kit) =>
    set((state: any) => ({
      brandKits: [...state.brandKits, kit],
      hasUnsavedChanges: true,
    })),

  deleteBrandKit: (id) =>
    set((state: any) => ({
      brandKits: state.brandKits.filter((k: BrandKit) => k.id !== id),
      activeBrandKitId: state.activeBrandKitId === id ? null : state.activeBrandKitId,
      hasUnsavedChanges: true,
    })),

  updateBrandKit: (id, updates) => {
    set((state: any) => ({
      brandKits: state.brandKits.map((k: BrandKit) => (k.id === id ? { ...k, ...updates } : k)),
      hasUnsavedChanges: true,
    }));
    // Pro: Auto-sync any layers using tokens from this kit
    get().syncLayersWithTokens();
  },

  syncLayersWithTokens: () => {
    const { artboards, brandKits } = get();
    if (!brandKits.length) {
      return;
    }

    const newArtboards = artboards.map((artboard: Artboard) => ({
      ...artboard,
      layers: artboard.layers.map((l: any) => {
        const updatedLayer = { ...l };
        let changed = false;

        // Resolve Color Token
        if (l.colorToken) {
          const kit = brandKits.find((k: any) => k.id === l.colorToken.kitId);
          if (kit) {
            // path 'colors.0' -> kit.colors[0]
            const [type, index] = l.colorToken.path.split('.');
            const newValue = (kit as any)[type]?.[parseInt(index)];
            if (newValue && l.color !== newValue) {
              updatedLayer.color = newValue;
              changed = true;
            }
          }
        }

        // Resolve Font Token
        if (l.fontToken) {
          const kit = brandKits.find((k: any) => k.id === l.fontToken.kitId);
          if (kit) {
            const [type, index] = l.fontToken.path.split('.');
            const newValue = (kit as any)[type]?.[parseInt(index)];
            if (newValue && l.fontFamily !== newValue) {
              updatedLayer.fontFamily = newValue;
              changed = true;
            }
          }
        }

        return changed ? updatedLayer : l;
      }),
    }));

    set({ artboards: newArtboards });
  },

  applyBrandColors: (colors: string[], kitId?: string) => {
    if (!colors || colors.length === 0) {
      return;
    }
    get().saveToHistory?.();

    const background = colors[0];
    const colorPool = colors.slice(1).length > 0 ? colors.slice(1) : colors;

    set((state: any) => ({
      canvasBackgroundColor: background,
      artboards: state.artboards.map((artboard: any) => ({
        ...artboard,
        backgroundColor: background,
        layers: artboard.layers.map((l: Layer) => {
          if (l.type === 'text') {
            return {
              ...l,
              color: colorPool[0],
              colorToken: kitId ? { kitId, type: 'color', path: 'colors.1' } : undefined,
            };
          }
          if (['rectangle', 'circle', 'triangle', 'path', 'star'].includes(l.type)) {
            const idx = Math.floor(Math.random() * colorPool.length);
            return {
              ...l,
              color: colorPool[idx],
              colorToken: kitId ? { kitId, type: 'color', path: `colors.${idx + 1}` } : undefined,
            };
          }
          return l;
        }),
      })),
    }));
  },

  applyBrandFonts: (heading, body, kitId?: string) => {
    get().saveToHistory?.();
    set((state: any) => ({
      artboards: state.artboards.map((artboard: any) => ({
        ...artboard,
        layers: artboard.layers.map((l: any) => {
          if (l.type === 'text') {
            const isHeading = l.fontWeight === '700' || l.fontSize > 32;
            return {
              ...l,
              fontFamily: isHeading ? heading : body,
              fontToken: kitId ? { kitId, type: 'font', path: isHeading ? 'fonts.0' : 'fonts.1' } : undefined,
            };
          }
          return l;
        }),
      })),
    }));
  },
});
