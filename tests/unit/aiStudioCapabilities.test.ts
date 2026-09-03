import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildStyleReferenceSuffix,
  composeGenerationPrompt,
} from '../../services/imageGenService';
import {
  CURATED_STYLE_PRESETS,
  presetToStyleReference,
} from '../../config/stylePresets';
import { StyleReference, GenerationContext } from '../../types';

describe('AI Studio Capabilities Unit Tests', () => {
  describe('Curated Style Reference Presets', () => {
    it('should provide high quality curated presets across multiple categories', () => {
      expect(CURATED_STYLE_PRESETS.length).toBeGreaterThanOrEqual(6);
      const presetIds = CURATED_STYLE_PRESETS.map((p) => p.id);
      expect(presetIds).toContain('cyberpunk-hologram');
      expect(presetIds).toContain('bauhaus-editorial');
      expect(presetIds).toContain('glassmorphism-3d');
      expect(presetIds).toContain('vintage-risograph');
      expect(presetIds).toContain('nordic-studio');
      expect(presetIds).toContain('anime-ghibli');
    });

    it('should correctly convert a curated preset into an active StyleReference', () => {
      const preset = CURATED_STYLE_PRESETS[0];
      const ref = presetToStyleReference(preset);

      expect(ref.id).toBe(`preset-${preset.id}`);
      expect(ref.name).toBe(preset.name);
      expect(ref.analysisStatus).toBe('ready');
      expect(ref.extracted?.palette).toEqual(preset.palette);
      expect(ref.extracted?.summary).toContain('cyberpunk');
      expect(ref.aspects).toContain('style');
      expect(ref.aspects).toContain('palette');
    });
  });

  describe('Style Reference Suffix Generation with Intensity Weighting', () => {
    const mockReference: StyleReference = {
      id: 'test-ref-1',
      image: 'data:image/png;base64,sample',
      name: 'Cyberpunk Look',
      aspects: ['style', 'palette', 'lighting'],
      extracted: {
        summary: 'cyberpunk neon aesthetic with glowing lines',
        palette: ['#06b6d4', '#8b5cf6', '#ec4899'],
        textures: 'glass, chrome',
        composition: 'centered framing',
        typography: 'monospace',
        mood: 'futuristic',
        lighting: 'neon rim lighting',
        illustrationStyle: '3D render',
        cameraAngle: 'wide angle',
      },
      analysisStatus: 'ready',
    };

    it('should generate balanced style reference suffix by default', () => {
      const suffix = buildStyleReferenceSuffix(mockReference);
      expect(suffix).toContain('Match this reference');
      expect(suffix).toContain('overall visual style: cyberpunk neon aesthetic with glowing lines');
      expect(suffix).toContain('color palette: #06b6d4, #8b5cf6, #ec4899');
      expect(suffix).toContain('lighting: neon rim lighting');
    });

    it('should adapt phrasing for subtle influence', () => {
      const subtleRef: StyleReference = {
        ...mockReference,
        strength: 'subtle',
      };
      const suffix = buildStyleReferenceSuffix(subtleRef);
      expect(suffix).toContain('Subtly inspired by this reference');
    });

    it('should adapt phrasing for strong influence', () => {
      const strongRef: StyleReference = {
        ...mockReference,
        strength: 'strong',
      };
      const suffix = buildStyleReferenceSuffix(strongRef);
      expect(suffix).toContain('Strictly emulate this reference');
    });

    it('should return empty string when reference has no aspects', () => {
      const emptyAspectsRef: StyleReference = {
        ...mockReference,
        aspects: [],
      };
      const suffix = buildStyleReferenceSuffix(emptyAspectsRef);
      expect(suffix).toBe('');
    });
  });

  describe('Prompt Composition Pipeline', () => {
    it('should compose prompt with negative prompt, brand kit, and style reference', () => {
      const context: GenerationContext = {
        prompt: 'A futuristic electric hypercar',
        campaignGoal: 'drive preorder signups',
        brandKit: {
          id: 'bk-1',
          name: 'Apex Mobility',
          colors: ['#00ffcc', '#003366'],
          fonts: ['Inter', 'Space Grotesk'],
        },
        negativePrompt: 'blurry, low resolution, watermark',
        canvasSize: { width: 1080, height: 1080 },
        styleReference: {
          id: 'ref-1',
          image: 'data:image/png;base64,...',
          aspects: ['style', 'palette'],
          extracted: {
            summary: 'dark metallic minimalism',
            palette: ['#00ffcc', '#003366'],
            textures: 'carbon fiber',
            composition: 'hero side profile',
            typography: 'none',
            mood: 'sleek',
            lighting: 'studio spotlights',
            illustrationStyle: 'photorealistic',
            cameraAngle: 'eye-level',
          },
          analysisStatus: 'ready',
          strength: 'strong',
        },
      };

      const composed = composeGenerationPrompt(context);

      expect(composed).toContain('A futuristic electric hypercar');
      expect(composed).toContain('The design must serve this goal: drive preorder signups.');
      expect(composed).toContain('Follow the "Apex Mobility" brand identity');
      expect(composed).toContain('Strictly emulate this reference');
      expect(composed).toContain('overall visual style: dark metallic minimalism');
      expect(composed).toContain('Composed for a 1080x1080 square canvas.');
      expect(composed).toContain('Avoid the following negative elements: blurry, low resolution, watermark.');
    });
  });
});
