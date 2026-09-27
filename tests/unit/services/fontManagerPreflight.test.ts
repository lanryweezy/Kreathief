import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fontManager } from '../../../services/fontManager';
import { TextLayer } from '../../../types';

describe('FontManager Preflight Loading Service', () => {
  beforeEach(() => {
    fontManager.reset();
  });

  it('skips loading for web-safe fonts like Arial', async () => {
    const layer: TextLayer = {
      id: 't-1',
      type: 'text',
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      text: 'Web Safe Test',
      fontFamily: 'Arial',
      fontSize: 16,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    };

    // Should resolve immediately without throwing or DOM injection
    await expect(fontManager.loadFontsForLayers([layer])).resolves.toBeUndefined();
  });

  it('handles custom Google Fonts preflight gracefully', async () => {
    const layer: TextLayer = {
      id: 't-2',
      type: 'text',
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      text: 'Google Font Test',
      fontFamily: 'Syne',
      fontSize: 24,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    };

    await expect(fontManager.loadFontsForLayers([layer], 100)).resolves.toBeUndefined();
  });
});
