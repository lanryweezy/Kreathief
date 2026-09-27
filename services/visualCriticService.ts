/**
 * Visual Critic Service — the agent's feedback loop with eyes.
 *
 * Evidence base: VFLM ("Seeing is Improving", CVPR 2026) and VLM-as-judge
 * refinement research show visual feedback on *rendered* output — not
 * coordinate text — is the decisive factor in layout quality. This service
 * renders the design (utils/designSnapshot), has Gemini art-direct it like a
 * hostile senior designer, and applies a whitelisted property patch per pass,
 * iterating until quality plateaus or the pass budget is spent.
 */
import { Layer } from '../types';
import { log } from '../utils/log';
import { safeParseJSON } from '../utils/errorHandling';
import { SchemaType } from '@google/generative-ai';
import { callBackendGeminiAPI } from './geminiService';
import { renderLayersToDataUrl } from '../utils/designSnapshot';

export interface CritiqueIssue {
  /** Stable issue code, e.g. weak_hierarchy, cramped_spacing, low_contrast. */
  issue: string;
  /** Canvas-pixel region where the problem is — makes findings actionable. */
  region: { x: number; y: number; width: number; height: number };
  /** 0..1 — how badly this hurts shippability. */
  severity: number;
  reason: string;
  suggestedAction: string;
  /** Layer id from the tree, when the issue maps to one element. */
  targetId?: string;
}

export interface CritiquePassRecord {
  pass: number;
  score: number;
  /** ΔQ vs the previous pass — the temporal improvement signal (VFLM/KDAB). */
  delta: number | null;
  patchesApplied: number;
}

export interface CritiquePassResult {
  layers: Layer[];
  score: number;
  defects: string[];
  passes: number;
  issues: CritiqueIssue[];
  history: CritiquePassRecord[];
}

export interface CritiqueOptions {
  brief: string;
  canvasWidth: number;
  canvasHeight: number;
  passes?: number;
  /** Stop early once the judge's score is at or above this. */
  targetScore?: number;
  /** Design Intent Graph digest — lets the critic judge causality, not just pixels. */
  intentContext?: string;
  onPass?: (pass: number, score: number, defects: string[]) => void;
}

const CRITIC_SYSTEM_INSTRUCTION = `You are a hostile senior art director at a top design agency reviewing a junior's draft. You are shown a RENDERED snapshot of a layered design plus its layer tree and the original brief.

Find the REAL problems, in priority order:
1. Brief failures — missing/wrong message, wrong tone, ignored constraints.
2. Hierarchy — is there an unambiguous 1st/2nd/3rd reading order?
3. Typography — scale coherence, pairing, line-height, cramped or oversized text.
4. Spacing & alignment — inconsistent gaps, elements drifting off grid, crowding.
5. Contrast & legibility — any text you can barely read.
6. Clichés & AI-slop — generic gradients, decoration that adds nothing, clutter.

Then return the SMALLEST set of surgical fixes as property patches on existing layer ids.
Rules:
- Only patch layers that exist in the layer tree. Never invent ids.
- Only these fields are allowed per patch: x, y, width, height, opacity, fontSize, color, text.
- "color" is the layer's fill (text layers: text color). Use hex values.
- Keep copy edits minimal and faithful to the brief; never change text unless it is wrong, unreadable, or generic filler.
- Every issue MUST be LOCALIZED: give the canvas-pixel region where it is visible, a severity 0-1,
  a concrete reason, and a computationally actionable suggested_action (never "improve the composition" —
  say "increase headline scale 12%" / "move CTA 24px off the product edge").
- Score the CURRENT render 0-100 for professional shippability BEFORE your fixes (100 = a senior designer ships it untouched).
- If the design is genuinely strong (score >= 85), return empty issues and patches arrays.
Return ONLY valid JSON.`;

