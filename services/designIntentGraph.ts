/**
 * ============================================
 * DESIGN INTENT GRAPH — the semantic layer above the layer stack
 * ============================================
 * Layers store WHAT a design is; the intent graph stores WHY it works:
 * which element carries the primary message, what dominates what, what
 * must survive any edit. This is the object the agent reasons about when
 * a user says "make it more premium" — a multi-variable transformation
 * over roles and relationships, not a random pixel reshuffle.
 *
 * Built on the proven semantic classifier from smartResizeEngine
 * (classifyLayerRole), so roles stay consistent between the intent graph,
 * intent-preserving recomposition (KT-049) and the repair planner.
 *
 * Pure module — no store, no DOM, safe for tests and the KDAB harness.
 */
import { Layer, SemanticLayerRole } from '../types';
import { classifyLayerRole } from './smartResizeEngine';

export type IntentImportance = number; // 0..1 — reading-order weight

export interface DesignIntentNode {
  layerId: string;
  role: SemanticLayerRole;
  /** Human/LLM readable label, e.g. "headline: SUMMER DROP". */
  label: string;
  importance: IntentImportance;
  /** What this element communicates, derived from role + copy. */
  communicates: string;
  /** Edges: `dominates:<layerId>`, `contrasts:<layerId>`, `supports:<role>`. */
  relationships: string[];
  /** True when the user/brief said this must be preserved. */
  protected_: boolean;
}

export interface DesignIntentGraph {
  nodes: DesignIntentNode[];
  canvas: { width: number; height: number };
  /** Campaign-level intent, from the Strategy Agent when available. */
  objective?: string;
  metaphor?: string;
  /** Roles present in the design in reading-order (most important first). */
  hierarchy: SemanticLayerRole[];
}

const ROLE_COMMUNICATION: Record<SemanticLayerRole, string> = {
  background: 'sets the mood and stage',
  headline: 'carries the PRIMARY MESSAGE',
  subheadline: 'supports the headline with detail',
  hero_badge: 'signals context (offer, drop, tag)',
  cta_button: 'drives the ACTION',
  cta_label: 'labels the ACTION',
  media_focal: 'is the visual anchor / product proof',
  offer_card: 'packages the offer',
  footer_meta: 'holds legal / contact / meta info',
  decorative: 'adds texture and energy only',
};

/** Reading-order weight per role — hierarchy is intent, not z-index. */
const ROLE_IMPORTANCE: Record<SemanticLayerRole, number> = {
  headline: 1,
  cta_button: 0.85,
  cta_label: 0.8,
  media_focal: 0.75,
  subheadline: 0.6,
  offer_card: 0.55,
  hero_badge: 0.45,
  footer_meta: 0.25,
  decorative: 0.2,
  background: 0.1,
};

function overlaps(a: Layer, b: Layer): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

/**
 * Build the intent graph for a layer stack. `protectedRoles` come from the
 * user's command ("keep the logo, preserve the CTA…") via the transformation
 * planner; those nodes are never offered to repair/relayout passes.
 */
export function buildDesignIntentGraph(
  layers: Layer[],
  canvas: { width: number; height: number },
  options: {
    strategy?: { designObjective?: string; coreMetaphor?: string } | any;
    protectedRoles?: SemanticLayerRole[];
  } = {}
): DesignIntentGraph {
  const protectedRoles = new Set(options.protectedRoles || []);
  const maxFont = Math.max(
    1,
    ...layers.filter((l) => l.type === 'text').map((l) => (l as any).fontSize || 0)
  );

  const nodes: DesignIntentNode[] = layers.map((layer) => {
    const role = classifyLayerRole(layer, layers, canvas.width, canvas.height);
    const preview =
      layer.type === 'text'
        ? `: "${String((layer as any).text || '').replace(/\s+/g, ' ').slice(0, 40)}"`
        : '';
    const importance =
      role === 'headline' && layer.type === 'text'
        ? 1
        : role === 'subheadline' && layer.type === 'text'
          ? 0.5 + 0.2 * ((layer as any).fontSize || 0) / maxFont
          : ROLE_IMPORTANCE[role];

    return {
      layerId: layer.id,
      role,
      label: `${role}${preview}`,
      importance,
      communicates: ROLE_COMMUNICATION[role],
      relationships: [],
      protected_: protectedRoles.has(role) || Boolean((layer as any).locked),
    };
  });

  // Derive structural edges between nodes.
  const byId = new Map(nodes.map((n) => [n.layerId, n]));
  const layerById = new Map(layers.map((l) => [l.id, l]));
  const headline = nodes.filter((n) => n.role === 'headline').sort((a, b) => b.importance - a.importance)[0];
  const media = nodes.find((n) => n.role === 'media_focal');
  const background = nodes.find((n) => n.role === 'background');

  if (headline && media) {
    headline.relationships.push(`dominates:${media.layerId}`);
  }
  for (const node of nodes) {
    if (node.role === 'cta_label' || node.role === 'cta_button') {
      node.relationships.push('supports:campaign_objective');
    }
    if (background && node.layerId !== background.layerId && node.importance >= 0.5) {
      const l = layerById.get(node.layerId)!;
      const bg = layerById.get(background.layerId)!;
      if (overlaps(l, bg)) node.relationships.push(`contrasts:${background.layerId}`);
    }
    if (node.role === 'subheadline' && headline) {
      node.relationships.push(`supports:${headline.layerId}`);
    }
  }

  const hierarchy = [...nodes]
    .sort((a, b) => b.importance - a.importance)
    .map((n) => n.role)
    .filter((role, i, arr) => arr.indexOf(role) === i);

  return {
    nodes,
    canvas,
    objective: options.strategy?.designObjective,
    metaphor: options.strategy?.coreMetaphor,
    hierarchy,
  };
}

