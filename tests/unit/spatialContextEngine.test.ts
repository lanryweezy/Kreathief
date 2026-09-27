import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveSpatialZone,
  resolveSpatialContext,
  buildSpatialPromptContext,
  suggestSpatialActions,
} from '../../services/spatialContextEngine';
import { agenticCopilot } from '../../services/agenticCopilot';
import { useStore } from '../../store/useStore';
import { Artboard, TextLayer, ShapeLayer, ImageLayer } from '../../types';

describe('Spatial Context Engine & Interactive Agentic Pinning', () => {
  const sampleArtboard: Artboard = {
    id: 'artboard_spatial_1',
    name: 'Instagram Post',
    width: 1080,
    height: 1080,
    x: 0,
    y: 0,
    backgroundColor: '#ffffff',
    layers: [
      {
        id: 'bg_card',
        type: 'shape',
        name: 'Background Card',
        x: 40,
        y: 40,
        width: 1000,
        height: 1000,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        fill: '#0f172a',
      } as ShapeLayer,
      {
        id: 'headline_text',
        type: 'text',
        name: 'Main Headline',
        x: 100,
        y: 120,
        width: 880,
        height: 140,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        text: 'STREETWEAR DROP 2026',
        fontSize: 64,
        fontFamily: 'Inter',
        color: '#ffffff',
      } as TextLayer,
      {
        id: 'hero_img',
        type: 'image',
        name: 'Product Hero',
        x: 240,
        y: 350,
        width: 600,
        height: 400,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        src: 'https://example.com/sneaker.png',
      } as ImageLayer,
      {
        id: 'cta_btn',
        type: 'shape',
        name: 'Shop Now Button',
        x: 390,
        y: 840,
        width: 300,
        height: 70,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        fill: '#6366f1',
      } as ShapeLayer,
    ],
  };

  describe('resolveSpatialZone', () => {
    it('correctly categorizes quadrants across artboard dimensions', () => {
      expect(resolveSpatialZone(100, 100, 1080, 1080)).toBe('top header (left)');
      expect(resolveSpatialZone(540, 100, 1080, 1080)).toBe('top header (center)');
      expect(resolveSpatialZone(950, 100, 1080, 1080)).toBe('top header (right)');
      expect(resolveSpatialZone(540, 500, 1080, 1080)).toBe('center hero (center)');
      expect(resolveSpatialZone(540, 950, 1080, 1080)).toBe('bottom CTA (center)');
    });
  });

  describe('resolveSpatialContext', () => {
    it('identifies top-most text layer when pin is dropped on headline', () => {
      const pin = resolveSpatialContext({ x: 200, y: 150 }, sampleArtboard);
      expect(pin.targetLayerId).toBe('headline_text');
      expect(pin.targetLayerName).toBe('Main Headline');
      expect(pin.targetLayerType).toBe('text');
      expect(pin.x).toBe(200);
      expect(pin.y).toBe(150);
      expect(pin.zoneSummary).toContain('top header');
    });

    it('identifies image layer when pin is dropped on hero photo', () => {
      const pin = resolveSpatialContext({ x: 500, y: 500 }, sampleArtboard);
      expect(pin.targetLayerId).toBe('hero_img');
      expect(pin.targetLayerType).toBe('image');
      expect(pin.zoneSummary).toContain('center hero');
    });

    it('identifies empty space when clicking outside content layers', () => {
      const emptyBoard: Artboard = {
        id: 'empty_board',
        name: 'Blank',
        width: 1080,
        height: 1080,
        layers: [],
      };
      const pin = resolveSpatialContext({ x: 540, y: 880 }, emptyBoard);
      expect(pin.targetLayerId).toBeUndefined();
      expect(pin.targetLayerName).toBeUndefined();
      expect(pin.zoneSummary).toContain('bottom CTA');
    });

    it('ignores locked and invisible layers during hit-testing', () => {
      const artboardWithLocked: Artboard = {
        ...sampleArtboard,
        layers: [
          {
            id: 'locked_overlay',
            type: 'shape',
            name: 'Locked Cover',
            x: 0,
            y: 0,
            width: 1080,
            height: 1080,
            locked: true,
            visible: true,
          } as ShapeLayer,
          ...sampleArtboard.layers,
        ],
      };
      const pin = resolveSpatialContext({ x: 200, y: 150 }, artboardWithLocked);
      expect(pin.targetLayerId).toBe('headline_text');
    });

    it('calculates nearby neighboring elements within proximity radius', () => {
      const pin = resolveSpatialContext({ x: 400, y: 800 }, sampleArtboard, 200);
      // cta_btn is at y: 840, within 200px
      expect(pin.nearbyLayerIds).toContain('cta_btn');
    });
  });

  describe('buildSpatialPromptContext', () => {
    it('generates rich LLM context with coordinates, target details, and nearby hierarchy', () => {
      const pin = resolveSpatialContext({ x: 200, y: 150 }, sampleArtboard);
      const promptContext = buildSpatialPromptContext(pin, sampleArtboard);

      expect(promptContext).toContain('[SPATIAL PIN CONTEXT]');
      expect(promptContext).toContain('Location (200px, 150px)');
      expect(promptContext).toContain('Target element under pin: "Main Headline" [text]');
      expect(promptContext).toContain('STREETWEAR DROP 2026');
      expect(promptContext).toContain('64px');
    });

    it('handles empty canvas space context smoothly', () => {
      const pin = resolveSpatialContext({ x: 800, y: 900 }, { ...sampleArtboard, layers: [] });
      const promptContext = buildSpatialPromptContext(pin, { ...sampleArtboard, layers: [] });

      expect(promptContext).toContain('Pin is dropped in empty canvas space');
      expect(promptContext).toContain('Location (800px, 900px)');
    });
  });

  describe('suggestSpatialActions', () => {
    it('suggests copy & contrast refinements for text layers', () => {
      const pin = resolveSpatialContext({ x: 200, y: 150 }, sampleArtboard);
      const suggestions = suggestSpatialActions(pin, sampleArtboard);

      const labels = suggestions.map((s) => s.label);
      expect(labels.some((l) => l.includes('Punchier Copy'))).toBe(true);
      expect(labels.some((l) => l.includes('Fix Contrast'))).toBe(true);
      expect(labels.some((l) => l.includes('Add Pill Badge'))).toBe(true);
    });

    it('suggests neural cutout & upscaling for image layers', () => {
      const pin = resolveSpatialContext({ x: 500, y: 500 }, sampleArtboard);
      const suggestions = suggestSpatialActions(pin, sampleArtboard);

      const labels = suggestions.map((s) => s.label);
      expect(labels.some((l) => l.includes('Cutout Subject'))).toBe(true);
      expect(labels.some((l) => l.includes('4K Clarity'))).toBe(true);
      expect(labels.some((l) => l.includes('SVG Vector'))).toBe(true);
    });

    it('suggests insertion actions for empty canvas coordinates', () => {
      const pin = resolveSpatialContext({ x: 540, y: 920 }, { ...sampleArtboard, layers: [] });
      const suggestions = suggestSpatialActions(pin, { ...sampleArtboard, layers: [] });

      const labels = suggestions.map((s) => s.label);
      expect(labels.some((l) => l.includes('CTA Button'))).toBe(true);
      expect(labels.some((l) => l.includes('Highlight Pill'))).toBe(true);
      expect(labels.some((l) => l.includes('Supporting Text'))).toBe(true);
    });
  });

  describe('AgenticCopilot Spatial Execution', () => {
    beforeEach(() => {
      useStore.setState({
        artboards: [sampleArtboard],
        activeArtboardId: sampleArtboard.id,
        selectedLayerIds: [],
      });
    });

    it('embeds spatial pin details inside buildContextSnapshot', () => {
      const pin = resolveSpatialContext({ x: 200, y: 150 }, sampleArtboard);
      const snapshot = agenticCopilot.buildContextSnapshot(pin);

      expect(snapshot).toContain('ACTIVE SPATIAL PIN CONTEXT');
      expect(snapshot).toContain('(x: 200px, y: 150px)');
      expect(snapshot).toContain('Target Layer directly under pin: [headline_text]');
      expect(snapshot).toContain('CRITICAL INSTRUCTION: When creating or modifying elements, anchor them at or near (200, 150)');
    });

    it('executes ADD_TEXT anchored right at spatial pin coordinates', () => {
      const pin = resolveSpatialContext({ x: 540, y: 720 }, sampleArtboard);
      agenticCopilot.executeActions(
        [
          {
            action: 'ADD_TEXT',
            payload: { text: 'Limited Edition 2026', fontSize: 32 },
          },
        ],
        pin
      );

      const state = useStore.getState();
      const currentBoard = state.artboards.find((a) => a.id === sampleArtboard.id)!;
      const addedLayer = currentBoard.layers.find((l) => (l as any).text === 'Limited Edition 2026');

      expect(addedLayer).toBeDefined();
      expect(addedLayer?.type).toBe('text');
      // Position should be centered at or near pin x: 540, y: 720
      expect(addedLayer?.y).toBeGreaterThan(600);
      expect(addedLayer?.y).toBeLessThan(750);
    });

    it('executes ADD_SHAPE anchored at spatial pin coordinates', () => {
      const pin = resolveSpatialContext({ x: 540, y: 880 }, sampleArtboard);
      agenticCopilot.executeActions(
        [
          {
            action: 'ADD_SHAPE',
            payload: { shapeType: 'rectangle', fill: '#10b981', width: 220, height: 60 },
          },
        ],
        pin
      );

      const state = useStore.getState();
      const currentBoard = state.artboards.find((a) => a.id === sampleArtboard.id)!;
      const addedShape = currentBoard.layers.find((l) => (l as any).fill === '#10b981');

      expect(addedShape).toBeDefined();
      expect(addedShape?.type).toBe('shape');
      // x should be centered around 540 - 220/2 = 430
      expect(addedShape?.x).toBe(430);
    });

    it('executes UPDATE_LAYER targeting the pinned layer', () => {
      const pin = resolveSpatialContext({ x: 200, y: 150 }, sampleArtboard);
      agenticCopilot.executeActions(
        [
          {
            action: 'UPDATE_LAYER',
            payload: { updates: { color: '#fbbf24' } },
          },
        ],
        pin
      );

      const state = useStore.getState();
      const currentBoard = state.artboards.find((a) => a.id === sampleArtboard.id)!;
      const updatedLayer = currentBoard.layers.find((l) => l.id === 'headline_text');

      expect((updatedLayer as any).color).toBe('#fbbf24');
    });
  });
});
