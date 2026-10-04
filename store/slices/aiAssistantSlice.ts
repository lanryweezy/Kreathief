import { agenticCopilot } from '../../services/agenticCopilot';
import { StateCreator } from 'zustand';
import { AIAssistantState, DesignCritique, DesignSuggestion, ChatMessage, DesignContext, SpatialPin } from '../../types';
import * as aiService from '../../services/aiService';
import { critiqueDesign, DesignCritiqueResult } from '../../services/designCritiqueEngine';
import { analyticsService } from '../../services/analyticsService';
import { log } from '../../utils/log';
import { v4 as uuidv4 } from 'uuid';
import type { StoreState } from '../useStore';

export interface AIAssistantSlice extends AIAssistantState {
  // Actions
  toggleAssistant: () => void;
  minimizeAssistant: () => void;
  moveAssistant: (x: number, y: number) => void;
  setAutoSuggest: (enabled: boolean) => void;

  // Spatial Pinning
  setSpatialPinMode: (enabled: boolean) => void;
  setSpatialPin: (pin: SpatialPin | null) => void;
  clearSpatialPin: () => void;

  // Analysis
  analyzeCurrentDesign: () => Promise<void>;
  sendMessage: (message: string, overridePin?: SpatialPin | null) => Promise<void>;
  clearConversation: () => void;

  // Enhanced critique
  enhancedCritique: DesignCritiqueResult | null;
  analyzeDesignEnhanced: () => Promise<DesignCritiqueResult | null>;

  // Suggestions
  dismissSuggestion: (suggestionId: string) => void;
  applySuggestion: (suggestionId: string) => void;

  // Real-time analysis
  triggerRealtimeAnalysis: (changeType?: string, layerId?: string) => Promise<void>;

  // Internal state management
  setAnalyzing: (analyzing: boolean) => void;
  setCritique: (critique: DesignCritique | undefined) => void;
  addMessage: (message: ChatMessage) => void;
}

const initialState: AIAssistantState = {
  isActive: false,
  isAnalyzing: false,
  currentCritique: undefined,
  enhancedCritique: null,
  conversationHistory: [],
  lastAnalysis: 0,
  autoSuggest: true,
  position: { x: window.innerWidth - 420, y: 100 },
  isMinimized: false,
  isSpatialPinMode: false,
  spatialPin: null,
};

