/**
 * ============================================
 * GEOMETRY JUDGE — Judge 1 of the Kreathief judge stack
 * ============================================
 * Pure math, zero tokens. Answers the questions the research says a
 * screenshot-reading VLM answers badly: overlap, clipping, safe zones,
 * alignment, spacing coherence. Runs BEFORE the vision passes so the
 * expensive critic only judges what free determinism could not fix.
 *
 * Contract (research §5/§24): a judge never returns a bare score and never
 * mutates the design. Every finding carries EVIDENCE + LOCATION + a
 * proposed RepairOperation, which the Repair Engine validates against the
 * constraint graph before anything touches the canvas.
 */
import { Layer, SemanticLayerRole } from '../types';
import { RepairOperation } from '../services/repairEngine';
import { classifyLayerRole } from '../services/smartResizeEngine';

export interface GeometryFinding {
  /** Machine-readable issue code, e.g. "text_overlap". */
  issue:
    | 'out_of_bounds'
    | 'safe_zone_violation'
    | 'text_overlap'
    | 'misaligned_column'
    | 'uneven_spacing';
  /** 0..1 — ordering weight for the repair batch. */
  severity: number;
  /** Bounding box of the offending region on the canvas. */
  region: { x: number; y: number; width: number; height: number };
  targetIds: string[];
  /** Deterministic proof — why this finding exists. */
  evidence: string[];
  /** The proposed fix; executed (or rejected) by the Repair Engine. */
  repair?: RepairOperation;
}

export interface GeometryAudit {
  /** 0..100 — 100 is geometrically clean. */
  score: number;
  findings: GeometryFinding[];
}

type Tagged = Layer & { role: SemanticLayerRole };

const CRITICAL_ROLES: SemanticLayerRole[] = ['headline', 'cta_button', 'cta_label'];

function rectOf(layers: Layer[]): { x: number; y: number; width: number; height: number } {
  const x = Math.min(...layers.map((l) => l.x));
  const y = Math.min(...layers.map((l) => l.y));
  const x2 = Math.max(...layers.map((l) => l.x + l.width));
  const y2 = Math.max(...layers.map((l) => l.y + l.height));
  return { x: Math.round(x), y: Math.round(y), width: Math.round(x2 - x), height: Math.round(y2 - y) };
}

function horizontalOverlap(a: Layer, b: Layer): number {
  return Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
}

function verticalOverlap(a: Layer, b: Layer): number {
  return Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
}

function areaOverlap(a: Layer, b: Layer): number {
  return Math.max(0, horizontalOverlap(a, b)) * Math.max(0, verticalOverlap(a, b));
}

/**
 * Audit a layer set. `canvas` is the artboard the layers live on.
 * Findings are returned highest-severity first so the repair batch
 * fixes the worst structural damage before cosmetic alignment.
 */
