/**
 * ============================================
 * REPAIR ENGINE — "LLM proposes. Compiler decides."
 * ============================================
 * Judges (geometry audit, VLM critic) never mutate the canvas directly.
 * They emit RepairOperations; this engine executes them deterministically
 * and accepts each one ONLY if the Design Constraint Graph stays satisfied
 * after execution (plus the final solveDesignLayers gate). A repair that
 * breaks text fidelity, safe zones, hierarchy dominance or a protected
 * layer is rejected and logged — this is the anti-"trust me bro" boundary
 * the research calls the core of a design compiler.
 */
import { Layer } from '../types';
import { log } from '../utils/log';
import { solveDesignLayers } from '../utils/designSolver';
import {
  DesignConstraint,
  ConstraintViolation,
  validateDesignConstraints,
} from './designIntentGraph';

export type RepairOperation =
  | { type: 'align'; axis: 'left' | 'center-x' | 'right'; targetIds: string[]; referenceId?: string }
  | { type: 'contain'; targetId: string; safeInset?: number }
  | { type: 'move'; targetId: string; dx: number; dy: number }
  | { type: 'scale'; targetId: string; factor: number; alsoFontSize?: boolean }
  | { type: 'unify_spacing'; targetIds: string[] }
  | { type: 'separate'; targetId: string; awayFromId: string; minGap: number };

export interface RepairLogEntry {
  operation: RepairOperation;
  accepted: boolean;
  reason: string;
}

