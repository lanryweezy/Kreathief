/**
 * ============================================
 * DESIGN AGENT ORCHESTRATOR — unified draft stage
 * ============================================
 * Merges the three AI→layer pathways into one pipeline:
 *  - Pathway B (two-stage blueprint planner) is the PRIMARY art director:
 *    unique LLM-authored layouts with real per-layer asset generation
 *    (image model + background removal) for paid plans.
 *  - Pathway A (procedural composition drafts) runs in parallel as the
 *    deterministic fallback and variant-diversity engine.
 *  - Every blueprint is sanitized (coordinate clamps, id dedup, role checks)
 *    before it can reach the canvas, and layers carry `aiProvenance` so a
 *    single layer can be re-rolled without rebuilding the design.
 *
 * Output is `AgentVariant[]`, consumed unchanged by the agentSlice
 * critic / performance / applyAgentVariant stages.
 */
import { Layer } from '../types';
import { log } from '../utils/log';
import { v4 as uuidv4 } from 'uuid';
import {
  DesignBlueprint,
  DesignBlueprintLayer,
  classifyDesignIntent,
  generateDesignBlueprint,
  processDesignBlueprint,
} from './aiDesignDirector';
import { resolveHeroPhoto } from './visualAssetDirector';
import { recommendPairingForStyle } from './typographyPairingEngine';
import { solveDesignLayers } from '../utils/designSolver';
import { runVisualCritiqueLoop } from './visualCriticService';
import {
  buildDesignIntentGraph,
  describeIntentGraphForPrompt,
  deriveDesignConstraints,
  validateDesignConstraints,
  DesignIntentGraph,
} from './designIntentGraph';
import { runRepair } from './repairEngine';
import { auditGeometry, GeometryAudit } from '../utils/geometryJudge';
import {
  applyDesignCommand,
  extractProtectedRoles,
  planDesignCommand,
} from './semanticTransformation';
import { AgentVariant, creativeAgentDraft } from './aiService';

export type DraftProgressStage = 'planning' | 'assets' | 'critique' | 'fallback';

export interface DraftStageOptions {
  /** User plan — 'free' users never trigger paid image generation. */
  plan: string;
  /** Live progress sink wired to the agent thinking log UI. */
  onProgress?: (stage: DraftProgressStage, message: string, current?: number, total?: number) => void;
  /** Optional strategy brief from the Strategy Agent (forward-looking hook). */
  strategy?: any;
}

const VALID_BLUEPRINT_TYPES = new Set([
  'shape',
  'text',
  'generated-image',
  'background',
  'gradient',
  'svg-icon',
  'group',
]);

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Hardens raw LLM blueprint JSON into a render-safe DesignBlueprint.
 * Returns null when the blueprint is too broken/poor to trust — the caller
 * then falls back to the procedural composition drafts.
 */
