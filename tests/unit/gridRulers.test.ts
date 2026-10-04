import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../store/useStore';
import { SnappingOracle } from '../../utils/snappingOracle';
import { FONT_FAMILIES } from '../../constants';
import { AVAILABLE_FONTS } from '../../services/FontLoader';
import { Layer, Artboard, GuideLine } from '../../types';

describe('Grid & Rulers Engine', () => {
  beforeEach(() => {
    useStore.getState().resetState?.();
    useStore.setState({
      guides: [],
      gridSize: 20,
      gridColor: '#7c3aed',
      gridStyle: 'lines',
      showGrid: false,
      showRulers: false,
      snapToGrid: true,
    });
  });

  describe('Zustand Grid & Guide Actions', () => {
    it('sets grid size within valid range (5-200)', () => {
      useStore.getState().setGridSize(50);
      expect(useStore.getState().gridSize).toBe(50);

      useStore.getState().setGridSize(2);
      expect(useStore.getState().gridSize).toBe(5);

      useStore.getState().setGridSize(300);
      expect(useStore.getState().gridSize).toBe(200);
    });

    it('sets grid color and style', () => {
      useStore.getState().setGridColor('#00e5ff');
      expect(useStore.getState().gridColor).toBe('#00e5ff');

      useStore.getState().setGridStyle('dots');
      expect(useStore.getState().gridStyle).toBe('dots');

      useStore.getState().setGridStyle('lines');
      expect(useStore.getState().gridStyle).toBe('lines');
    });

    it('adds horizontal and vertical guides', () => {
      useStore.getState().addGuide('horizontal', 150);
      useStore.getState().addGuide('vertical', 300);

      const guides = useStore.getState().guides;
      expect(guides).toHaveLength(2);
      expect(guides[0].type).toBe('horizontal');
      expect(guides[0].position).toBe(150);
      expect(guides[1].type).toBe('vertical');
      expect(guides[1].position).toBe(300);
    });

    it('updates guide position', () => {
      useStore.getState().addGuide('horizontal', 100);
      const guideId = useStore.getState().guides[0].id;

      useStore.getState().updateGuide(guideId, 250);
      expect(useStore.getState().guides[0].position).toBe(250);
    });

    it('removes guide by ID or index', () => {
      useStore.getState().addGuide('horizontal', 100);
      useStore.getState().addGuide('vertical', 200);
      useStore.getState().addGuide('horizontal', 300);

      const secondGuideId = useStore.getState().guides[1].id;
      useStore.getState().removeGuide(secondGuideId);

      expect(useStore.getState().guides).toHaveLength(2);
      expect(useStore.getState().guides.find((g) => g.id === secondGuideId)).toBeUndefined();

      // Remove by index
      useStore.getState().removeGuide(0);
      expect(useStore.getState().guides).toHaveLength(1);
      expect(useStore.getState().guides[0].position).toBe(300);
    });

    it('clears all guides', () => {
      useStore.getState().addGuide('horizontal', 100);
      useStore.getState().addGuide('vertical', 200);
      expect(useStore.getState().guides).toHaveLength(2);

      useStore.getState().clearGuides();
      expect(useStore.getState().guides).toHaveLength(0);
    });
  });

  describe('Snapping with User Guides', () => {
    const mockArtboard: Artboard = {
      id: 'ab-1',
      name: 'Artboard',
      x: 0,
      y: 0,
      width: 1000,
      height: 1000,
      backgroundColor: '#ffffff',
      layers: [],
    };

    it('snaps moving layer to a vertical user guide', () => {
      const movingLayer: Layer = {
        id: 'layer-1',
        type: 'rectangle',
        name: 'Box',
        x: 198, // 2px away from guide at 200 (within threshold of 5)
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      };

      const guides: GuideLine[] = [{ id: 'g-1', type: 'vertical', position: 200 }];

      const snap = SnappingOracle.calculateSnaps([movingLayer], [], mockArtboard, 5, 1, guides);
      expect(snap.x).toBe(200);
      expect(snap.lines.some((l) => l.type === 'vertical' && l.value === 200)).toBe(true);
    });

    it('snaps moving layer to a horizontal user guide', () => {
      const movingLayer: Layer = {
        id: 'layer-2',
        type: 'rectangle',
        name: 'Box',
        x: 100,
        y: 348, // 2px away from guide at 350
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      };

      const guides: GuideLine[] = [{ id: 'g-2', type: 'horizontal', position: 350 }];

      const snap = SnappingOracle.calculateSnaps([movingLayer], [], mockArtboard, 5, 1, guides);
      expect(snap.y).toBe(350);
      expect(snap.lines.some((l) => l.type === 'horizontal' && l.value === 350)).toBe(true);
    });
  });

  describe('Kreathief Brand Fonts Registration', () => {
    it('contains all 4 Kreathief brand fonts in FONT_FAMILIES', () => {
      expect(FONT_FAMILIES).toContain('Kreathief001');
      expect(FONT_FAMILIES).toContain('Kreathief002');
      expect(FONT_FAMILIES).toContain('Kreathief003');
      expect(FONT_FAMILIES).toContain('Kreathief004');
    });

    it('contains all 4 Kreathief brand fonts in AVAILABLE_FONTS', () => {
      expect(AVAILABLE_FONTS).toContain('Kreathief001');
      expect(AVAILABLE_FONTS).toContain('Kreathief002');
      expect(AVAILABLE_FONTS).toContain('Kreathief003');
      expect(AVAILABLE_FONTS).toContain('Kreathief004');
    });
  });
});
