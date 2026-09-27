import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiActionRegistry } from '../../components/ContextMenu';

describe('ContextMenu AI Action Registry & SVG Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('contains registered ai actions including lint-fix, auto-layout, remove-bg', () => {
    expect(aiActionRegistry.has('lint-fix')).toBe(true);
    expect(aiActionRegistry.has('auto-layout')).toBe(true);
    expect(aiActionRegistry.has('remove-bg')).toBe(true);
    expect(aiActionRegistry.has('extract-colors')).toBe(true);
  });

  it('executes lint-fix action and applies auto-fix for contrast/alignment issues', () => {
    const lintAction = aiActionRegistry.get('lint-fix');
    expect(lintAction).toBeDefined();

    const mockUpdateLayer = vi.fn();
    const mockAddToast = vi.fn();

    const mockStore = {
      activeArtboardId: 'ab_1',
      artboards: [
        {
          id: 'ab_1',
          width: 1080,
          height: 1080,
          backgroundColor: '#000000',
          layers: [
            {
              id: 'layer_dark_text',
              type: 'text',
              x: 100,
              y: 100,
              width: 300,
              height: 60,
              text: 'Low Contrast Headline',
              color: '#111111', // Almost black on black -> WCAG failure
              fontSize: 32,
            },
          ],
        },
      ],
      updateLayer: mockUpdateLayer,
      addToast: mockAddToast,
    };

    lintAction?.execute(
      'layer_dark_text',
      mockStore.artboards[0].layers[0],
      mockStore
    );

    expect(mockUpdateLayer).toHaveBeenCalledWith(
      'layer_dark_text',
      expect.objectContaining({ color: '#ffffff' })
    );
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.stringContaining('Applied 1 design & contrast auto-fix'),
      'success'
    );
  });

  it('reports 100/100 score when layer has no lint issues', () => {
    const lintAction = aiActionRegistry.get('lint-fix');
    const mockUpdateLayer = vi.fn();
    const mockAddToast = vi.fn();

    const mockStore = {
      activeArtboardId: 'ab_1',
      artboards: [
        {
          id: 'ab_1',
          width: 1080,
          height: 1080,
          backgroundColor: '#000000',
          layers: [
            {
              id: 'layer_clean',
              type: 'text',
              x: 200,
              y: 200,
              width: 300,
              height: 60,
              text: 'Accessible Text',
              color: '#ffffff', // High contrast white on black
              fontSize: 32,
            },
          ],
        },
      ],
      updateLayer: mockUpdateLayer,
      addToast: mockAddToast,
    };

    lintAction?.execute(
      'layer_clean',
      mockStore.artboards[0].layers[0],
      mockStore
    );

    expect(mockUpdateLayer).not.toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.stringContaining('passes all design & accessibility checks'),
      'success'
    );
  });
});