const CRITIC_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    score: { type: SchemaType.NUMBER },
    summary: { type: SchemaType.STRING },
    defects: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    issues: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          issue: { type: SchemaType.STRING },
          region: {
            type: SchemaType.OBJECT,
            properties: {
              x: { type: SchemaType.NUMBER },
              y: { type: SchemaType.NUMBER },
              width: { type: SchemaType.NUMBER },
              height: { type: SchemaType.NUMBER },
            },
            required: ['x', 'y', 'width', 'height'],
          },
          severity: { type: SchemaType.NUMBER },
          reason: { type: SchemaType.STRING },
          suggested_action: { type: SchemaType.STRING },
          target_id: { type: SchemaType.STRING },
        },
        required: ['issue', 'region', 'severity', 'reason', 'suggested_action'],
      },
    },
    patches: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          changes: {
            type: SchemaType.OBJECT,
            properties: {
              x: { type: SchemaType.NUMBER },
              y: { type: SchemaType.NUMBER },
              width: { type: SchemaType.NUMBER },
              height: { type: SchemaType.NUMBER },
              opacity: { type: SchemaType.NUMBER },
              fontSize: { type: SchemaType.NUMBER },
              color: { type: SchemaType.STRING },
              text: { type: SchemaType.STRING },
            },
          },
        },
        required: ['id', 'changes'],
      },
    },
  },
  required: ['score', 'defects', 'patches'],
};

/** Whitelisted merge of one critic patch onto an existing layer. */
function applyPatch(layer: Layer, changes: any): Layer {
  if (!changes || typeof changes !== 'object') return layer;
  const patched: any = { ...layer };
  const l = layer as any;

  const takeNumber = (key: string, min: number, max: number) => {
    const v = changes[key];
    if (typeof v === 'number' && isFinite(v)) {
      patched[key] = Math.max(min, Math.min(max, v));
    }
  };
  takeNumber('x', 0, Math.max(l.width || 0, 8192));
  takeNumber('y', 0, Math.max(l.height || 0, 8192));
  takeNumber('width', 4, 8192);
  takeNumber('height', 4, 8192);
  takeNumber('opacity', 0, 1);
  takeNumber('fontSize', 6, 1000);

  if (typeof changes.color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(changes.color.trim())) {
    patched.color = changes.color.trim();
  }
  // Text edits only on text layers, never emptying the string.
  if (layer.type === 'text' && typeof changes.text === 'string' && changes.text.trim()) {
    patched.text = changes.text.slice(0, 500);
  }
  return patched as Layer;
}

function describeLayerTree(layers: Layer[]): string {
  return [...layers]
    .sort((a, b) => ((a as any).zIndex ?? 0) - ((b as any).zIndex ?? 0))
    .map((l: any) => {
      const geom = `${Math.round(l.x)},${Math.round(l.y)} ${Math.round(l.width)}x${Math.round(l.height)}`;
      if (l.type === 'text') {
        return `- [${l.id}] "${l.name || 'text'}" text(${l.type}) @ ${geom} fontSize=${l.fontSize} color=${l.color} content="${String(l.text || '').replace(/"/g, "'")}"`;
      }
      if (l.type === 'image') {
        return `- [${l.id}] "${l.name || 'image'}" image @ ${geom} opacity=${l.opacity ?? 1}`;
      }
      return `- [${l.id}] "${l.name || l.type}" ${l.type} @ ${geom} fill=${l.color || l.fill || 'gradient'}`;
    })
    .join('\n');
}

/**
 * Render → critique → patch, up to `passes` times. Temporal evaluation: every
 * pass records ΔQ vs the previous score, and the loop stops the moment the
 * repair curve plateaus (marginal improvement → 0), per VFLM. Fails soft: any
 * VLM or render error simply ends the loop with the layers as they are.
 */
