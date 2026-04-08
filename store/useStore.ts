import { create } from 'zustand';
import { createUISlice, UISlice } from './slices/uiSlice';
import { createCanvasSlice, CanvasSlice } from './slices/canvasSlice';
import { createDrawingSlice, DrawingSlice } from './slices/drawingSlice';
import { createLayerSlice, LayerSlice } from './slices/layerSlice';
import { createProjectSlice, ProjectSlice } from './slices/projectSlice';
import { createHistorySlice, HistorySlice } from './slices/historySlice';
import { createAISlice, AISlice } from './slices/aiSlice';
import { createBrandSlice, BrandSlice } from './slices/brandSlice';
import { createAgentSlice, AgentSlice } from './slices/agentSlice';

// Merged type for the full store state
export type StoreState = UISlice &
  CanvasSlice &
  DrawingSlice &
  LayerSlice &
  ProjectSlice &
  HistorySlice &
  AISlice &
  BrandSlice &
  AgentSlice & {
    reset: () => void;
  };

// Combine all slices into a single store with full type safety
export const useStore = create<StoreState>()((set, get, store) => ({
  ...createUISlice(set, get, store),
  ...createCanvasSlice(set, get, store),
  ...createDrawingSlice(set, get, store),
  ...createLayerSlice(set, get, store),
  ...createProjectSlice(set, get, store),
  ...createHistorySlice(set, get, store),
  ...createAISlice(set, get, store),
  ...createBrandSlice(set, get, store),
  ...createAgentSlice(set, get, store),

  // Common action to reset the store
  reset: () => {
    set({
      activeArtboardId: undefined,
      artboards: [],
      selectedLayerIds: [],
      canvasBackgroundColor: '#ffffff',
      past: [],
      future: [],
    });
  },
}));