export function auditGeometry(
  layers: Layer[],
  canvas: { width: number; height: number }
): GeometryAudit {
  const findings: GeometryFinding[] = [];
  const tagged: Tagged[] = layers.map((l) => ({
    ...l,
    role: classifyLayerRole(l, layers, canvas.width, canvas.height),
  })) as Tagged[];
  const byId = new Map(tagged.map((t) => [t.id, t]));
  const safe = Math.round(Math.min(canvas.width, canvas.height) * 0.05);

  // ── Check 1: clipping / out-of-bounds (background is intentionally full-bleed)
  for (const t of tagged) {
    if (t.role === 'background') continue;
    const overflowX = Math.max(0, -t.x, t.x + t.width - canvas.width);
    const overflowY = Math.max(0, -t.y, t.y + t.height - canvas.height);
    const overflow = Math.max(overflowX, overflowY);
    if (overflow > 1) {
      const ratio = overflow / Math.max(t.width, t.height, 1);
      findings.push({
        issue: 'out_of_bounds',
        severity: Math.min(1, 0.4 + ratio * 2),
        region: rectOf([t]),
        targetIds: [t.id],
        evidence: [
          `${t.role} "${t.name || t.id}" overflows canvas by ${Math.round(overflow)}px`,
          `overflow ratio ${(ratio * 100).toFixed(1)}%`,
        ],
        repair: { type: 'contain', targetId: t.id },
      });
    }
  }

  // ── Check 2: safe zone for primary-message / conversion elements
  for (const t of tagged) {
    if (!CRITICAL_ROLES.includes(t.role)) continue;
    if (findings.some((f) => f.issue === 'out_of_bounds' && f.targetIds[0] === t.id)) continue;
    const breach = Math.max(
      safe - t.x,
      safe - t.y,
      t.x + t.width - (canvas.width - safe),
      t.y + t.height - (canvas.height - safe)
    );
    if (breach > 1) {
      findings.push({
        issue: 'safe_zone_violation',
        severity: Math.min(1, 0.5 + (breach / safe) * 0.3),
        region: rectOf([t]),
        targetIds: [t.id],
        evidence: [
          `critical ${t.role} enters the ${safe}px safe zone by ${Math.round(breach)}px`,
          'story/UI chrome can cover this region',
        ],
        repair: { type: 'contain', targetId: t.id, safeInset: safe },
      });
    }
  }

  // ── Check 3: text ↔ text collisions (CTA button+label pairs are deliberate)
  const texts = tagged.filter((t) => t.type === 'text');
  const seenPairs = new Set<string>();
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i];
      const b = texts[j];
      const pairKey = `${a.id}|${b.id}`;
      if (seenPairs.has(pairKey)) continue;
      const intentional =
        (a.role === 'cta_button' && b.role === 'cta_label') ||
        (b.role === 'cta_button' && a.role === 'cta_label');
      if (intentional) continue;
      const ox = horizontalOverlap(a, b);
      const oy = verticalOverlap(a, b);
      if (ox <= 2 || oy <= 2) continue;
      const overlapRatio = areaOverlap(a, b) / Math.max(1, Math.min(a.width * a.height, b.width * b.height));
      if (overlapRatio < 0.05) continue;
      seenPairs.add(pairKey);
      // Push the smaller/lighter text block away from the heavier one.
      const area = (l: Layer) => l.width * l.height;
      const mover = a.role === 'headline' ? b : b.role === 'headline' ? a : area(a) <= area(b) ? a : b;
      const anchor = mover.id === a.id ? b : a;
      findings.push({
        issue: 'text_overlap',
        severity: Math.min(1, 0.6 + overlapRatio),
        region: rectOf([a, b]),
        targetIds: [mover.id, anchor.id],
        evidence: [
          `"${(a as any).text?.slice(0, 24)}" collides with "${(b as any).text?.slice(0, 24)}"`,
          `overlap covers ${(overlapRatio * 100).toFixed(0)}% of the smaller block`,
        ],
        repair: {
          type: 'separate',
          targetId: mover.id,
          awayFromId: anchor.id,
          // Edge clearance after the collision depth is removed.
          minGap: Math.max(12, Math.round(Math.min(canvas.width, canvas.height) * 0.015)),
        },
      });
    }
  }

  // ── Check 4: alignment coherence of the dominant text column
  if (texts.length >= 2) {
    const tol = Math.max(4, canvas.width * 0.01);
    const edges = texts.map((t) => ({ id: t.id, left: t.x }));
    // Cluster left edges; the biggest cluster defines the column axis.
    const clusters = new Map<number, string[]>();
    for (const e of edges) {
      const key = [...clusters.keys()].find((k) => Math.abs(k - e.left) <= tol);
      if (key === undefined) clusters.set(e.left, [e.id]);
      else clusters.get(key)!.push(e.id);
    }
    const [axisLeft, column] = [...clusters.entries()].sort(
      (a, b) => b[1].length - a[1].length
    )[0];
    const outliers = texts.filter((t) => !column.includes(t.id) && Math.abs(t.x - axisLeft) > tol);
    // Only report once per outlier vs the column reference.
    const reference = byId.get(column[0]);
    if (reference && outliers.length && column.length >= 2) {
      for (const o of outliers.slice(0, 3)) {
        findings.push({
          issue: 'misaligned_column',
          severity: 0.35,
          region: rectOf([o, reference]),
          targetIds: [o.id, reference.id],
          evidence: [
            `${o.role} left edge ${Math.round(o.x)}px deviates from column axis ${Math.round(axisLeft)}px`,
            `column of ${column.length} layer(s) shares this axis`,
          ],
          repair: { type: 'align', axis: 'left', targetIds: [o.id], referenceId: reference.id },
        });
      }
    }
  }

  // ── Check 5: uneven vertical rhythm inside a stacked column
  const columnTexts = texts
    .filter((t) => !findings.some((f) => f.issue === 'text_overlap' && f.targetIds.includes(t.id)))
    .sort((a, b) => a.y - b.y);
  if (columnTexts.length >= 3) {
    const gaps: number[] = [];
    for (let i = 1; i < columnTexts.length; i++) {
      const prev = columnTexts[i - 1];
      const cur = columnTexts[i];
      const gap = cur.y - (prev.y + prev.height);
      // Only chain gaps between horizontally-similar, NEARBY blocks — a gap
      // over 15% of the canvas is a layout-region break (headline stack vs
      // footer CTA), not uneven rhythm. Uniformizing across regions would
      // drag the CTA to the middle of the design.
      if (
        gap >= 0 &&
        gap <= canvas.height * 0.15 &&
        horizontalOverlap(prev as Layer, cur as Layer) > Math.min(prev.width, cur.width) * 0.4
      ) {
        gaps.push(gap);
      }
    }
    if (gaps.length >= 2) {
      const minGap = Math.min(...gaps);
      const maxGap = Math.max(...gaps);
      if (maxGap > Math.max(24, minGap * 2.2 + 12)) {
        const stack = columnTexts.map((t) => t.id);
        findings.push({
          issue: 'uneven_spacing',
          severity: 0.3,
          region: rectOf(columnTexts),
          targetIds: stack,
          evidence: [
            `vertical gaps range ${Math.round(minGap)}px → ${Math.round(maxGap)}px`,
            'rhythm ratio exceeds 2.2x',
          ],
          repair: { type: 'unify_spacing', targetIds: stack },
        });
      }
    }
  }

  // ── Score: 100 minus weighted penalties
  let score = 100;
  for (const f of findings) score -= f.severity * 20;
  score = Math.max(0, Math.round(score));

  findings.sort((a, b) => b.severity - a.severity);

  return { score, findings };
}