/**
 * Compact text rendering of the graph for VLM prompts — lets the critic and
 * planner reason about causal structure ("headline dominates product")
 * instead of rediscovering semantics from pixels every time.
 */
export function describeIntentGraphForPrompt(graph: DesignIntentGraph): string {
  const lines: string[] = [];
  if (graph.objective) lines.push(`OBJECTIVE: ${graph.objective}`);
  if (graph.metaphor) lines.push(`CONCEPT: ${graph.metaphor}`);
  lines.push(`HIERARCHY (reading order): ${graph.hierarchy.join(' > ')}`);
  for (const node of [...graph.nodes].sort((a, b) => b.importance - a.importance)) {
    const guard = node.protected_ ? ' [PROTECTED — never alter]' : '';
    const rel = node.relationships.length ? ` (${node.relationships.join(', ')})` : '';
    lines.push(`- ${node.layerId} ${node.label} → ${node.communicates}${rel}${guard}`);
  }
  return lines.join('\n');
}

/** Find nodes a user phrase refers to ("the headline", "logo", "CTA"). */
export function findNodesByPhrase(
  graph: DesignIntentGraph,
  phrase: string
): DesignIntentNode[] {
  const p = phrase.toLowerCase().trim();
  const roleAliases: Array<[RegExp, SemanticLayerRole[]]> = [
    [/head\s*line|title|main\s*(copy|text)/, ['headline']],
    [/sub\s*head|subtitle|support(ing)?\s*text|body/, ['subheadline']],
    [/\bcta\b|button|call\s*to\s*action/, ['cta_button', 'cta_label']],
    [/logo|brand\s*mark/, ['media_focal', 'decorative']],
    [/product|photo|image|hero\s*(image|visual)?/, ['media_focal']],
    [/badge|tag|label\s*pill/, ['hero_badge']],
    [/background|backdrop|canvas\s*color/, ['background']],
    [/footer|legal|disclaimer|small\s*print/, ['footer_meta']],
    [/card|offer\s*box|price\s*box/, ['offer_card']],
    [/decorat|ornament|shape|accent\s*shape/, ['decorative']],
  ];
  const roles = new Set<SemanticLayerRole>();
  for (const [re, mapped] of roleAliases) {
    if (re.test(p)) mapped.forEach((r) => roles.add(r));
  }
  return graph.nodes.filter((n) => roles.has(n.role));
}

// ─── Constraint graph: what must remain true ───────────────────────────────

export type DesignConstraintType =
  | 'text_fidelity'      // exact copy survives (BizGenEval/STRICT constraint class)
  | 'inside_bounds'      // fully on canvas
  | 'inside_safe_zone'   // critical elements respect print/story safe margins
  | 'dominates'          // headline stays visually dominant over its rival
  | 'protected_immutable'; // locked/user-protected layers keep position/scale/style

export interface DesignConstraint {
  id: string;
  type: DesignConstraintType;
  targetId: string;
  /** For dominates: the layer that must stay smaller/quieter. */
  rivalId?: string;
  /** Captured at derivation time so validation is a delta check. */
  param?: Record<string, unknown>;
  origin: 'derived' | 'user';
}

export interface ConstraintViolation {
  constraintId: string;
  message: string;
}

