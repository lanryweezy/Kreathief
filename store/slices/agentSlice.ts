import { log } from '../../utils/log';
import type { StoreState } from '../useStore';

import { StateCreator } from 'zustand';
import {
  AgentVariant,
  creativeAgentDraft,
  creativeAgentRefine,
  criticAgentReview,
  performanceAgentScore,
  analyzeDesign,
} from '../../services/aiService';
import { Layer } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { composeGenerationPrompt } from '../../services/imageGenService';
import { analyticsService } from '../../services/analyticsService';

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

export const createAgentSlice: StateCreator<StoreState, [], [], AgentSlice> = (set, get) => ({
  agentStatus: 'idle',
  agentVariants: [],
  agentError: null,
  agentIntent: '',
  thinkingLog: [],

  addThinkingEvent: (agent, message) => {
    set((state: any) => ({
      thinkingLog: [...state.thinkingLog, { id: uuidv4().substring(0, 8), agent, message, timestamp: Date.now() }],
    }));
  },

  runAgenticWorkflow: async (intent: string) => {
    try {
      analyticsService.track('agent_workflow', { type: 'draft', intent_length: intent.length });
      set({ agentStatus: 'creative', agentIntent: intent, agentError: null, agentVariants: [], thinkingLog: [] });
      get().addThinkingEvent('Creative Agent', 'Synthesizing creative direction...');

      const canvasSize = get().canvasSize || { width: 1080, height: 1080 };
      const userPlan = get().user?.plan || 'free';

      if (intent.toLowerCase() === 'score design') {
        get().addThinkingEvent('Critic Agent', 'Analyzing design aesthetics and compliance...');
        const activeArtboard = get().artboards.find((a: any) => a.id === get().activeArtboardId);
        if (!activeArtboard) {
          throw new Error('No active artboard found');
        }

        set({ agentStatus: 'critic' });
        // Use analyzeDesign instead of getDesignCritique
        const critique = await analyzeDesign(
          activeArtboard,
          (get() as any).designContext || {},
          (get() as any).brandKits?.find((b: any) => b.id === (get() as any).activeBrandKitId)
        );
        get().addThinkingEvent('Critic Agent', `Score: ${critique.overallScore}/100. ${critique.summary || ''}`);
        critique.suggestions.forEach((s) => get().addThinkingEvent('Critic Agent', s.message));

        set({ agentStatus: 'done' });
        return;
      }

      // Stage 1: Creative Generation (always runs)
      // Opt-in brand steering: same flag as the Image Gen panel
      const brandKit = get().useBrandInPrompts
        ? get().brandKits?.find((b: any) => b.id === get().activeBrandKitId)
        : undefined;
      const styleReference = get().styleReference;
      if (brandKit) {
        get().addThinkingEvent('Creative Agent', `Applying "${brandKit.name}" brand identity.`);
      }
      // The agent builds layers rather than pixels, so a reference can only reach it as
      // text. If analysis failed there is nothing to pass, which is worth stating instead
      // of letting the user assume their upload was honored.
      if (styleReference) {
        const usable = Boolean(styleReference.extracted) && styleReference.aspects.length > 0;
        get().addThinkingEvent(
          'Creative Agent',
          usable
            ? `Matching reference on: ${styleReference.aspects.join(', ')}.`
            : 'Reference image could not be described — continuing without it.'
        );
        get().setReferenceAppliedMode(usable ? 'descriptor' : 'none', styleReference.id);
      }

      const composedIntent = composeGenerationPrompt({
        prompt: intent,
        brandKit,
        styleReference,
        campaignGoal: get().campaignGoal,
        canvasSize,
      });
      const draftedVariants = await creativeAgentDraft(composedIntent, canvasSize);
      get().addThinkingEvent('Creative Agent', `Drafted ${draftedVariants.length} distinct layout directions.`);
      set({ agentVariants: draftedVariants });

      // Free users: skip critic + performance for speed/cost
      // Pro/Enterprise: full pipeline
      if (userPlan === 'free') {
        get().addThinkingEvent('Creative Agent', 'Skipping review (Free plan — upgrade to Pro for full pipeline)');
        set({ agentVariants: draftedVariants, agentStatus: 'done' });
        return;
      }

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
      analyticsService.track('agent_workflow', { type: 'refine', layer_count: layerIds.length });
      set({ agentStatus: 'creative', agentIntent: intent, agentError: null, agentVariants: [], thinkingLog: [] });
      get().addThinkingEvent('Creative Agent', 'Analyzing selection for refinement...');

      const state = get();
      const canvasSize = state.canvasSize || { width: 1080, height: 1080 };
      const userPlan = state.user?.plan || 'free';
      const activeArtboard = state.artboards.find((a: any) => a.id === state.activeArtboardId);
      if (!activeArtboard) {
        throw new Error('No active artboard');
      }

      const targetLayers = activeArtboard.layers.filter((l: Layer) => layerIds.includes(l.id));
      const contextLayers = activeArtboard.layers.filter((l: Layer) => !layerIds.includes(l.id));

      // Stage 1: Creative Refinement (always runs)
      const draftedVariants = await creativeAgentRefine(intent, targetLayers, contextLayers, canvasSize);
      get().addThinkingEvent('Creative Agent', 'Generated improved versions of selected elements.');
      set({ agentVariants: draftedVariants });

      // Free users: skip critic + performance
      if (userPlan === 'free') {
        get().addThinkingEvent('Creative Agent', 'Skipping review (Free plan — upgrade to Pro for full pipeline)');
        set({ agentVariants: draftedVariants, agentStatus: 'done' });
        return;
      }

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
    if (!variant || !state.activeArtboardId) {
      return;
    }

    // Use the user's new batching system for a smooth Undo experience
    if (state.beginBatch) {
      state.beginBatch();
    }

    const activeArtboardIndex = state.artboards.findIndex((a: any) => a.id === state.activeArtboardId);
    if (activeArtboardIndex === -1) {
      if (state.endBatch) {
        state.endBatch();
      }
      return;
    }

    const newArtboards = state.artboards.map((a: any, i: number) =>
      i === activeArtboardIndex ? { ...a, layers: [...a.layers] } : a
    );
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
    if (state.endBatch) {
      state.endBatch();
    }
  },

  resetAgentState: () => {
    set({ agentStatus: 'idle', agentVariants: [], agentError: null, agentIntent: '' });
  },
});
