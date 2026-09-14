import { describe, it, expect } from 'vitest';
import {
  resolveChildConstraints,
  applyConstraints,
  inferConstraints,
} from '../../layout/constraints';
import { Layer } from '../../types';

const createLayer = (partial: Partial<Layer> = {}): Layer =>
  ({
    id: 'layer-1',
    type: 'rectangle',
    name: 'Layer 1',
    x: 20,
    y: 20,
    width: 60,
    height: 40,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    color: '#3b82f6',
    ...partial,
  } as Layer);

describe('Constraints Engine - resolveChildConstraints', () => {
  const parentPrev = { width: 100, height: 100 };
  const parentNext = { width: 200, height: 150 };

  it('preserves fixed left offset when horizontal constraint is "start"', () => {
    const child = createLayer({ x: 20, width: 60, constraints: { horizontal: 'start', vertical: 'start' } });
    const resolved = resolveChildConstraints(child, parentPrev, parentNext);
    expect(resolved.x).toBe(20);
    expect(resolved.width).toBe(60);
  });

  it('preserves fixed right offset when horizontal constraint is "end"', () => {
    // Child right edge was at 20 + 60 = 80 in parent of 100 => right margin = 20
    const child = createLayer({ x: 20, width: 60, constraints: { horizontal: 'end', vertical: 'start' } });
    const resolved = resolveChildConstraints(child, parentPrev, parentNext);
    // In next parent (width: 200), right margin should remain 20 => x = 200 - 20 - 60 = 120
    expect(resolved.x).toBe(120);
    expect(resolved.width).toBe(60);
  });

  it('maintains center alignment when horizontal constraint is "center"', () => {
    // Parent was 100, center was 50. Child center was 20 + 30 = 50.
    const child = createLayer({ x: 20, width: 60, constraints: { horizontal: 'center', vertical: 'start' } });
    const resolved = resolveChildConstraints(child, parentPrev, parentNext);
    // New parent width 200, new center 100. Child center should be 100 => x = 100 - 30 = 70.
    expect(resolved.x).toBe(70);
    expect(resolved.width).toBe(60);
  });

  it('stretches width when horizontal constraint is "both"', () => {
    // Left margin 20, right margin 20
    const child = createLayer({ x: 20, width: 60, constraints: { horizontal: 'both', vertical: 'start' } });
    const resolved = resolveChildConstraints(child, parentPrev, parentNext);
    // Next parent width 200 => width = 200 - 20 - 20 = 160
    expect(resolved.x).toBe(20);
    expect(resolved.width).toBe(160);
  });

  it('scales position and width proportionally when horizontal constraint is "scale"', () => {
    // Parent scaled 2x (100 -> 200)
    const child = createLayer({ x: 20, width: 60, constraints: { horizontal: 'scale', vertical: 'start' } });
    const resolved = resolveChildConstraints(child, parentPrev, parentNext);
    expect(resolved.x).toBe(40);
    expect(resolved.width).toBe(120);
  });

  it('stretches height when vertical constraint is "both"', () => {
    // Top margin 20, bottom margin 100 - (20 + 40) = 40.
    const child = createLayer({ y: 20, height: 40, constraints: { horizontal: 'start', vertical: 'both' } });
    const resolved = resolveChildConstraints(child, parentPrev, parentNext);
    // Next parent height 150 => height = 150 - 20 - 40 = 90
    expect(resolved.y).toBe(20);
    expect(resolved.height).toBe(90);
  });

  it('preserves fixed bottom offset when vertical constraint is "end"', () => {
    // Bottom margin = 100 - 60 = 40
    const child = createLayer({ y: 20, height: 40, constraints: { horizontal: 'start', vertical: 'end' } });
    const resolved = resolveChildConstraints(child, parentPrev, parentNext);
    // In next parent height 150 => y = 150 - 40 - 40 = 70
    expect(resolved.y).toBe(70);
    expect(resolved.height).toBe(40);
  });
});

describe('Constraints Engine - applyConstraints batch', () => {
  it('returns unchanged list if parent dimensions did not change', () => {
    const layers = [createLayer({ id: 'c1' }), createLayer({ id: 'c2' })];
    const unchanged = applyConstraints({ width: 100, height: 100 }, { width: 100, height: 100 }, layers);
    expect(unchanged).toBe(layers);
  });

  it('applies constraints across all children in parent', () => {
    const c1 = createLayer({ id: 'c1', x: 10, width: 20, constraints: { horizontal: 'start', vertical: 'start' } });
    const c2 = createLayer({ id: 'c2', x: 70, width: 20, constraints: { horizontal: 'end', vertical: 'start' } });
    const updated = applyConstraints({ width: 100, height: 100 }, { width: 200, height: 100 }, [c1, c2]);
    expect(updated[0].x).toBe(10);
    expect(updated[1].x).toBe(170); // 200 - 10 - 20 = 170
  });
});

describe('Constraints Engine - inferConstraints', () => {
  it('infers "center" when element is centered horizontally', () => {
    const inferred = inferConstraints({ x: 25, y: 10, width: 50, height: 20 }, { width: 100, height: 100 });
    expect(inferred.horizontal).toBe('center');
  });

  it('infers "both" (stretch) when element spans most of parent width', () => {
    const inferred = inferConstraints({ x: 5, y: 10, width: 90, height: 20 }, { width: 100, height: 100 });
    expect(inferred.horizontal).toBe('both');
  });

  it('infers "end" when anchored closer to right/bottom', () => {
    const inferred = inferConstraints({ x: 80, y: 80, width: 15, height: 15 }, { width: 100, height: 100 });
    expect(inferred.horizontal).toBe('end');
    expect(inferred.vertical).toBe('end');
  });
});
