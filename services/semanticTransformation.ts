/**
 * ============================================
 * SEMANTIC TRANSFORMATION ENGINE — design intelligence, not pixel shuffle
 * ============================================
 * "Make it feel more premium" is not one edit — an art director executes it
 * as a coordinated set of variable changes (type tracking, breathing space,
 * hierarchy sharpening, noise reduction) while preserving the concept, the
 * copy, the logo and anything the brief protects.
 *
 * This engine turns a natural-language command into exactly that: a
 * multi-variable, role-scoped, constraint-preserving transformation over
 * the existing layer stack (KDAB KT-051..KT-054). Recomposition across
 * formats ("make it work at 1080x1920") reuses the intent-preserving
 * smartResizeEngine and keeps layer identities stable (KT-049/KT-056),
 * so the result merges back into the same artboard as an edit — not a
 * replacement design.
 *
 * Everything here is deterministic and logged as human-readable rationale
 * ("why did the agent do that?" → changes[] — KT-055 causal reasoning).
 */
import { Layer, SemanticLayerRole } from '../types';
import { smartResizeArtboard } from './smartResizeEngine';
import { buildDesignIntentGraph, findNodesByPhrase, DesignIntentGraph } from './designIntentGraph';

export type SemanticTransformation =
  | 'premium'
  | 'youthful'
  | 'minimal'
  | 'bold'
  | 'professional'
  | 'warm';

export interface DesignCommandPlan {
  /** Mood shift the user asked for, or null if this isn't an edit command. */
  transformation: SemanticTransformation | null;
  /** Intent-preserving recomposition target, if the command implies one. */
  relayoutTo: { width: number; height: number } | null;
  /** Roles the user said to preserve — never touched. */
  protectedRoles: SemanticLayerRole[];
  /** "Change ONLY the headline" → restrict edits to exactly these roles. */
  localTargetRoles: SemanticLayerRole[] | null;
}

export interface DesignCommandResult {
  layers: Layer[];
  graph: DesignIntentGraph;
  changes: string[];
  transformation: SemanticTransformation | null;
  relayoutTo: { width: number; height: number } | null;
}

// ─── Command parsing ─────────────────────────────────────────────────────────

