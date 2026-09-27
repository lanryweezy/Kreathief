import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanvasHealthPill } from '../../components/canvas/CanvasHealthPill';
import { useStore } from '../../store/useStore';
import { Artboard, ShapeLayer, TextLayer } from '../../types';

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}));

describe('CanvasHealthPill Floating Component', () => {
  let mockSetActiveTab: ReturnType<typeof vi.fn>;
  let mockUpdateLayer: ReturnType<typeof vi.fn>;
  let mockAddToast: ReturnType<typeof vi.fn>;
  let mockSaveToHistory: ReturnType<typeof vi.fn>;

  const healthyArtboard: Artboard = {
    id: 'ab_healthy',
    name: 'Clean Artboard',
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
        id: 'l_head',
        type: 'text',
        name: 'Headline',
        text: 'PREMIUM ARTBOARD',
        fontSize: 36,
        color: '#ffffff',
        x: 200,
        y: 200,
        width: 600,
        height: 50,
        visible: true,
      } as TextLayer,
    ],
  };

  const defectArtboard: Artboard = {
    id: 'ab_defect',
    name: 'Defect Artboard',
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
        text: 'CLICK HERE',
        fontSize: 18,
        color: '#ffffff', // Bad contrast on yellow
        x: 360,
        y: 818,
        width: 280,
        height: 24,
        visible: true,
      } as TextLayer,
    ],
  };

  beforeEach(() => {
    mockSetActiveTab = vi.fn();
    mockUpdateLayer = vi.fn();
    mockAddToast = vi.fn();
    mockSaveToHistory = vi.fn();
  });

  it('renders a healthy status pill when canvas passes all checks', () => {
    (useStore as any).mockImplementation((selector: any) => {
      const state = {
        artboards: [healthyArtboard],
        activeArtboardId: 'ab_healthy',
        canvasBackgroundColor: '#0a0a14',
        setActiveTab: mockSetActiveTab,
        updateLayer: mockUpdateLayer,
        addToast: mockAddToast,
        saveToHistory: mockSaveToHistory,
      };
      return selector(state);
    });

    render(<CanvasHealthPill />);
    expect(screen.getByText(/HEALTH 100%/i)).toBeInTheDocument();
  });

  it('renders warning health score with 1-click Auto-Fix All button when defects are found', () => {
    (useStore as any).mockImplementation((selector: any) => {
      const state = {
        artboards: [defectArtboard],
        activeArtboardId: 'ab_defect',
        canvasBackgroundColor: '#0a0a14',
        setActiveTab: mockSetActiveTab,
        updateLayer: mockUpdateLayer,
        addToast: mockAddToast,
        saveToHistory: mockSaveToHistory,
      };
      return selector(state);
    });

    render(<CanvasHealthPill />);

    const fixBtn = screen.getByRole('button', { name: /auto-fix all/i });
    expect(fixBtn).toBeInTheDocument();

    fireEvent.click(fixBtn);
    expect(mockSaveToHistory).toHaveBeenCalled();
    expect(mockUpdateLayer).toHaveBeenCalledWith('l_btn_txt', expect.objectContaining({ color: '#000000' }));
    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('auto-fixes'), 'success');
  });

  it('navigates to Accessibility panel when health score pill is clicked', () => {
    (useStore as any).mockImplementation((selector: any) => {
      const state = {
        artboards: [healthyArtboard],
        activeArtboardId: 'ab_healthy',
        canvasBackgroundColor: '#0a0a14',
        setActiveTab: mockSetActiveTab,
        updateLayer: mockUpdateLayer,
        addToast: mockAddToast,
        saveToHistory: mockSaveToHistory,
      };
      return selector(state);
    });

    render(<CanvasHealthPill />);
    const pill = screen.getByRole('button', { name: /open accessibility & design linter/i });
    fireEvent.click(pill);

    expect(mockSetActiveTab).toHaveBeenCalledWith('ACCESSIBILITY');
  });
});
