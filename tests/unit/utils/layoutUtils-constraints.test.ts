import { describe, it, expect } from 'vitest';
import { resolveConstraints, resolveSemanticConstraints } from '../../../utils/layoutUtils';

describe('resolveConstraints', () => {
  const canvasSize = { width: 800, height: 600 };

  it('provides default fallback constraints when not specified', () => {
    const layer = {};
    const result = resolveConstraints(layer, canvasSize);

    expect(result).toEqual({ x: 20, y: 20 });
  });

  it('resolves scale constraints to fill the full canvas dimensions', () => {
    const layer = { constraints: { horizontal: 'scale', vertical: 'scale' } as any };
    const result = resolveConstraints(layer, canvasSize);

    expect(result).toEqual({ x: 0, y: 0, width: 800, height: 600 });
  });

  it('resolves horizontal constraints correctly (center, start, end)', () => {
    expect(resolveConstraints({ width: 100, constraints: { horizontal: 'center', vertical: 'start' } } as any, canvasSize).x).toBe(350);
    expect(resolveConstraints({ width: 100, constraints: { horizontal: 'start', vertical: 'start' } } as any, canvasSize).x).toBe(20);
    expect(resolveConstraints({ width: 100, constraints: { horizontal: 'end', vertical: 'start' } } as any, canvasSize).x).toBe(680);
  });

  it('resolves vertical constraints correctly (center, start, end)', () => {
    expect(resolveConstraints({ height: 100, constraints: { horizontal: 'start', vertical: 'center' } } as any, canvasSize).y).toBe(250);
    expect(resolveConstraints({ height: 100, constraints: { horizontal: 'start', vertical: 'start' } } as any, canvasSize).y).toBe(20);
    expect(resolveConstraints({ height: 100, constraints: { horizontal: 'start', vertical: 'end' } } as any, canvasSize).y).toBe(480);
  });
});

describe('resolveSemanticConstraints', () => {
  it('returns default start/start constraints when array is empty', () => {
    const result = resolveSemanticConstraints([]);
    expect(result).toEqual({ horizontal: 'start', vertical: 'start' });
  });

  it('maps horizontal semantic terms correctly', () => {
    expect(resolveSemanticConstraints(['center-h']).horizontal).toBe('center');
    expect(resolveSemanticConstraints(['pin-right']).horizontal).toBe('end');
    expect(resolveSemanticConstraints(['fill']).horizontal).toBe('scale');
  });

  it('maps vertical semantic terms correctly', () => {
    expect(resolveSemanticConstraints(['center-v']).vertical).toBe('center');
    expect(resolveSemanticConstraints(['pin-bottom']).vertical).toBe('end');
    expect(resolveSemanticConstraints(['fill']).vertical).toBe('scale');
  });

  it('handles multiple constraints at the same time', () => {
    expect(resolveSemanticConstraints(['center-h', 'pin-bottom'])).toEqual({
      horizontal: 'center',
      vertical: 'end'
    });
    expect(resolveSemanticConstraints(['fill'])).toEqual({
      horizontal: 'scale',
      vertical: 'scale'
    });
  });
});
