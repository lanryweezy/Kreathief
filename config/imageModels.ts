import * as CompanyLogos from '../components/CompanyLogos';
import { Icons } from '../constants';
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
  /**
   * Second vector path: this model's *raster* output can be auto-promoted to editable
   * SVG by the built-in ImageTracer trace (see utils/svgIngest + vectorizerService).
   * Enabled only on flat/graphic models whose output survives a trace cleanly. This is
   * what lets "generate logo" fall back to a real vector when the native SVG model
   * (Recraft) is down, instead of dead-ending — and it stays a data decision, so no
   * call site hardcodes a model id to get vector resilience.
   */
  rasterToVector: boolean;
  upscaling: boolean;
  inpainting: boolean;
  /**
   * Model generates images with a native alpha/transparency channel (RGBA).
   * When true the design agent dispatches hero-cutout layers directly to this
   * model and skips the secondary Freepik background-removal round-trip.
   * Enabled for Qwen-Image-2.1 (64-channel RGBA autoencoder, A=0 for transparent areas).
   */
  nativeTransparency: boolean;
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
  icon: any;
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
  rasterToVector: false,
  upscaling: false,
  inpainting: false,
  nativeTransparency: false,
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
    icon: CompanyLogos.AlibabaLogo,
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
    icon: CompanyLogos.AlibabaLogo,
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
    icon: CompanyLogos.AlibabaLogo,
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
    icon: CompanyLogos.AlibabaLogo,
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
    icon: CompanyLogos.AlibabaLogo,
    capabilities: { ...REFERENCE_CAPABLE, rasterToVector: true },
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
    icon: CompanyLogos.AlibabaLogo,
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
    icon: CompanyLogos.GoogleLogo,
    capabilities: { ...TEXT_ONLY, rasterToVector: true },
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
    icon: CompanyLogos.GoogleLogo,
    capabilities: { ...TEXT_ONLY, rasterToVector: true },
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
    icon: CompanyLogos.GoogleLogo,
    capabilities: TEXT_ONLY,
  },
  
  {
    id: 'gpt-image-2-5',
    name: 'GPT Image 2.5',
    provider: 'OpenAI',
    category: 'fast',
    falEndpoint: 'https://fal.run/fal-ai/gpt-image-2-5',
    description: "OpenAI's highly-refined iteration — superb typography and layout",
    supportsAspectRatio: true,
    outputType: 'image',
    icon: CompanyLogos.ByteDanceLogo,
    capabilities: TEXT_ONLY,
  },{
    id: 'gpt-image-2',
    name: 'GPT Image 2',
    provider: 'OpenAI',
    category: 'fast',
    falEndpoint: 'https://fal.run/fal-ai/gpt-image-2',
    description: "OpenAI's latest — detailed images, fine typography",
    supportsAspectRatio: true,
    outputType: 'image',
    icon: CompanyLogos.ByteDanceLogo,
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
    icon: CompanyLogos.AlibabaLogo,
    capabilities: REFERENCE_CAPABLE,
  },
  
  {
    id: 'flux-1-1-pro-ultra',
    name: 'FLUX.1.1 Pro Ultra',
    provider: 'Black Forest Labs',
    category: 'quality',
    falEndpoint: 'https://fal.run/fal-ai/flux-pro/v1.1-ultra',
    description: 'SOTA 4K Image Generation - peerless photorealism and typography',
    supportsAspectRatio: true,
    outputType: 'image',
    icon: CompanyLogos.AlibabaLogo,
    capabilities: TEXT_ONLY,
  },
  {
    id: 'flux-1-1-pro',
    name: 'FLUX.1.1 Pro',
    provider: 'Black Forest Labs',
    category: 'fast',
    falEndpoint: 'https://fal.run/fal-ai/flux-pro/v1.1',
    description: 'Blazing fast SOTA model for 2026',
    supportsAspectRatio: true,
    outputType: 'image',
    icon: CompanyLogos.IdeogramLogo,
    capabilities: TEXT_ONLY,
  },
  {
    id: 'recraft-v3-svg',
    name: 'Recraft V3 (Native Vector)',
    provider: 'Recraft',
    category: 'vector',
    falEndpoint: 'https://fal.run/fal-ai/recraft-v3/text-to-svg',
    description: 'Generates pure, editable SVG vector paths natively',
    supportsAspectRatio: true,
    outputType: 'svg',
    icon: CompanyLogos.IdeogramLogo,
    capabilities: VECTOR_ONLY,
  },
  {
    id: 'luma-photon',
    name: 'Luma Photon',
    provider: 'Luma AI',
    category: 'quality',
    falEndpoint: 'https://fal.run/fal-ai/luma/photon',
    description: 'Extremely fast, highly aesthetic hyper-realism',
    supportsAspectRatio: true,
    outputType: 'image',
    icon: CompanyLogos.IdeogramLogo,
    capabilities: TEXT_ONLY,
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
    icon: CompanyLogos.AlibabaLogo,
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
    icon: CompanyLogos.AlibabaLogo,
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
    icon: CompanyLogos.AlibabaLogo,
    capabilities: { ...TEXT_ONLY, inpainting: true },
  },
  {
    id: 'recraft-v4',
    name: 'Recraft V4 Pro',
    provider: 'Recraft',
    category: 'quality',
    falEndpoint: 'https://fal.run/fal-ai/recraft/v4/pro/text-to-image',
    description: "Design-grade output — brand systems, production workflows",
    supportsAspectRatio: true,
    outputType: 'image',
    icon: CompanyLogos.AlibabaLogo,
    capabilities: { ...TEXT_ONLY, rasterToVector: true },
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
    icon: CompanyLogos.AlibabaLogo,
    capabilities: VECTOR_ONLY,
  },
];

