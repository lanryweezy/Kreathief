export interface PromptArchetypeStrategy {
  id: string;
  label: string;
  icon: string;
  guidance: string;
  enhanceLocally: (cleanPrompt: string) => string;
}

const promptArchetypeStrategies = new Map<string, PromptArchetypeStrategy>();

export const registerPromptArchetype = (strategy: PromptArchetypeStrategy): void => {
  promptArchetypeStrategies.set(strategy.id, strategy);
};

export const getPromptArchetype = (id: string): PromptArchetypeStrategy | undefined => {
  return promptArchetypeStrategies.get(id);
};

export const getAllPromptArchetypes = (): PromptArchetypeStrategy[] => {
  return Array.from(promptArchetypeStrategies.values());
};

// --- Register Core Archetypes ---

registerPromptArchetype({
  id: 'cinematic',
  label: 'Cinematic',
  icon: 'Camera',
  guidance: 'Emphasize cinematic photography: 85mm f/1.4 lens optics, shallow depth of field, natural volumetric lighting, subtle film grain, 8k resolution, photorealistic realism.',
  enhanceLocally: (clean) => `${clean}, cinematic 35mm photography, natural volumetric lighting, shallow depth of field, f/1.8 aperture, 8k resolution, ultra detailed, photorealistic`,
});

registerPromptArchetype({
  id: 'artistic',
  label: 'Concept Art',
  icon: 'Brush',
  guidance: 'Emphasize artistic painterly qualities: expressive brushstrokes, tactile canvas texture, rich color harmonies, and atmospheric emotional depth.',
  enhanceLocally: (clean) => `${clean}, expressive concept art, rich painterly brush strokes, vibrant color harmony, atmospheric lighting, detailed composition`,
});

registerPromptArchetype({
  id: 'product',
  label: 'Product Shot',
  icon: 'Box',
  guidance: 'Emphasize commercial product photography: studio softbox illumination, clean rim highlights, pristine reflections, neutral cyclorama backdrop, commercial catalog sharpness.',
  enhanceLocally: (clean) => `${clean}, professional studio product photography, clean reflections, softbox illumination, minimal cyclorama backdrop, catalog grade`,
});

registerPromptArchetype({
  id: 'render_3d',
  label: '3D Octane',
  icon: 'Sparkles',
  guidance: 'Emphasize high-end 3D digital art: Octane/Blender render, subsurface scattering, ambient occlusion, physically based rendering (PBR), and volumetric caustics.',
  enhanceLocally: (clean) => `${clean}, 3D Octane render, smooth ray tracing, subsurface scattering, ambient occlusion, physically based shaders, 8k masterpiece`,
});

registerPromptArchetype({
  id: 'vector_graphic',
  label: 'Vector Graphic',
  icon: 'Edit',
  guidance: 'Emphasize modern graphic design: clean vector line work, bold flat colors, geometric balance, modern SVG illustration aesthetic.',
  enhanceLocally: (clean) => `${clean}, clean modern vector illustration, bold graphic lines, minimalist geometric styling, vibrant flat color palette, SVG vector`,
});