export async function runVisualCritiqueLoop(
  inputLayers: Layer[],
  options: CritiqueOptions
): Promise<CritiquePassResult> {
  const maxPasses = Math.max(1, Math.min(3, options.passes ?? 1));
  const targetScore = options.targetScore ?? 85;
  let layers = inputLayers;
  let lastScore = 0;
  const allDefects: string[] = [];
  const allIssues: CritiqueIssue[] = [];
  const history: CritiquePassRecord[] = [];

  for (let pass = 1; pass <= maxPasses; pass++) {
    let dataUrl: string;
    try {
      dataUrl = await renderLayersToDataUrl(layers, options.canvasWidth, options.canvasHeight);
    } catch (err) {
      log.warn(`[VisualCritic] Snapshot render failed (pass ${pass})`, String(err));
      break;
    }
    const base64 = dataUrl.split(',')[1];
    if (!base64) break;

    try {
      const intentBlock = options.intentContext
        ? `\n\nDESIGN INTENT GRAPH (judge against this — protected nodes must stay untouched):\n${options.intentContext.slice(0, 3500)}`
        : '';
      const response = await callBackendGeminiAPI({
        modelName: 'gemini-2.5-flash',
        systemInstruction: CRITIC_SYSTEM_INSTRUCTION,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: CRITIC_RESPONSE_SCHEMA,
          temperature: 0.2,
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `BRIEF: ${options.brief.slice(0, 800)}\nCANVAS: ${options.canvasWidth}x${options.canvasHeight}${intentBlock}\n\nLAYER TREE (patch only these ids):\n${describeLayerTree(layers).slice(0, 6000)}\n\nThe image attached is the rendered design. Critique it and return your JSON.`,
              },
              { inlineData: { mimeType: 'image/jpeg', data: base64 } },
            ],
          },
        ],
      });

      const raw = await (response as any)?.text;
      const parsed = safeParseJSON<any | null>(raw || 'null', null);
      if (!parsed || typeof parsed.score !== 'number') break;

      lastScore = Math.round(parsed.score);
      const defects = Array.isArray(parsed.defects) ? parsed.defects.slice(0, 6).map(String) : [];
      const issues = normalizeIssues(parsed.issues, options.canvasWidth, options.canvasHeight);
      allDefects.push(...(defects.length ? defects : issues.map((i) => `${i.issue}: ${i.reason}`)));
      allIssues.push(...issues);

      const delta = history.length ? lastScore - history[history.length - 1].score : null;
      history.push({ pass, score: lastScore, delta, patchesApplied: 0 });
      options.onPass?.(pass, lastScore, defects);

      // Temporal plateau: a previous repair that moved the needle by <= 2
      // points means another critique pass buys nothing — stop spending.
      if (lastScore >= targetScore || (delta !== null && delta <= 2 && pass > 1)) {
        break;
      }
      if (!Array.isArray(parsed.patches) || parsed.patches.length === 0) {
        break;
      }

      const byId = new Map(parsed.patches.map((p: any) => [String(p?.id ?? ''), p?.changes]));
      layers = layers.map((l) => (byId.has(l.id) ? applyPatch(l, byId.get(l.id)) : l));
      history[history.length - 1].patchesApplied = byId.size;
    } catch (err) {
      log.warn(`[VisualCritic] Critique pass ${pass} failed`, String(err));
      break;
    }
  }

  return { layers, score: lastScore, defects: allDefects, passes: history.length, issues: allIssues, history };
}

/** Validate/clamp the VLM's localized findings into our strict issue shape. */
function normalizeIssues(raw: unknown, canvasW: number, canvasH: number): CritiqueIssue[] {
  if (!Array.isArray(raw)) return [];
  const issues: CritiqueIssue[] = [];
  for (const item of raw.slice(0, 8)) {
    if (!item || typeof item !== 'object') continue;
    const r = item.region;
    if (!r || typeof r.x !== 'number' || typeof r.y !== 'number') continue;
    issues.push({
      issue: String(item.issue || 'unspecified').slice(0, 60),
      region: {
        x: Math.max(0, Math.min(canvasW, Math.round(r.x))),
        y: Math.max(0, Math.min(canvasH, Math.round(r.y))),
        width: Math.max(1, Math.min(canvasW, Math.round(typeof r.width === 'number' ? r.width : 50))),
        height: Math.max(1, Math.min(canvasH, Math.round(typeof r.height === 'number' ? r.height : 50))),
      },
      severity: Math.max(0, Math.min(1, typeof item.severity === 'number' ? item.severity : 0.5)),
      reason: String(item.reason || '').slice(0, 300),
      suggestedAction: String(item.suggested_action || item.suggestedAction || '').slice(0, 300),
      targetId: typeof item.target_id === 'string' && item.target_id ? item.target_id : undefined,
    });
    if (issues.length >= 6) break;
  }
  return issues;
}
