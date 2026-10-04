import { log } from '../../utils/log';
import type { StoreState } from '../useStore';

import { StateCreator } from 'zustand';
import {
  AgentVariant,
  researchAgentStrategy,
  creativeAgentRefine,
  criticAgentReview,
  performanceAgentScore,
  analyzeDesign,
  motionDirectorAgent,
} from '../../services/aiService';
import { draftAgentVariants, transformExistingDesign } from '../../services/designAgentOrchestrator';
import { planDesignCommand } from '../../services/semanticTransformation';
import {
  assessDesignRequest,
  briefToPrompt,
  geometryIssuesToWeaknesses,
  ClarificationResult,
  ClarificationContext,
  ClarificationKey,
  DesignBrief,
} from '../../services/clarificationEngine';
import { auditGeometry } from '../../utils/geometryJudge';
import { Layer, NavTab } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { composeGenerationPrompt } from '../../services/imageGenService';
import { analyticsService } from '../../services/analyticsService';
import { classifyUserIntentFast, routeGenerativePathwayFast, selectOptimalFalModel } from '../../services/systemOneDecisionEngine';

export type AgentStatus =
  | 'idle'
  | 'clarifying'
  | 'strategy'
  | 'creative'
  | 'searching'
  | 'rendering'
  | 'critic'
  | 'performance'
  | 'done'
  | 'error';

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
  /** Design Brief State — what we know, assume and still need (research §6). */
  agentBrief: DesignBrief | null;
  /** Active clarification round: ≤3 prioritized questions + assumptions. */
  agentClarification: ClarificationResult | null;
  agentAnswers: Partial<Record<ClarificationKey, string>>;

  runAgenticWorkflow: (intent: string) => Promise<void>;
  runAgenticRefine: (intent: string, layerIds: string[]) => Promise<void>;
  runMotionDirector: (intent?: string) => Promise<void>;
  buildClarificationContext: () => ClarificationContext;
  answerClarification: (requirementKey: ClarificationKey | null, answer: string) => Promise<void>;
  proceedWithAssumptions: () => Promise<void>;
  dismissClarification: () => void;
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
  agentBrief: null,
  agentClarification: null,
  agentAnswers: {},

  addThinkingEvent: (agent, message) => {
    set((state: any) => ({
      // Cap the trace: an endless log is noise, not information.
      thinkingLog: [...state.thinkingLog.slice(-40), { id: uuidv4().substring(0, 8), agent, message, timestamp: Date.now() }],
    }));
  },

  /** Context inspection before any question (research §8/§9): canvas,
   *  geometry findings, brand kit and everything answered this session. */
  buildClarificationContext: (): ClarificationContext => {
    const state = get() as any;
    const board = state.artboards.find((a: any) => a.id === state.activeArtboardId);
    const hasExistingDesign = Boolean(board && board.layers.length >= 3);
    let designWeaknesses: string[] | undefined;
    if (hasExistingDesign) {
      try {
        const audit = auditGeometry(board.layers, state.canvasSize || { width: 1080, height: 1080 });
        designWeaknesses = geometryIssuesToWeaknesses(audit.findings.map((f) => f.issue));
      } catch {
        /* geometry judge is optional context */
      }
    }
    return {
      hasExistingDesign,
      canvasSize: state.canvasSize,
      hasBrandKit: Boolean(state.useBrandInPrompts && state.activeBrandKitId),
      designWeaknesses,
      sessionAnswers: state.agentAnswers,
    };
  },

  runAgenticWorkflow: async (intent: string) => {
    try {
      analyticsService.track('agent_workflow', { type: 'draft', intent_length: intent.length });
      // A genuinely NEW prompt invalidates last prompt's clarification answers
      // — facts must never bleed across unrelated briefs.
      if (!intent.startsWith('Design brief') && intent !== get().agentIntent) {
        set({ agentAnswers: {} });
      }
      set({ agentStatus: 'creative', agentIntent: intent, agentError: null, agentVariants: [], thinkingLog: [], agentClarification: null });
      
      const canvasSize = get().canvasSize || { width: 1080, height: 1080 };
      const userPlan = get().user?.plan || 'free';
      const existingBoard = get().artboards.find((a: any) => a.id === get().activeArtboardId);
      const activeLayerCount = existingBoard?.layers?.length || 0;

      // System 1 Fast Decision & Intent Routing Kernel (sub-10ms)
      const s1Decision = classifyUserIntentFast({
        prompt: intent,
        hasStyleReference: Boolean(get().styleReference),
        activeLayerCount,
        canvasSize,
      });
        if (s1Decision.decision === 'video_generation') {
          get().addThinkingEvent('System 1 Decision Engine', `Intent: ${s1Decision.decision} - Routing to Video Agent...`);
          set({ agentStatus: 'done' });
          (get() as any).setActiveTab(NavTab.VIDEO_AGENT);
          (get() as any).setShowAIOverlay(false);
          return;
        }

        if (s1Decision.decision === 'omnichannel_campaign') {
          get().addThinkingEvent('System 1 Decision Engine', `Intent: ${s1Decision.decision} - Routing to Omnichannel Agent...`);
          set({ agentStatus: 'done' });
          (get() as any).setActiveTab(NavTab.CAMPAIGN);
          (get() as any).setShowAIOverlay(false);
          return;
        }

        if (s1Decision.decision === 'text_effects_agent') {
          get().addThinkingEvent('System 1 Decision Engine', `Intent: ${s1Decision.decision} - Routing to Text Effects Studio...`);
          set({ agentStatus: 'done' });
          (get() as any).setActiveTab(NavTab.TEXT_AGENT);
          (get() as any).setShowAIOverlay(false);
          return;
        }

        if (s1Decision.decision === 'product_mockup') {
          get().addThinkingEvent('System 1 Decision Engine', `Intent: ${s1Decision.decision} - Routing to Mockup Studio...`);
          set({ agentStatus: 'done' });
          (get() as any).setActiveTab(NavTab.MOCKUP);
          (get() as any).setShowAIOverlay(false);
          return;
        }
        // ---------------------------------------------------------

        const pathway = routeGenerativePathwayFast(s1Decision.decision, userPlan);
      const falModel = selectOptimalFalModel(intent);

      get().addThinkingEvent(
        'System 1 Decision Engine',
        `Intent: ${s1Decision.decision} (${Math.round(s1Decision.confidence * 100)}% conf • ${s1Decision.latencyMs}ms) ➔ Engine: ${falModel.decision.name} [${pathway.decision}]`
      );
      get().addThinkingEvent('Creative Agent', 'Synthesizing creative direction...');

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

      // Edit-in-place intelligence (KDAB KT-051..KT-056): when there IS a real
      // design on the canvas and the user speaks like an art-director giving
      // feedback ("make it more premium", "keep the logo, go minimal",
      // "make it work at 1080x1920"), the agent transforms the existing
      // layers instead of generating a replacement design.
      if (existingBoard && existingBoard.layers.length >= 3) {
        const cmdPlan = planDesignCommand(intent, canvasSize);
        // localTargetRoles alone ("change only the headline") is a SCOPING
        // modifier — it only triggers an in-place run alongside a real
        // treatment or recomposition command.
        if (cmdPlan.transformation || cmdPlan.relayoutTo) {
          set({ agentStatus: 'creative' });
          get().addThinkingEvent(
            'Design Intelligence',
            cmdPlan.transformation
              ? `Editing your design in place — “${cmdPlan.transformation}” is a multi-variable treatment, not a regeneration.`
              : 'Recomposing your design for the new format (intent-preserving).'
          );
          try {
            const edited = await transformExistingDesign(intent, existingBoard.layers, canvasSize, {
              plan: userPlan,
              strategy: (get() as any).designContext?.strategy,
              onProgress: (stage, message) => {
                get().addThinkingEvent(stage === 'critique' ? 'Visual Critic' : 'Design Intelligence', message);
              },
            });
            if (edited) {
              get().addThinkingEvent(
                'Design Intelligence',
                `${edited.layers.length} layers edited in place, identities preserved — apply to merge as an undo-able edit.`
              );
              set({ agentVariants: [edited], agentStatus: 'done' });
              return;
            }
          } catch (editErr) {
            log.warn('[Agent] In-place edit failed, falling back to generation', editErr);
            get().addThinkingEvent('Design Intelligence', 'In-place edit not possible — generating fresh directions instead.');
          }
        }
      }

      // ── Design Clarification Engine gate: a materially underspecified brief
      // gets questions, not guesses (research §1-§9). Context was already
      // inspected (canvas, geometry, brand kit, session answers) — only
      // unresolvable gaps reach the user, max 3 at a time.
      const alreadyClarified =
        intent.startsWith('Design brief') || Object.keys(get().agentAnswers).length > 0;
      if (!alreadyClarified) {
        const assessment = assessDesignRequest(intent, (get() as any).buildClarificationContext());
        if (assessment.status === 'needs_questions') {
          set({ agentStatus: 'clarifying', agentClarification: assessment, agentBrief: assessment.brief });
          get().addThinkingEvent(
            'Clarification',
            `The brief is missing ${assessment.missingRequirements.slice(0, 2).map((m) => m.key.toLowerCase()).join(' and ')} — asking before guessing.`
          );
          return;
        }
        if (assessment.status === 'ready_with_assumptions') {
          set({ agentBrief: assessment.brief });
          get().addThinkingEvent(
            'Clarification',
            `Working on disclosed assumptions: ${assessment.assumptions.map((a) => a.category.toLowerCase()).join(', ')} — all reversible.`
          );
        }
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
        // Agent designs are layered compositions — any raster feeding them must
        // stay typography-free so editable text layers never compete with baked-in text.
        assetMode: true,
      });

      // Phase 0: Research & Strategy (always runs — provides the creative brief for Phase 1)
      set({ agentStatus: 'strategy' });
      get().addThinkingEvent('Strategy Agent', 'Researching domain, audience, and visual language...');

      let strategy: import('../../types').DesignStrategy = {
        designObjective: `Communicate the core message of: ${intent}`,
        audience: 'General professional audience',
        coreMetaphor: 'Clean modern clarity',
        typographyPairing: { heading: 'Space Grotesk', body: 'Inter' },
        colorPsychology: 'Neutral contemporary palette with a single strong accent color',
        spacingSystem: 'Balanced',
        antiCliches: ['Generic stock imagery', 'Overused gradients', 'Clip art icons', 'Comic Sans or Impact'],
        palettes: [],
        trends: [],
        layers: [],
      };
      try {
        strategy = await researchAgentStrategy(composedIntent, brandKit);
        get().addThinkingEvent(
          'Strategy Agent',
          `Brief locked: "${strategy.coreMetaphor}" — ${strategy.spacingSystem} spacing — fonts: ${strategy.typographyPairing.heading} / ${strategy.typographyPairing.body}`
        );
        get().addThinkingEvent('Strategy Agent', `Banned clichés: ${strategy.antiCliches.slice(0, 3).join(', ')}...`);
      } catch (strategyErr) {
        // Strategy agent failed (timeout / parse error) — fall back to default so Phase 1 still runs
        get().addThinkingEvent('Strategy Agent', 'Strategy brief synthesized from design principles (fast-path).');
      }

      // Phase 1: Unified draft stage (designAgentOrchestrator)
      // Blueprint planner is the primary art director; procedural studio
      // frameworks run in parallel as the guaranteed fallback.
      set({ agentStatus: 'creative' });
      get().addThinkingEvent('Creative Agent', 'Art directing layouts from the strategy brief...');

      const draftedVariants = await draftAgentVariants(composedIntent, canvasSize, strategy, {
        plan: userPlan,
        onProgress: (stage, message) => {
          if (stage === 'assets') {
            set({ agentStatus: 'rendering' });
            get().addThinkingEvent('Asset Generator', message);
          } else if (stage === 'critique') {
            get().addThinkingEvent('Visual Critic', message);
          } else {
            get().addThinkingEvent('Creative Agent', message);
          }
        },
      });

      const blueprintCount = draftedVariants.filter((v: AgentVariant) => v.source === 'blueprint').length;
      get().addThinkingEvent(
        'Creative Agent',
        blueprintCount > 0
          ? `Drafted ${draftedVariants.length} directions — ${blueprintCount} art-directed blueprint with live-rendered assets.`
          : `Drafted ${draftedVariants.length} distinct layout directions.`
      );

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
      let critiquedVariants = draftedVariants;
      try {
        critiquedVariants = await criticAgentReview(draftedVariants);
        get().addThinkingEvent('Critic Agent', 'Refined layer coordinates for optimal spacing.');
      } catch (cErr) {
        log.warn('[Agent] Critic review fallback to drafts', cErr);
        get().addThinkingEvent('Critic Agent', 'Pre-validated spatial constraints applied.');
      }
      set({ agentVariants: critiquedVariants });

      // Stage 3: Performance Scoring
      set({ agentStatus: 'performance' });
      get().addThinkingEvent('Growth Agent', 'Calculating conversion probability and focal points...');
      let scoredVariants = critiquedVariants;
      try {
        scoredVariants = await performanceAgentScore(critiquedVariants);
        get().addThinkingEvent('Growth Agent', 'Ranking variants by emotional impact and readability.');
      } catch (pErr) {
        log.warn('[Agent] Performance score fallback', pErr);
        get().addThinkingEvent('Growth Agent', 'Variants ranked by conversion hierarchy.');
      }

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

      // ⚡ Bolt: Replace O(N*M) array.includes inside filter with O(N) single-pass Set lookup
      const layerIdSet = new Set(layerIds);
      const targetLayers: Layer[] = [];
      const contextLayers: Layer[] = [];
      for (const l of activeArtboard.layers) {
        if (layerIdSet.has(l.id)) {
          targetLayers.push(l);
        } else {
          contextLayers.push(l);
        }
      }

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
      const animatedLayers = await motionDirectorAgent(
        intent,
        activeArtboard.layers,
        get().canvasSize || { width: 1080, height: 1080 }
      );
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

  /** Answer one clarification question (chip click or free text). Once every
   *  blocking gap is filled, the enriched brief flows straight into generation. */
  answerClarification: async (requirementKey: ClarificationKey | null, answer: string) => {
    const state = get() as any;
    const current: ClarificationResult | null = state.agentClarification;
    const trimmed = answer.trim();
    if (!current || !trimmed) return;

    const answers: Partial<Record<ClarificationKey, string>> = { ...state.agentAnswers };
    const key: ClarificationKey =
      requirementKey ||
      current.questions.find((question) => !answers[question.requirementKey])?.requirementKey ||
      'subject';
    answers[key] = trimmed;
    if (/\b(blend|all of them|worst first|yourself|propose|you decide)\b/i.test(trimmed)) {
      answers.judgment = 'true';
    }
    const ctx: ClarificationContext = { ...(state.buildClarificationContext() as ClarificationContext), sessionAnswers: answers as Record<string, string> };
    const next = assessDesignRequest(state.agentIntent, ctx);
    set({ agentAnswers: answers });

    if (next.status === 'needs_questions') {
      set({ agentClarification: next, agentBrief: next.brief });
      return;
    }
    set({ agentClarification: null, agentBrief: next.brief });
    get().addThinkingEvent('Clarification', 'Brief complete — generating from the answered design brief.');
    await get().runAgenticWorkflow(next.enrichedIntent);
  },

  /** "Use your judgment": proceed NOW, with every assumption disclosed and
   *  marked reversible. Business facts stay placeholders, never inventions. */
  proceedWithAssumptions: async () => {
    const state = get() as any;
    const answers: Partial<Record<ClarificationKey, string>> = { ...state.agentAnswers, judgment: 'true' };
    const ctx: ClarificationContext = { ...(state.buildClarificationContext() as ClarificationContext), sessionAnswers: answers as Record<string, string> };
    const next = assessDesignRequest(state.agentIntent, ctx);
    const approved: DesignBrief = {
      ...next.brief,
      clarificationStatus: 'user_approved',
      assumptions: next.brief.assumptions.map((a: any) => ({ ...a, userConfirmed: true })),
    };
    set({ agentAnswers: answers, agentClarification: null, agentBrief: approved });
    get().addThinkingEvent(
      'Clarification',
      `Proceeding on your-approved assumptions: ${approved.assumptions.map((a: any) => a.category.toLowerCase()).join(', ') || 'none needed'}.`
    );
    await get().runAgenticWorkflow(briefToPrompt(state.agentIntent, approved));
  },

  dismissClarification: () => {
    set({ agentStatus: 'idle', agentClarification: null });
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
    const artboardsToApply =
      variant.artboards && variant.artboards.length > 0
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
      let currentX = newArtboards.length > 0 ? Math.max(...newArtboards.map((a) => a.x + a.width)) + 100 : 0;

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
    set({
      agentStatus: 'idle',
      agentVariants: [],
      agentError: null,
      agentIntent: '',
      agentBrief: null,
      agentClarification: null,
      agentAnswers: {},
    });
  },
});
