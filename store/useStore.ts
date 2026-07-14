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
import { createCollaborationSlice, CollaborationSlice } from './slices/collaborationSlice';
import { createAIAssistantSlice, AIAssistantSlice } from './slices/aiAssistantSlice';
import { createIntentSlice, IntentSlice } from './slices/intentSlice';
import { DEFAULT_CANVAS_FILTERS, DEFAULT_CANVAS_SIZE } from './slices/canvasSlice';
import type { NavTab } from '../types';

// Merged type for the full store state
export type StoreState = UISlice &
  CanvasSlice &
  DrawingSlice &
  LayerSlice &
  ProjectSlice &
  HistorySlice &
  AISlice &
  BrandSlice &
  AgentSlice &
  CollaborationSlice &
  AIAssistantSlice &
  IntentSlice & {
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
  ...createCollaborationSlice(set, get, store),
  ...createAIAssistantSlice(set, get, store),
  ...createIntentSlice(set, get, store),

  // Common action to reset the store completely
  reset: () => {
    get().stopAutoSave?.();
    set({
      // UI Slice
      activeTab: 'MAGIC' as NavTab,
      showGrid: false,
      showRulers: false,
      isCommandPaletteOpen: false,
      showFeedbackModal: false,
      showShortcuts: false,
      showShareModal: false,
      zoom: 1,
      snapToGrid: false,
      snapToObjects: true,
      fontPreview: null,
      customFonts: [],
      isCropMode: false,
      croppingLayerId: null,
      cropArea: { x: 0, y: 0, width: 0, height: 0 },
      showGoldenRatio: false,
      isEraserActive: false,
      isExpanding: false,
      isRemovingBg: false,
      toasts: [],
      comments: [],
      snapshots: [],
      tags: [],
      isPublished: false,
      favoriteProjects: [],
      isLassoMode: false,
      lassoPoints: [],
      showVersionDiff: false,
      showPresentation: false,

      // Canvas Slice
      canvasBackgroundColor: '#ffffff',
      canvasFilters: DEFAULT_CANVAS_FILTERS,
      canvasSize: DEFAULT_CANVAS_SIZE,
      isExporting: false,

      // Drawing Slice
      isPenMode: false,
      brushColor: '#000000',
      brushSize: 2,
      brushOpacity: 1,
      textureIntensity: 50,

      // Layer/Base Slice
      artboards: [],
      activeArtboardId: undefined,
      selectedLayerIds: [],
      clipboardLayer: null,
      editingPathId: null,

      // Project Slice
      projectId: `proj_${crypto.randomUUID()}`,
      projectTitle: 'Untitled Design',
      isSaving: false,
      syncStatus: 'synced',
      lastSaved: null,
      hasUnsavedChanges: false,
      projects: [],

      // History Slice
      past: [],
      future: [],
      // @ts-expect-error TODO: fix type - internal slice property
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

      // AI Assistant Slice
      isActive: false,
      isAnalyzing: false,
      currentCritique: undefined,
      conversationHistory: [],
      autoSuggest: true,

      // AI Slice
      uploads: [],
      prompt: '',
      isGenerating: false,
    });
  },
}));
