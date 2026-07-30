import { StateCreator } from 'zustand';
import { CanvasSize, CanvasUnit, CanvasFilters } from '../../types';
import type { StoreState } from '../useStore';

export const DEFAULT_CANVAS_FILTERS: CanvasFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  grayscale: 0,
  blur: 0,
  opacity: 1,
  vignette: 0,
  hueRotate: 0,
  noise: 0,
  grainScale: 50,
  textureBlendMode: 'overlay',
};

export const DEFAULT_CANVAS_SIZE: CanvasSize = { width: 1080, height: 1080, name: 'Square (IG Post)' };

export interface CanvasSlice {
  canvasSize: CanvasSize;
  canvasBackgroundColor: string;
  canvasFilters: CanvasFilters;
  unit: CanvasUnit;
  panOffset: { x: number; y: number };

  setCanvasSize: (size: CanvasSize) => void;
  setCanvasBackgroundColor: (color: string) => void;
  setCanvasFilters: (filters: CanvasFilters | ((prev: CanvasFilters) => CanvasFilters)) => void;
  setUnit: (unit: CanvasUnit) => void;
  setPanOffset: (
    offset: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })
  ) => void;
}

export const createCanvasSlice: StateCreator<StoreState, [], [], CanvasSlice> = (set, get) => ({
  canvasSize: DEFAULT_CANVAS_SIZE,
  canvasBackgroundColor: '#ffffff',
  canvasFilters: DEFAULT_CANVAS_FILTERS,
  unit: 'px',
  panOffset: { x: 0, y: 0 },

  setCanvasSize: (canvasSize) => {
    // Record before mutating so canvas resize is undoable
    get().saveToHistory?.();
    set({ canvasSize });
    const state = get();
    if (state.activeArtboardId && state.updateArtboard) {
      state.updateArtboard(state.activeArtboardId, { width: canvasSize.width, height: canvasSize.height });
    }
  },
  setCanvasBackgroundColor: (canvasBackgroundColor) => {
    get().saveToHistory?.();
    set({ canvasBackgroundColor });
  },
  setCanvasFilters: (input) => {
    // saveToHistory is debounced, so slider drags collapse into one entry
    get().saveToHistory?.();
    set((state: CanvasSlice) => ({
      canvasFilters: typeof input === 'function' ? input(state.canvasFilters) : input,
    }));
  },
  setUnit: (unit) => set({ unit }),
  setPanOffset: (input) =>
    set((state: CanvasSlice) => ({
      panOffset: typeof input === 'function' ? input(state.panOffset) : input,
    })),
});
