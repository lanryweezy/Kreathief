/**
 * Image Generation Models Configuration
 * All models are accessed via Fal.ai proxy (/api/fal)
 *
 * Every model advertises its own `capabilities`, so generation code branches on a
 * capability flag rather than on hardcoded model ids. Adding a model — or granting an
 * existing one a new power — is a config change, never a change to pipeline logic.
 */

export type ImageModelCategory = 'fast' | 'quality' | 'vector' | 'google' | 'chinese';

export interface ModelCapabilities {
  /** Text-to-image generation. */
  text: boolean;
  /** Can accept an image as context/analysis input. */
  vision: boolean;
  /** Native reference-image conditioning (style/character/product transfer). */
  referenceImage: boolean;
  /** Prompt-driven editing of a supplied image. */
  editing: boolean;
  /** Emits editable SVG rather than raster. */
  svg: boolean;
  upscaling: boolean;
  inpainting: boolean;
}

/** Which body field the endpoint expects the input image(s) in. */
export type ImageInputField = 'image_url' | 'image_urls';

/**
 * Which body field an endpoint takes its output dimensions in. Verified per-endpoint against
 * Fal's OpenAPI specs: the Nano Banana family speaks `aspect_ratio`, most others `image_size`,
 * and flux/dev/image-to-image accepts neither (it inherits the input image's dimensions).
 * Sending the wrong one is silently ignored by Fal, so the requested size would just vanish.
 */
export type ImageSizeField = 'image_size' | 'aspect_ratio' | 'none';

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
  capabilities: ModelCapabilities;
  /**
   * Separate route used for reference-conditioned / edit calls. Fal exposes editing on
   * its own URL, so this must be allowlisted in api/fal.ts independently of falEndpoint.
   * Absent = no native conditioning, pipeline falls back to the style descriptor.
   */
  editEndpoint?: string;
  /** Defaults to 'image_urls' when omitted; only meaningful alongside editEndpoint. */
  imageInputField?: ImageInputField;
  /** Sizing vocabulary of `falEndpoint`. Defaults to 'image_size' when omitted. */
  sizeField?: ImageSizeField;
  /** Sizing vocabulary of `editEndpoint`; falls back to `sizeField` when omitted. */
  editSizeField?: ImageSizeField;
}

// ─── Capability presets ──────────────────────────────────────────────────────
const TEXT_ONLY: ModelCapabilities = {
  text: true,
  vision: false,
  referenceImage: false,
  editing: false,
  svg: false,
  upscaling: false,
  inpainting: false,
};

/** Text-to-image models that also accept a reference image and support editing. */
const REFERENCE_CAPABLE: ModelCapabilities = {
  ...TEXT_ONLY,
  vision: true,
  referenceImage: true,
  editing: true,
};

const VECTOR_ONLY: ModelCapabilities = { ...TEXT_ONLY, svg: true };

