import { StateCreator } from 'zustand';
import { BrandKit, Layer, Artboard } from '../../types';
import type { StoreState } from '../useStore';

// Get perceived brightness of a hex color (0-255)
function getBrightness(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

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

export const createBrandSlice: StateCreator<StoreState, [], [], BrandSlice> = (set, get) => ({
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

    // 1-Click Brand Shuffle: Randomize background color
    const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
    const background = shuffledColors[0];
    const colorPool = shuffledColors.slice(1).length > 0 ? shuffledColors.slice(1) : shuffledColors;

    // Smart contrast: determine if background is light or dark
    const bgBrightness = getBrightness(background);
    const isLightBg = bgBrightness > 128;

    // Sort colors by brightness for smart assignment
    const sortedColors = [...colorPool].sort((a, b) => getBrightness(a) - getBrightness(b));
    const lightColors = sortedColors.filter((c) => getBrightness(c) > 128);
    const darkColors = sortedColors.filter((c) => getBrightness(c) <= 128);

    set((state: any) => ({
      canvasBackgroundColor: background,
      artboards: state.artboards.map((artboard: any) => ({
        ...artboard,
        backgroundColor: background,
        layers: artboard.layers.map((l: Layer, layerIdx: number) => {
          // Do not override locked layers!
          if (l.locked || l.lockStyle) {
            return l;
          }

          if (l.type === 'text') {
            // Text gets contrasting color (readable on background)
            const textColor = isLightBg
              ? darkColors[0] || colorPool[colorPool.length - 1]
              : lightColors[0] || colorPool[0];
            return {
              ...l,
              color: textColor,
              colorToken: kitId ? { kitId, type: 'color', path: 'colors.1' } : undefined,
            };
          }
          if (['rectangle', 'circle', 'triangle', 'path', 'star'].includes(l.type)) {
            // 1-Click Brand Shuffle: Assign random color from pool
            const colorIdx = Math.floor(Math.random() * colorPool.length);
            return {
              ...l,
              color: colorPool[colorIdx],
              colorToken: kitId
                ? { kitId, type: 'color', path: `colors.${colors.indexOf(colorPool[colorIdx])}` }
                : undefined,
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
          if (l.locked || l.lockStyle) {
            return l;
          }

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
