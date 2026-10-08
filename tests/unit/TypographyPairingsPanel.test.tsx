import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TypographyPairingsPanel } from '../../components/panels/TypographyPairingsPanel';
import { useStore } from '../../store/useStore';
import { Artboard, TextLayer } from '../../types';

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}));

vi.mock('../../services/FontLoader', () => ({
  loadFont: vi.fn().mockResolvedValue(true),
}));

describe('TypographyPairingsPanel Component', () => {
  let mockHarmonizeArtboardTypography: ReturnType<typeof vi.fn>;
  let mockUpdateLayer: ReturnType<typeof vi.fn>;
  let mockAddToast: ReturnType<typeof vi.fn>;
  let mockSaveToHistory: ReturnType<typeof vi.fn>;

  const testArtboard: Artboard = {
    id: 'ab_typography_test',
    name: 'Typography Artboard',
    width: 1080,
    height: 1080,
    x: 0,
    y: 0,
    backgroundColor: '#0a0a14',
    layers: [
      {
        id: 'txt_head',
        type: 'text',
        name: 'Main Title',
        text: 'SUMMER FESTIVAL 2026',
        fontSize: 54,
        fontWeight: '800',
        fontFamily: 'Inter',
        x: 100,
        y: 100,
        width: 800,
        height: 60,
        visible: true,
      } as TextLayer,
      {
        id: 'txt_sub',
        type: 'text',
        name: 'Subtitle Copy',
        text: 'Live electronic performances & immersive art installations',
        fontSize: 24,
        fontWeight: '400',
        fontFamily: 'Inter',
        x: 100,
        y: 180,
        width: 700,
        height: 40,
        visible: true,
      } as TextLayer,
    ],
  };

  beforeEach(() => {
    mockHarmonizeArtboardTypography = vi.fn();
    mockUpdateLayer = vi.fn();
    mockAddToast = vi.fn();
    mockSaveToHistory = vi.fn();

    (useStore as any).mockImplementation((selector: any) => {
      const state = {
        artboards: [testArtboard],
        activeArtboardId: 'ab_typography_test',
        selectedLayerIds: ['txt_head'],
        updateLayer: mockUpdateLayer,
        harmonizeArtboardTypography: mockHarmonizeArtboardTypography,
        addToast: mockAddToast,
        saveToHistory: mockSaveToHistory,
      };
      return selector(state);
    });
  });

  it('renders typography harmonizer header and detects active text layers', () => {
    render(<TypographyPairingsPanel />);

    expect(screen.getByText('Artboard Harmonizer')).toBeInTheDocument();
    expect(screen.getByText(/2 text layers detected on active canvas/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /auto-harmonize all typography/i })).toBeInTheDocument();
  });

  it('triggers auto-harmonize on all typography when hero button is clicked', () => {
    render(<TypographyPairingsPanel />);

    const autoHarmonizeBtn = screen.getByRole('button', { name: /auto-harmonize all typography/i });
    fireEvent.click(autoHarmonizeBtn);

    expect(mockHarmonizeArtboardTypography).toHaveBeenCalledTimes(1);
  });

  it('filters pairings based on search input query', () => {
    render(<TypographyPairingsPanel />);

    const searchInput = screen.getByPlaceholderText(/search pairings, fonts, or aesthetics/i);
    fireEvent.change(searchInput, { target: { value: 'Cyberpunk' } });

    expect(screen.getByText(/cyberpunk/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Orbitron/i).length).toBeGreaterThan(0);
  });

  it('filters pairings based on search input query with typo tolerance', () => {
    render(<TypographyPairingsPanel />);

    const searchInput = screen.getByPlaceholderText(/search pairings, fonts, or aesthetics/i);

    // Simulate typo "Cybrpunk" instead of "Cyberpunk"
    fireEvent.change(searchInput, { target: { value: 'Cybrpunk' } });

    expect(screen.getByText(/cyberpunk/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Orbitron/i).length).toBeGreaterThan(0);
  });

  it('allows applying a specific pairing directly to the artboard', () => {
    render(<TypographyPairingsPanel />);

    const applyBtns = screen.getAllByRole('button', { name: /apply to artboard/i });
    expect(applyBtns.length).toBeGreaterThan(0);

    fireEvent.click(applyBtns[0]);
    expect(mockHarmonizeArtboardTypography).toHaveBeenCalledWith(expect.objectContaining({
      heading: expect.any(String),
      body: expect.any(String),
    }));
  });
});
