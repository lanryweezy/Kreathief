import { StateCreator } from 'zustand';
import { BrushType, CustomBrush } from '../../types';

// FIX: Add brush size limits to prevent performance issues
const BRUSH_SIZE_MIN = 1;
const BRUSH_SIZE_MAX = 500; // Reasonable max to prevent browser lag
const BRUSH_VALUE_MIN = 0;
const BRUSH_VALUE_MAX = 100;

export interface DrawingSlice {
  isPenMode: boolean;
  brushColor: string;
  brushSize: number;
  brushOpacity: number;
  brushType: BrushType;
  brushSmoothing: number;
  brushJitter: number;
  textureIntensity: number;
  customBrushes: CustomBrush[];
  autoSelectAfterDraw: boolean;
  selectedCustomBrushId: string | null;
  setAutoSelectAfterDraw: (autoSelectAfterDraw: boolean) => void;
  setPenMode: (isDrawing: boolean) => void;
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setBrushType: (type: BrushType) => void;
  setBrushSmoothing: (smoothing: number) => void;
  setBrushJitter: (jitter: number) => void;
  setTextureIntensity: (val: number) => void;
  addCustomBrushes: (brushes: CustomBrush[]) => void;
  setSelectedCustomBrushId: (id: string | null) => void;
}

export const createDrawingSlice: StateCreator<DrawingSlice, [], [], DrawingSlice> = (set) => ({
  isPenMode: false,
  brushColor: '#000000',
  brushSize: 5,
  brushOpacity: 1,
  brushType: BrushType.BASIC,
  brushSmoothing: 50,
  brushJitter: 0,
  textureIntensity: 0.5,
  customBrushes: [],
  selectedCustomBrushId: null,

  autoSelectAfterDraw: true,

  setAutoSelectAfterDraw: (autoSelectAfterDraw: boolean) => set({ autoSelectAfterDraw }),
  setPenMode: (isPenMode) => set({ isPenMode }),
  setBrushColor: (brushColor) => set({ brushColor }),

  // FIX: Clamp brush size to valid range
  setBrushSize: (brushSize) => {
    const clampedSize = Math.max(BRUSH_SIZE_MIN, Math.min(BRUSH_SIZE_MAX, brushSize));
    set({ brushSize: clampedSize });
  },

  setBrushOpacity: (brushOpacity) => set({ brushOpacity }),
  setBrushType: (brushType) => set({ brushType }),

  // FIX: Clamp smoothing to 0-100
  setBrushSmoothing: (brushSmoothing) => {
    const clamped = Math.max(BRUSH_VALUE_MIN, Math.min(BRUSH_VALUE_MAX, brushSmoothing));
    set({ brushSmoothing: clamped });
  },

  // FIX: Clamp jitter to 0-100
  setBrushJitter: (brushJitter) => {
    const clamped = Math.max(BRUSH_VALUE_MIN, Math.min(BRUSH_VALUE_MAX, brushJitter));
    set({ brushJitter: clamped });
  },

  setTextureIntensity: (textureIntensity) => set({ textureIntensity }),
  addCustomBrushes: (brushes) => set((state) => ({ customBrushes: [...state.customBrushes, ...brushes] })),
  setSelectedCustomBrushId: (selectedCustomBrushId) => set({ selectedCustomBrushId }),
});
