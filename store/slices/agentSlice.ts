import { StateCreator } from 'zustand';
import { AgentVariant, creativeAgentDraft, creativeAgentRefine, criticAgentReview, performanceAgentScore } from '../../services/multiAgentService';
import { Layer } from '../../types';

export type AgentStatus = 'idle' | 'creative' | 'critic' | 'performance' | 'done' | 'error';

export interface AgentSlice {
  agentStatus: AgentStatus;
  agentVariants: AgentVariant[];
  agentError: string | null;
  agentIntent: string;

  runAgenticWorkflow: (intent: string) => Promise<void>;
  runAgenticRefine: (intent: string, layerIds: string[]) => Promise<void>;
  applyAgentVariant: (variantId: string) => void;
  resetAgentState: () => void;
}

export const createAgentSlice: StateCreator<any, [], [], AgentSlice> = (set, get) => ({
  agentStatus: 'idle',
  agentVariants: [],
  agentError: null,
  agentIntent: '',

  runAgenticWorkflow: async (intent: string) => {
    try {
      set({ agentStatus: 'creative', agentIntent: intent, agentError: null, agentVariants: [] });

      const canvasSize = get().canvasSize || { width: 1080, height: 1080 };
      
      // Stage 1: Creative Generation
      const draftedVariants = await creativeAgentDraft(intent, canvasSize);
      set({ agentVariants: draftedVariants }); // Show drafts early to user if desired

      // Stage 2: Critic Review
      set({ agentStatus: 'critic' });
      const critiquedVariants = await criticAgentReview(draftedVariants);
      set({ agentVariants: critiquedVariants });

      // Stage 3: Performance Scoring
      set({ agentStatus: 'performance' });
      const scoredVariants = await performanceAgentScore(critiquedVariants);
      
      set({ agentVariants: scoredVariants, agentStatus: 'done' });
    } catch (err: any) {
      console.error('Agent Workflow Failed:', err);
      set({ agentStatus: 'error', agentError: err.message || 'Workflow failed' });
    }
  },

  runAgenticRefine: async (intent: string, layerIds: string[]) => {
    try {
      set({ agentStatus: 'creative', agentIntent: intent, agentError: null, agentVariants: [] });

      const state = get();
      const canvasSize = state.canvasSize || { width: 1080, height: 1080 };
      const activeArtboard = state.artboards.find((a: any) => a.id === state.activeArtboardId);
      if (!activeArtboard) {throw new Error("No active artboard");}

      const targetLayers = activeArtboard.layers.filter((l: Layer) => layerIds.includes(l.id));
      const contextLayers = activeArtboard.layers.filter((l: Layer) => !layerIds.includes(l.id));

      // Stage 1: Creative Refinement
      const draftedVariants = await creativeAgentRefine(intent, targetLayers, contextLayers, canvasSize);
      set({ agentVariants: draftedVariants });

      // Stage 2: Critic Review
      set({ agentStatus: 'critic' });
      const critiquedVariants = await criticAgentReview(draftedVariants);
      set({ agentVariants: critiquedVariants });

      // Stage 3: Performance Scoring
      set({ agentStatus: 'performance' });
      const scoredVariants = await performanceAgentScore(critiquedVariants);
      
      set({ agentVariants: scoredVariants, agentStatus: 'done' });
    } catch (err: any) {
      console.error('Agent Refine Failed:', err);
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
