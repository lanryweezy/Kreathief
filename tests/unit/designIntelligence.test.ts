/**
 * Design Intelligence subsystem tests (KDAB K-section, KT-051..KT-056).
 * Pure deterministic coverage of the Design Intent Graph and the semantic
 * transformation engine — no network, no DOM.
 */
import { describe, it, expect } from 'vitest';
import {
  buildDesignIntentGraph,
  describeIntentGraphForPrompt,
  findNodesByPhrase,
  deriveDesignConstraints,
  validateDesignConstraints,
} from '../../services/designIntentGraph';
import { runRepair } from '../../services/repairEngine';
import { auditGeometry } from '../../utils/geometryJudge';
import {
  planDesignCommand,
  extractProtectedRoles,
  applyDesignCommand,
} from '../../services/semanticTransformation';
import { Layer } from '../../types';

const CANVAS = { width: 1080, height: 1350 };

const base = (over: Partial<Layer> & Record<string, any>): Layer =>
  ({
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    ...over,
  }) as Layer;

const makeLayers = (): Layer[] => [
  base({ id: 'bg', type: 'rectangle', name: 'Background', x: 0, y: 0, width: 1080, height: 1350, color: '#0b1020' } as any),
  base({ id: 'hero', type: 'image', name: 'Product Hero', x: 240, y: 380, width: 600, height: 600 } as any),
  base({
    id: 'headline', type: 'text', name: 'Headline', text: 'SUMMER DROP', x: 140, y: 160,
    width: 800, height: 120, fontSize: 96, color: '#ffffff', letterSpacing: 0, lineHeight: 1.1,
  } as any),
  base({
    id: 'sub', type: 'text', name: 'Subheadline', text: 'New collection live now', x: 240, y: 300,
    width: 600, height: 60, fontSize: 28, color: '#cbd5e1', letterSpacing: 0, lineHeight: 1.4,
  } as any),
  base({ id: 'cta', type: 'text', name: 'CTA', text: 'SHOP NOW →', x: 440, y: 1100, width: 200, height: 40, fontSize: 22, color: '#f59e0b' } as any),
  base({ id: 'blob1', type: 'circle', name: 'decorative blob', x: 60, y: 900, width: 120, height: 120, color: '#7c3aed', opacity: 1 } as any),
];

describe('Design Intent Graph', () => {
  it('assigns semantic roles, importance ordering and relationships', () => {
    const graph = buildDesignIntentGraph(makeLayers(), CANVAS);
    const byId = new Map(graph.nodes.map((n) => [n.layerId, n]));

    expect(byId.get('bg')!.role).toBe('background');
    expect(byId.get('headline')!.role).toBe('headline');
    expect(byId.get('hero')!.role).toBe('media_focal');
    expect(byId.get('cta')!.role).toBe('cta_label');
    expect(byId.get('blob1')!.role).toBe('decorative');

    // Headline dominates the visual anchor and carries max importance.
    expect(byId.get('headline')!.importance).toBe(1);
    expect(byId.get('headline')!.relationships).toContain('dominates:hero');
    // CTA supports the campaign objective; subheadline supports the headline.
    expect(byId.get('cta')!.relationships).toContain('supports:campaign_objective');
    expect(byId.get('sub')!.relationships).toContain('supports:headline');
    // Background must be protected-by-lock only if flagged; here it's not locked.
    expect(byId.get('bg')!.protected_).toBe(false);
    expect(graph.hierarchy[0]).toBe('headline');
  });

  it('marks locked layers protected and describes the graph for VLM prompts', () => {
    const layers = makeLayers();
    (layers[1] as any).locked = true;
    const graph = buildDesignIntentGraph(layers, CANVAS, { protectedRoles: ['cta_label'] });
    const digest = describeIntentGraphForPrompt(graph);

    expect(graph.nodes.find((n) => n.layerId === 'hero')!.protected_).toBe(true);
    expect(graph.nodes.find((n) => n.layerId === 'cta')!.protected_).toBe(true);
    expect(digest).toContain('HIERARCHY (reading order)');
    expect(digest).toContain('[PROTECTED — never alter]');
  });

  it('resolves natural phrases to nodes', () => {
    const graph = buildDesignIntentGraph(makeLayers(), CANVAS);
    expect(findNodesByPhrase(graph, 'keep the logo').length).toBeGreaterThan(0);
    const headlineNodes = findNodesByPhrase(graph, 'the headline');
    expect(headlineNodes.map((n) => n.layerId)).toContain('headline');
  });
});

