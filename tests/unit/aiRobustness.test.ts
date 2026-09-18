import { describe, it, expect, vi } from 'vitest';
import { creativeAgentDraft, generateProceduralDrafts } from '../../services/aiService';
import { generateImageWithModel, generateProceduralArtwork } from '../../services/imageGenService';
import { enhancePromptWithArchetype, generateDesignTheme } from '../../services/geminiService';

vi.mock('../../services/geminiService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/geminiService')>();
  return {
    ...actual,
    callBackendGeminiAPI: vi.fn().mockRejectedValue(new Error('Cloud API Offline')),
    generateImage: vi.fn().mockRejectedValue(new Error('Freepik Offline')),
  };
});

describe('AI Robustness & Procedural Fallbacks', () => {
  it('should generate rich procedural design variants when cloud API is offline', async () => {
    const variants = await creativeAgentDraft('Modern coffee shop promo', { width: 1080, height: 1080 });
    expect(variants).toBeDefined();
    expect(variants.length).toBeGreaterThanOrEqual(3);

    const firstVariant = variants[0];
    expect(firstVariant.themeIdea).toBeTruthy();
    expect(firstVariant.layers.length).toBeGreaterThanOrEqual(5);

    // Verify text and shape layers are properly generated
    const textLayers = firstVariant.layers.filter((l) => l.type === 'text');
    const shapeLayers = firstVariant.layers.filter((l) => l.type === 'rectangle' || l.type === 'circle');
    expect(textLayers.length).toBeGreaterThan(0);
    expect(shapeLayers.length).toBeGreaterThan(0);

    // Verify coordinates and dimensions are valid numbers
    firstVariant.layers.forEach((layer) => {
      expect(typeof layer.x).toBe('number');
      expect(typeof layer.y).toBe('number');
      expect(typeof layer.width).toBe('number');
      expect(typeof layer.height).toBe('number');
      expect(layer.opacity).toBe(1);
    });
  });

  it('should generate category-specific color palettes and copy in procedural drafts', () => {
    const coffeeDrafts = generateProceduralDrafts('Artisan Espresso Cafe', { width: 1080, height: 1080 });
    expect(
      coffeeDrafts[0].layers.some(
        (l: any) => l.text?.includes('ROAST') || l.text?.includes('Espresso') || l.name?.includes('Card')
      )
    ).toBe(true);

    const techDrafts = generateProceduralDrafts('SaaS AI Platform', { width: 1080, height: 1080 });
    expect(
      techDrafts[0].layers.some(
        (l: any) => l.text?.includes('AI-POWERED') || l.text?.includes('Platform') || l.name?.includes('Card')
      )
    ).toBe(true);
  });

  it('should generate high quality SVG procedural artwork when cloud image APIs fail', async () => {
    const dataUrl = await generateImageWithModel('Cyberpunk neon city skyline at night', {
      aspectRatio: 'SQUARE' as any,
    });

    expect(dataUrl).toBeTruthy();
    expect(dataUrl.startsWith('data:image/svg+xml')).toBe(true);
    expect(dataUrl).toContain('Cyberpunk');
    expect(dataUrl).toContain('AI%20STUDIO');
  });

  it('should produce direct SVG data URL from generateProceduralArtwork with custom palette', () => {
    const artwork = generateProceduralArtwork('Organic nature leaf background', {
      styleReference: {
        id: 'ref-1',
        name: 'Nature',
        image: 'data:image/png;base64,mock',
        aspects: ['palette'],
        extracted: {
          style: 'Organic',
          palette: ['#10B981', '#34D399', '#059669', '#064E3B'],
          lighting: 'Natural',
          mood: 'Calm',
          composition: 'Minimal',
        },
      },
    });

    expect(artwork).toBeTruthy();
    expect(artwork.startsWith('data:image/svg+xml')).toBe(true);
    expect(artwork).toContain('%2310B981'); // Encoded #10B981
  });

  it('should perform archetype-specific local prompt enhancement', async () => {
    const enhancedCinematic = await enhancePromptWithArchetype('a vintage sports car', 'cinematic');
    expect(enhancedCinematic).toContain('vintage sports car');
    expect(enhancedCinematic.toLowerCase()).toContain('cinematic');

    const enhancedVector = await enhancePromptWithArchetype('a mountain landscape', 'vector_graphic');
    expect(enhancedVector).toContain('mountain landscape');
    expect(enhancedVector.toLowerCase()).toContain('vector');
  });

  it('should generate local design themes when cloud API is offline', async () => {
    const theme = await generateDesignTheme('Futuristic dark mode');
    expect(theme).toBeDefined();
    expect(theme.backgroundColor).toBeTruthy();
    expect(theme.primaryColor).toBeTruthy();
    expect(theme.headingFont).toBeTruthy();
  });

  it('should validate and auto-repair malformed AI multi-layer design JSON using Zod', async () => {
    const { MultiLayerDesignSchema } = await import('../../services/aiDesignDirector');

    const malformedJson = {
      // Missing title and backgroundColor
      layers: [
        {
          type: 'text',
          name: 'Headline',
          x: '150', // string number
          y: '220', // string number
          width: '800',
          height: '120',
          text: 'Autonomous AI Design',
          fontSize: '48',
        },
        {
          type: 'rect',
          name: 'Badge',
          x: 40,
          y: 40,
          width: 160,
          height: 36,
          color: '#3b82f6',
        },
      ],
    };

    const parsed = MultiLayerDesignSchema.safeParse(malformedJson);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe('AI Generated Artboard');
      expect(parsed.data.backgroundColor).toBe('#0f172a');
      expect(parsed.data.layers[0].x).toBe(150);
      expect(typeof parsed.data.layers[0].x).toBe('number');
      expect(parsed.data.layers[0].fontSize).toBe(48);
      expect(typeof parsed.data.layers[0].fontSize).toBe('number');
    }
  });
});
