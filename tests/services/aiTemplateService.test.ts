import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractTagsFromPrompt, generateTemplateWithAI } from '../../services/aiTemplateService';
import { templateMarketplace } from '../../services/templateMarketplace';

vi.mock('../../services/aiDesignDirector', () => ({
  generateMultiLayerDesign: vi.fn().mockResolvedValue({
    title: 'Neon Cyberpunk Flyer',
    description: 'A vibrant electronic music festival flyer with glowing neon typography',
    width: 1080,
    height: 1350,
    backgroundColor: '#090a0f',
    layers: [
      { id: 'layer-bg', type: 'rect', name: 'Background', x: 0, y: 0, width: 1080, height: 1350 },
      { id: 'layer-text', type: 'text', name: 'Main Headline', text: 'NEON MATRIX', x: 100, y: 300 },
    ],
  }),
}));

vi.mock('../../services/templateMarketplace', () => ({
  templateMarketplace: {
    submitTemplate: vi.fn().mockResolvedValue({ id: 'mock-submitted-id' }),
  },
}));

describe('AI Template Generation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractTagsFromPrompt', () => {
    it('extracts unique meaningful tags and includes category and ai-generated', () => {
      const prompt = 'Make a cyberpunk flyer with neon typography and futuristic glow';
      const tags = extractTagsFromPrompt(prompt, 'Posters');

      expect(tags).toContain('posters');
      expect(tags).toContain('ai-generated');
      expect(tags).toContain('cyberpunk');
      expect(tags).toContain('flyer');
      expect(tags).toContain('neon');
      expect(tags).not.toContain('with');
      expect(tags).not.toContain('make');
    });
  });

  describe('generateTemplateWithAI', () => {
    it('generates a full MarketplaceTemplate structure with artboard data', async () => {
      const template = await generateTemplateWithAI({
        prompt: 'Neon Cyberpunk Flyer',
        category: 'Posters',
      });

      expect(template.id).toMatch(/^ai_tmpl_/);
      expect(template.title).toBe('Neon Cyberpunk Flyer');
      expect(template.category).toBe('Posters');
      expect(template.authorId).toBe('gemini-ai');
      expect(template.authorName).toBe('Gemini Creative AI');
      expect(template.status).toBe('approved');

      // Verify templateData structure
      expect(template.templateData).toBeDefined();
      expect(template.templateData.width).toBe(1080);
      expect(template.templateData.height).toBe(1350);
      expect(template.templateData.artboard.layers.length).toBe(2);
      expect(template.templateData.meta.generatedBy).toBe('Gemini 2.5 Flash');
    });

    it('submits template to marketplace if publishImmediately is true', async () => {
      const template = await generateTemplateWithAI({
        prompt: 'Minimalist SaaS Banner',
        category: 'Corporate',
        publishImmediately: true,
      });

      expect(template).toBeDefined();
      expect(templateMarketplace.submitTemplate).toHaveBeenCalledTimes(1);
    });
  });
});
