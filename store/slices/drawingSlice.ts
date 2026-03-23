import { StateCreator } from 'zustand';
import { BrushType } from '../../types';

export interface DrawingSlice {
  isPenMode: boolean;
  brushColor: string;
  brushSize: number;
  brushOpacity: number;
  brushType: BrushType;
  textureIntensity: number;
  brushSmoothing: number;
  brushJitter: number;

  setPenMode: (isDrawing: boolean) => void;
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setBrushType: (type: BrushType) => void;
  setTextureIntensity: (val: number) => void;
  setBrushSmoothing: (val: number) => void;
  setBrushJitter: (val: number) => void;
  toggleEraser: () => void;
}

export const createDrawingSlice: StateCreator<DrawingSlice, [], [], DrawingSlice> = (set) => ({
  isPenMode: false,
  brushColor: '#000000',
  brushSize: 5,
  brushOpacity: 1,
  brushType: BrushType.BASIC,
  textureIntensity: 0.5,
  brushSmoothing: 50,
  brushJitter: 0,

  setPenMode: (isPenMode) => set({ isPenMode }),
  setBrushColor: (brushColor) => set({ brushColor }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setBrushOpacity: (brushOpacity) => set({ brushOpacity }),
  setBrushType: (brushType) => set({ brushType }),
  setTextureIntensity: (textureIntensity) => set({ textureIntensity }),
  setBrushSmoothing: (brushSmoothing) => set({ brushSmoothing }),
  setBrushJitter: (brushJitter) => set({ brushJitter }),
  toggleEraser: () =>
    set((state) => ({
      brushType: state.brushType === BrushType.ERASER ? BrushType.BASIC : BrushType.ERASER,
    })),
});
