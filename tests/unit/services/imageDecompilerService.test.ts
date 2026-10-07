import { describe, it, expect, vi } from 'vitest';
import {
  generateProceduralDecompileFallback,
  decompileFlatImageToArtboard,
  DecompiledDesign,
} from '../../../services/imageDecompilerService';

describe('Image Decompiler & Editable Graphic Extraction Engine', () => {
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  it('generates a valid procedural decompile fallback structure', () => {
    const fallback = generateProceduralDecompileFallback(sampleBase64);
    expect(fallback.name).toBeDefined();
    expect(fallback.width).toBe(1080);
    expect(fallback.height).toBe(1080);
    expect(fallback.elements.length).toBeGreaterThanOrEqual(4);

    const titleElement = fallback.elements.find((e) => e.type === 'text' && e.name.includes('Title'));
    expect(titleElement).toBeDefined();
    expect(titleElement?.text).toBe('YOUR EDITABLE HEADLINE');
  });

  it('decompiles a flat image into a complete multi-layer Artboard with editable text and shapes', async () => {
    const artboard = await decompileFlatImageToArtboard(sampleBase64, 1080, 1080, 'ab_decompiled_01');

    expect(artboard.id).toBe('ab_decompiled_01');
    expect(artboard.width).toBe(1080);
    expect(artboard.height).toBe(1080);
    expect(artboard.layers.length).toBeGreaterThan(3);

    // Background image layer check
    const bgLayer = artboard.layers[0];
    expect(bgLayer.type).toBe('image');
    expect(bgLayer.width).toBe(1080);
    expect(bgLayer.height).toBe(1080);

    // Editable text layers check
    const textLayers = artboard.layers.filter((l) => l.type === 'text');
    expect(textLayers.length).toBeGreaterThan(0);
    textLayers.forEach((t) => {
      expect((t as any).text).toBeDefined();
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.y).toBeGreaterThanOrEqual(0);
    });

    // Editable shape/button layers check
    const shapeLayers = artboard.layers.filter((l) => l.type === 'rectangle' || l.type === 'circle');
    expect(shapeLayers.length).toBeGreaterThan(0);
    shapeLayers.forEach((s) => {
      expect((s as any).color).toBeDefined();
    });
  });
});