export function sanitizeBlueprint(
  raw: unknown,
  canvasSize: { width: number; height: number }
): DesignBlueprint | null {
  const bp = raw as Partial<DesignBlueprint> | null;
  if (!bp || !Array.isArray(bp.layers) || bp.layers.length === 0) {
    return null;
  }

  const W = canvasSize.width;
  const H = canvasSize.height;
  const seenIds = new Set<string>();

  const layers: DesignBlueprintLayer[] = bp.layers
    .filter((l): l is DesignBlueprintLayer =>
      Boolean(l && typeof l === 'object' && typeof l.type === 'string' && VALID_BLUEPRINT_TYPES.has(l.type) && l.properties)
    )
    .map((layer, i) => {
      const p = layer.properties;

      // Clamp geometry so nothing can land off-canvas or collapse to zero.
      p.width = clamp(num(p.width, 200), 8, W);
      p.height = clamp(num(p.height, 200), 8, H);
      p.x = clamp(num(p.x, 0), 0, Math.max(0, W - 8));
      p.y = clamp(num(p.y, 0), 0, Math.max(0, H - 8));
      p.rotation = num(p.rotation, 0);
      p.opacity = clamp(num(p.opacity, 1), 0, 1);
      if (p.fontSize !== undefined) {
        p.fontSize = clamp(num(p.fontSize, 24), 6, Math.round(H / 3));
      }

      // Guarantee unique, present ids (processDesignBlueprint keys assets by id).
      let id = typeof layer.id === 'string' && layer.id.trim() ? layer.id.trim() : `bp_${i}_${uuidv4().slice(0, 6)}`;
      while (seenIds.has(id)) {
        id = `${id}_x`;
      }
      seenIds.add(id);

      return {
        ...layer,
        id,
        name: typeof layer.name === 'string' && layer.name.trim() ? layer.name : `${layer.type} ${i + 1}`,
        zIndex: num(layer.zIndex, i + 1),
      };
    })
    // Image layers are useless without a prompt (nothing to generate/search for).
    .filter(
      (l) =>
        l.type !== 'generated-image' ||
        (typeof l.properties.prompt === 'string' && l.properties.prompt.trim().length > 0)
    );

  // Quality bar: a real design needs depth and at least one editable text layer.
  if (layers.length < 3 || !layers.some((l) => l.type === 'text')) {
    log.warn(`[AgentOrchestrator] Blueprint rejected (layers=${layers.length})`);
    return null;
  }

  return {
    canvas: {
      width: W,
      height: H,
      background:
        bp.canvas && typeof bp.canvas.background === 'string' && bp.canvas.background ? bp.canvas.background : '#0f172a',
      backgroundGradient: bp.canvas?.backgroundGradient,
    },
    layers,
    metadata: bp.metadata,
  };
}

/**
 * Free-plan asset policy: never fire paid image generation. Swap each
 * `generated-image` role for a curated stock hero matched to the layer's
 * prompt, and strip the prompt so processDesignBlueprint skips generation.
 */
function substituteStockAssets(blueprint: DesignBlueprint, intent: string): void {
  const archetype = classifyDesignIntent(intent);
  for (const layer of blueprint.layers) {
    if (layer.type !== 'generated-image') {
      continue;
    }
    const photo = resolveHeroPhoto(archetype, layer.properties.prompt || intent);
    layer.properties.imageUrl = photo.url;
    layer.name = `${layer.name} — ${photo.alt}`;
    delete layer.properties.prompt;
    delete layer.properties.removeBackground;
  }
}

/** Convert a processed blueprint into an AgentVariant with provenance stamped. */
function blueprintToVariant(
  blueprint: DesignBlueprint,
  layers: Layer[],
  generatedAssets: Map<string, string>,
  intent: string,
  canvasSize: { width: number; height: number }
): AgentVariant {
  const sourceById = new Map(blueprint.layers.map((l) => [l.id, l]));

  for (const layer of layers) {
    const origin = sourceById.get(layer.id);
    layer.aiProvenance = {
      source: generatedAssets.has(layer.id)
        ? 'generated'
        : origin?.type === 'generated-image'
          ? 'stock'
          : 'blueprint',
      prompt: origin?.properties.prompt || undefined,
      role: origin?.name,
    };
  }

  const title = blueprint.metadata?.title || 'Art-Directed Design';
  const description = blueprint.metadata?.description || intent.slice(0, 80);

  return {
    id: uuidv4(),
    themeIdea: `${title} — ${description}`,
    layers,
    width: canvasSize.width,
    height: canvasSize.height,
    source: 'blueprint',
    criticFeedback: [
      'Blueprint validated: coordinates clamped to canvas bounds',
      'Layer ids deduplicated and z-order normalized',
      `${generatedAssets.size} layer(s) rendered with AI-generated assets`,
    ],
  };
}

