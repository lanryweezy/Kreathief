import { StateCreator } from 'zustand';
import type { StoreState } from '../../useStore';
import { Artboard, TextLayer } from '../../../types';
import { LayerSlice } from './baseSlice';

export const createStyleSlice: StateCreator<StoreState, [], [], Partial<LayerSlice>> = (set) => ({
  applyTexture: (textureUrl, _intensity) =>
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => {
          if (state.selectedLayerIds.includes(l.id) && l.type === 'text') {
            return { ...l, decorations: { ...(l as TextLayer).decorations, textures: [textureUrl] } } as TextLayer;
          }
          return l;
        }),
      })),
    })),

  removeTexture: () =>
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => {
          if (state.selectedLayerIds.includes(l.id) && l.type === 'text') {
            const { textures: _, ...remaining } = (l as TextLayer).decorations || {};
            return { ...l, decorations: remaining } as TextLayer;
          }
          return l;
        }),
      })),
    })),

  shufflePalette: () => {
    // 5 curated aesthetic palettes (Y2K, Vaporwave, Pastel, Neon, Vintage)
    const PALETTES = [
      ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#ff0000'],
      ['#ff71ce', '#01cdfe', '#05ffa1', '#b967ff', '#fffb96'],
      ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff'],
      ['#39ff14', '#fe019a', '#0ff0fc', '#bc13fe', '#fff01f'],
      ['#2a363b', '#e84a5f', '#ff847c', '#fecea8', '#99b898'],
    ];
    // Pick a random palette
    const targetPalette = PALETTES[Math.floor(Math.random() * PALETTES.length)];

    set((state: any) => {
      // First, collect all unique solid colors currently used in the active artboard
      const activeArtboard =
        state.artboards.find((a: Artboard) => a.id === state.activeArtboardId) || state.artboards[0];
      if (!activeArtboard) {
        return state;
      }

      const colors = new Set<string>();
      activeArtboard.layers.forEach((l: any) => {
        if (l.color && typeof l.color === 'string') {
          colors.add(l.color);
        }
        if (l.fill && typeof l.fill === 'string') {
          colors.add(l.fill);
        }
        if (l.stroke && l.stroke.color) {
          colors.add(l.stroke.color);
        }
      });

      // Create a mapping from old colors to new colors from the target palette
      const colorMap = new Map<string, string>();
      let i = 0;
      colors.forEach((c) => {
        colorMap.set(c, targetPalette[i % targetPalette.length]);
        i++;
      });

      return {
        artboards: state.artboards.map((a: Artboard) => {
          if (a.id !== state.activeArtboardId) {
            return a;
          }
          return {
            ...a,
            layers: a.layers.map((l: any) => {
              const updates: any = {};
              if (l.color && typeof l.color === 'string' && colorMap.has(l.color)) {
                updates.color = colorMap.get(l.color);
              }
              if (l.fill && typeof l.fill === 'string' && colorMap.has(l.fill)) {
                updates.fill = colorMap.get(l.fill);
              }
              if (l.stroke && l.stroke.color && colorMap.has(l.stroke.color)) {
                updates.stroke = { ...l.stroke, color: colorMap.get(l.stroke.color) };
              }
              return Object.keys(updates).length > 0 ? { ...l, ...updates } : l;
            }),
          };
        }),
      };
    });
  },

  syncTextStyleAcrossProject: (sourceLayerId: string) => {
    set((state: any) => {
      // Find the source layer
      let sourceLayer: TextLayer | undefined;
      for (const a of state.artboards) {
        const found = a.layers.find((l: any) => l.id === sourceLayerId);
        if (found && found.type === 'text') {
          sourceLayer = found as TextLayer;
          break;
        }
      }
      if (!sourceLayer) {
        return state;
      }

      // Extract styles to copy
      const {
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        color,
        textAlign,
        letterSpacing,
        lineHeight,
        textTransform,
        textDecoration,
        textShadow,
        styleType,
        warpStyle,
      } = sourceLayer;

      return {
        artboards: state.artboards.map((a: Artboard) => ({
          ...a,
          layers: a.layers.map((l: any) => {
            // Apply to all text layers with the SAME font family, except the source layer
            if (l.type === 'text' && l.id !== sourceLayerId && l.fontFamily === fontFamily) {
              return {
                ...l,
                fontSize,
                fontWeight,
                fontStyle,
                color,
                textAlign,
                letterSpacing,
                lineHeight,
                textTransform,
                textDecoration,
                textShadow,
                styleType,
                warpStyle,
              };
            }
            return l;
          }),
        })),
      };
    });
  },

  setEditingPathId: (id) => set({ editingPathId: id }),

  onUpdatePath: (id, updates) =>
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
      })),
    })),

  applyMask: (targetId, maskId) =>
    set((state: any) => ({
      artboards: state.artboards.map((a: Artboard) => ({
        ...a,
        layers: a.layers.map((l) => (l.id === targetId ? { ...l, maskLayerId: maskId || undefined } : l)),
      })),
    })),
});
