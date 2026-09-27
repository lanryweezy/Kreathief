import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextWarpControls } from '../../components/canvas/TextWarpControls';
import { TextEffectsPanel } from '../../components/panels/TextEffectsPanel';
import { textWarpStrategies, TextWarpEngine } from '../../services/TextWarpEngine';
import { TextLayer } from '../../types';
import { useStore } from '../../store/useStore';

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}));

describe('TextWarpEngine & Bézier Strategies', () => {
  it('should have arc, bezier_custom, wave, arch strategies registered', () => {
    expect(textWarpStrategies.has('arc')).toBe(true);
    expect(textWarpStrategies.has('arch')).toBe(true);
    expect(textWarpStrategies.has('wave')).toBe(true);
    expect(textWarpStrategies.has('bezier_custom')).toBe(true);
  });

  it('should warp coordinates accurately using arc strategy', () => {
    const strategy = textWarpStrategies.get('arc');
    expect(strategy).toBeDefined();
    // At center nx = 0.5, 4 * 0.5 * 0.5 = 1.0 * magnitude
    const warped = strategy!.warp(100, 50, 0.5, 0.5, 20);
    expect(warped.x).toBe(100);
    expect(warped.y).toBe(30); // 50 - 20
  });

  it('should warp coordinates smoothly with bezier_custom strategy', () => {
    const strategy = textWarpStrategies.get('bezier_custom');
    expect(strategy).toBeDefined();
    const warpedCenter = strategy!.warp(150, 60, 0.5, 0.5, 30);
    expect(warpedCenter.x).toBe(150);
    expect(warpedCenter.y).toBe(30); // 60 - 30 * (1 - 0) = 30
  });
});

describe('TextWarpControls Component', () => {
  let mockUpdateLayer: ReturnType<typeof vi.fn>;
  let mockSaveToHistory: ReturnType<typeof vi.fn>;

  const baseTextLayer: TextLayer = {
    id: 'layer-text-test-1',
    type: 'text',
    name: 'Warp Text',
    text: 'KREATHIEF 3D',
    x: 50,
    y: 50,
    width: 300,
    height: 80,
    fontSize: 40,
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center',
    color: '#ffffff',
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 1,
    letterSpacing: 0,
    lineHeight: 1.2,
    textTransform: 'none',
    warpStyle: 'arc',
    curve: 40,
  };

  beforeEach(() => {
    mockUpdateLayer = vi.fn();
    mockSaveToHistory = vi.fn();
    (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const state = {
        updateLayer: mockUpdateLayer,
        saveToHistory: mockSaveToHistory,
      };
      return selector(state);
    });
  });

  it('renders interactive Bézier diamond handle and tangent rails for Arc warp', () => {
    render(<TextWarpControls layer={baseTextLayer} zoom={1} />);

    const arcHandle = screen.getByTestId('bezier-handle-arc');
    expect(arcHandle).toBeInTheDocument();
    expect(arcHandle).toHaveAttribute('data-testid', 'bezier-handle-arc');
    expect(screen.getByText(/Bézier Arc: \+40°/i)).toBeInTheDocument();
  });

  it('renders wave Bézier handle for Wave warp', () => {
    const waveLayer: TextLayer = {
      ...baseTextLayer,
      warpStyle: 'wave',
      curve: 25,
    };

    render(<TextWarpControls layer={waveLayer} zoom={1} />);

    const waveHandle = screen.getByTestId('bezier-handle-wave');
    expect(waveHandle).toBeInTheDocument();
    expect(screen.getByText(/Wave Amplitude: 25px/i)).toBeInTheDocument();
  });

  it('renders 3D Orbit Gizmo when 3D extrusion or perspective is active', () => {
    const layer3D: TextLayer = {
      ...baseTextLayer,
      warpStyle: 'perspective',
      warpParams: {
        rotateX: 15,
        rotateY: -20,
        perspective: 800,
        is3dExtrusion: true,
        depth3d: 14,
      },
    };

    render(<TextWarpControls layer={layer3D} zoom={1.5} />);

    const gizmo = screen.getByTestId('3d-orbit-gizmo');
    expect(gizmo).toBeInTheDocument();
    expect(screen.getByText(/3D Orbit: X:15° Y:-20°/i)).toBeInTheDocument();
  });

  it('handles pointer down and drag on Bézier handle with zoom scaling', () => {
    render(<TextWarpControls layer={baseTextLayer} zoom={2} />);

    const arcHandle = screen.getByTestId('bezier-handle-arc');

    // Simulate pointer down
    fireEvent.pointerDown(arcHandle, {
      clientX: 200,
      clientY: 100,
      pointerId: 1,
    });

    expect(mockSaveToHistory).toHaveBeenCalled();

    // Simulate dragging upward (dy = -40 in screen coords => -20 in canvas coords with zoom=2)
    fireEvent.pointerMove(arcHandle, {
      clientX: 200,
      clientY: 60,
      pointerId: 1,
    });

    expect(mockUpdateLayer).toHaveBeenCalledWith(
      'layer-text-test-1',
      expect.objectContaining({
        curve: expect.any(Number),
      })
    );
  });
});

describe('TextEffectsPanel 3D & Bézier Studio UI', () => {
  it('allows toggling on-canvas Bézier edit mode', () => {
    const handleChange = vi.fn();
    render(
      <TextEffectsPanel
        effects={{
          warpStyle: 'arc',
          isWarpEditing: false,
        }}
        onChange={handleChange}
      />
    );

    const toggleBtn = screen.getByTestId('toggle-canvas-warp-editing');
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveTextContent('Enable');

    fireEvent.click(toggleBtn);
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        isWarpEditing: true,
      })
    );
  });

  it('allows enabling 3D Extrusion studio and adjusting depth', () => {
    const handleChange = vi.fn();
    render(
      <TextEffectsPanel
        effects={{
          warpParams: {
            rotateX: 0,
            rotateY: 0,
            perspective: 800,
            is3dExtrusion: true,
            depth3d: 12,
            lightAngle: 45,
          },
        }}
        onChange={handleChange}
      />
    );

    const depthSlider = screen.getByLabelText('Extrusion Depth');
    expect(depthSlider).toBeInTheDocument();

    fireEvent.change(depthSlider, { target: { value: '24' } });

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        warpParams: expect.objectContaining({
          is3dExtrusion: true,
          depth3d: 24,
        }),
      })
    );
  });
});