export const IMAGE_GEN_MODELS: ImageGenModel[] = [
  // ─── Google Nano Banana ─────────────────────────────────────────────────────
  {
    id: 'nano-banana',
    name: 'Nano Banana',
    provider: 'Google',
    category: 'google',
    falEndpoint: 'https://fal.run/fal-ai/nano-banana',
    editEndpoint: 'https://fal.run/fal-ai/nano-banana/edit',
    imageInputField: 'image_urls',
    sizeField: 'aspect_ratio',
    description: "Google's original image generation — fast, versatile",
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '🍌',
    capabilities: REFERENCE_CAPABLE,
  },
  {
    id: 'nano-banana-2',
    name: 'Nano Banana 2',
    provider: 'Google',
    category: 'google',
    falEndpoint: 'https://fal.run/fal-ai/nano-banana-2',
    editEndpoint: 'https://fal.run/fal-ai/nano-banana-2/edit',
    imageInputField: 'image_urls',
    sizeField: 'aspect_ratio',
    description: "Google's new SOTA — fast generation + editing",
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '🍌',
    capabilities: REFERENCE_CAPABLE,
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    provider: 'Google',
    category: 'google',
    falEndpoint: 'https://fal.run/fal-ai/nano-banana-pro',
    editEndpoint: 'https://fal.run/fal-ai/nano-banana-pro/edit',
    imageInputField: 'image_urls',
    sizeField: 'aspect_ratio',
    description: "Google's best — realism, typography, high fidelity",
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '🍌',
    capabilities: REFERENCE_CAPABLE,
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
    capabilities: TEXT_ONLY,
  },
  {
    id: 'seedream-4-5',
    name: 'Seedream 4.5',
    provider: 'ByteDance',
    category: 'chinese',
    falEndpoint: 'https://fal.run/fal-ai/bytedance/seedream/v4.5/text-to-image',
    editEndpoint: 'https://fal.run/fal-ai/bytedance/seedream/v4.5/edit',
    imageInputField: 'image_urls',
    description: "ByteDance's SOTA — stylized, transform, high quality",
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '🌿',
    capabilities: REFERENCE_CAPABLE,
  },
  {
    id: 'qwen-image',
    name: 'Qwen-Image',
    provider: 'Alibaba',
    category: 'chinese',
    falEndpoint: 'https://fal.run/fal-ai/qwen-image',
    editEndpoint: 'https://fal.run/fal-ai/qwen-image-edit',
    imageInputField: 'image_url',
    description: "Alibaba's image gen — great text rendering + editing",
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '🏮',
    capabilities: REFERENCE_CAPABLE,
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
    capabilities: TEXT_ONLY,
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
    capabilities: TEXT_ONLY,
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
    capabilities: TEXT_ONLY,
  },
  {
    id: 'gpt-image-2',
    name: 'GPT Image 2',
    provider: 'OpenAI',
    category: 'fast',
    falEndpoint: 'https://fal.run/fal-ai/gpt-image-2',
    description: "OpenAI's latest — detailed images, fine typography",
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '⚡',
    capabilities: TEXT_ONLY,
  },

  // ─── Quality — Best output ─────────────────────────────────────────────────
  {
    id: 'flux-dev',
    name: 'FLUX.1 Dev',
    provider: 'Black Forest Labs',
    category: 'quality',
    falEndpoint: 'https://fal.run/fal-ai/flux/dev',
    editEndpoint: 'https://fal.run/fal-ai/flux/dev/image-to-image',
    imageInputField: 'image_url',
    // The image-to-image route derives its dimensions from the input image and exposes no
    // sizing field at all, so nothing size-related may be sent to it.
    editSizeField: 'none',
    description: 'Top-tier text-to-image — photorealistic, detailed',
    supportsAspectRatio: true,
    outputType: 'image',
    icon: '🎯',
    capabilities: REFERENCE_CAPABLE,
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
    capabilities: TEXT_ONLY,
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
    capabilities: TEXT_ONLY,
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
    capabilities: { ...TEXT_ONLY, inpainting: true },
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
    capabilities: TEXT_ONLY,
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
    capabilities: VECTOR_ONLY,
  },
];

export const DEFAULT_IMAGE_MODEL = 'nano-banana-2';

/** Default backend for prompt-driven edits when the caller has no model preference. */
export const DEFAULT_EDIT_MODEL = 'nano-banana-2';

export const getImageModel = (modelId?: string): ImageGenModel | undefined =>
  IMAGE_GEN_MODELS.find((m) => m.id === modelId);

/** True when the model can be conditioned on a reference image natively. */
export const supportsReferenceImage = (modelId?: string): boolean => {
  const model = getImageModel(modelId);
  return Boolean(model?.capabilities.referenceImage && model.editEndpoint);
};

/** Fal's named `image_size` presets, for endpoints that speak that vocabulary. */
const aspectToImageSize = (aspectRatio: string): string => {
  if (aspectRatio === '1:1') {
    return 'square';
  }
  if (aspectRatio === '16:9' || aspectRatio === '4:3') {
    return 'landscape_hd';
  }
  return 'portrait_hd';
};

/**
 * The body fragment carrying the requested output size, expressed in the target endpoint's own
 * vocabulary. Resolved from config rather than branched on per call site, so a model that
 * changes its sizing field is a one-line data edit.
 *
 * Every AspectRatio value ('1:1', '16:9', '9:16', '4:3', '3:4') is itself a valid Fal
 * `aspect_ratio`, so that branch passes through untranslated.
 */
export const buildSizePayload = (
  model: ImageGenModel | undefined,
  aspectRatio: string,
  target: 'generate' | 'edit' = 'generate'
): Record<string, string> => {
  const field: ImageSizeField =
    target === 'edit'
      ? model?.editSizeField ?? model?.sizeField ?? 'image_size'
      : model?.sizeField ?? 'image_size';

  if (field === 'none') {
    return {};
  }
  if (field === 'aspect_ratio') {
    return { aspect_ratio: aspectRatio };
  }
  return { image_size: aspectToImageSize(aspectRatio) };
};

export const IMAGE_MODEL_CATEGORIES: Record<ImageModelCategory, { label: string; description: string }> = {
  google: { label: 'Google', description: 'Nano Banana models' },
  chinese: { label: 'Chinese', description: 'ByteDance, Alibaba, Ideogram' },
  fast: { label: 'Fast', description: 'Quick drafts' },
  quality: { label: 'Quality', description: 'Best output' },
  vector: { label: 'Vector', description: 'Editable SVG' },
};