/** Compress the Strategy Agent brief + curated typography pairing into planner constraints. */
function buildStrategyContext(strategy: any, intent: string): string {
  const archetype = classifyDesignIntent(intent);
  const pairing = recommendPairingForStyle(strategy?.typographyPairing?.heading || archetype);
  const lines: string[] = [];
  if (strategy?.coreMetaphor) lines.push(`- Core visual metaphor: ${strategy.coreMetaphor}`);
  if (strategy?.designObjective) lines.push(`- Communication objective: ${strategy.designObjective}`);
  if (strategy?.audience) lines.push(`- Audience: ${strategy.audience}`);
  lines.push(`- Typography: heading “${pairing.heading}”, body “${pairing.body}”${pairing.accent ? `, accent “${pairing.accent}”` : ''} (mood: ${pairing.mood})`);
  if (strategy?.colorPsychology) lines.push(`- Color direction: ${strategy.colorPsychology}`);
  if (Array.isArray(strategy?.palettes) && strategy.palettes[0]?.length) {
    lines.push(`- Preferred palette: ${strategy.palettes[0].join(', ')}`);
  }
  if (strategy?.spacingSystem) lines.push(`- Spacing philosophy: ${strategy.spacingSystem}`);
  if (Array.isArray(strategy?.antiCliches) && strategy.antiCliches.length) {
    lines.push(`- BAN list (these make it look amateur): ${strategy.antiCliches.join(', ')}`);
  }
  return lines.join('\n');
}

/**
 * Text-fidelity guard (KDAB S-04): if the brief contains explicitly quoted
 * copy, the design MUST contain it character-for-character. If the model
 * paraphrased or dropped it, overwrite the most prominent text layer.
 */