export interface RepairResult {
  layers: Layer[];
  log: RepairLogEntry[];
  acceptedCount: number;
  rejectedCount: number;
  remainingViolations: ConstraintViolation[];
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** Execute one operation on a working copy. Pure per-call. */
function execute(layers: Layer[], op: RepairOperation, canvas: { width: number; height: number }): Layer[] {
  const out = layers.map((l) => ({ ...l }) as Layer);
  const byId = new Map(out.map((l) => [l.id, l]));

  switch (op.type) {
    case 'align': {
      const targets = op.targetIds.map((id) => byId.get(id)).filter(Boolean) as any[];
      const reference = op.referenceId ? (byId.get(op.referenceId) as any) : undefined;
      if (reference) {
        const anchor =
          op.axis === 'left' ? reference.x
            : op.axis === 'right' ? reference.x + reference.width
              : reference.x + reference.width / 2;
        for (const t of targets) {
          if (t.id === reference.id) continue;
          t.x = op.axis === 'left' ? anchor
            : op.axis === 'right' ? anchor - t.width
              : anchor - t.width / 2;
        }
      } else if (targets.length) {
        // Self-consensus: pull to the median of the chosen axis.
        const vals = targets.map((t) =>
          op.axis === 'left' ? t.x : op.axis === 'right' ? t.x + t.width : t.x + t.width / 2
        ).sort((a, b) => a - b);
        const median = vals[Math.floor(vals.length / 2)];
        for (const t of targets) {
          t.x = op.axis === 'left' ? median
            : op.axis === 'right' ? median - t.width
              : median - t.width / 2;
        }
      }
      break;
    }
    case 'contain': {
      const t = byId.get(op.targetId) as any;
      if (t) {
        const inset = op.safeInset ?? 0;
        t.width = Math.min(t.width, Math.max(8, canvas.width - inset * 2));
        t.height = Math.min(t.height, Math.max(8, canvas.height - inset * 2));
        t.x = clamp(t.x, inset, Math.max(inset, canvas.width - inset - t.width));
        t.y = clamp(t.y, inset, Math.max(inset, canvas.height - inset - t.height));
      }
      break;
    }
    case 'move': {
      const t = byId.get(op.targetId) as any;
      if (t) {
        t.x = t.x + op.dx;
        t.y = t.y + op.dy;
      }
      break;
    }
    case 'scale': {
      const t = byId.get(op.targetId) as any;
      if (t) {
        const cx = t.x + t.width / 2;
        const cy = t.y + t.height / 2;
        t.width = clamp(t.width * op.factor, 8, canvas.width);
        t.height = clamp(t.height * op.factor, 8, canvas.height);
        t.x = Math.round(cx - t.width / 2);
        t.y = Math.round(cy - t.height / 2);
        if (op.alsoFontSize && typeof t.fontSize === 'number') {
          t.fontSize = clamp(Math.round(t.fontSize * op.factor), 6, 1000);
        }
      }
      break;
    }
    case 'unify_spacing': {
      const targets = op.targetIds
        .map((id) => byId.get(id) as any)
        .filter(Boolean)
        .sort((a, b) => a.y - b.y);
      if (targets.length >= 3) {
        const contentH = targets.reduce((acc, t) => acc + t.height, 0);
        const span = targets[targets.length - 1].y + targets[targets.length - 1].height - targets[0].y;
        const gap = Math.max(8, (span - contentH) / (targets.length - 1));
        let y = targets[0].y;
        for (const t of targets) {
          t.y = Math.round(y);
          y += t.height + gap;
        }
      }
      break;
    }
    case 'separate': {
      const t = byId.get(op.targetId) as any;
      const a = byId.get(op.awayFromId) as any;
      if (t && a) {
        // Edge-to-edge semantics: remove the collision depth entirely, then
        // add minGap of clearance along the dominant displacement axis.
        const ox = Math.min(t.x + t.width, a.x + a.width) - Math.max(t.x, a.x);
        const oy = Math.min(t.y + t.height, a.y + a.height) - Math.max(t.y, a.y);
        const dx = t.x + t.width / 2 - (a.x + a.width / 2);
        const dy = t.y + t.height / 2 - (a.y + a.height / 2);
        if (Math.abs(dx) >= Math.abs(dy)) {
          if (ox > 0) t.x += (dx >= 0 ? 1 : -1) * (ox + op.minGap);
        } else if (oy > 0) {
          t.y += (dy >= 0 ? 1 : -1) * (oy + op.minGap);
        }
      }
      break;
    }
  }
  return out;
}

/**
 * Run a batch of proposed repairs. Each operation is applied to a candidate
 * copy and validated against the constraint graph; violations introduced by
 * an op → rejection, the design keeps the last accepted state. The solver is
 * the FINAL gate, and even the solver can be rejected if its clamps would
 * break a constraint (the constraint graph outranks the grid).
 */
export function runRepair(
  inputLayers: Layer[],
  operations: RepairOperation[],
  canvas: { width: number; height: number },
  constraints: DesignConstraint[]
): RepairResult {
  const entries: RepairLogEntry[] = [];
  let current = inputLayers.map((l) => ({ ...l }) as Layer);
  let baselineViolations = validateDesignConstraints(current, constraints, canvas).length;
  let accepted = 0;
  let rejected = 0;

  // Highest-severity-first ordering is the caller's job; we execute in order.
  for (const op of operations) {
    try {
      const candidate = execute(current, op, canvas);
      const after = validateDesignConstraints(candidate, constraints, canvas).length;
      if (after > baselineViolations) {
        entries.push({ operation: op, accepted: false, reason: `would introduce ${after - baselineViolations} constraint violation(s)` });
        rejected++;
        continue;
      }
      current = candidate;
      baselineViolations = after;
      entries.push({ operation: op, accepted: true, reason: 'constraint graph satisfied' });
      accepted++;
    } catch (err) {
      entries.push({ operation: op, accepted: false, reason: String(err) });
      rejected++;
    }
  }

  // Deterministic craft gate — but never at the cost of a constraint.
  try {
    const solved = solveDesignLayers(current, canvas);
    const solvedViolations = validateDesignConstraints(solved.layers, constraints, canvas).length;
    if (solvedViolations <= baselineViolations) {
      current = solved.layers;
    } else {
      log.warn('[RepairEngine] Solver output rejected (would break constraints); keeping repaired state');
    }
  } catch (err) {
    log.warn('[RepairEngine] Solver gate failed', String(err));
  }

  return {
    layers: current,
    log: entries,
    acceptedCount: accepted,
    rejectedCount: rejected,
    remainingViolations: validateDesignConstraints(current, constraints, canvas),
  };
}
