import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccessibilityPanel } from '../../components/panels/AccessibilityPanel';
import { useStore } from '../../store/useStore';
import { Artboard, TextLayer, ShapeLayer } from '../../types';

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}));

describe('AccessibilityPanel & Real-Time Linter UI', () => {
  let mockSelectLayer: ReturnType<typeof vi.fn>;
  let mockUpdateLayer: ReturnType<typeof vi.fn>;

  const testArtboard: Artboard = {
    id: 'ab_1',
    name: 'Main Artboard',
    width: 1000,
    height: 1000,
    x: 0,
    y: 0,
    backgroundColor: '#0a0a14',
    layers: [
      {
        id: 'l_bg',
        type: 'rectangle',
        name: 'Background',
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
        color: '#0a0a14',
        visible: true,
      } as ShapeLayer,
      {
        id: 'l_btn',
        type: 'rectangle',
        name: 'CTA Button',
        x: 350,
        y: 800,
        width: 300,
        height: 60,
        color: '#ffff00', // Yellow
        visible: true,
      } as ShapeLayer,
      {
        id: 'l_btn_txt',
        type: 'text',
        name: 'Button Text',
        text: 'CLICK HERE NOW',
        fontSize: 18,
        color: '#ffffff', // Low contrast on yellow!
        x: 360,
        y: 818,
        width: 280,
        height: 24,
        visible: true,
      } as TextLayer,
    ],
  };

  beforeEach(() => {
    mockSelectLayer = vi.fn();
    mockUpdateLayer = vi.fn();

    (useStore as any).mockImplementation((selector: any) => {
      const state = {
        artboards: [testArtboard],
        activeArtboardId: 'ab_1',
        selectLayer: mockSelectLayer,
        updateLayer: mockUpdateLayer,
        canvasBackgroundColor: '#0a0a14',
      };
      return selector(state);
    });

    (useStore as any).getState = () => ({
      saveToHistory: vi.fn(),
      addToast: vi.fn(),
    });
  });

  it('renders the Design Linter tab with active Health score and metrics ribbon', () => {
    render(<AccessibilityPanel />);

    expect(screen.getByText('Design Linter')).toBeInTheDocument();
    expect(screen.getByText('Vision Sim')).toBeInTheDocument();
    expect(screen.getByText(/HEALTH:/i)).toBeInTheDocument();
    expect(screen.getByText('Contrast')).toBeInTheDocument();
    expect(screen.getByText('Safe Zone')).toBeInTheDocument();
  });

  it('renders discovered lint issues and allows applying 1-click auto-fix', () => {
    render(<AccessibilityPanel />);

    // Should detect contrast failure on white text over yellow button
    const fixButton = screen.getByRole('button', { name: /switch text color to/i });
    expect(fixButton).toBeInTheDocument();

    fireEvent.click(fixButton);
    expect(mockUpdateLayer).toHaveBeenCalledWith('l_btn_txt', expect.objectContaining({ color: '#000000' }));
  });

  it('allows switching to Vision Simulation tab to preview color-blindness modes', () => {
    render(<AccessibilityPanel />);

    const visionTab = screen.getByText('Vision Sim');
    fireEvent.click(visionTab);

    expect(screen.getByText('Deuteranopia (Green-Weak)')).toBeInTheDocument();
    expect(screen.getByText('Protanopia (Red-Weak)')).toBeInTheDocument();
    expect(screen.getByText('Monochromacy (Greyscale)')).toBeInTheDocument();
  });
});