function enforceTextFidelity(variant: AgentVariant, intent: string): string[] {
  const required = (intent.match(/["“']([^"”']{3,80})["”']/g) || [])
    .map((s) => s.replace(/["“']/g, '').trim())
    .filter((s) => s.length > 2)
    .slice(0, 3);
  if (required.length === 0) return [];

  const existingText = variant.layers
    .filter((l) => l.type === 'text')
    .map((l) => String((l as any).text || ''))
    .join(' \u2022 ')
    .toLowerCase();

  const repaired: string[] = [];
  for (const phrase of required) {
    if (existingText.includes(phrase.toLowerCase())) continue;
    // Promote the largest text layer (the headline slot) to carry the exact copy.
    const headline = variant.layers
      .filter((l) => l.type === 'text')
      .sort((a, b) => ((b as any).fontSize || 0) - ((a as any).fontSize || 0))[0] as any;
    if (headline) {
      headline.text = phrase;
      repaired.push(`Restored exact briefed copy “${phrase}” onto layer "${headline.name || headline.id}"`);
    }
  }
  if (repaired.length) {
    variant.criticFeedback = [...(variant.criticFeedback || []), ...repaired];
  }
  return repaired;
}

/**
 * Build the Design Intent Graph for a layer stack and digest it for VLM use.
 * Protected roles come from the user's own "keep/preserve X" language.
 */
function intentContextFor(
  layers: Layer[],
  canvasSize: { width: number; height: number },
  intent: string,
  strategy?: any
): { context: string; protectedRoles: import('../types').SemanticLayerRole[] } {
  const baseGraph = buildDesignIntentGraph(layers, canvasSize, { strategy });
  const protectedRoles = extractProtectedRoles(intent, baseGraph);
  const graph = protectedRoles.length
    ? buildDesignIntentGraph(layers, canvasSize, { strategy, protectedRoles })
    : baseGraph;
  return { context: describeIntentGraphForPrompt(graph), protectedRoles };
}

/**
 * Cross-judge disagreement signal (research §22-23): Geometry is pure math,
 * the VLM critic is human-like perception. When they agree the verdict is
 * trustworthy; when they disagree that DELTA routes the next intervention —
 * math-clean but vision-weak needs artistic work; vision-OK but math-broken
 * needs structural repair. Surfaced in criticFeedback, logged for the
 * future auto-KDAB HIR metric.
 */
function judgesSummary(geometry: GeometryAudit | null, visionScore: number): string[] {
  if (!geometry) return [];
  const g = geometry.score;
  let verdict: string;
  if (g >= 85 && visionScore >= 75) verdict = 'judges AGREE — structurally and aesthetically sound';
  else if (g >= 85 && visionScore > 0 && visionScore < 60) verdict = 'DISAGREEMENT: geometry clean, vision weak → needs artistic intervention, not repair';
  else if (g < 70 && visionScore >= 70) verdict = 'DISAGREEMENT: critics like it but geometry is broken → needs structural repair';
  else if (g < 70 && visionScore > 0 && visionScore < 70) verdict = 'judges AGREE — the design needs work on both axes';
  else verdict = 'mixed signals — keeping both reports for the next pass';
  return [`Judges: geometry ${g}/100 (post-repair), vision ${visionScore}/100 — ${verdict}`];
}

/** Solver + visual-critique post-flight shared by every draft variant. */
async function polishVariantLayers(
  variant: AgentVariant,
  intent: string,
  canvasSize: { width: number; height: number },
  critiquePasses: number,
  strategy?: any,
  skipTransformation = false
): Promise<void> {
  const graphOf = (layers: Layer[]): DesignIntentGraph => {
    const { protectedRoles } = intentContextFor(layers, canvasSize, intent, strategy);
    return buildDesignIntentGraph(layers, canvasSize, { strategy, protectedRoles });
  };

  // Mood language in a GENERATION brief ("a premium poster for…") executes the
  // same multi-variable transformation the edit-in-place path uses — but the
  // recomposition half is stripped: the draft already targets this canvas.
  const plan = planDesignCommand(intent, canvasSize);
  plan.relayoutTo = null;
  if (!skipTransformation && (plan.transformation || plan.localTargetRoles)) {
    const { protectedRoles } = intentContextFor(variant.layers, canvasSize, intent, strategy);
    plan.protectedRoles = protectedRoles;
    try {
      const applied = applyDesignCommand(variant.layers, intent, canvasSize, plan, strategy);
      variant.layers = applied.layers;
      variant.criticFeedback = [...(variant.criticFeedback || []), ...applied.changes];
    } catch (err) {
      log.warn('[AgentOrchestrator] Semantic transformation skipped', String(err));
    }
  }

  const intentContext = describeIntentGraphForPrompt(graphOf(variant.layers));

  // ── JUDGE 1 — Geometry (pure math, zero tokens). Runs BEFORE the vision
  // passes so the expensive critic only judges what determinism couldn't fix.
  // Findings carry RepairOperations; the Repair Engine executes each one only
  // if the constraint graph stays satisfied. "LLM proposes, compiler decides."
  let geometry: GeometryAudit | null = null;
  try {
    geometry = auditGeometry(variant.layers, canvasSize);
    if (geometry.findings.length > 0) {
      const ops = geometry.findings.map((f) => f.repair).filter(Boolean) as import('./repairEngine').RepairOperation[];
      const repair = runRepair(variant.layers, ops, canvasSize, deriveDesignConstraints(graphOf(variant.layers), variant.layers));
      variant.layers = repair.layers;
      geometry = auditGeometry(variant.layers, canvasSize); // re-audit post-repair
      variant.criticFeedback = [
        ...(variant.criticFeedback || []),
        `Geometry judge: ${geometry.score}/100 after repair (${repair.acceptedCount} op(s) accepted${repair.rejectedCount ? `, ${repair.rejectedCount} rejected by constraints` : ''})`,
        ...geometry.findings.slice(0, 3).map((f) => `Geometry: ${f.issue} — ${f.evidence[0]}`),
      ];
    } else {
      variant.criticFeedback = [...(variant.criticFeedback || []), `Geometry judge: ${geometry.score}/100, no structural findings`];
    }
  } catch (err) {
    log.warn('[AgentOrchestrator] Geometry judge skipped', String(err));
  }

  // Artistic pass second (VLM sees the render), deterministic solver last:
  // whatever the critic proposes is still clamped, snapped and contrast-checked.
  if (critiquePasses > 0) {
    try {
      const critique = await runVisualCritiqueLoop(variant.layers, {
        brief: intent,
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
        passes: critiquePasses,
        intentContext,
      });
      variant.layers = critique.layers;
      if (critique.score > 0) {
        variant.criticFeedback = [
          ...(variant.criticFeedback || []),
          `Visual critic score: ${critique.score}/100${critique.history.length > 1 ? ` (ΔQ: ${critique.history.slice(1).map((h) => (h.delta ?? 0) > 0 ? `+${h.delta}` : h.delta).join(' → ')})` : ''}`,
          ...critique.defects.slice(0, 3).map((d) => `Critic: ${d}`),
          ...judgesSummary(geometry, critique.score),
        ];
      }
    } catch (err) {
      log.warn('[AgentOrchestrator] Visual critique skipped', String(err));
    }
  }

  // ── JUDGE 3 — the deterministic solver, now under the compiler rule: its
  // clamps/snaps are only kept if the constraint graph is no worse than the
  // pre-solve state (the constraint graph outranks the grid).
  const constraints = deriveDesignConstraints(graphOf(variant.layers), variant.layers);
  const preViolations = validateDesignConstraints(variant.layers, constraints, canvasSize).length;
  try {
    const solved = solveDesignLayers(variant.layers, {
      width: canvasSize.width,
      height: canvasSize.height,
    });
    const postViolations = validateDesignConstraints(solved.layers, constraints, canvasSize).length;
    if (postViolations <= preViolations) {
      variant.layers = solved.layers;
      if (solved.fixes.length > 0) {
        variant.criticFeedback = [
          ...(variant.criticFeedback || []),
          ...solved.fixes.slice(0, 4).map((f) => f.message),
        ];
      }
    } else {
      log.warn('[AgentOrchestrator] Solver output rejected (breaks constraints); keeping repaired state');
      variant.criticFeedback = [
        ...(variant.criticFeedback || []),
        'Solver clamp rejected: would break a bound constraint (constraint graph outranks the grid)',
      ];
    }
  } catch (err) {
    log.warn('[AgentOrchestrator] Solver gate failed', String(err));
  }

  enforceTextFidelity(variant, intent);
}

/**
 * Unified draft stage. Always returns at least the procedural variants
 * (Pathway A); prepends an art-directed blueprint variant (Pathway B)
 * when the planner succeeds. Every variant leaves through the same
 * polish gate: VLM visual critique + deterministic solver + text fidelity.
 */
export async function draftAgentVariants(
  intent: string,
  canvasSize: { width: number; height: number },
  strategy?: any,
  options: DraftStageOptions = { plan: 'free' }
): Promise<AgentVariant[]> {
  // Pathway A runs concurrently — it is the guaranteed floor for quality/latency.
  const proceduralPromise = creativeAgentDraft(intent, canvasSize, 3, strategy);

  let blueprintVariant: AgentVariant | null = null;
  try {
    options.onProgress?.('planning', 'Art-directing a bespoke multi-layer blueprint...');
    const strategyContext = strategy ? buildStrategyContext(strategy, intent) : undefined;
    const rawBlueprint = await generateDesignBlueprint(intent, canvasSize.width, canvasSize.height, strategyContext);
    const sanitized = sanitizeBlueprint(rawBlueprint, canvasSize);

    if (sanitized) {
      const allowGeneration = options.plan !== 'free';
      if (!allowGeneration) {
        substituteStockAssets(sanitized, intent);
      }

      const processed = await processDesignBlueprint(sanitized, {
        onProgress: (current, total, layerName) =>
          options.onProgress?.('assets', `Rendering "${layerName}" (${current}/${total})...`, current, total),
      });

      blueprintVariant = blueprintToVariant(sanitized, processed.layers, processed.generatedAssets, intent, canvasSize);
      log.info(`[AgentOrchestrator] Blueprint variant accepted (${sanitized.layers.length} layers)`);
    }
  } catch (err) {
    log.warn('[AgentOrchestrator] Blueprint stage failed, relying on procedural drafts', String(err));
  }

  const procedural = await proceduralPromise;

  if (!blueprintVariant) {
    options.onProgress?.('fallback', 'Blueprint planner unavailable — using curated studio frameworks.');
    // Shallow-clone: polish mutates variants; never corrupt the draft cache.
    const variants = procedural.slice(0, 3).map((v) => ({ ...v }));
    await polishAll(variants, intent, canvasSize, options);
    return variants;
  }

  // Blueprint leads the lineup; keep two procedural directions for choice diversity.
  const variants = [blueprintVariant, ...procedural.slice(0, 2).map((v) => ({ ...v }))];
  await polishAll(variants, intent, canvasSize, options);
  return variants;
}

async function polishAll(
  variants: AgentVariant[],
  intent: string,
  canvasSize: { width: number; height: number },
  options: DraftStageOptions
): Promise<void> {
  const paid = options.plan !== 'free';
  options.onProgress?.('critique', 'Visual critic is reviewing every render before delivery...');
  // Sequenced, not parallel: each pass is a vision call; keep latency honest
  // and the thinking log readable. Free tier: only the blueprint gets a pass.
  for (const variant of variants) {
    const passes = variant.source === 'blueprint' ? (paid ? 2 : 1) : paid ? 1 : 0;
    await polishVariantLayers(variant, intent, canvasSize, passes, options.strategy);
  }
}

/**
 * Edit-in-place design intelligence (KDAB KT-051..KT-056): instead of
 * generating a NEW design, transform the one the user already has.
 * Command → multi-variable transformation over the Design Intent Graph,
 * optional intent-preserving recomposition, then the same critic + solver
 * + text-fidelity gate as generation. Layer ids are preserved so applying
 * the result merges into the existing artboard as an edit (undo-able).
 * Returns null when the command is not an in-place edit command.
 */
export async function transformExistingDesign(
  intent: string,
  existingLayers: Layer[],
  canvasSize: { width: number; height: number },
  options: { plan: string; strategy?: any; onProgress?: (stage: DraftProgressStage, message: string) => void } = { plan: 'free' }
): Promise<AgentVariant | null> {
  const plan = planDesignCommand(intent, canvasSize);
  if (!plan.transformation && !plan.relayoutTo) {
    return null; // not an executable in-place edit on its own
  }
  if (existingLayers.length < 2) {
    return null; // nothing to edit
  }

  const { protectedRoles } = intentContextFor(existingLayers, canvasSize, intent, options.strategy);
  plan.protectedRoles = [...new Set([...(plan.protectedRoles || []), ...protectedRoles])];

  options.onProgress?.('critique', plan.transformation
    ? `Applying the “${plan.transformation}” treatment to your design (protecting: ${plan.protectedRoles.length ? plan.protectedRoles.join(', ') : 'locked layers only'})...`
    : 'Recomposing your design for the new format...');

  const applied = applyDesignCommand(existingLayers, intent, canvasSize, plan, options.strategy);
  const size = plan.relayoutTo || canvasSize;

  const variant: AgentVariant = {
    id: uuidv4(),
    themeIdea: `Edit: ${plan.transformation ? `${plan.transformation} treatment` : 'recomposition'}${plan.relayoutTo ? ` → ${plan.relayoutTo.width}×${plan.relayoutTo.height}` : ''}`,
    layers: applied.layers,
    width: size.width,
    height: size.height,
    source: 'transformed',
    criticFeedback: [...applied.changes],
  };

  // Full quality loop: critic sees the edited render, solver guarantees craft.
  // Transformation already executed above — never apply it twice.
  const paid = options.plan !== 'free';
  await polishVariantLayers(variant, intent, size, paid ? 2 : 1, options.strategy, true);
  return variant;
}
