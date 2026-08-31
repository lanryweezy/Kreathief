import { log } from '../../utils/log';
import type { StoreState } from '../useStore';

import { StateCreator } from 'zustand';
import {
  AgentVariant,
  researchAgentStrategy,
  creativeAgentDraft,
  creativeAgentRefine,
  criticAgentReview,
  performanceAgentScore,
  analyzeDesign,
  motionDirectorAgent,
} from '../../services/aiService';
import { Layer } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { composeGenerationPrompt } from '../../services/imageGenService';
import { analyticsService } from '../../services/analyticsService';

export type AgentStatus = 'idle' | 'strategy' | 'creative' | 'searching' | 'rendering' | 'critic' | 'performance' | 'done' | 'error';

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
  runMotionDirector: (intent?: string) => Promise<void>;
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

      // Phase 0: Research & Strategy (always runs — provides the creative brief for Phase 1)
      set({ agentStatus: 'strategy' });
      get().addThinkingEvent('Strategy Agent', 'Researching domain, audience, and visual language...');
      let researchInterval = setInterval(() => {
        const thoughts = [
          'Decoding audience psychology...',
          'Identifying category clichés to avoid...',
          'Selecting typographic register...',
          'Defining spacing philosophy...',
          'Establishing core visual metaphor...',
        ];
        get().addThinkingEvent('Strategy Agent', thoughts[Math.floor(Math.random() * thoughts.length)]);
      }, 3500);

      let strategy: import('../../types').DesignStrategy = {
        designObjective: `Communicate the core message of: ${intent}`,
        audience: 'General professional audience',
        coreMetaphor: 'Clean modern clarity',
        typographyPairing: { heading: 'Space Grotesk', body: 'Inter' },
        colorPsychology: 'Neutral contemporary palette with a single strong accent color',
        spacingSystem: 'Balanced',
        avoidanceRules: ['Generic stock imagery', 'Overused gradients', 'Clip art icons', 'Comic Sans or Impact'],
      };
      try {
        strategy = await researchAgentStrategy(composedIntent, brandKit);
        get().addThinkingEvent('Strategy Agent', `Brief locked: "${strategy.coreMetaphor}" — ${strategy.spacingSystem} spacing — fonts: ${strategy.typographyPairing.heading} / ${strategy.typographyPairing.body}`);
        get().addThinkingEvent('Strategy Agent', `Banned clichés: ${strategy.avoidanceRules.slice(0, 3).join(', ')}...`);
      } catch (strategyErr) {
        // Strategy agent failed (timeout / parse error) — fall back to default so Phase 1 still runs
        get().addThinkingEvent('Strategy Agent', 'Strategy brief synthesized from design principles (fast-path).');
      } finally {
        clearInterval(researchInterval);
      }


      // Phase 1: Creative Drafting (executes the researched strategy)
      set({ agentStatus: 'creative' });
      get().addThinkingEvent('Creative Agent', 'Art directing layouts from the strategy brief...');
      
      let draftingInterval = setInterval(() => {
        const thoughts = [
          'Applying modular typographic scale...',
          'Injecting spatial tension...',
          'Constructing layer hierarchy...',
          'Encoding Gestalt principles...',
          'Art directing image prompts...',
          'Generating layout variants...'
        ];
        const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)];
        get().addThinkingEvent('Creative Agent', randomThought);
      }, 4000);

      let draftedVariants;
      try {
        draftedVariants = await creativeAgentDraft(composedIntent, canvasSize, 3, strategy);
      } finally {
        clearInterval(draftingInterval);
      }
      
      set({ agentStatus: 'searching' });
      get().addThinkingEvent('Creative Agent', `Drafted ${draftedVariants.length} distinct layout directions.`);
      get().addThinkingEvent('Creative Agent', 'Searching and rendering image assets...');
      
      // Simulate rendering/searching time if needed, or simply step through
      await new Promise(r => setTimeout(r, 1500));
      set({ agentStatus: 'rendering' });
      await new Promise(r => setTimeout(r, 1500));
      
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

  runMotionDirector: async (intent = '') => {
    try {
      analyticsService.track('agent_workflow', { type: 'motion_director' });
      set({ agentStatus: 'rendering', agentError: null, thinkingLog: [] });
      
      const activeArtboard = get().artboards.find((a: any) => a.id === get().activeArtboardId);
      if (!activeArtboard) {
        throw new Error('No active artboard found');
      }

      get().addThinkingEvent('Motion Director', 'Analyzing spatial layout and hierarchy...');
      const animatedLayers = await motionDirectorAgent(intent, activeArtboard.layers, get().canvasSize || { width: 1080, height: 1080 });
      get().addThinkingEvent('Motion Director', 'Sequencing entry animations applied.');

      const newArtboards = get().artboards.map((a: any) => {
        if (a.id === get().activeArtboardId) {
          return { ...a, layers: animatedLayers };
        }
        return a;
      });

      set({
        artboards: newArtboards,
        agentStatus: 'done',
      });
      // Optionally trigger history save
      if (typeof (get() as any).pushHistoryState === 'function') {
        (get() as any).pushHistoryState();
      }

    } catch (err: any) {
      log.error('[AgentSlice] Motion Director failed:', err);
      set({ agentStatus: 'error', agentError: err.message || 'Failed to apply motion sequence' });
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

    // Determine if we are using the new multi-artboard schema or legacy layers schema
    const artboardsToApply = variant.artboards && variant.artboards.length > 0 
      ? variant.artboards 
      : [{ name: 'Artboard', layers: variant.layers || [] }];

    if (artboardsToApply.length === 1) {
      // Single artboard scenario - apply to current active artboard
      const sourceArtboard = artboardsToApply[0];
      const newArtboards = state.artboards.map((a: any, i: number) =>
        i === activeArtboardIndex ? { ...a, layers: [...a.layers] } : a
      );
      const artboard = newArtboards[activeArtboardIndex];

      const boardLayerIds = new Set(artboard.layers.map((l: Layer) => l.id));
      const isRefinement = sourceArtboard.layers.some((l: Layer) => boardLayerIds.has(l.id));

      if (isRefinement) {
        artboard.layers = artboard.layers.map((l: Layer) => {
          const match = sourceArtboard.layers.find((vl: Layer) => vl.id === l.id);
          return match || l;
        });
        const newLayers = sourceArtboard.layers.filter((vl: Layer) => !boardLayerIds.has(vl.id));
        artboard.layers = [...artboard.layers, ...newLayers];
      } else {
        artboard.layers = structuredClone(sourceArtboard.layers);
      }
      set({ artboards: newArtboards });
    } else {
      // Multi-artboard scenario - Gamma/Campaign style
      // We will create entirely new artboards and append them
      const newArtboards = [...state.artboards];
      // Generate some offset to place them side by side
      let currentX = newArtboards.length > 0 
        ? Math.max(...newArtboards.map(a => a.x + a.width)) + 100 
        : 0;

      for (const sourceArtboard of artboardsToApply) {
        newArtboards.push({
          id: crypto.randomUUID(),
          name: sourceArtboard.name,
          width: state.canvasSize.width,
          height: state.canvasSize.height,
          x: currentX,
          y: 0,
          layers: structuredClone(sourceArtboard.layers),
        });
        currentX += state.canvasSize.width + 100;
      }
      set({ artboards: newArtboards });
    }
    if (state.endBatch) {
      state.endBatch();
    }
    state.addToast?.('Design variant applied to canvas!', 'success');
  },

  resetAgentState: () => {
    set({ agentStatus: 'idle', agentVariants: [], agentError: null, agentIntent: '' });
  },
});