describe('Command planning (KT-051/052/054/056 parsing)', () => {
  it('detects edit-in-place transformations only with editing verbs', () => {
    expect(planDesignCommand('Make it feel more premium', CANVAS).transformation).toBe('premium');
    expect(planDesignCommand('clean it up, less clutter please', CANVAS).transformation).toBe('minimal');
    // Generation brief — mood word but no edit verb: must NOT be an edit command.
    const gen = planDesignCommand('Create a premium poster for a luxury coffee brand', CANVAS);
    expect(gen.transformation).toBeNull();
    expect(gen.relayoutTo).toBeNull();
  });

  it('parses recomposition targets only when the command is about sizing', () => {
    expect(planDesignCommand('make it work at 1080x1920', CANVAS).relayoutTo).toEqual({ width: 1080, height: 1920 });
    expect(planDesignCommand('resize this to a story format', CANVAS).relayoutTo).toEqual({ width: 1080, height: 1920 });
    // "tell a story" is not a format request.
    expect(planDesignCommand('make it tell a story', CANVAS).relayoutTo).toBeNull();
  });

  it('scopes local edits from "change only X" language', () => {
    const plan = planDesignCommand('change only the headline', CANVAS);
    expect(plan.localTargetRoles).toEqual(['headline']);
  });

  it('extracts preserve-clauses against the intent graph', () => {
    const graph = buildDesignIntentGraph(makeLayers(), CANVAS);
    const roles = extractProtectedRoles('make it minimal but keep the CTA and preserve the headline', graph);
    expect(roles).toContain('cta_label');
    expect(roles).toContain('headline');
  });
});

describe('Semantic transformation execution (KT-051..KT-054)', () => {
  it('premium pass raises tracking, dims decoration and logs rationale', () => {
    const layers = makeLayers();
    const plan = planDesignCommand('make it more premium', CANVAS);
    const res = applyDesignCommand(layers, 'make it more premium', CANVAS, plan);

    const headline = res.layers.find((l) => l.id === 'headline') as any;
    const blob = res.layers.find((l) => l.id === 'blob1') as any;
    expect(headline.letterSpacing).toBeGreaterThan(0);
    expect(blob.opacity).toBeLessThan(1);
    expect(res.changes.join(' ')).toMatch(/premium/i);
    // Input layers untouched (pure function).
    expect((layers.find((l) => l.id === 'headline') as any).letterSpacing).toBe(0);
  });

  it('never touches locked layers or user-protected roles (constraint satisfaction)', () => {
    const layers = makeLayers();
    (layers.find((l) => l.id === 'hero') as any).locked = true;
    const heroBefore = JSON.stringify(layers.find((l) => l.id === 'hero'));
    const plan = planDesignCommand('make it bold', CANVAS);
    plan.protectedRoles = ['cta_label'];
    const res = applyDesignCommand(layers, 'make it bold', CANVAS, plan);

    expect(JSON.stringify(res.layers.find((l) => l.id === 'hero'))).toBe(heroBefore);
    const cta = res.layers.find((l) => l.id === 'cta') as any;
    const ctaBefore = layers.find((l) => l.id === 'cta') as any;
    expect(cta.fontSize).toBe(ctaBefore.fontSize); // protected → untouched
    const headline = res.layers.find((l) => l.id === 'headline') as any;
    expect(headline.fontWeight).toBe('900'); // bold pass applied where allowed
  });

  it('local edit scoping leaves every other layer byte-identical (KT-052)', () => {
    const layers = makeLayers();
    const command = 'make the headline bolder, change only the headline';
    const plan = planDesignCommand(command, CANVAS);
    plan.transformation = plan.transformation || 'bold';
    const res = applyDesignCommand(layers, command, CANVAS, plan);

    const before = new Map(layers.map((l) => [l.id, JSON.stringify(l)]));
    for (const out of res.layers) {
      if (out.id === 'headline') continue;
      expect(JSON.stringify(out)).toBe(before.get(out.id));
    }
    expect((res.layers.find((l) => l.id === 'headline') as any).fontWeight).toBe('900');
  });

  it('recomposition preserves layer identities and copy across formats (KT-056)', () => {
    const layers = makeLayers();
    const command = 'make it work at 1200x630 banner';
    const plan = planDesignCommand(command, CANVAS);
    expect(plan.relayoutTo).toEqual({ width: 1200, height: 630 });
    const res = applyDesignCommand(layers, command, CANVAS, plan);

    expect(res.layers.map((l) => l.id)).toEqual(layers.map((l) => l.id));
    const headline = res.layers.find((l) => l.id === 'headline') as any;
    expect(headline.text).toBe('SUMMER DROP');
    // Wide-format reflow actually moves the headline into the left column.
    expect(headline.x).toBeLessThan(120);
    // Graph rebuilt at the new size still resolves the same hierarchy.
    expect(res.graph.canvas.width).toBe(1200);
  });
});

