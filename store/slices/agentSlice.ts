import { log } from '../../utils/log';

import { StateCreator } from 'zustand';
import { AgentVariant, creativeAgentDraft, creativeAgentRefine, criticAgentReview, performanceAgentScore } from '../../services/multiAgentService';
import { Layer } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export type AgentStatus = 'idle' | 'creative' | 'critic' | 'performance' | 'done' | 'error';

export interface ThinkingEvent {
  id: string;
  agent: string;
  message: string;
  timestamp: number;
}

export interface AgentSlice {
  agentStatus: AgentStatus;
  agentVariants: AgentVariant[];
  agentError: string | null;
  agentIntent: string;
  thinkingLog: ThinkingEvent[];

  runAgenticWorkflow: (intent: string) => Promise<void>;
  runAgenticRefine: (intent: string, layerIds: string[]) => Promise<void>;
  applyAgentVariant: (variantId: string) => void;
  resetAgentState: () => void;
  addThinkingEvent: (agent: string, message: string) => void;
}

export const createAgentSlice: StateCreator<any, [], [], AgentSlice> = (set, get) => ({
  agentStatus: 'idle',
  agentVariants: [],
  agentError: null,
  agentIntent: '',
  thinkingLog: [],

  addThinkingEvent: (agent, message) => {
    set((state: any) => ({
      thinkingLog: [
        ...state.thinkingLog,
        { id: uuidv4().substring(0, 8), agent, message, timestamp: Date.now() }
      ]
    }));
  },

  runAgenticWorkflow: async (intent: string) => {
    try {
      set({ agentStatus: 'creative', agentIntent: intent, agentError: null, agentVariants: [], thinkingLog: [] });
      get().addThinkingEvent('Creative Agent', 'Synthesizing creative direction...');

      const canvasSize = get().canvasSize || { width: 1080, height: 1080 };
      
      // Stage 1: Creative Generation
      const draftedVariants = await creativeAgentDraft(intent, canvasSize);
      get().addThinkingEvent('Creative Agent', `Drafted ${draftedVariants.length} distinct layout directions.`);
      set({ agentVariants: draftedVariants });

      // Stage 2: Critic Review
      set({ agentStatus: 'critic' });
      get().addThinkingEvent('Critic Agent', 'Auditing alignment and visual balance...');
      const critiquedVariants = await criticAgentReview(draftedVariants);
      get().addThinkingEvent('Critic Agent', 'Refined layer coordinates for optimal spacing.');
      set({ agentVariants: critiquedVariants });

      // Stage 3: Performance Scoring
      set({ agentStatus: 'performance' });
      get().addThinkingEvent('Growth Agent', 'Calculating conversion probability and focal points...');
      const scoredVariants = await performanceAgentScore(critiquedVariants);
      get().addThinkingEvent('Growth Agent', 'Ranking variants by emotional impact and readability.');
      
      set({ agentVariants: scoredVariants, agentStatus: 'done' });
    } catch (err: any) {
      log.error('Agent Workflow Failed:', err);
      set({ agentStatus: 'error', agentError: err.message || 'Workflow failed' });
    }
  },

  runAgenticRefine: async (intent: string, layerIds: string[]) => {
    try {
      set({ agentStatus: 'creative', agentIntent: intent, agentError: null, agentVariants: [], thinkingLog: [] });
      get().addThinkingEvent('Creative Agent', 'Analyzing selection for refinement...');

      const state = get();
      const canvasSize = state.canvasSize || { width: 1080, height: 1080 };
      const activeArtboard = state.artboards.find((a: any) => a.id === state.activeArtboardId);
      if (!activeArtboard) {throw new Error("No active artboard");}

      const targetLayers = activeArtboard.layers.filter((l: Layer) => layerIds.includes(l.id));
      const contextLayers = activeArtboard.layers.filter((l: Layer) => !layerIds.includes(l.id));

      // Stage 1: Creative Refinement
      const draftedVariants = await creativeAgentRefine(intent, targetLayers, contextLayers, canvasSize);
      get().addThinkingEvent('Creative Agent', 'Generated improved versions of selected elements.');
      set({ agentVariants: draftedVariants });

      // Stage 2: Critic Review
      set({ agentStatus: 'critic' });
      get().addThinkingEvent('Critic Agent', 'Checking contrast and accessibility standards...');
      const critiquedVariants = await criticAgentReview(draftedVariants);
      get().addThinkingEvent('Critic Agent', 'Corrected color values for accessibility compliance.');
      set({ agentVariants: critiquedVariants });

      // Stage 3: Performance Scoring
      set({ agentStatus: 'performance' });
      get().addThinkingEvent('Growth Agent', 'Testing visual hierarchy against heat-map data...');
      const scoredVariants = await performanceAgentScore(critiquedVariants);
      get().addThinkingEvent('Growth Agent', 'Finalized performance scoring.');
      
      set({ agentVariants: scoredVariants, agentStatus: 'done' });
    } catch (err: any) {
      log.error('Agent Refine Failed:', err);
      set({ agentStatus: 'error', agentError: err.message || 'Refinement failed' });
    }
  },

  applyAgentVariant: (variantId: string) => {
    const state = get();
    const variant = state.agentVariants.find((v: AgentVariant) => v.id === variantId);
    if (!variant || !state.activeArtboardId) {return;}

    // Use the user's new batching system for a smooth Undo experience
    if (state.beginBatch) {state.beginBatch();}

    const activeArtboardIndex = state.artboards.findIndex((a: any) => a.id === state.activeArtboardId);
    if (activeArtboardIndex === -1) {return;}

    const newArtboards = [...state.artboards];
    const artboard = newArtboards[activeArtboardIndex];

    // If it was a refinement, we only replace layers that match IDs in the variant
    // In strict draft mode, we replace all.
    // We check if the variant layers have IDs that already exist on the board.
    const boardLayerIds = new Set(artboard.layers.map((l: Layer) => l.id));
    const isRefinement = variant.layers.some((l: Layer) => boardLayerIds.has(l.id));

    if (isRefinement) {
       artboard.layers = artboard.layers.map((l: Layer) => {
         const match = variant.layers.find((vl: Layer) => vl.id === l.id);
         return match || l;
       });
       // Add any 'new' layers at the end
       const newLayers = variant.layers.filter((vl: Layer) => !boardLayerIds.has(vl.id));
       artboard.layers = [...artboard.layers, ...newLayers];
    } else {
       artboard.layers = structuredClone(variant.layers);
    }

    set({ artboards: newArtboards });
    if (state.endBatch) {state.endBatch();}
  },

  resetAgentState: () => {
    set({ agentStatus: 'idle', agentVariants: [], agentError: null, agentIntent: '' });
  },
});
