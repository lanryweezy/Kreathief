import { describe, it, expect } from 'vitest';
import {
  TEXTURE_DEFINITIONS,
  ALL_TEXTURE_DEFINITIONS,
  getTextureById,
  createTextureOverlayConfig,
} from '../../services/textureOverlayEngine';

describe('TextureOverlayEngine', () => {
  it('should contain all 10 signature procedural textures', () => {
    expect(ALL_TEXTURE_DEFINITIONS).toHaveLength(10);
    expect(Object.keys(TEXTURE_DEFINITIONS)).toHaveLength(10);
  });

  it('should have valid IDs and SVG generation for all textures', () => {
    const expectedIds = [
      'paperGrain',
      'risoHalftone',
      'grungeScratches',
      'filmGrain',
      'holographicFoil',
      'canvasWeave',
      'blueprintGrid',
      'marbledAcid',
      'dustSpecks',
      'goldFoilTexture',
    ];

    expectedIds.forEach((id) => {
      const def = getTextureById(id);
      expect(def).toBeDefined();
      expect(def?.id).toBe(id);
      expect(def?.name).toBeTruthy();
      expect(def?.description).toBeTruthy();
      expect(def?.defaultBlendMode).toBeTruthy();
      expect(def?.defaultOpacity).toBeGreaterThan(0);

      const uri = def!.generateSvgUri();
      expect(uri).toContain('data:image/svg+xml');
      expect(uri).toContain('%3Csvg');
    });
  });

  it('should create an Artboard TextureOverlayConfig with customized options', () => {
    const config = createTextureOverlayConfig('paperGrain', {
      opacity: 0.6,
      blendMode: 'overlay',
      scale: 1.5,
      invert: true,
    });

    expect(config).toBeDefined();
    expect(config?.id).toBe('paperGrain');
    expect(config?.name).toBe('Vintage Paper Grain');
    expect(config?.opacity).toBe(0.6);
    expect(config?.blendMode).toBe('overlay');
    expect(config?.scale).toBe(1.5);
    expect(config?.invert).toBe(true);
    expect(config?.svgDataUri).toContain('data:image/svg+xml');
  });

  it('should return null for non-existent texture', () => {
    const config = createTextureOverlayConfig('unknownTextureId');
    expect(config).toBeNull();
  });
});