describe('Constraint graph — what must remain true (KT-054/KT-061)', () => {
  it('derives the full invariant set from the intent graph', () => {
    const layers = makeLayers();
    (layers.find((l) => l.id === 'hero') as any).locked = true;
    const graph = buildDesignIntentGraph(layers, CANVAS);
    const constraints = deriveDesignConstraints(graph, layers);
    const byType = new Map(constraints.map((c) => [c.id, c.type]));

    expect(byType.get('tf_headline')).toBe('text_fidelity');
    expect(byType.get('sz_headline')).toBe('inside_safe_zone'); // importance 1 ≥ 0.75
    expect(byType.get('ib_blob1')).toBe('inside_bounds');       // decorative
    expect(byType.get('pi_hero')).toBe('protected_immutable');  // locked
    expect(byType.get('dom_headline')).toBe('dominates');
  });

  it('detects every class of breakage in a candidate design', () => {
    const layers = makeLayers();
    const graph = buildDesignIntentGraph(layers, CANVAS);
    const constraints = deriveDesignConstraints(graph, layers);
    expect(validateDesignConstraints(layers, constraints, CANVAS)).toHaveLength(0);

    const broken = layers.map((l) => ({ ...l }) as Layer);
    (broken.find((l) => l.id === 'headline') as any).text = 'SUMMER DR0P';   // fidelity
    (broken.find((l) => l.id === 'cta') as any).x = 10;                       // safe zone
    (broken.find((l) => l.id === 'blob1') as any).y = 2000;                   // bounds… off-canvas
    const violations = validateDesignConstraints(broken, constraints, CANVAS);
    const ids = violations.map((v) => v.constraintId);
    expect(ids).toContain('tf_headline');
    expect(ids).toContain('sz_cta');
    expect(ids).toContain('ib_blob1');
  });

  it('protected layers are vetoed positionally (protected_immutable)', () => {
    const layers = makeLayers();
    (layers.find((l) => l.id === 'hero') as any).locked = true;
    const graph = buildDesignIntentGraph(layers, CANVAS);
    const constraints = deriveDesignConstraints(graph, layers);
    const moved = layers.map((l) =>
      l.id === 'hero' ? ({ ...l, x: 300 } as Layer) : l
    );
    expect(validateDesignConstraints(moved, constraints, CANVAS).map((v) => v.constraintId)).toContain('pi_hero');
  });
});

