import { describe, it, expect } from 'vitest';
import {
  IMAGE_GEN_MODELS,
  getImageModel,
  supportsVectorTrace,
  getVectorTraceFallbackModel,
} from '../../config/imageModels';

describe('Phase 1.3 capability-routed second vector path', () => {
  it('every model advertises the rasterToVector capability explicitly (no undefined)', () => {
    for (const m of IMAGE_GEN_MODELS) {
      expect(typeof m.capabilities.rasterToVector).toBe('boolean');
    }
  });

  it('recraft-vector and recraft-v3-svg are the native-SVG models', () => {
    const svgModels = IMAGE_GEN_MODELS.filter((m) => m.capabilities.svg);
    expect(svgModels.map((m) => m.id).sort()).toEqual(['recraft-v3-svg', 'recraft-vector'].sort());
  });

  it('marks flat/graphic models as trace-promotable but NOT photographic ones', () => {
    expect(supportsVectorTrace('recraft-v4')).toBe(true);
    expect(supportsVectorTrace('ideogram-v3')).toBe(true);
    // Negative control: a realism model must NOT be vector-traceable — a trace of a
    // photo is node-bloat garbage, so the routing must refuse it.
    expect(supportsVectorTrace('flux-dev')).toBe(false);
    expect(supportsVectorTrace('nano-banana-pro')).toBe(false);
    expect(supportsVectorTrace('does-not-exist')).toBe(false);
  });

  it('prefers Recraft V4 as the first raster->trace fallback', () => {
    expect(getVectorTraceFallbackModel()?.id).toBe('recraft-v4');
  });

  it('skips already-tried models when choosing the fallback (never loops back)', () => {
    expect(getVectorTraceFallbackModel(['recraft-v4'])?.id).toBe('ideogram-v4');
    const next = getVectorTraceFallbackModel(['recraft-v4', 'ideogram-v4']);
    expect(next?.id).toBe('ideogram-v3');
    // The chosen fallback must itself be trace-capable.
    expect(supportsVectorTrace(next?.id)).toBe(true);
  });

  it('returns a fallback whose endpoint is real (so the second path can actually run)', () => {
    const fb = getVectorTraceFallbackModel();
    expect(fb).toBeDefined();
    expect(fb?.falEndpoint).toMatch(/^https:\/\//);
    expect(getImageModel(fb!.id)).toBe(fb);
  });
});
