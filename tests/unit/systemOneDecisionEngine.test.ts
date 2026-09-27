import { describe, it, expect } from 'vitest';
import {
  classifyUserIntentFast,
  decideEditInPlaceFast,
  routeGenerativePathwayFast,
  selectOptimalFalModel,
  getModelFallbackChain,
  predictAndPrefetchResources,
} from '../../services/systemOneDecisionEngine';

describe('Kreathief System 1 Fast Decision Engine (Jev-Inspired Routing)', () => {
  describe('classifyUserIntentFast', () => {
    it('classifies visual reference with empty prompt as steal_and_remix with high confidence', () => {
      const result = classifyUserIntentFast({
        prompt: '',
        hasStyleReference: true,
        activeLayerCount: 0,
        canvasSize: { width: 1080, height: 1080 },
      });

      expect(result.decision).toBe('steal_and_remix');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.latencyMs).toBeLessThan(50);
    });

    it('classifies explicit image mode as raster_background', () => {
      const result = classifyUserIntentFast({
        prompt: 'Futuristic sports car at sunset',
        hasStyleReference: false,
        activeLayerCount: 0,
        canvasSize: { width: 1920, height: 1080 },
        selectedGenerationMode: 'image',
      });

      expect(result.decision).toBe('raster_background');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('classifies recoloring requests on existing canvas as color_retheme', () => {
      const result = classifyUserIntentFast({
        prompt: 'Change palette to dark mode with neon accents',
        hasStyleReference: false,
        activeLayerCount: 5,
        canvasSize: { width: 1080, height: 1080 },
      });

      expect(result.decision).toBe('color_retheme');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('classifies vector icon queries as vector_icon_search', () => {
      const result = classifyUserIntentFast({
        prompt: 'Minimalist shopping cart svg icon',
        hasStyleReference: false,
        activeLayerCount: 0,
        canvasSize: { width: 1080, height: 1080 },
      });

      expect(result.decision).toBe('vector_icon_search');
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('classifies general prompt as fresh_composition', () => {
      const result = classifyUserIntentFast({
        prompt: 'A bakery flyer announcing 50% discount on croissants',
        hasStyleReference: false,
        activeLayerCount: 0,
        canvasSize: { width: 1080, height: 1080 },
      });

      expect(result.decision).toBe('fresh_composition');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('decideEditInPlaceFast', () => {
    it('returns false when canvas has fewer than 2 layers', () => {
      const result = decideEditInPlaceFast('Make it more modern and darker', 1);
      expect(result.decision).toBe(false);
      expect(result.confidence).toBe(1.0);
    });

    it('returns true when user gives art-direction command on established canvas', () => {
      const result = decideEditInPlaceFast('Make it more premium and fix alignment', 4);
      expect(result.decision).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('returns false when user explicitly requests fresh design from scratch', () => {
      const result = decideEditInPlaceFast('Start fresh and create a new design for concert', 6);
      expect(result.decision).toBe(false);
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe('routeGenerativePathwayFast', () => {
    it('routes fresh_composition to agentic_multilayer', () => {
      const result = routeGenerativePathwayFast('fresh_composition');
      expect(result.decision).toBe('agentic_multilayer');
    });

    it('routes color_retheme directly to direct_style_transfer', () => {
      const result = routeGenerativePathwayFast('color_retheme');
      expect(result.decision).toBe('direct_style_transfer');
    });

    it('routes raster_background to fast_diffusion_raster', () => {
      const result = routeGenerativePathwayFast('raster_background');
      expect(result.decision).toBe('fast_diffusion_raster');
    });

    it('routes vector_icon_search to vector_svg_pipeline', () => {
      const result = routeGenerativePathwayFast('vector_icon_search');
      expect(result.decision).toBe('vector_svg_pipeline');
    });
  });

  describe('selectOptimalFalModel (Jev-Powered Model Selector)', () => {
    it('routes vector and icon prompts to Recraft 20B / v3', () => {
      const result = selectOptimalFalModel('Create a set of isometric delivery vector icons');
      expect(result.decision.id).toBe('recraft-20b');
      expect(result.decision.outputType).toBe('svg');
    });

    it('routes background removal tasks to Bria RemBG in sub-5ms', () => {
      const result = selectOptimalFalModel('Remove background and isolate the model cleanly');
      expect(result.decision.id).toBe('bria-rembg');
      expect(result.confidence).toBeGreaterThanOrEqual(0.95);
      expect(result.latencyMs).toBeLessThan(25);
    });

    it('routes cinematic video requests to Kling 3.0 Pro', () => {
      const result = selectOptimalFalModel('A cinematic commercial video with drone camera flythrough');
      expect(result.decision.id).toBe('kling-3-pro');
      expect(result.decision.category).toBe('video');
    });

    it('routes fast video loop requests to LTX Video', () => {
      const result = selectOptimalFalModel('Quick loop animation preview of floating neon particles');
      expect(result.decision.id).toBe('ltx-video');
    });

    it('routes typography-heavy graphic design requests to Ideogram v2', () => {
      const result = selectOptimalFalModel('A retro coffee shop poster with bold typography text "FRESH BREW DAILY"');
      expect(result.decision.id).toBe('ideogram-v2');
    });

    it('routes 3D mesh requests to Hunyuan 3D', () => {
      const result = selectOptimalFalModel('Generate a 3d glb mesh model of this perfume bottle');
      expect(result.decision.id).toBe('hunyuan-3d');
    });

    it('routes voiceover narration requests to F5 TTS', () => {
      const result = selectOptimalFalModel('Generate natural emotional voiceover speech for promo');
      expect(result.decision.id).toBe('f5-tts');
    });

    it('routes sound effects and audio ambience requests to Stable Audio 2.0', () => {
      const result = selectOptimalFalModel('Generate cinematic whoosh sound effect and ambient bgm');
      expect(result.decision.id).toBe('stable-audio');
      expect(result.decision.category).toBe('audio');
    });

    it('routes 4K ultra photorealism requests to FLUX 1.1 Pro Ultra', () => {
      const result = selectOptimalFalModel('A 4k ultra medium format editorial fashion photo');
      expect(result.decision.id).toBe('flux-1.1-pro-ultra');
      expect(result.decision.speedRating).toBe('moderate');
    });

    it('routes localized inpainting requests to FLUX.1 Inpainting', () => {
      const result = selectOptimalFalModel('Inpaint brush fill and replace the sunglasses');
      expect(result.decision.id).toBe('flux-inpaint');
      expect(result.decision.category).toBe('enhancement');
    });

    it('routes talking avatar lip sync requests to LatentSync', () => {
      const result = selectOptimalFalModel('Perform lip sync matching mouth motion to audio file');
      expect(result.decision.id).toBe('latentsync');
      expect(result.decision.category).toBe('video');
    });

    it('routes 3D gaussian splatting requests to Microsoft Trellis', () => {
      const result = selectOptimalFalModel('Reconstruct 3d gaussian splatting radiance field from photo');
      expect(result.decision.id).toBe('trellis-3d');
      expect(result.decision.category).toBe('3d');
    });

    it('routes fast artifact reduction upscaling to Aura-SR', () => {
      const result = selectOptimalFalModel('Fast sub-second upscale with artifact denoise');
      expect(result.decision.id).toBe('aura-sr');
    });

    it('defaults to SOTA FLUX 1.1 Pro for high-fidelity photorealistic requests', () => {
      const result = selectOptimalFalModel('A hyperrealistic portrait of a cyberpunk samurai in the rain');
      expect(result.decision.id).toBe('flux-1.1-pro');
    });

    it('routes general image prompts to flux-schnell in fast_draft budget mode', () => {
      const result = selectOptimalFalModel('A futuristic cyber city skyline', {
        budgetMode: 'fast_draft',
      });
      expect(result.decision.id).toBe('flux-schnell');
      expect(result.decision.typicalLatencySeconds).toBeLessThan(1.0);
    });

    it('routes video prompts to ltx-video in fast_draft budget mode', () => {
      const result = selectOptimalFalModel('A flowing river at sunset', 'video', {
        budgetMode: 'fast_draft',
      });
      expect(result.decision.id).toBe('ltx-video');
      expect(result.decision.typicalLatencySeconds).toBeLessThan(5.0);
    });

    it('routes editorial photo prompts to flux-1.1-pro-ultra in high_fidelity budget mode', () => {
      const result = selectOptimalFalModel('Luxury watch advertisement', {
        budgetMode: 'high_fidelity',
      });
      expect(result.decision.id).toBe('flux-1.1-pro-ultra');
      expect(result.decision.typicalLatencySeconds).toBeGreaterThanOrEqual(5.0);
    });

    it('downgrades model selection when maxLatencySeconds is constrained', () => {
      // By default, general video routes to kling-3-pro (25.0s)
      const unconstrained = selectOptimalFalModel('Epic battle scene video');
      expect(unconstrained.decision.id).toBe('kling-3-pro');

      // With maxLatencySeconds = 5.0s, it downgrades to ltx-video (4.5s)
      const constrained = selectOptimalFalModel('Epic battle scene video', {
        maxLatencySeconds: 5.0,
      });
      expect(constrained.decision.id).toBe('ltx-video');
      expect(constrained.decision.typicalLatencySeconds).toBeLessThanOrEqual(5.0);
    });
  });

  describe('getModelFallbackChain', () => {
    it('returns an ordered resilient fallback chain for FLUX models', () => {
      const fallbacks = getModelFallbackChain('flux-1.1-pro');
      expect(fallbacks.length).toBeGreaterThan(0);
      const ids = fallbacks.map((f) => f.id);
      expect(ids).toContain('flux-dev');
      expect(ids).toContain('flux-schnell');
    });

    it('sorts fallbacks fastest-first in fast_draft budget mode', () => {
      const fallbacks = getModelFallbackChain('kling-3-pro', 'fast_draft');
      expect(fallbacks.length).toBeGreaterThanOrEqual(2);
      expect(fallbacks[0].typicalLatencySeconds).toBeLessThanOrEqual(fallbacks[1].typicalLatencySeconds);
    });
  });

  describe('predictAndPrefetchResources', () => {
    it('predicts vector assets and warms paper_geometry and svg_engine for icon typing', () => {
      const warmed: string[] = [];
      const prediction = predictAndPrefetchResources('A modern svg icon for', (key) => {
        warmed.push(key);
      });

      expect(prediction.predictedKeywords).toContain('vector');
      expect(prediction.suggestedToolAssets).toContain('paper_geometry');
      expect(prediction.suggestedToolAssets).toContain('svg_engine');
      expect(prediction.suggestedModels).toContain('fal-ai/recraft-v3');
      expect(warmed).toContain('module:paper_geometry');
      expect(warmed).toContain('pipeline:svg_engine');
    });

    it('is idempotent and does not re-warm previously warmed resources', () => {
      const secondCallWarmed: string[] = [];
      const prediction = predictAndPrefetchResources('A modern svg icon for cart', (key) => {
        secondCallWarmed.push(key);
      });

      // Already warmed in previous test
      expect(prediction.newlyWarmed.length).toBe(0);
      expect(secondCallWarmed.length).toBe(0);
    });

    it('predicts video assets and warms video_canvas module for animation queries', () => {
      const prediction = predictAndPrefetchResources('Create an anim video clip of stars');
      expect(prediction.predictedKeywords).toContain('video');
      expect(prediction.suggestedToolAssets).toContain('video_canvas');
      expect(prediction.suggestedModels).toContain('fal-ai/kling-video/v3/pro');
    });
  });
});