export const createAIAssistantSlice: StateCreator<StoreState, [], [], AIAssistantSlice> = (set, get) => ({
  ...initialState,

  // Basic UI actions
  toggleAssistant: () => {
    const current = get().isActive;
    set({ isActive: !current });

    // If opening for the first time and there's a design, analyze it
    if (!current && get().artboards?.length > 0) {
      setTimeout(() => {
        get().analyzeCurrentDesign();
      }, 500);
    }
  },

  minimizeAssistant: () => {
    set({ isMinimized: !get().isMinimized });
  },

  moveAssistant: (x: number, y: number) => {
    set({ position: { x, y } });
  },

  setAutoSuggest: (enabled: boolean) => {
    set({ autoSuggest: enabled });
  },

  setSpatialPinMode: (enabled: boolean) => {
    set({ isSpatialPinMode: enabled });
  },

  setSpatialPin: (pin: SpatialPin | null) => {
    set({ spatialPin: pin });
  },

  clearSpatialPin: () => {
    set({ spatialPin: null, isSpatialPinMode: false });
  },

  // Analysis functions
  analyzeCurrentDesign: async () => {
    const state = get();
    const activeArtboard = state.artboards?.find((a: any) => a.id === state.activeArtboardId);

    if (!activeArtboard) {
      log.warn('[AI Assistant] No active artboard to analyze');
      return;
    }

    set({ isAnalyzing: true });

    try {
      const context: DesignContext = {
        canvasSize: state.canvasSize || { width: 1080, height: 1080, name: 'Square' },
        layerCount: activeArtboard.layers.length,
        hasText: activeArtboard.layers.some((l: any) => l.type === 'text'),
        hasImages: activeArtboard.layers.some((l: any) => l.type === 'image'),
        colorPalette: (state as any).documentColors || [],
        fontFamilies: [
          ...new Set(
            activeArtboard.layers
              .filter((l: any) => l.type === 'text')
              .map((l: any) => l.fontFamily as string)
              .filter(Boolean)
          ),
        ] as string[],
        brandKit: state.brandKits?.find((bk: any) => bk.id === state.activeBrandKitId),
        purpose: state.projectTitle?.toLowerCase().includes('social') ? 'social_post' : undefined,
      };

      const critique = await aiService.analyzeDesign(activeArtboard, context, context.brandKit);

      set({
        currentCritique: critique,
        lastAnalysis: Date.now(),
        isAnalyzing: false,
      });

      // Add analysis result to conversation
      const analysisMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `I've analyzed your design! Overall score: ${critique.overallScore}/100. ${
          critique.suggestions.length > 0
            ? `I found ${critique.suggestions.length} suggestions for improvement.`
            : 'Looking great!'
        }`,
        timestamp: Date.now(),
      };

      get().addMessage(analysisMessage);
    } catch (error) {
      log.error('[AI Assistant] Analysis failed', error);
      set({ isAnalyzing: false });

      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I had trouble analyzing your design. Please try again.',
        timestamp: Date.now(),
      };

      get().addMessage(errorMessage);
    }
  },

  enhancedCritique: null,

  analyzeDesignEnhanced: async () => {
    const state = get();
    const activeArtboard = state.artboards?.find((a: any) => a.id === state.activeArtboardId);

    if (!activeArtboard) {
      log.warn('[AI Assistant] No active artboard to analyze');
      return null;
    }

    set({ isAnalyzing: true });

    try {
      const context: DesignContext = {
        canvasSize: state.canvasSize || { width: 1080, height: 1080, name: 'Square' },
        layerCount: activeArtboard.layers.length,
        hasText: activeArtboard.layers.some((l: any) => l.type === 'text'),
        hasImages: activeArtboard.layers.some((l: any) => l.type === 'image'),
        colorPalette: (state as any).documentColors || [],
        fontFamilies: [
          ...new Set(
            activeArtboard.layers
              .filter((l: any) => l.type === 'text')
              .map((l: any) => l.fontFamily as string)
              .filter(Boolean)
          ),
        ] as string[],
        brandKit: state.brandKits?.find((bk: any) => bk.id === state.activeBrandKitId),
        purpose: state.projectTitle?.toLowerCase().includes('social') ? 'social_post' : undefined,
      };

      const result = await critiqueDesign(activeArtboard, context, context.brandKit);

      set({
        enhancedCritique: result,
        isAnalyzing: false,
        lastAnalysis: Date.now(),
      });

      const analysisMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `Design Critique: ${result.letterGrade} (${result.overallScore}/100)\n\n${result.summary}\n\nQuick wins:\n${result.quickWins.map((w) => `• ${w}`).join('\n')}`,
        timestamp: Date.now(),
      };

      get().addMessage(analysisMessage);
      return result;
    } catch (error) {
      log.error('[AI Assistant] Enhanced analysis failed', error);
      set({ isAnalyzing: false });
      return null;
    }
  },

  sendMessage: async (message: string, overridePin?: SpatialPin | null) => {
    const state = get();

    analyticsService.track('agent_chat', { message_length: message.length });

    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };

    set((state: any) => ({
      conversation: [...state.conversation, userMessage],
      isAnalyzing: true,
      lastAnalysisTimestamp: Date.now(),
    }));

    try {
      // 🚀 AGENTIC ROUTING 🚀
      // Route the natural language through the Agentic Copilot to execute state mutations
      // 🛡️ User Protection: Group all AI actions into a single Undo block
      if (typeof state.beginBatch === 'function') state.beginBatch();
      if (typeof state.saveToHistory === 'function') state.saveToHistory();

      const targetPin = overridePin !== undefined ? overridePin : state.spatialPin;
      const aiResponse = await agenticCopilot.processCommand(message, targetPin);

      if (typeof state.endBatch === 'function') state.endBatch();

      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      };

      set((state: any) => ({
        conversation: [...state.conversation, aiMessage],
        isAnalyzing: false,
      }));
    } catch (error) {
      log.error('[aiAssistantSlice] Error in Agentic Copilot:', error);
      set({ isAnalyzing: false });
    }
  },

  clearConversation: () => {
    set({
      conversationHistory: [],
      currentCritique: undefined,
    });
  },

  // Suggestion management
  dismissSuggestion: (suggestionId: string) => {
    const critique = get().currentCritique;
    if (!critique) return;

    const updatedSuggestions = critique.suggestions.filter((s: any) => s.id !== suggestionId);

    set({
      currentCritique: {
        ...critique,
        suggestions: updatedSuggestions,
      },
    });
  },

  applySuggestion: async (suggestionId: string) => {
    const critique = get().currentCritique;
    if (!critique) return;

    const suggestion = critique.suggestions.find((s: any) => s.id === suggestionId);
    if (!suggestion?.autoFix) return;

    try {
      suggestion.autoFix();
      get().dismissSuggestion(suggestionId);
    } catch (error) {
      log.error('[AI Assistant] Auto-fix failed', error);
    }
  },

  // Real-time analysis
  triggerRealtimeAnalysis: async (changeType?: string, layerId?: string) => {
    const state = get();

    if (!state.autoSuggest || !state.isActive) return;

    // Throttle analysis - don't analyze more than once every 2 seconds
    if (Date.now() - state.lastAnalysis < 2000) return;

    const activeArtboard = state.artboards?.find((a: any) => a.id === state.activeArtboardId);
    if (!activeArtboard) return;

    try {
      const context: DesignContext = {
        canvasSize: state.canvasSize || { width: 1080, height: 1080, name: 'Square' },
        layerCount: activeArtboard.layers.length,
        hasText: activeArtboard.layers.some((l: any) => l.type === 'text'),
        hasImages: activeArtboard.layers.some((l: any) => l.type === 'image'),
        colorPalette: (state as any).documentColors || [],
        fontFamilies: [
          ...new Set(
            activeArtboard.layers
              .filter((l: any) => l.type === 'text')
              .map((l: any) => l.fontFamily as string)
              .filter(Boolean)
          ),
        ] as string[],
      };

      const suggestions = await aiService.getRealtimeSuggestions(activeArtboard, context, {
        type: changeType || 'unknown',
        layerId,
      });

      if (suggestions.length > 0) {
        const currentCritique = state.currentCritique;
        set({
          currentCritique: {
            overallScore: currentCritique?.overallScore || 75,
            suggestions: suggestions,
            strengths: currentCritique?.strengths || [],
            areas_for_improvement: currentCritique?.areas_for_improvement || [],
            timestamp: Date.now(),
          },
          lastAnalysis: Date.now(),
        });
      }
    } catch (error) {
      log.error('[AI Assistant] Real-time analysis failed', error);
    }
  },

  // Internal state management
  setAnalyzing: (analyzing: boolean) => {
    set({ isAnalyzing: analyzing });
  },

  setCritique: (critique: DesignCritique | undefined) => {
    set({ currentCritique: critique });
  },

  addMessage: (message: ChatMessage) => {
    const history = get().conversationHistory;
    set({
      conversationHistory: [...history, message],
    });
  },
});
