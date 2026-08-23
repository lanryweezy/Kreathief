import { describe, it, expect } from 'vitest';
import { applyPaletteToArtboard, ExtractedPalette } from '../../../utils/color/paletteExtractor';
import { Artboard } from '../../../types';

describe('Palette Extractor & Auto-Recolor Engine', () => {
  const samplePalette: ExtractedPalette = {
    dominant: '#7d2ae8',
    vibrant: '#9333ea',
    muted: '#64748b',
    dark: '#0f172a',
    light: '#f8fafc',
    allColors: ['#7d2ae8', '#9333ea', '#64748b', '#0f172a', '#f8fafc'],
  };

  it('generates proper recolor updates for text and shape layers while preserving images', () => {
    const artboard: Artboard = {
      id: 'ab-1',
      name: 'Design',
      x: 0,
      y: 0,
      width: 1080,
      height: 1080,
      layers: [
        {
          id: 'text-1',
          type: 'text',
          text: 'Hello World',
          x: 0,
          y: 0,
          width: 200,
          height: 50,
          rotation: 0,
          opacity: 1,
        } as any,
        {
          id: 'rect-1',
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 300,
          height: 200,
          rotation: 0,
          opacity: 1,
        } as any,
        {
          id: 'img-1',
          type: 'image',
          src: 'https://example.com/photo.jpg',
          x: 0,
          y: 0,
          width: 400,
          height: 400,
          rotation: 0,
          opacity: 1,
        } as any,
      ],
    };

    const updates = applyPaletteToArtboard(artboard, samplePalette);

    // Should update text-1 and rect-1, but skip img-1
    expect(updates.length).toBe(2);
    expect(updates.find((u) => u.id === 'text-1')?.color).toBe(samplePalette.light);
    expect(updates.find((u) => u.id === 'rect-1')?.color).toBe(samplePalette.dominant);
    expect(updates.find((u) => u.id === 'img-1')).toBeUndefined();
  });
});