/**
 * Derive the constraint graph from the intent graph: the concrete invariants
 * the solver and repair engine must never break — the research's "MUST remain
 * true" tree (exact text, safe zones, dominance, protection).
 */
export function deriveDesignConstraints(
  graph: DesignIntentGraph,
  layers: Layer[]
): DesignConstraint[] {
  const layerById = new Map(layers.map((l) => [l.id, l]));
  const constraints: DesignConstraint[] = [];

  for (const node of graph.nodes) {
    const layer = layerById.get(node.layerId);
    if (!layer) continue;

    if (layer.type === 'text' && typeof (layer as any).text === 'string') {
      constraints.push({
        id: `tf_${node.layerId}`,
        type: 'text_fidelity',
        targetId: node.layerId,
        param: { text: (layer as any).text },
        origin: 'derived',
      });
    }
    // Primary message and conversion elements must stay in the safe zone;
    // everything else must at least stay on the canvas.
    const critical = node.importance >= 0.75;
    constraints.push({
      id: `${critical ? 'sz' : 'ib'}_${node.layerId}`,
      type: critical ? 'inside_safe_zone' : 'inside_bounds',
      targetId: node.layerId,
      origin: 'derived',
    });
    if (node.protected_) {
      constraints.push({
        id: `pi_${node.layerId}`,
        type: 'protected_immutable',
        targetId: node.layerId,
        param: { x: layer.x, y: layer.y, width: layer.width, height: layer.height, opacity: layer.opacity },
        origin: 'user',
      });
    }
  }

  const headline = graph.nodes.find((n) => n.role === 'headline');
  const rival = graph.nodes
    .filter((n) => n.role !== 'headline' && n.layerId !== headline?.layerId)
    .sort((a, b) => b.importance - a.importance)[0];
  if (headline && rival && headline.layerId !== rival.layerId) {
    constraints.push({
      id: `dom_${headline.layerId}`,
      type: 'dominates',
      targetId: headline.layerId,
      rivalId: rival.layerId,
      origin: 'derived',
    });
  }
  return constraints;
}

/** Check a candidate layer set against the constraint graph. */
export function validateDesignConstraints(
  layers: Layer[],
  constraints: DesignConstraint[],
  canvas: { width: number; height: number }
): ConstraintViolation[] {
  const layerById = new Map(layers.map((l) => [l.id, l]));
  const safe = Math.round(Math.min(canvas.width, canvas.height) * 0.05);
  const violations: ConstraintViolation[] = [];
  const near = (a: unknown, b: unknown) => Math.abs(Number(a) - Number(b)) < 0.51;

  for (const c of constraints) {
    const layer = layerById.get(c.targetId);
    if (!layer) {
      violations.push({ constraintId: c.id, message: `Layer ${c.targetId} disappeared (${c.type})` });
      continue;
    }
    switch (c.type) {
      case 'text_fidelity':
        if (String((layer as any).text ?? '') !== String(c.param?.text ?? '')) {
          violations.push({ constraintId: c.id, message: `Text fidelity broken on ${layer.name || c.targetId}` });
        }
        break;
      case 'inside_bounds':
        if (layer.x < -0.5 || layer.y < -0.5 || layer.x + layer.width > canvas.width + 0.5 || layer.y + layer.height > canvas.height + 0.5) {
          violations.push({ constraintId: c.id, message: `${layer.name || c.targetId} left the canvas` });
        }
        break;
      case 'inside_safe_zone':
        if (layer.x < safe - 0.5 || layer.y < safe - 0.5 || layer.x + layer.width > canvas.width - safe + 0.5 || layer.y + layer.height > canvas.height - safe + 0.5) {
          violations.push({ constraintId: c.id, message: `${layer.name || c.targetId} violates the ${safe}px safe zone` });
        }
        break;
      case 'dominates': {
        const rival = c.rivalId ? layerById.get(c.rivalId) : undefined;
        const fs = (layer as any).fontSize || 0;
        const rfs = rival ? (rival as any).fontSize || 0 : 0;
        if (rival && fs > 0 && rfs > 0 && fs < rfs) {
          violations.push({ constraintId: c.id, message: 'Headline no longer dominates its closest rival' });
        }
        break;
      }
      case 'protected_immutable': {
        const p = c.param || {};
        if (!near(layer.x, p.x) || !near(layer.y, p.y) || !near(layer.width, p.width) || !near(layer.height, p.height) || !near(layer.opacity, p.opacity)) {
          violations.push({ constraintId: c.id, message: `Protected layer ${layer.name || c.targetId} was altered` });
        }
        break;
      }
    }
  }
  return violations;
}
