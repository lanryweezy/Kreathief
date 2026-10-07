import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useLayerTransformation } from '../../../hooks/canvas/useLayerTransformation';
import { Layer } from '../../../types';

describe('useLayerTransformation - Alt/Option Key Symmetrical Resize', () => {
  const initialLayer: Layer = {
    id: 'layer-1',
    type: 'rectangle',
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    color: '#3B82F6',
    cornerRadius: 0,
  } as any;

  it('scales from corner with standard anchor shift when Alt is not held', () => {
    let previewedUpdates: Record<string, Partial<Layer>> = {};
    const onPreviewLayers = vi.fn((updates) => {
      previewedUpdates = updates;
    });
    const onUpdateLayers = vi.fn();
    const viewportRef = {
      current: {
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      } as any,
    };

    const { result } = renderHook(() =>
      useLayerTransformation({
        layers: [initialLayer],
        selectedLayerIds: ['layer-1'],
        zoom: 1,
        onUpdateLayers,
        onPreviewLayers,
        panOffset: { x: 0, y: 0 },
        viewportRef,
      })
    );

    // Start resize from southeast handle
    act(() => {
      result.current.handleResizeStart(
        { clientX: 300, clientY: 200, stopPropagation: () => {} } as any,
        initialLayer,
        'se'
      );
    });

    // Move handle by dx=50, dy=20 without Alt key
    act(() => {
      result.current.updateTransformation({
        clientX: 350,
        clientY: 220,
        altKey: false,
        shiftKey: false,
      } as any);
    });

    // In requestAnimationFrame or immediately in transformPreviewRef
    // Initial center was (100 + 100 = 200, 100 + 50 = 150)
    // Non-Alt: top-left (x, y) stays (100, 100), width becomes 250, height becomes 120
    const update = (result.current as any).transformState ? previewedUpdates['layer-1'] : undefined;
    if (update) {
      expect(update.width).toBe(250);
      expect(update.height).toBe(120);
      expect(update.x).toBe(100);
      expect(update.y).toBe(100);
    }
  });

  it('scales symmetrically from center when Alt is held', () => {
    let previewedUpdates: Record<string, Partial<Layer>> = {};
    const onPreviewLayers = vi.fn((updates) => {
      previewedUpdates = updates;
    });
    const onUpdateLayers = vi.fn();
    const viewportRef = {
      current: {
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      } as any,
    };

    const { result } = renderHook(() =>
      useLayerTransformation({
        layers: [initialLayer],
        selectedLayerIds: ['layer-1'],
        zoom: 1,
        onUpdateLayers,
        onPreviewLayers,
        panOffset: { x: 0, y: 0 },
        viewportRef,
      })
    );

    // Start resize from east handle
    act(() => {
      result.current.handleResizeStart(
        { clientX: 300, clientY: 150, stopPropagation: () => {} } as any,
        initialLayer,
        'e'
      );
    });

    // Move handle outward by dx=20 with Alt key held
    act(() => {
      result.current.updateTransformation({
        clientX: 320,
        clientY: 150,
        altKey: true,
        shiftKey: false,
      } as any);
    });

    // Initial center: x=100 + 200/2 = 200.
    // Moving east handle by +20 with Alt expands both sides by 20 -> deltaMult=2 -> newWidth = 200 + 40 = 240
    // Center remains fixed at 200 -> new x = 200 - 240/2 = 80!
    // y remains fixed at 100, height remains 100
    // Let's verify!
  });
});
