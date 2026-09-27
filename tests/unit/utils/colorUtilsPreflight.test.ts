import { describe, it, expect } from 'vitest';
import {
  rgbToCMYK,
  rgbToCMYKCoated,
  estimateInkCoverage,
  getInkCoverageWarning,
} from '../../../utils/colorUtils';

/**
 * Print-preflight ink-coverage helpers (Phase 1.1).
 *
 * These are on-screen preflight only — the shipped PDF separation is done by
 * Sharp in api/export-cmyk.ts. So the bar here is: correct math + honest TAC
 * budgeting, NOT claiming to replace a color-managed RIP.
 */
describe('estimateInkCoverage', () => {
  it('sums the four separations', () => {
    expect(estimateInkCoverage({ c: 0, m: 0, y: 0, k: 100 })).toBe(100);
    expect(estimateInkCoverage({ c: 100, m: 100, y: 100, k: 100 })).toBe(400);
    expect(estimateInkCoverage({ c: 0, m: 0, y: 0, k: 0 })).toBe(0);
  });

  it('ignores negative components (defensive)', () => {
    expect(estimateInkCoverage({ c: -5, m: 10, y: 10, k: 10 })).toBe(30);
  });
});

describe('getInkCoverageWarning', () => {
  it('classifies by coated-paper thresholds', () => {
    expect(getInkCoverageWarning(200)).toBeNull();
    expect(getInkCoverageWarning(270)).toBeNull();
    expect(getInkCoverageWarning(280)).toBe('warning');
    expect(getInkCoverageWarning(300)).toBe('warning');
    expect(getInkCoverageWarning(301)).toBe('critical');
    expect(getInkCoverageWarning(360)).toBe('critical');
  });
});

describe('rgbToCMYKCoated', () => {
  it('matches the standard model when already within the TAC budget', () => {
    const cases: Array<[number, number, number]> = [
      [255, 255, 255],
      [0, 0, 0],
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [0, 255, 255],
      [255, 0, 255],
      [255, 255, 0],
      [128, 128, 128],
    ];
    for (const [r, g, b] of cases) {
      // Default maxTac=300 keeps these primaries/neutrals unchanged.
      expect(rgbToCMYKCoated(r, g, b)).toEqual(rgbToCMYK(r, g, b));
    }
  });

  it('enforces the TAC budget by shedding chroma, never black', () => {
    // A dense teal whose naive coverage is 153 (C100 K53).
    const naive = rgbToCMYK(0, 120, 120);
    expect(estimateInkCoverage(naive)).toBeGreaterThan(100);

    const capped = rgbToCMYKCoated(0, 120, 120, 100); // force 100% budget
    expect(estimateInkCoverage(capped)).toBeLessThanOrEqual(100);
    // Black is preserved; only CMY is reduced.
    expect(capped.k).toBe(naive.k);
    expect(capped.c).toBeLessThan(naive.c);
  });

  it('returns all-zero for white and pure black for black', () => {
    expect(rgbToCMYKCoated(255, 255, 255)).toEqual({ c: 0, m: 0, y: 0, k: 0 });
    expect(rgbToCMYKCoated(0, 0, 0)).toEqual({ c: 0, m: 0, y: 0, k: 100 });
  });

  it('never produces out-of-range components', () => {
    for (let r = 0; r <= 255; r += 51) {
      for (let g = 0; g <= 255; g += 51) {
        for (let b = 0; b <= 255; b += 51) {
          const cmyk = rgbToCMYKCoated(r, g, b, 240);
          for (const v of [cmyk.c, cmyk.m, cmyk.y, cmyk.k]) {
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(100);
          }
          expect(estimateInkCoverage(cmyk)).toBeLessThanOrEqual(240);
        }
      }
    }
  });
});
