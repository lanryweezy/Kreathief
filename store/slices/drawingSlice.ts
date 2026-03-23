import { StateCreator } from 'zustand';
import { BrushType } from '../../types';

export interface DrawingSlice {
  isPenMode: boolean;
  brushColor: string;
  brushSize: number;
  brushOpacity: number;
  brushType: BrushType;
  brushSmoothing: number;
  brushJitter: number;
  textureIntensity: number;

  setPenMode: (isDrawing: boolean) => void;
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setBrushType: (type: BrushType) => void;
  setBrushSmoothing: (smoothing: number) => void;
  setBrushJitter: (jitter: number) => void;
  setTextureIntensity: (val: number) => void;
  toggleEraser: () => void;
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

  setPenMode: (isPenMode) => set({ isPenMode }),
  setBrushColor: (brushColor) => set({ brushColor }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setBrushOpacity: (brushOpacity) => set({ brushOpacity }),
  setBrushType: (brushType) => set({ brushType }),
  setBrushSmoothing: (brushSmoothing) => set({ brushSmoothing }),
  setBrushJitter: (brushJitter) => set({ brushJitter }),
  setTextureIntensity: (textureIntensity) => set({ textureIntensity }),
  toggleEraser: () =>
    set((state) => ({
      brushType: state.brushType === BrushType.ERASER ? BrushType.BASIC : BrushType.ERASER,
    })),
});
