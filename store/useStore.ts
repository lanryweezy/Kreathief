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

  // Common action to reset the store completely
  reset: () => {
    set({
      // UI Slice
      activeTab: 'MAGIC' as any,
      showGrid: false,
      showRulers: false,
      isCommandPaletteOpen: false,
      showFeedbackModal: false,
      showShortcuts: false,
      showShareModal: false,
      zoom: 1,

      // Canvas Slice
      canvasBackgroundColor: '#ffffff',
      canvasFilters: { brightness: 100, contrast: 100, saturation: 100, sepia: 0, grayscale: 0, blur: 0, opacity: 1, vignette: 0, hueRotate: 0 },
      canvasSize: { width: 1080, height: 1080, name: 'Square' },
      isExporting: false,

      // Drawing Slice
      isPenMode: false,

      // Layer/Base Slice
      artboards: [],
      activeArtboardId: undefined,
      selectedLayerIds: [],

      // Project Slice
      projectId: `proj_${Date.now()}`,
      projectTitle: 'Untitled Design',
      isSaving: false,
      syncStatus: 'synced',
      lastSaved: null,
      hasUnsavedChanges: false,
      projects: [],

      // History Slice
      past: [],
      future: [],
      // @ts-ignore - internal slice property
      __batchDepth: 0,
      __hasPendingBatchChange: false,
      __lastStateSnapshot: null,
      
      // Brand Slice
      brandKits: [],
      activeBrandKitId: null,

      // Agent Slice
      agentStatus: 'idle',
      agentVariants: [],
      agentError: null,
      agentIntent: '',
      thinkingLog: [],

      // AI Slice (Resetting transient data)
      uploads: [],
    });
  },
}));

