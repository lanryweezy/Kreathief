import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LayersPanel } from '../../components/panels/LayersPanel';
import { useStore } from '../../store/useStore';
import { Layer } from '../../types';

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}));

describe('LayersPanel Virtualization & Performance', () => {
  let mockSelectLayer: ReturnType<typeof vi.fn>;
  let mockUpdateLayer: ReturnType<typeof vi.fn>;
  let mockDeleteLayer: ReturnType<typeof vi.fn>;
  let mockReorderLayer: ReturnType<typeof vi.fn>;

  const createLayers = (count: number): Layer[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `layer-${i}`,
      type: 'text',
      name: `Heading Layer ${i}`,
      text: `Text ${i}`,
      x: 10 * i,
      y: 10 * i,
      width: 200,
      height: 50,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    } as Layer));
  };

  beforeEach(() => {
    mockSelectLayer = vi.fn();
    mockUpdateLayer = vi.fn();
    mockDeleteLayer = vi.fn();
    mockReorderLayer = vi.fn();

    const layers = createLayers(50);

    (useStore as any).mockImplementation((selector: any) => {
      const state = {
        artboards: [
          {
            id: 'artboard-1',
            name: 'Primary Canvas',
            width: 1080,
            height: 1080,
            layers,
          },
        ],
        activeArtboardId: 'artboard-1',
        selectedLayerIds: ['layer-0'],
        selectLayer: mockSelectLayer,
        multiSelectLayer: vi.fn(),
        updateLayer: mockUpdateLayer,
        deleteLayer: mockDeleteLayer,
        reorderLayer: mockReorderLayer,
        hoveredLayerId: null,
        setHoveredLayerId: vi.fn(),
      };
      return selector(state);
    });
  });

  it('renders layers panel header with accurate layer count badge', () => {
    render(<LayersPanel />);
    expect(screen.getByTestId('layers-panel')).toBeInTheDocument();
    expect(screen.getByText('Layers')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('filters layers using search input without crashing', () => {
    render(<LayersPanel />);
    const searchInput = screen.getByTestId('layer-search-input');
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Heading Layer 4' } });
    expect((searchInput as HTMLInputElement).value).toBe('Heading Layer 4');
  });
});