describe('Geometry judge — deterministic, evidence-bearing findings (KT-057..059)', () => {
  it('scores a clean design 100 with no findings', () => {
    const audit = auditGeometry(makeLayers(), CANVAS);
    expect(audit.findings.map((f) => f.issue)).toEqual([]);
    expect(audit.score).toBe(100);
  });

  it('flags overflow, safe-zone breach and text collisions WITH evidence + repair ops', () => {
    const layers = makeLayers();
    (layers.find((l) => l.id === 'sub') as any).y = 220;                      // collides with headline
    (layers.find((l) => l.id === 'cta') as any).x = 20;                        // critical label in the 54px safe zone
    (layers.find((l) => l.id === 'blob1') as any).x = 1030;                    // hangs off the right edge
    const audit = auditGeometry(layers, CANVAS);
    const issues = audit.findings.map((f) => f.issue);

    expect(issues).toContain('safe_zone_violation');
    expect(issues).toContain('text_overlap');
    expect(issues).toContain('out_of_bounds');
    // Judge contract: no bare complaints — every finding proves itself and proposes.
    for (const f of audit.findings) {
      expect(f.evidence.length).toBeGreaterThan(0);
      expect(f.region.width).toBeGreaterThan(0);
      expect(f.repair).toBeDefined();
    }
    // Findings come sorted worst-first for the repair batch.
    for (let i = 1; i < audit.findings.length; i++) {
      expect(audit.findings[i - 1].severity).toBeGreaterThanOrEqual(audit.findings[i].severity);
    }
    expect(audit.score).toBeLessThan(100);
  });

  it('does NOT propose fixes for intentional compositions or region breaks', () => {
    // A CTA button shape carrying its label is deliberate design — the label
    // stack (headline → sub) and the footer CTA are separate layout regions.
    const layers = makeLayers().filter((l) => l.id !== 'cta');
    layers.push(
      base({ id: 'cta_btn', type: 'rectangle', name: 'Shop button', x: 420, y: 1090, width: 240, height: 60, color: '#f59e0b' } as any),
      base({ id: 'cta2', type: 'text', name: 'CTA label', text: 'SHOP', x: 460, y: 1100, width: 160, height: 40, fontSize: 22, color: '#0b1020' } as any),
    );
    const findings = auditGeometry(layers, CANVAS).findings;
    expect(findings.some((f) => f.issue === 'text_overlap')).toBe(false);
    // Headline stack → footer CTA gap is a layout region, not uneven rhythm.
    expect(findings.some((f) => f.issue === 'uneven_spacing')).toBe(false);
  });
});

describe('Repair engine — LLM proposes, compiler decides (KT-059/KT-061)', () => {
  const of = (layers: Layer[]) =>
    deriveDesignConstraints(buildDesignIntentGraph(layers, CANVAS), layers);

  it('accepts repairs that restore constraints and rejects ones that break them', () => {
    const layers = makeLayers();
    const constraints = of(layers);

    // Reject: pushing the headline out of the safe zone adds a violation.
    const rejected = runRepair(layers, [{ type: 'move', targetId: 'headline', dx: -160, dy: 0 }], CANVAS, constraints);
    expect(rejected.rejectedCount).toBe(1);
    expect((rejected.layers.find((l) => l.id === 'headline') as any).x).toBe(140);
    expect(rejected.log[0].reason).toMatch(/constraint violation/);

    // Accept: pulling an overflowing critical layer back into the safe zone
    // is a strict improvement (same op the geometry judge proposes).
    const broken = layers.map((l) =>
      l.id === 'cta' ? ({ ...l, x: 1000 } as Layer) : l
    );
    const accepted = runRepair(broken, [{ type: 'contain', targetId: 'cta', safeInset: 54 }], CANVAS, of(broken));
    expect(accepted.acceptedCount).toBe(1);
    expect(accepted.remainingViolations).toHaveLength(0);
  });

  it('a locked layer cannot be moved by any proposed operation', () => {
    const layers = makeLayers();
    (layers.find((l) => l.id === 'hero') as any).locked = true;
    const res = runRepair(
      layers,
      [{ type: 'move', targetId: 'hero', dx: 100, dy: 100 }, { type: 'scale', targetId: 'hero', factor: 0.8 }],
      CANVAS,
      of(layers)
    );
    expect(res.rejectedCount).toBe(2);
    expect(res.layers.find((l) => l.id === 'hero')).toEqual(layers.find((l) => l.id === 'hero'));
  });

  it('end-to-end: judge → repair fixes geometry without touching copy (KT-052/059)', () => {
    const layers = makeLayers();
    (layers.find((l) => l.id === 'sub') as any).y = 220; // collide with the headline
    (layers.find((l) => l.id === 'blob1') as any).x = 1030; // hang off-canvas

    const before = auditGeometry(layers, CANVAS);
    const ops = before.findings.map((f) => f.repair).filter(Boolean) as import('../../services/repairEngine').RepairOperation[];
    const res = runRepair(layers, ops, CANVAS, of(layers));
    const after = auditGeometry(res.layers, CANVAS);

    expect(after.score).toBeGreaterThan(before.score);
    expect(res.remainingViolations).toHaveLength(0);
    // Repaired, not regenerated: every text block is byte-identical copy-wise.
    for (const id of ['headline', 'sub', 'cta']) {
      expect((res.layers.find((l) => l.id === id) as any).text).toBe(
        (layers.find((l) => l.id === id) as any).text
      );
    }
    // Layer identities survive the repair batch.
    expect(res.layers.map((l) => l.id)).toEqual(layers.map((l) => l.id));
  });
});
