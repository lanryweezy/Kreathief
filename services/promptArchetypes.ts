/**
 * Extension point for AI generation prompt archetypes.
 *
 * Evidence of extension pressure: The `PROMPT_ARCHETYPES` array in `MagicPanel.tsx`
 * and the `switch (archetype)` blocks in `geminiService.ts` required touching core
 * UI and API service files whenever adding a new prompt style.
 *
 * Contract: Implementors must provide the UI metadata (`label`, `icon`), the
 * semantic `guidance` for the cloud LLM prompt enhancer, and the fallback
 * `localSuffix` used when cloud enhancement fails.
 */
export interface PromptArchetypeStrategy {
  id: string;
  label: string;
  icon: string;
  guidance: string;
  localSuffix: string;
}

export const promptArchetypeStrategies = new Map<string, PromptArchetypeStrategy>();

export const registerPromptArchetypeStrategy = (strategy: PromptArchetypeStrategy) => {
  promptArchetypeStrategies.set(strategy.id, strategy);
};

// Pre-register core strategies
registerPromptArchetypeStrategy({
  id: 'cinematic',
  label: 'Cinematic',
  icon: 'Camera',
  guidance: 'Emphasize cinematic photography: 85mm f/1.4 lens optics, shallow depth of field, natural volumetric lighting, subtle film grain, 8k resolution, photorealistic realism.',
  localSuffix: ', cinematic 35mm photography, natural volumetric lighting, shallow depth of field, f/1.8 aperture, 8k resolution, ultra detailed, photorealistic',
});

registerPromptArchetypeStrategy({
  id: 'artistic',
  label: 'Concept Art',
  icon: 'Brush',
  guidance: 'Emphasize artistic painterly qualities: expressive brushstrokes, tactile canvas texture, rich color harmonies, and atmospheric emotional depth.',
  localSuffix: ', expressive concept art, rich painterly brush strokes, vibrant color harmony, atmospheric lighting, detailed composition',
});

registerPromptArchetypeStrategy({
  id: 'product',
  label: 'Product Shot',
  icon: 'Box',
  guidance: 'Emphasize commercial product photography: studio softbox illumination, clean rim highlights, pristine reflections, neutral cyclorama backdrop, commercial catalog sharpness.',
  localSuffix: ', professional studio product photography, clean reflections, softbox illumination, minimal cyclorama backdrop, catalog grade',
});

registerPromptArchetypeStrategy({
  id: 'render_3d',
  label: '3D Octane',
  icon: 'Sparkles',
  guidance: 'Emphasize high-end 3D digital art: Octane/Blender render, subsurface scattering, ambient occlusion, physically based rendering (PBR), and volumetric caustics.',
  localSuffix: ', 3D Octane render, smooth ray tracing, subsurface scattering, ambient occlusion, physically based shaders, 8k masterpiece',
});

registerPromptArchetypeStrategy({
  id: 'vector_graphic',
  label: 'Vector Graphic',
  icon: 'Edit',
  guidance: 'Emphasize modern graphic design: clean vector line work, bold flat colors, geometric balance, modern SVG illustration aesthetic.',
  localSuffix: ', clean modern vector illustration, bold graphic lines, minimalist geometric styling, vibrant flat color palette, SVG vector',
});

export const DEFAULT_ARCHETYPE_GUIDANCE = 'Include lighting, style, composition, camera perspective, and mood keywords.';
export const DEFAULT_ARCHETYPE_LOCAL_SUFFIX = ', highly detailed, cinematic volumetric lighting, 8k resolution, photorealistic masterpiece, award winning composition';
