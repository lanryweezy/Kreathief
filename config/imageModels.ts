/**
 * Image Generation Models Configuration
 * All models are accessed via Fal.ai proxy (/api/fal)
 */

export type ImageModelCategory = 'fast' | 'quality' | 'vector';

export interface ImageGenModel {
  id: string;
  name: string;
  provider: string;
  category: ImageModelCategory;
  falEndpoint: string;
  description: string;
  supportsAspectRatio: boolean;
  outputType: 'image' | 'svg';
  icon: string;
}

export const IMAGE_GEN_MODELS: ImageGenModel[] = [
  // ─── Fast — Quick generation ───────────────────────────────────────────────
  {
    id: 'flux-schnell',
    name: 'FLUX.1 Schnell',
    provider: 'Black Forest Labs',
    category: 'fast',
    falEndpoint: 'https://fal.run/fal-ai/flux/schnell',
    description: 'Fastest FLUX model — great for quick drafts',
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '⚡',
  },

  // ─── Quality — Best output ─────────────────────────────────────────────────
  {
    id: 'flux-dev',
    name: 'FLUX.1 Dev',
    provider: 'Black Forest Labs',
    category: 'quality',
    falEndpoint: 'https://fal.run/fal-ai/flux/dev',
    description: 'Top-tier text-to-image — photorealistic, detailed',
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '🎯',
  },
  {
    id: 'flux-pro',
    name: 'FLUX.1 Pro',
    provider: 'Black Forest Labs',
    category: 'quality',
    falEndpoint: 'https://fal.run/fal-ai/flux-pro',
    description: 'Highest quality FLUX — commercial grade',
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '🎯',
  },
  {
    id: 'sdxl',
    name: 'Stable Diffusion XL',
    provider: 'Stability AI',
    category: 'quality',
    falEndpoint: 'https://fal.run/fal-ai/fast-sdxl',
    description: 'Versatile, huge community, great for stylized art',
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '🎯',
  },

  // ─── Vector — Editable SVG output ──────────────────────────────────────────
  {
    id: 'recraft-vector',
    name: 'Recraft V3 Vector',
    provider: 'Recraft',
    category: 'vector',
    falEndpoint: 'https://fal.run/fal-ai/recraft-v3/vector',
    description: 'Generates editable SVG vectors — logos, icons, illustrations',
    supportsAspectRatio: false,
    outputType: 'svg',
    icon: '✏️',
  },
];

export const DEFAULT_IMAGE_MODEL = 'flux-dev';

export const IMAGE_MODEL_CATEGORIES: Record<ImageModelCategory, { label: string; description: string }> = {
  fast: { label: 'Fast', description: 'Quick drafts' },
  quality: { label: 'Quality', description: 'Best output' },
  vector: { label: 'Vector', description: 'Editable SVG' },
};