export const DEFAULT_IMAGE_MODEL = 'flux-1-1-pro-ultra';

/** Default backend for prompt-driven edits when the caller has no model preference. */
export const DEFAULT_EDIT_MODEL = 'nano-banana-2';

/**
 * Design Agent specialist routing constants — change here to swap models per layer role.
 */
/** Hero-cutout layers → native RGBA transparent PNG; no secondary bg-removal round-trip. */
export const DEFAULT_CUTOUT_MODEL = 'qwen-image-2-1';
/** Vector accent layers → pure editable SVG paths via Recraft V3. */
export const DEFAULT_VECTOR_ACCENT_MODEL = 'recraft-v3-svg';
/** Background layers → photorealistic/atmospheric raster stage (must contain no text). */
export const DEFAULT_BACKGROUND_MODEL = 'flux-1-1-pro-ultra';


export const getImageModel = (modelId?: string): ImageGenModel | undefined =>
  IMAGE_GEN_MODELS.find((m) => m.id === modelId);

/** True when the model can be conditioned on a reference image natively. */
export const supportsReferenceImage = (modelId?: string): boolean => {
  const model = getImageModel(modelId);
  return Boolean(model?.capabilities.referenceImage && model.editEndpoint);
};

/** True when the model's raster output can be promoted to editable SVG via trace. */
export const supportsVectorTrace = (modelId?: string): boolean =>
  Boolean(getImageModel(modelId)?.capabilities.rasterToVector);

/**
 * Vector-friendliness preference order for the raster->trace fallback. Recraft and
 * Ideogram emit the flattest, highest-contrast shapes that ImageTracer reduces cleanly;
 * photographic models (FLUX/Nano Banana realism) are intentionally excluded because a
 * trace of them produces node-bloat no designer would ship.
 */
const VECTOR_TRACE_ORDER = ['recraft-v4', 'ideogram-v4', 'ideogram-v3', 'seedream-4-5'];

/**
 * The model to route through when a native-SVG generation fails and we need a real
 * vector back-stop: the highest-preference `rasterToVector` model, excluding any the
 * caller already tried. Returns undefined only if no trace-capable model exists,
 * which the caller treats as "fall through to procedural".
 */
export const getVectorTraceFallbackModel = (excludeIds: string[] = []): ImageGenModel | undefined => {
  const skip = new Set(excludeIds);
  for (const id of VECTOR_TRACE_ORDER) {
    const m = getImageModel(id);
    if (m && m.capabilities.rasterToVector && !skip.has(id)) return m;
  }
  return IMAGE_GEN_MODELS.find((m) => m.capabilities.rasterToVector && !skip.has(m.id));
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
