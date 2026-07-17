/**
 * Image Generation Models Configuration
 * All models are accessed via Fal.ai proxy (/api/fal)
 */

export type ImageModelCategory = 'fast' | 'quality' | 'vector' | 'google' | 'chinese';

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
  // ─── Google Nano Banana ─────────────────────────────────────────────────────
  {
    id: 'nano-banana',
    name: 'Nano Banana',
    provider: 'Google',
    category: 'google',
    falEndpoint: 'https://fal.run/fal-ai/nano-banana',
    description: "Google's original image generation — fast, versatile",
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '🍌',
  },
  {
    id: 'nano-banana-2',
    name: 'Nano Banana 2',
    provider: 'Google',
    category: 'google',
    falEndpoint: 'https://fal.run/fal-ai/nano-banana-2',
    description: "Google's new SOTA — fast generation + editing",
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '🍌',
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    provider: 'Google',
    category: 'google',
    falEndpoint: 'https://fal.run/fal-ai/nano-banana-pro',
    description: "Google's best — realism, typography, high fidelity",
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '🍌',
  },

  // ─── Chinese Models ─────────────────────────────────────────────────────────
  {
    id: 'seedream-5-lite',
    name: 'Seedream 5.0 Lite',
    provider: 'ByteDance',
    category: 'chinese',
    falEndpoint: 'https://fal.run/fal-ai/bytedance/seedream/v5/lite/text-to-image',
    description: "ByteDance's fast image gen — stylized, creative",
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '🌿',
  },
  {
    id: 'seedream-4-5',
    name: 'Seedream 4.5',
    provider: 'ByteDance',
    category: 'chinese',
    falEndpoint: 'https://fal.run/fal-ai/bytedance/seedream/v4.5/text-to-image',
    description: "ByteDance's SOTA — stylized, transform, high quality",
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '🌿',
  },
  {
    id: 'qwen-image',
    name: 'Qwen-Image',
    provider: 'Alibaba',
    category: 'chinese',
    falEndpoint: 'https://fal.run/fal-ai/qwen-image',
    description: "Alibaba's image gen — great text rendering + editing",
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '🏮',
  },
  {
    id: 'ideogram-v3',
    name: 'Ideogram V3',
    provider: 'Ideogram',
    category: 'chinese',
    falEndpoint: 'https://fal.run/fal-ai/ideogram/v3',
    description: 'Best typography in AI images — posters, logos, text-heavy designs',
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '✨',
  },
  {
    id: 'ideogram-v4',
    name: 'Ideogram V4',
    provider: 'Ideogram',
    category: 'chinese',
    falEndpoint: 'https://fal.run/fal-ai/ideogram/v4',
    description: 'Latest Ideogram — crisp visuals, accurate text, full creative control',
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '✨',
  },

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
  {
    id: 'gpt-image-2',
    name: 'GPT Image 2',
    provider: 'OpenAI',
    category: 'fast',
    falEndpoint: 'https://fal.run/fal-ai/openai/gpt-image-2',
    description: "OpenAI's latest — detailed images, fine typography",
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
    id: 'flux-2-pro',
    name: 'FLUX.2 Pro',
    provider: 'Black Forest Labs',
    category: 'quality',
    falEndpoint: 'https://fal.run/fal-ai/flux-2-pro',
    description: 'Latest FLUX — enhanced realism, crisp text, native editing',
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
  {
    id: 'recraft-v4',
    name: 'Recraft V4 Pro',
    provider: 'Recraft',
    category: 'quality',
    falEndpoint: 'https://fal.run/fal-ai/recraft/v4/pro/text-to-image',
    description: 'Design-grade output — brand systems, production workflows',
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

export const DEFAULT_IMAGE_MODEL = 'nano-banana-2';

export const IMAGE_MODEL_CATEGORIES: Record<ImageModelCategory, { label: string; description: string }> = {
  google: { label: 'Google', description: 'Nano Banana models' },
  chinese: { label: 'Chinese', description: 'ByteDance, Alibaba, Ideogram' },
  fast: { label: 'Fast', description: 'Quick drafts' },
  quality: { label: 'Quality', description: 'Best output' },
  vector: { label: 'Vector', description: 'Editable SVG' },
};