const EDIT_VERB =
  /\b(make|make\s+it|move|more|less|keep|preserve|retain|don'?t\s+\w+|clean\s*up|strip|dial|feel|style\s*it|turn\s*this|rework|adjust|tighten|give\s+it|change\w*|resiz\w*|reformat|adapt|convert|export|fit)\b/i;

const TRANSFORMATION_TRIGGERS: Array<[SemanticTransformation, RegExp]> = [
  ['premium', /\b(premium|luxur|sophisticat|elegant|high[- ]?end|expensive[- ]?looking|classy)\b/i],
  ['youthful', /\b(youthful|young|playful|fun|vibrant|energetic|gen\s?z|poppy)\b/i],
  ['minimal', /\b(minimal|minimalist|clean|simpler|less\s+clutter|breathing\s+room|whitespace)\b/i],
  ['bold', /\b(bolder|bold|urgent|loud|impactful|punchy|aggressive|stand\s*out)\b/i],
  ['professional', /\b(professional|corporate|trust wort|enterprise|serious|refined|business[- ]like)\b/i],
  ['warm', /\b(warm|cozy|friendly|inviting|organic|homey)\b/i],
];

const FORMAT_TARGETS: Array<[RegExp, { width: number; height: number }]> = [
  [/\b(story|reel|reels|tiktok)\b/i, { width: 1080, height: 1920 }],
  [/\b(banner|linkedin|og\s?image|display\s?ad)\b/i, { width: 1200, height: 630 }],
  [/\b(square|feed|post|1x1)\b/i, { width: 1080, height: 1080 }],
  [/\b(poster|portrait)\b/i, { width: 1080, height: 1350 }],
  [/\b(thumbnail|youtube)\b/i, { width: 1280, height: 720 }],
  [/\b(pin|pinterest)\b/i, { width: 1000, height: 1500 }],
  [/\b(header|twitter|x\s?header)\b/i, { width: 1500, height: 500 }],
];

const PRESERVE_CLAUSE =
  /(?:keep|preserve|retain|don'?t\s+(?:touch|change|alter)|leave)\s+(?:the\s+|my\s+|its\s+)?([^.,;]{3,60})/gi;

/**
 * Decide whether a user sentence is an in-place design command (vs a brief
 * for a brand-new design). Requires an editing verb — "premium coffee shop
 * poster" is a generation brief, "make it feel premium" is a transformation.
 */
export function planDesignCommand(
  intent: string,
  canvasSize: { width: number; height: number }
): DesignCommandPlan {
  const text = (intent || '').trim();
  const plan: DesignCommandPlan = {
    transformation: null,
    relayoutTo: null,
    protectedRoles: [],
    localTargetRoles: null,
  };
  if (!text || !EDIT_VERB.test(text)) {
    return plan;
  }

  for (const [kind, re] of TRANSFORMATION_TRIGGERS) {
    if (re.test(text)) {
      plan.transformation = kind;
      break;
    }
  }

  // Explicit pixel target wins: "make it work at 1080x1920".
  const dims = text.match(/(\d{3,4})\s*(?:x|×|by)\s*(\d{3,4})/i);
  if (dims) {
    const w = Number(dims[1]);
    const h = Number(dims[2]);
    if (w >= 100 && h >= 100 && w <= 8000 && h <= 8000) {
      plan.relayoutTo = { width: w, height: h };
    }
  } else if (/\b(fit|resize|adapt|convert|export|version|dimension|format|cross[- ]?post|reformat|work\s+at)\b/i.test(text)) {
    // Format keywords only count when the command is actually about sizing —
    // "make it tell a story" must NOT trigger a 9:16 recomposition.
    for (const [re, size] of FORMAT_TARGETS) {
      if (re.test(text)) {
        plan.relayoutTo = size;
        break;
      }
    }
  }
  if (plan.relayoutTo && plan.relayoutTo.width === canvasSize.width && plan.relayoutTo.height === canvasSize.height) {
    plan.relayoutTo = null; // already there
  }

  // "change only the headline" / "just the CTA" → local edit scoping.
  const only = text.match(/\b(?:only|just)\s+(?:change|edit|adjust|touch|redo)\s+(?:the\s+|my\s+)?([a-z ]{3,30})/i)
    || text.match(/\b(?:change|edit|adjust|touch)\s+(?:only|just)\s+([a-z ]{3,30})/i);
  if (only) {
    const roles = new Set<SemanticLayerRole>();
    // Build a throwaway graph later; phrase matching needs roles only.
    const phrase = only[1];
    const aliasPairs: Array<[RegExp, SemanticLayerRole[]]> = [
      [/head\s*line|title/, ['headline']],
      [/sub\s*head|subtitle|body/, ['subheadline']],
      [/\bcta\b|button/, ['cta_button', 'cta_label']],
      [/logo|brand/, ['media_focal']],
      [/photo|image|product|hero/, ['media_focal']],
      [/badge|tag/, ['hero_badge']],
      [/background|backdrop/, ['background']],
      [/footer|legal|disclaimer/, ['footer_meta']],
      [/card|offer/, ['offer_card']],
      [/decorat|shape|accent/, ['decorative']],
    ];
    for (const [re, mapped] of aliasPairs) {
      if (re.test(phrase)) mapped.forEach((r) => roles.add(r));
    }
    if (roles.size > 0) plan.localTargetRoles = [...roles];
  }

  return plan;
}

/** Extract "keep/preserve X" clauses against the built intent graph. */
export function extractProtectedRoles(
  intent: string,
  graph: DesignIntentGraph
): SemanticLayerRole[] {
  const roles = new Set<SemanticLayerRole>();
  for (const clause of intent.match(PRESERVE_CLAUSE) || []) {
    findNodesByPhrase(graph, clause).forEach((n) => roles.add(n.role));
  }
  return [...roles];
}

// ─── Transformation execution ────────────────────────────────────────────────

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function adjustFilters(layer: Layer, patch: Partial<{ saturation: number; brightness: number; contrast: number; sepia: number }>): void {
  const anyLayer = layer as any;
  const base = {
    brightness: 100, contrast: 100, saturation: 100, grayscale: 0,
    blur: 0, sepia: 0, hueRotate: 0, vignette: 0, opacity: 1,
    ...(anyLayer.filters || {}),
  };
  anyLayer.filters = {
    ...base,
    saturation: clamp((base.saturation ?? 100) + (patch.saturation || 0), 0, 200),
    brightness: clamp((base.brightness ?? 100) + (patch.brightness || 0), 0, 200),
    contrast: clamp((base.contrast ?? 100) + (patch.contrast || 0), 0, 200),
    sepia: clamp((base.sepia ?? 0) + (patch.sepia || 0), 0, 100),
  };
}

/** Pull content away from edges (bigger margins) or push slightly outward. */
function breathe(layers: Layer[], canvas: { width: number; height: number }, factor: number, skipRoles: Set<SemanticLayerRole>, graph: DesignIntentGraph): void {
  const roleById = new Map(graph.nodes.map((n) => [n.layerId, n.role]));
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  for (const l of layers) {
    if (l.locked || skipRoles.has(roleById.get(l.id) as SemanticLayerRole)) continue;
    if ((l as any).width >= canvas.width * 0.95 && (l as any).height >= canvas.height * 0.95) continue; // full bleed
    const nx = cx + (l.x + l.width / 2 - cx) * factor;
    const ny = cy + (l.y + l.height / 2 - cy) * factor;
    l.x = Math.round(nx - l.width / 2);
    l.y = Math.round(ny - l.height / 2);
  }
}

/**
 * Apply a planned command to the existing layers. Pure w.r.t. the store —
 * clones the layer array, returns new layers plus the rationale log.
 */
export function applyDesignCommand(
  inputLayers: Layer[],
  command: string,
  canvas: { width: number; height: number },
  plan: DesignCommandPlan,
  strategy?: any
): DesignCommandResult {
  const changes: string[] = [];
  let layers = inputLayers.map((l) => ({ ...l }) as Layer);
  let size = { ...canvas };

  const graphFor = (ls: Layer[], c: { width: number; height: number }) =>
    buildDesignIntentGraph(ls, c, { strategy, protectedRoles: plan.protectedRoles });

  // 1. Intent-preserving recomposition (KT-049/KT-056): reuse the semantic
  //    reflow engine, then restore original layer ids so the edit merges
  //    back into the same artboard instead of replacing the design.
  if (plan.relayoutTo) {
    const pseudo = {
      id: 'cmd-pseudo',
      name: 'command',
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
      layers,
    } as any;
    const resized = smartResizeArtboard(pseudo, plan.relayoutTo.width, plan.relayoutTo.height, {
      preserveHierarchy: true,
    });
    // smartResize pushes exactly one clone per input layer, order preserved.
    layers = resized.layers.map((l, i) => ({ ...l, id: inputLayers[i]?.id ?? l.id })) as Layer[];
    size = { width: plan.relayoutTo.width, height: plan.relayoutTo.height };
    changes.push(
      `Recomposed for ${size.width}×${size.height}: hierarchy, copy and layer identities preserved (headline > media > CTA order intact).`
    );
  }

  let graph = graphFor(layers, size);

  if (!plan.transformation && !plan.localTargetRoles) {
    return { layers, graph, changes, transformation: null, relayoutTo: plan.relayoutTo };
  }

  // "Change only X" → everything that isn't X becomes protected (KT-052).
  if (plan.localTargetRoles) {
    const allowed = new Set(plan.localTargetRoles);
    const protectedRoles = new Set<SemanticLayerRole>([...(plan.protectedRoles || [])]);
    const allRoles = new Set(graph.nodes.map((n) => n.role));
    for (const r of allRoles) {
      if (!allowed.has(r)) protectedRoles.add(r);
    }
    plan.protectedRoles = [...protectedRoles];
    graph = graphFor(layers, size); // rebuild with new protection set
  }

  const skip = new Set<SemanticLayerRole>([
    ...(plan.protectedRoles || []),
    'background', // stage is handled via palette ops only, never moved
  ]);
  const nodesOf = (...roles: SemanticLayerRole[]) =>
    graph.nodes.filter((n) => roles.includes(n.role) && !n.protected_ && !skip.has(n.role));
  const layerById = new Map(layers.map((l) => [l.id, l]));
  const of = (nodes: ReturnType<typeof nodesOf>) =>
    nodes.map((n) => layerById.get(n.layerId)).filter(Boolean) as Layer[];

  const headlines = of(nodesOf('headline'));
  const subheads = of(nodesOf('subheadline'));
  const ctas = of(nodesOf('cta_button', 'cta_label'));
  const badges = of(nodesOf('hero_badge'));
  const media = of(nodesOf('media_focal'));
  const decorations = of(nodesOf('decorative'));
  const footers = of(nodesOf('footer_meta'));

  switch (plan.transformation) {
    case 'premium': {
      // Luxury = air + restraint, never bigger shouting.
      breathe(layers, size, 0.94, skip, graph);
      for (const t of [...headlines, ...subheads]) {
        const anyT = t as any;
        if (typeof anyT.fontSize === 'number' && headlines.includes(t)) {
          anyT.fontSize = Math.round(clamp(anyT.fontSize * 1.06, 8, 400));
        }
        anyT.letterSpacing = clamp((anyT.letterSpacing || 0) + Math.max(0.5, anyT.fontSize * 0.015), 0, 20);
        if (typeof anyT.lineHeight === 'number') {
          anyT.lineHeight = clamp(anyT.lineHeight * 1.06, 0.9, 3);
        }
      }
      for (const d of decorations) {
        (d as any).opacity = Math.round(clamp(((d as any).opacity ?? 1) * 0.55, 0.05, 1) * 100) / 100;
      }
      for (const m of media) adjustFilters(m, { saturation: -8, contrast: 4 });
      changes.push('Premium pass: +breathing space, wider tracking, tighter leading scale-up, decorative noise dimmed, imagery desaturated slightly.');
      break;
    }
    case 'youthful': {
      for (const m of [...media, ...decorations]) adjustFilters(m, { saturation: 18, brightness: 4 });
      for (const d of decorations) {
        const anyD = d as any;
        if (Math.abs(anyD.rotation || 0) < 1) anyD.rotation = d.y > size.height / 2 ? 3 : -3;
      }
      for (const t of headlines) {
        const anyT = t as any;
        anyT.fontSize = Math.round(clamp(anyT.fontSize * 1.05, 8, 400));
      }
      for (const b of badges) (b as any).opacity = 1;
      changes.push('Youthful pass: color lifted, headline scaled +5%, decorative elements given slight tilt for energy.');
      break;
    }
    case 'minimal': {
      breathe(layers, size, 0.9, skip, graph);
      for (const d of decorations) {
        (d as any).opacity = Math.round(clamp(((d as any).opacity ?? 1) * 0.3, 0.03, 1) * 100) / 100;
      }
      for (const b of [...badges, ...footers]) {
        (b as any).opacity = Math.round(clamp(((b as any).opacity ?? 1) * 0.75, 0.05, 1) * 100) / 100;
      }
      changes.push('Minimal pass: decoration reduced to whisper opacity, margins expanded, secondary info softened.');
      break;
    }
    case 'bold': {
      for (const t of headlines) {
        const anyT = t as any;
        anyT.fontSize = Math.round(clamp(anyT.fontSize * 1.14, 8, 400));
        anyT.fontWeight = '900';
        anyT.textTransform = 'uppercase';
      }
      for (const c of ctas) {
        const anyC = c as any;
        if (anyC.type === 'text') anyC.fontWeight = '800';
        anyC.opacity = 1;
      }
      for (const m of media) adjustFilters(m, { contrast: 12, saturation: 6 });
      changes.push('Bold pass: headline dominant scale + weight 900, CTA reinforced, imagery contrast pushed.');
      break;
    }
    case 'professional': {
      for (const t of [...subheads, ...footers]) {
        (t as any).textAlign = 'left';
        if (typeof (t as any).lineHeight === 'number') {
          (t as any).lineHeight = clamp((t as any).lineHeight, 1.1, 1.6);
        }
      }
      for (const m of [...media, ...decorations]) adjustFilters(m, { saturation: -10 });
      for (const d of decorations) {
        (d as any).opacity = Math.round(clamp(((d as any).opacity ?? 1) * 0.7, 0.05, 1) * 100) / 100;
      }
      changes.push('Professional pass: body copy left-aligned with controlled leading, color drama dialed back.');
      break;
    }
    case 'warm': {
      for (const m of media) adjustFilters(m, { sepia: 8, brightness: 5, saturation: 6 });
      breathe(layers, size, 0.96, skip, graph);
      for (const d of decorations) {
        const anyD = d as any;
        if (Math.abs(anyD.cornerRadius ?? 0) === 0 && 'cornerRadius' in anyD) {
          anyD.cornerRadius = Math.round(((anyD.width || 0) + (anyD.height || 0)) * 0.04);
        }
      }
      changes.push('Warm pass: imagery softened toward warm tones, margins relaxed for an inviting feel.');
      break;
    }
    default:
      break;
  }

  if (plan.transformation) {
    // Constraint guarantee (BizGenEval-style): protected copy never moved.
    for (const roleId of plan.protectedRoles || []) {
      changes.push(`Preserved: ${roleId} (user constraint).`);
    }
  }

  graph = graphFor(layers, size);
  return { layers, graph, changes, transformation: plan.transformation, relayoutTo: plan.relayoutTo };
}
