import { describe, it, expect } from 'vitest';
import {
  getAspectRatioCategory,
  classifyLayerRole,
  calculateOpticalFontSize,
  smartResizeArtboard,
  autoBalanceLayout,
  generateSmartResizedMatrix,
  SMART_RESIZE_PRESETS,
} from '../../services/smartResizeEngine';
import { Artboard, Layer, TextLayer } from '../../types';

describe('AI Contextual Auto-Layout & Smart Resizing Matrix Engine', () => {
  describe('Aspect Ratio Categorization', () => {
    it('correctly categorizes square, tall vertical, and wide horizontal dimensions', () => {
      expect(getAspectRatioCategory(1080, 1080)).toBe('square');
      expect(getAspectRatioCategory(1080, 1920)).toBe('tall_vertical');
      expect(getAspectRatioCategory(1080, 1350)).toBe('tall_vertical');
      expect(getAspectRatioCategory(1200, 630)).toBe('wide_horizontal');
      expect(getAspectRatioCategory(1280, 720)).toBe('wide_horizontal');
      expect(getAspectRatioCategory(1500, 500)).toBe('wide_horizontal');
    });

    it('contains standard industry presets with proper metadata', () => {
      expect(SMART_RESIZE_PRESETS.length).toBeGreaterThanOrEqual(6);
      const feed = SMART_RESIZE_PRESETS.find((p) => p.id === 'feed_1_1');
      expect(feed?.width).toBe(1080);
      expect(feed?.height).toBe(1080);

      const story = SMART_RESIZE_PRESETS.find((p) => p.id === 'story_9_16');
      expect(story?.width).toBe(1080);
      expect(story?.height).toBe(1920);

      const banner = SMART_RESIZE_PRESETS.find((p) => p.id === 'banner_16_9');
      expect(banner?.width).toBe(1200);
      expect(banner?.height).toBe(630);
    });
  });

  describe('Semantic Content Role Classification', () => {
    const W = 1080;
    const H = 1080;

    const layers: Layer[] = [
      {
        id: 'bg',
        type: 'rectangle',
        name: 'Dark Background',
        x: 0,
        y: 0,
        width: 1080,
        height: 1080,
        color: '#090a15',
        locked: true,
        visible: true,
        rotation: 0,
        opacity: 1,
      } as any,
      {
        id: 'badge',
        type: 'text',
        name: 'Hero Badge',
        text: '✦ SPECIAL OFFER • 50% OFF',
        fontSize: 18,
        x: 400,
        y: 100,
        width: 280,
        height: 30,
        locked: false,
        visible: true,
        rotation: 0,
        opacity: 1,
      } as any,
      {
        id: 'heading',
        type: 'text',
        name: 'Main Headline',
        text: 'THE FUTURE OF INTELLIGENCE',
        fontSize: 64,
        x: 100,
        y: 200,
        width: 880,
        height: 120,
        locked: false,
        visible: true,
        rotation: 0,
        opacity: 1,
      } as any,
      {
        id: 'subheading',
        type: 'text',
        name: 'Subtitle Description',
        text: 'Join visionary creators building the next generation of creative AI.',
        fontSize: 22,
        x: 140,
        y: 350,
        width: 800,
        height: 60,
        locked: false,
        visible: true,
        rotation: 0,
        opacity: 1,
      } as any,
      {
        id: 'btn_container',
        type: 'rectangle',
        name: 'CTA Button',
        x: 390,
        y: 800,
        width: 300,
        height: 64,
        color: '#00f0ff',
        locked: false,
        visible: true,
        rotation: 0,
        opacity: 1,
      } as any,
      {
        id: 'btn_txt',
        type: 'text',
        name: 'Button Label',
        text: 'CLAIM ACCESS NOW →',
        fontSize: 18,
        x: 410,
        y: 820,
        width: 260,
        height: 24,
        locked: false,
        visible: true,
        rotation: 0,
        opacity: 1,
      } as any,
      {
        id: 'footer',
        type: 'text',
        name: 'Promo Code',
        text: 'USE CODE: FUTURE50 • WWW.KREATHIEF.AI',
        fontSize: 14,
        x: 200,
        y: 1000,
        width: 680,
        height: 20,
        locked: false,
        visible: true,
        rotation: 0,
        opacity: 1,
      } as any,
    ];

    it('accurately identifies background, hero badge, headline, subheadline, CTA, and footer roles', () => {
      expect(classifyLayerRole(layers[0], layers, W, H)).toBe('background');
      expect(classifyLayerRole(layers[1], layers, W, H)).toBe('hero_badge');
      expect(classifyLayerRole(layers[2], layers, W, H)).toBe('headline');
      expect(classifyLayerRole(layers[3], layers, W, H)).toBe('subheadline');
      expect(classifyLayerRole(layers[4], layers, W, H)).toBe('cta_button');
      expect(classifyLayerRole(layers[5], layers, W, H)).toBe('cta_label');
      expect(classifyLayerRole(layers[6], layers, W, H)).toBe('footer_meta');
    });
  });

  describe('Optical Font Scaling', () => {
    it('applies non-linear harmonic scaling with role-specific floors and ceilings', () => {
      const headlineFont = calculateOpticalFontSize(64, 1080, 1920, 1080, 1080, 'headline');
      expect(headlineFont).toBeGreaterThan(64);
      expect(headlineFont).toBeLessThanOrEqual(180);

      const smallFont = calculateOpticalFontSize(14, 1080, 400, 1080, 400, 'footer_meta');
      expect(smallFont).toBeGreaterThanOrEqual(10); // Minimum legibility floor
    });
  });

  describe('Smart Resizing Cross-Format Transformations', () => {
    const sourceArtboard: Artboard = {
      id: 'ab_source',
      name: 'Source Design',
      width: 1080,
      height: 1080,
      x: 0,
      y: 0,
      backgroundColor: '#090a15',
      layers: [
        {
          id: 'bg',
          type: 'rectangle',
          name: 'Dark Background',
          x: 0,
          y: 0,
          width: 1080,
          height: 1080,
          color: '#090a15',
        } as any,
        {
          id: 'badge',
          type: 'text',
          name: 'Hero Badge',
          text: '✦ SPECIAL OFFER',
          fontSize: 18,
          x: 400,
          y: 100,
          width: 280,
          height: 30,
        } as any,
        {
          id: 'head',
          type: 'text',
          name: 'Headline',
          text: 'QUANTUM HYPERDRIVE',
          fontSize: 56,
          x: 140,
          y: 200,
          width: 800,
          height: 80,
        } as any,
        {
          id: 'sub',
          type: 'text',
          name: 'Subheadline',
          text: 'Supercharged creative performance engineered for professionals.',
          fontSize: 20,
          x: 140,
          y: 320,
          width: 800,
          height: 50,
        } as any,
        {
          id: 'card',
          type: 'rectangle',
          name: 'Product Card',
          x: 240,
          y: 420,
          width: 600,
          height: 320,
          color: '#1a1f36',
        } as any,
        {
          id: 'cta_btn',
          type: 'rectangle',
          name: 'CTA Button',
          x: 390,
          y: 840,
          width: 300,
          height: 64,
          color: '#00f0ff',
        } as any,
        {
          id: 'cta_lbl',
          type: 'text',
          name: 'CTA Text',
          text: 'ORDER NOW →',
          fontSize: 18,
          x: 410,
          y: 860,
          width: 260,
          height: 24,
        } as any,
      ],
    };

    it('transforms 1:1 Square to 16:9 Wide Banner with dual-column reflow', () => {
      const banner = smartResizeArtboard(sourceArtboard, 1200, 630);

      expect(banner.width).toBe(1200);
      expect(banner.height).toBe(630);
      expect(banner.layers).toHaveLength(sourceArtboard.layers.length);

      // Headline and CTA button should be positioned in the left column (x < 600)
      const head = banner.layers.find((l) => l.name?.includes('Headline')) as TextLayer;
      const ctaBtn = banner.layers.find((l) => l.name === 'CTA Button');
      expect(head).toBeDefined();
      expect(head.x).toBeLessThan(400);

      expect(ctaBtn).toBeDefined();
      expect(ctaBtn?.x).toBeLessThan(400);

      // Product card should be positioned in the right column (x >= 600)
      const card = banner.layers.find((l) => l.name === 'Product Card');
      expect(card).toBeDefined();
      expect(card?.x).toBeGreaterThanOrEqual(600);
    });

    it('transforms 1:1 Square to 9:16 Tall Story with vertical single-column rhythm', () => {
      const story = smartResizeArtboard(sourceArtboard, 1080, 1920);

      expect(story.width).toBe(1080);
      expect(story.height).toBe(1920);

      // CTA button should be safely positioned near the bottom touch zone
      const ctaBtn = story.layers.find((l) => l.name === 'CTA Button');
      expect(ctaBtn).toBeDefined();
      expect(ctaBtn?.y).toBeGreaterThanOrEqual(1400);

      // Button width and height remain within ergonomic touch bounds
      expect(ctaBtn?.height).toBeGreaterThanOrEqual(50);
      expect(ctaBtn?.height).toBeLessThanOrEqual(80);
    });
  });

  describe('Auto-Balance Layout Engine', () => {
    it('normalizes vertical rhythm and centers content horizontally', () => {
      const unbalancedLayers: Layer[] = [
        {
          id: 'bg',
          type: 'rectangle',
          name: 'Background',
          x: 0,
          y: 0,
          width: 1080,
          height: 1080,
        } as any,
        {
          id: 't1',
          type: 'text',
          name: 'Heading',
          x: 50,
          y: 80,
          width: 600,
          height: 70,
        } as any,
        {
          id: 't2',
          type: 'text',
          name: 'Paragraph',
          x: 120,
          y: 160,
          width: 500,
          height: 50,
        } as any,
        {
          id: 'btn',
          type: 'rectangle',
          name: 'CTA Button',
          x: 200,
          y: 900,
          width: 320,
          height: 60,
        } as any,
      ];

      const balanced = autoBalanceLayout(unbalancedLayers, 1080, 1080, { alignment: 'center' });

      // Background remains unaffected
      expect(balanced[0].x).toBe(0);
      expect(balanced[0].y).toBe(0);

      // Heading should be centered horizontally at 1080/2 - 600/2 = 240
      expect(balanced[1].x).toBe(240);

      // Paragraph centered horizontally at 1080/2 - 500/2 = 290
      expect(balanced[2].x).toBe(290);

      // CTA Button centered horizontally at 1080/2 - 320/2 = 380
      expect(balanced[3].x).toBe(380);

      // Vertical distance between t1 and t2 should be balanced
      expect(balanced[2].y).toBeGreaterThan(balanced[1].y);
      expect(balanced[3].y).toBeGreaterThan(balanced[2].y);
    });
  });

  describe('Smart Resized Matrix Generation', () => {
    it('generates synchronized multi-format matrix artboards with side-by-side positioning', () => {
      const master: Artboard = {
        id: 'ab_master',
        name: 'Master Campaign',
        width: 1080,
        height: 1080,
        x: 0,
        y: 0,
        backgroundColor: '#121212',
        layers: [
          {
            id: 'l1',
            type: 'text',
            name: 'Title',
            text: 'SUMMER SPECIAL',
            fontSize: 48,
            x: 100,
            y: 200,
            width: 880,
            height: 60,
          } as any,
        ],
      };

      const matrix = generateSmartResizedMatrix(master, ['feed_1_1', 'story_9_16', 'banner_16_9', 'poster_4_5']);

      expect(matrix).toHaveLength(4);
      expect(matrix[0].width).toBe(1080);
      expect(matrix[0].height).toBe(1080);
      expect(matrix[1].width).toBe(1080);
      expect(matrix[1].height).toBe(1920);
      expect(matrix[2].width).toBe(1200);
      expect(matrix[2].height).toBe(630);
      expect(matrix[3].width).toBe(1080);
      expect(matrix[3].height).toBe(1350);

      // Coordinate offset checks (no overlapping)
      let currentX = master.width;
      for (const ab of matrix) {
        expect(ab.x).toBeGreaterThan(currentX);
        currentX = ab.x + ab.width;
      }
    });
  });
});
