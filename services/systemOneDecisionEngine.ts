/**
 * =====================================================================
 * KREATHIEF SYSTEM 1 DECISION ENGINE (Fast Typed Decision & Routing Layer)
 * =====================================================================
 * Inspired by ultra-fast decision models (like Jev by TypeSafe AI / OpenRouter Decisions).
 * 
 * Traditional LLMs (System 2) stream tokens and are slow/expensive for simple decisions.
 * System 1 provides sub-50ms deterministic structured decisions:
 *  - Choice: Multi-class categorical routing
 *  - Boolean: Fast gating (e.g. edit-in-place vs fresh design)
 *  - Score: Numeric quality & contrast grading (0-100)
 *  - Probability: Confidence calibrated routing vectors
 */

import { log } from '../utils/log';
import { CanvasSize, Layer } from '../types';

export type UserIntentCategory =
  | 'fresh_composition'       // Create brand new multi-layer design
  | 'steal_and_remix'          // Deconstruct & remix visual reference
  | 'in_place_transform'       // Modify existing layers on active canvas
  | 'color_retheme'            // Change palette/mood across layers
  | 'copy_refinement'          // Polish/translate/generate typography
  | 'raster_background'        // Generate flat single image background
  | 'vector_icon_search'       // Search or generate SVG vector asset
  | 'accessibility_audit'      // Run WCAG and layout compliance check
  | 'video_generation'         // Route to VideoAgentPanel
  | 'omnichannel_campaign'     // Route to CampaignPanel
  | 'text_effects_agent'       // Route to TextAgentPanel
  | 'product_mockup';          // Route to MockupPanel

export type GenerativeModelPathway =
  | 'agentic_multilayer'       // 3-stage Design Agent (AST + Text + Shapes)
  | 'fast_diffusion_raster'    // Flux Schnell / SDXL single image
  | 'vector_svg_pipeline'      // Clean SVG vector generation
  | 'typographic_typesetter'   // Brand font pair generator & warp engine
  | 'direct_style_transfer';   // Deterministic aesthetic matrix

export interface DecisionResult<T> {
  decision: T;
  confidence: number;          // 0.0 to 1.0
  latencyMs: number;
  reasoningBrief: string;
  source: 'local_fast_kernel' | 'cloud_decision_model';
}

export interface IntentClassificationContext {
  prompt: string;
  hasStyleReference: boolean;
  activeLayerCount: number;
  canvasSize: CanvasSize;
  selectedGenerationMode?: 'design' | 'image';
}

/**
 * Fast System 1 Intent Classifier (Sub-10ms Local Fast Kernel with Cloud API fallback)
 */
export function classifyUserIntentFast(
  context: IntentClassificationContext
): DecisionResult<UserIntentCategory> {
  const startTime = performance.now();
  const rawPrompt = (context.prompt || '').trim().toLowerCase();

  // Rule 1: Visual reference without extensive transform prompt -> Steal & Remix
  if (context.hasStyleReference && (!rawPrompt || rawPrompt.startsWith('remix') || rawPrompt.startsWith('steal') || rawPrompt.includes('this reference') || rawPrompt.includes('reverse-engineer'))) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      decision: 'steal_and_remix',
      confidence: 0.98,
      latencyMs: elapsed,
      reasoningBrief: 'Visual reference attached with remix intent',
      source: 'local_fast_kernel',
    };
  }

  // Domain Routing: Omnichannel Campaign
  if (/\b(campaign|multi-channel|launch campaign|across platforms|all sizes)\b/i.test(rawPrompt)) {
    return {
      decision: 'omnichannel_campaign',
      confidence: 0.95,
      latencyMs: Math.round(performance.now() - startTime),
      reasoningBrief: 'User explicitly requested a multi-format campaign',
      source: 'local_fast_kernel',
    };
  }

  // Domain Routing: Video Generation
  if (/\b(video|animation|animate|motion|mp4|reel|tiktok|youtube intro)\b/i.test(rawPrompt)) {
    return {
      decision: 'video_generation',
      confidence: 0.92,
      latencyMs: Math.round(performance.now() - startTime),
      reasoningBrief: 'Detected strong motion/video keywords in prompt',
      source: 'local_fast_kernel',
    };
  }

  // Domain Routing: Text Effects Agent
  if (/\b(text effect|3d text|typography effect|warp text|neon text|metal text)\b/i.test(rawPrompt)) {
    return {
      decision: 'text_effects_agent',
      confidence: 0.90,
      latencyMs: Math.round(performance.now() - startTime),
      reasoningBrief: 'Detected 3D/stylized text effect request',
      source: 'local_fast_kernel',
    };
  }

  // Domain Routing: Product Mockups
  if (/\b(mockup|apparel|t-shirt|tshirt|hoodie|billboard|bus stop|iphone mockup|macbook mockup|put it on a)\b/i.test(rawPrompt)) {
    return {
      decision: 'product_mockup',
      confidence: 0.94,
      latencyMs: Math.round(performance.now() - startTime),
      reasoningBrief: 'User wants to visualize a design on a physical product/screen',
      source: 'local_fast_kernel',
    };
  }

  // Rule 2: Explicit mode 'image'
  if (context.selectedGenerationMode === 'image') {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      decision: 'raster_background',
      confidence: 0.95,
      latencyMs: elapsed,
      reasoningBrief: 'User explicitly selected single raster image generation mode',
      source: 'local_fast_kernel',
    };
  }

  // Rule 3: Canvas has active layers & prompt expresses edit commands
  if (context.activeLayerCount >= 2) {
    const isColorEdit = /\b(recolor|palette|dark mode|light mode|neon theme|gold|pastel|monochrome)\b/i.test(rawPrompt);
    const isCopyEdit = /\b(change text|rewrite|headline|spelling|translate|slogan|tagline)\b/i.test(rawPrompt);
    const isTransformEdit = /\b(make it|align|move|resize|scale|spacing|border|contrast|bigger|smaller)\b/i.test(rawPrompt);

    if (isColorEdit) {
      return {
        decision: 'color_retheme',
        confidence: 0.94,
        latencyMs: Math.round(performance.now() - startTime),
        reasoningBrief: 'Targeted color and palette transformation on existing layers',
        source: 'local_fast_kernel',
      };
    }

    if (isCopyEdit) {
      return {
        decision: 'copy_refinement',
        confidence: 0.92,
        latencyMs: Math.round(performance.now() - startTime),
        reasoningBrief: 'Textual refinement on existing copy layers',
        source: 'local_fast_kernel',
      };
    }

    if (isTransformEdit) {
      return {
        decision: 'in_place_transform',
        confidence: 0.91,
        latencyMs: Math.round(performance.now() - startTime),
        reasoningBrief: 'In-place layout and styling adjustment',
        source: 'local_fast_kernel',
      };
    }
  }

  // Rule 4: Vector / Icon requests
  if (/\b(icon|vector|svg|logo symbol|glyph)\b/i.test(rawPrompt)) {
    return {
      decision: 'vector_icon_search',
      confidence: 0.89,
      latencyMs: Math.round(performance.now() - startTime),
      reasoningBrief: 'Vector icon or scalable glyph generation request',
      source: 'local_fast_kernel',
    };
  }

  // Rule 5: Accessibility / Audit
  if (/\b(score|audit|critique|check contrast|wcag|compliance)\b/i.test(rawPrompt)) {
    return {
      decision: 'accessibility_audit',
      confidence: 0.96,
      latencyMs: Math.round(performance.now() - startTime),
      reasoningBrief: 'Accessibility and visual audit evaluation',
      source: 'local_fast_kernel',
    };
  }

  // Default: Fresh multi-layer composition
  return {
    decision: 'fresh_composition',
    confidence: 0.88,
    latencyMs: Math.round(performance.now() - startTime),
    reasoningBrief: 'Fresh multi-layer graphic design generation',
    source: 'local_fast_kernel',
  };
}

/**
 * Fast Boolean Gating: Determines whether the agent should transform in-place vs create new project
 */
export function decideEditInPlaceFast(
  prompt: string,
  layerCount: number
): DecisionResult<boolean> {
  const startTime = performance.now();
  const lower = prompt.toLowerCase();

  // If no existing layers, cannot edit in place
  if (layerCount < 2) {
    return {
      decision: false,
      confidence: 1.0,
      latencyMs: Math.round(performance.now() - startTime),
      reasoningBrief: 'Canvas contains fewer than 2 layers — generating fresh design',
      source: 'local_fast_kernel',
    };
  }

  // Strong in-place keywords
  const inPlaceRegex = /\b(make it|change|tweak|replace|swap|turn into|darker|lighter|recolor|shift|align|translate|fix|more premium)\b/i;
  const freshRegex = /\b(create a new|start fresh|new design|generate a flyer|from scratch|blank)\b/i;

  if (freshRegex.test(lower)) {
    return {
      decision: false,
      confidence: 0.95,
      latencyMs: Math.round(performance.now() - startTime),
      reasoningBrief: 'User explicitly requested a fresh design from scratch',
      source: 'local_fast_kernel',
    };
  }

  const shouldEdit = inPlaceRegex.test(lower);
  return {
    decision: shouldEdit,
    confidence: shouldEdit ? 0.92 : 0.75,
    latencyMs: Math.round(performance.now() - startTime),
    reasoningBrief: shouldEdit
      ? 'Art-direction command detected — modifying active canvas in place'
      : 'Ambiguous command with existing layers — defaulting to fresh direction',
    source: 'local_fast_kernel',
  };
}

/**
 * Optimal Model Pathway Router: Picks the fastest, highest-quality model pipeline
 */
export function routeGenerativePathwayFast(
  intent: UserIntentCategory,
  userPlan: string = 'free'
): DecisionResult<GenerativeModelPathway> {
  const startTime = performance.now();

  switch (intent) {
    case 'steal_and_remix':
    case 'fresh_composition':
      return {
        decision: 'agentic_multilayer',
        confidence: 0.97,
        latencyMs: Math.round(performance.now() - startTime),
        reasoningBrief: 'Requires multi-layer AST scene synthesis and typography pairing',
        source: 'local_fast_kernel',
      };
    case 'raster_background':
      return {
        decision: 'fast_diffusion_raster',
        confidence: 0.96,
        latencyMs: Math.round(performance.now() - startTime),
        reasoningBrief: 'Single raster image background requested',
        source: 'local_fast_kernel',
      };
    case 'vector_icon_search':
      return {
        decision: 'vector_svg_pipeline',
        confidence: 0.93,
        latencyMs: Math.round(performance.now() - startTime),
        reasoningBrief: 'Scalable SVG vector generation pipeline',
        source: 'local_fast_kernel',
      };
    case 'color_retheme':
      return {
        decision: 'direct_style_transfer',
        confidence: 0.99,
        latencyMs: Math.round(performance.now() - startTime),
        reasoningBrief: 'Deterministic color palette and contrast matrix reassignment',
        source: 'local_fast_kernel',
      };
    case 'copy_refinement':
      return {
        decision: 'typographic_typesetter',
        confidence: 0.95,
        latencyMs: Math.round(performance.now() - startTime),
        reasoningBrief: 'Textual hierarchy and font pairing optimizer',
        source: 'local_fast_kernel',
      };
    default:
      return {
        decision: 'agentic_multilayer',
        confidence: 0.85,
        latencyMs: Math.round(performance.now() - startTime),
        reasoningBrief: 'Standard multi-layer design agent pathway',
        source: 'local_fast_kernel',
      };
  }
}

export interface FalModelEntry {
  id: string;
  name: string;
  provider: string;
  category: 'image' | 'video' | 'audio' | '3d' | 'vector' | 'enhancement';
  falEndpoint: string;
  bestFor: string;
  speedRating: 'realtime' | 'fast' | 'moderate' | 'heavy';
  strengths: string[];
  outputType: 'image' | 'video' | 'audio' | '3d' | 'svg';
  typicalLatencySeconds: number;
}

export const FAL_MODELS_DIRECTORY: Record<string, FalModelEntry> = {
  // ─── Image & Typography ──────────────────────────────────────────
  'flux-1.1-pro-ultra': {
    id: 'flux-1.1-pro-ultra',
    name: 'FLUX 1.1 Pro Ultra',
    provider: 'Black Forest Labs',
    category: 'image',
    falEndpoint: 'fal-ai/flux-pro/v1.1-ultra',
    bestFor: '4K ultra-high resolution generation, raw photo realism, medium-format camera aesthetics, and premium editorial campaigns.',
    speedRating: 'moderate',
    strengths: ['4K resolution', 'Raw textures', 'Master lighting', 'Editorial realism'],
    outputType: 'image',
    typicalLatencySeconds: 8.0,
  },
  'flux-1.1-pro': {
    id: 'flux-1.1-pro',
    name: 'FLUX 1.1 Pro',
    provider: 'Black Forest Labs',
    category: 'image',
    falEndpoint: 'fal-ai/flux-pro/v1.1',
    bestFor: 'State-of-the-art visual fidelity, photorealistic hero images, commercial advertising, and fine texture detail.',
    speedRating: 'fast',
    strengths: ['SOTA detail', 'Prompt adherence', 'Lighting & textures', 'Photorealism'],
    outputType: 'image',
    typicalLatencySeconds: 3.5,
  },
  'flux-dev': {
    id: 'flux-dev',
    name: 'FLUX.1 [dev]',
    provider: 'Black Forest Labs',
    category: 'image',
    falEndpoint: 'fal-ai/flux/dev',
    bestFor: 'Fine-tuned character consistency, LoRA styles, and reference image conditioning.',
    speedRating: 'moderate',
    strengths: ['LoRA support', 'Character consistency', 'Stylization'],
    outputType: 'image',
    typicalLatencySeconds: 5.0,
  },
  'flux-schnell': {
    id: 'flux-schnell',
    name: 'FLUX.1 [schnell]',
    provider: 'Black Forest Labs',
    category: 'image',
    falEndpoint: 'fal-ai/flux/schnell',
    bestFor: 'Sub-second real-time image generation, live canvas feedback, and high-throughput brainstorming.',
    speedRating: 'realtime',
    strengths: ['4-step diffusion', 'Sub-second latency', 'Cost-effective'],
    outputType: 'image',
    typicalLatencySeconds: 0.8,
  },
  'flux-inpaint': {
    id: 'flux-inpaint',
    name: 'FLUX.1 Inpainting',
    provider: 'Black Forest Labs',
    category: 'enhancement',
    falEndpoint: 'fal-ai/flux/inpaint',
    bestFor: 'Precision brush-masked localized inpainting, seamless object replacement, and image expansion.',
    speedRating: 'fast',
    strengths: ['Seamless blending', 'Context-aware fill', 'Object replacement'],
    outputType: 'image',
    typicalLatencySeconds: 4.0,
  },
  'ideogram-v2': {
    id: 'ideogram-v2',
    name: 'Ideogram v2',
    provider: 'Ideogram',
    category: 'image',
    falEndpoint: 'fal-ai/ideogram/v2',
    bestFor: 'In-image graphic design typography, logos with text, signage, quotes, and t-shirt graphic layout.',
    speedRating: 'moderate',
    strengths: ['Perfect spelling', 'Typographic layouts', 'Signage design', 'Badge emblems'],
    outputType: 'image',
    typicalLatencySeconds: 4.5,
  },
  'recraft-20b': {
    id: 'recraft-20b',
    name: 'Recraft 20B / v3',
    provider: 'Recraft',
    category: 'vector',
    falEndpoint: 'fal-ai/recraft-v3',
    bestFor: 'Native vector (SVG) generation, clean UI icons, isometric illustrations, and strict brand palette matching.',
    speedRating: 'fast',
    strengths: ['Native SVG output', '3D icon sets', 'Color palette locking', 'Clean vectors'],
    outputType: 'svg',
    typicalLatencySeconds: 2.8,
  },
  'nano-banana-pro': {
    id: 'nano-banana-pro',
    name: 'Google Nano Banana Pro',
    provider: 'Google',
    category: 'image',
    falEndpoint: 'fal-ai/nano-banana-pro',
    bestFor: 'Versatile multimodal image generation with prompt-driven editing and style transfer.',
    speedRating: 'fast',
    strengths: ['Reference image editing', 'Color richness', 'High fidelity'],
    outputType: 'image',
    typicalLatencySeconds: 2.2,
  },
  'luma-photon': {
    id: 'luma-photon',
    name: 'Luma Photon',
    provider: 'Luma AI',
    category: 'image',
    falEndpoint: 'fal-ai/luma/photon',
    bestFor: 'Flash-fast commercial photorealism with atmospheric cinematic lighting.',
    speedRating: 'fast',
    strengths: ['Atmospheric lighting', 'Cinematic glow', 'High dynamic range'],
    outputType: 'image',
    typicalLatencySeconds: 2.5,
  },

  // ─── Video & Motion ──────────────────────────────────────────────
  'kling-3-pro': {
    id: 'kling-3-pro',
    name: 'Kling 3.0 Pro',
    provider: 'Kuaishou',
    category: 'video',
    falEndpoint: 'fal-ai/kling-video/v3/pro',
    bestFor: 'Cinematic commercial video ads, realistic human movement, fluid physics, and integrated audio.',
    speedRating: 'heavy',
    strengths: ['Cinematic physics', '1080p full HD', 'Natural human motion', 'Camera motion'],
    outputType: 'video',
    typicalLatencySeconds: 25.0,
  },
  'wan-2.1': {
    id: 'wan-2.1',
    name: 'Wan 2.1 Video',
    provider: 'Wan',
    category: 'video',
    falEndpoint: 'fal-ai/wan/v2.1',
    bestFor: 'Open-weight state-of-the-art text-to-video & image-to-video with seamless motion flow and long shot retention.',
    speedRating: 'moderate',
    strengths: ['Temporal consistency', 'Fine-grained motion control', 'Seamless transitions'],
    outputType: 'video',
    typicalLatencySeconds: 18.0,
  },
  'minimax-hailuo': {
    id: 'minimax-hailuo',
    name: 'MiniMax Hailuo',
    provider: 'MiniMax',
    category: 'video',
    falEndpoint: 'fal-ai/minimax-video',
    bestFor: 'High-action social clips, dynamic camera zooms, cinematic angles for TikTok and Reels.',
    speedRating: 'moderate',
    strengths: ['Dynamic action', 'Camera pans/zooms', 'Viral social video'],
    outputType: 'video',
    typicalLatencySeconds: 15.0,
  },
  'ltx-video': {
    id: 'ltx-video',
    name: 'LTX Video 2.5',
    provider: 'Lightricks',
    category: 'video',
    falEndpoint: 'fal-ai/ltx-video',
    bestFor: 'Ultra-fast video generation and real-time kinetic canvas loops.',
    speedRating: 'fast',
    strengths: ['High speed', 'Low cost', 'Fast animation loops'],
    outputType: 'video',
    typicalLatencySeconds: 4.5,
  },
  'hunyuan-video': {
    id: 'hunyuan-video',
    name: 'Hunyuan Video',
    provider: 'Tencent',
    category: 'video',
    falEndpoint: 'fal-ai/hunyuan-video',
    bestFor: 'High resolution (720p/1080p) text-to-video with accurate visual semantics and camera choreography.',
    speedRating: 'heavy',
    strengths: ['720p/1080p native', 'Camera choreography', 'Complex prompt fidelity'],
    outputType: 'video',
    typicalLatencySeconds: 28.0,
  },
  'latentsync': {
    id: 'latentsync',
    name: 'LatentSync Lip Sync',
    provider: 'ByteDance',
    category: 'video',
    falEndpoint: 'fal-ai/latentsync',
    bestFor: 'Synchronizing character mouth and facial movements precisely to any audio speech file.',
    speedRating: 'fast',
    strengths: ['Sub-frame lip sync', 'Natural facial gestures', 'Multilingual support'],
    outputType: 'video',
    typicalLatencySeconds: 6.0,
  },

  // ─── Enhancement, Inpainting & Background Removal ───────────────
  'bria-rembg': {
    id: 'bria-rembg',
    name: 'Bria Background Removal',
    provider: 'Bria AI',
    category: 'enhancement',
    falEndpoint: 'fal-ai/bria/background/remove',
    bestFor: 'Sub-second background removal with clean cutout of hair, glass, shadows, and product edges.',
    speedRating: 'realtime',
    strengths: ['Sub-second speed', 'Hairline detail', 'Shadow preservation', 'Commercial safety'],
    outputType: 'image',
    typicalLatencySeconds: 0.6,
  },
  'clarity-upscaler': {
    id: 'clarity-upscaler',
    name: 'Clarity Super-Resolution',
    provider: 'Fal AI',
    category: 'enhancement',
    falEndpoint: 'fal-ai/clarity-upscaler',
    bestFor: '4x and 8x AI upscaling, texture reconstruction, and 300 DPI high-res print preparation.',
    speedRating: 'fast',
    strengths: ['4x/8x upscaling', 'Texture sharpening', 'Print DPI readiness'],
    outputType: 'image',
    typicalLatencySeconds: 3.0,
  },
  'aura-sr': {
    id: 'aura-sr',
    name: 'Aura-SR Upscaler',
    provider: 'Fal AI',
    category: 'enhancement',
    falEndpoint: 'fal-ai/aura-sr',
    bestFor: 'Super-fast GAN-based upscaling and compression artifact removal.',
    speedRating: 'realtime',
    strengths: ['Sub-second upscaling', 'JPEG artifact cleanup', 'Sharp outlines'],
    outputType: 'image',
    typicalLatencySeconds: 0.9,
  },

  // ─── Audio & Sound Effects ───────────────────────────────────────
  'f5-tts': {
    id: 'f5-tts',
    name: 'F5 Expressive TTS',
    provider: 'F5',
    category: 'audio',
    falEndpoint: 'fal-ai/f5-tts',
    bestFor: 'Natural emotional voiceovers, social ad narrations, and instant multilingual speech.',
    speedRating: 'fast',
    strengths: ['Zero-shot voice cloning', 'Emotional prosody', 'High clarity'],
    outputType: 'audio',
    typicalLatencySeconds: 1.5,
  },
  'stable-audio': {
    id: 'stable-audio',
    name: 'Stable Audio 2.0',
    provider: 'Stability AI',
    category: 'audio',
    falEndpoint: 'fal-ai/stable-audio',
    bestFor: 'Studio-grade audio sound effects, ambient atmospheres, Foley, and rhythmic instrumentals.',
    speedRating: 'fast',
    strengths: ['44.1kHz stereo', 'Seamless looping', 'Precise timing control'],
    outputType: 'audio',
    typicalLatencySeconds: 3.0,
  },

  // ─── 3D Spatial Meshes ───────────────────────────────────────────
  'hunyuan-3d': {
    id: 'hunyuan-3d',
    name: 'Hunyuan 3D v2',
    provider: 'Tencent',
    category: '3d',
    falEndpoint: 'fal-ai/hunyuan3d-v2',
    bestFor: 'Single-image to complete 3D GLB/OBJ mesh generation with UV textures for interactive mockups.',
    speedRating: 'moderate',
    strengths: ['Watertight geometry', 'PBR textures', 'GLB export'],
    outputType: '3d',
    typicalLatencySeconds: 12.0,
  },
  'trellis-3d': {
    id: 'trellis-3d',
    name: 'Microsoft Trellis 3D',
    provider: 'Microsoft',
    category: '3d',
    falEndpoint: 'fal-ai/trellis',
    bestFor: 'Structured 3D Gaussian Splatting and radiance field reconstruction from 2D images.',
    speedRating: 'fast',
    strengths: ['3D Gaussian Splats', 'Complex geometry', 'High surface detail'],
    outputType: '3d',
    typicalLatencySeconds: 6.5,
  },
};

export type BudgetMode = 'fast_draft' | 'balanced' | 'high_fidelity';

export interface FalModelSelectionOptions {
  preferredCategory?: 'image' | 'video' | 'audio' | '3d' | 'vector' | 'enhancement';
  budgetMode?: BudgetMode;
  maxLatencySeconds?: number;
}

/**
 * System 1 Jev-Powered Model Selector
 * Given a user task or prompt, instantly routes to the optimal Fal.ai model endpoint in sub-5ms.
 * Supports budget mode ('fast_draft' | 'balanced' | 'high_fidelity') and maxLatencySeconds constraints.
 */
export function selectOptimalFalModel(
  taskDescription: string,
  preferredCategoryOrOptions?: 'image' | 'video' | 'audio' | '3d' | 'vector' | 'enhancement' | FalModelSelectionOptions,
  maybeOptions?: FalModelSelectionOptions
): DecisionResult<FalModelEntry> {
  const startTime = performance.now();
  const lower = taskDescription.toLowerCase();

  let preferredCategory: ('image' | 'video' | 'audio' | '3d' | 'vector' | 'enhancement') | undefined;
  let budgetMode: BudgetMode = 'balanced';
  let maxLatencySeconds: number | undefined;

  if (typeof preferredCategoryOrOptions === 'string') {
    preferredCategory = preferredCategoryOrOptions;
    if (maybeOptions) {
      budgetMode = maybeOptions.budgetMode || 'balanced';
      maxLatencySeconds = maybeOptions.maxLatencySeconds;
    }
  } else if (preferredCategoryOrOptions && typeof preferredCategoryOrOptions === 'object') {
    preferredCategory = preferredCategoryOrOptions.preferredCategory;
    budgetMode = preferredCategoryOrOptions.budgetMode || 'balanced';
    maxLatencySeconds = preferredCategoryOrOptions.maxLatencySeconds;
  }

  const finalizeResult = (
    entry: FalModelEntry,
    confidence: number,
    reasoningBrief: string
  ): DecisionResult<FalModelEntry> => {
    // If a maxLatencySeconds constraint was requested and current selection exceeds it,
    // downgrade to a faster fallback model
    let selected = entry;
    if (maxLatencySeconds && selected.typicalLatencySeconds > maxLatencySeconds) {
      const fallbacks = getModelFallbackChain(selected.id, 'fast_draft');
      const withinBudget = fallbacks.find((f) => f.typicalLatencySeconds <= maxLatencySeconds);
      if (withinBudget) {
        selected = withinBudget;
        reasoningBrief = `${reasoningBrief} (Latency constrained to ${withinBudget.name} < ${maxLatencySeconds}s)`;
      }
    }

    return {
      decision: selected,
      confidence,
      latencyMs: Math.round(performance.now() - startTime),
      reasoningBrief,
      source: 'local_fast_kernel',
    };
  };

  // 1. Vector / Icon Intent
  if (preferredCategory === 'vector' || /\b(svg|vector|icon|glyph|flat logo|sticker)\b/i.test(lower)) {
    return finalizeResult(
      FAL_MODELS_DIRECTORY['recraft-20b'],
      0.98,
      'Selected Recraft 20B for native scalable vector SVG output and icon generation'
    );
  }

  // 2. Background Removal & Inpainting
  if (/\b(inpaint|erase and replace|brush fill|object replacement|fill mask)\b/i.test(lower)) {
    return finalizeResult(
      FAL_MODELS_DIRECTORY['flux-inpaint'],
      0.97,
      'Selected FLUX.1 Inpainting for precision localized brush replacement'
    );
  }

  if (preferredCategory === 'enhancement' || /\b(remove background|rmbg|cutout|transparent background|isolate subject)\b/i.test(lower)) {
    return finalizeResult(
      FAL_MODELS_DIRECTORY['bria-rembg'],
      0.99,
      'Selected Bria RemBG for sub-second edge-preserving background removal'
    );
  }

  // 3. Upscaling (Only if explicit upscaling / resolution boost is requested)
  if (/\b(upscale|super-resolution|enhance resolution|increase resolution|denoise artifact)\b/i.test(lower)) {
    if (budgetMode === 'fast_draft' || /\b(fast|artifact|denoise|sub-second)\b/i.test(lower)) {
      return finalizeResult(
        FAL_MODELS_DIRECTORY['aura-sr'],
        0.95,
        'Selected Aura-SR for fast GAN-based artifact reduction & upscaling'
      );
    }
    return finalizeResult(
      FAL_MODELS_DIRECTORY['clarity-upscaler'],
      0.96,
      'Selected Clarity Upscaler for 4x/8x high-DPI texture reconstruction'
    );
  }

  // 4. Video & Motion Intent
  if (preferredCategory === 'video' || /\b(video|animate|animation|animating|motion|clip|reel|cinematic camera|move|flythrough|lip sync|talking head)\b/i.test(lower)) {
    if (/\b(lip sync|talking avatar|match mouth|voice sync)\b/i.test(lower)) {
      return finalizeResult(
        FAL_MODELS_DIRECTORY['latentsync'],
        0.98,
        'Selected LatentSync for frame-accurate audio-driven facial lip sync'
      );
    }
    if (budgetMode === 'fast_draft' || /\b(fast|quick|preview|loop)\b/i.test(lower)) {
      return finalizeResult(
        FAL_MODELS_DIRECTORY['ltx-video'],
        0.94,
        'Selected LTX Video for real-time fast animation loop synthesis'
      );
    }
    if (budgetMode === 'high_fidelity') {
      return finalizeResult(
        FAL_MODELS_DIRECTORY['kling-3-pro'],
        0.97,
        'Selected Kling 3.0 Pro for ultra-fidelity cinematic video render'
      );
    }
    return finalizeResult(
      FAL_MODELS_DIRECTORY['kling-3-pro'],
      0.95,
      'Selected Kling 3.0 Pro for cinematic realism and high-fidelity video motion'
    );
  }

  // 5. 3D Mesh & Spatial Intent
  if (preferredCategory === '3d' || /\b(3d|mesh|glb|obj|gaussian splat|splatting|3d mockup|3d object)\b/i.test(lower)) {
    if (budgetMode === 'fast_draft' || /\b(splat|gaussian|radiance field|trellis)\b/i.test(lower)) {
      return finalizeResult(
        FAL_MODELS_DIRECTORY['trellis-3d'],
        0.96,
        'Selected Microsoft Trellis for structured 3D Gaussian Splatting and radiance fields'
      );
    }
    return finalizeResult(
      FAL_MODELS_DIRECTORY['hunyuan-3d'],
      0.97,
      'Selected Hunyuan 3D for image-to-mesh UV textured 3D asset generation'
    );
  }

  // 6. Voiceover & Audio Intent
  if (preferredCategory === 'audio' || /\b(voiceover|speech|tts|audio|narration|voice|sound effect|sfx|soundtrack|music|foley)\b/i.test(lower)) {
    if (/\b(sound effect|sfx|soundtrack|music|foley|ambience|bgm)\b/i.test(lower)) {
      return finalizeResult(
        FAL_MODELS_DIRECTORY['stable-audio'],
        0.97,
        'Selected Stable Audio 2.0 for studio-grade sound effects and ambient soundtracks'
      );
    }
    return finalizeResult(
      FAL_MODELS_DIRECTORY['f5-tts'],
      0.98,
      'Selected F5 TTS for expressive natural voiceover synthesis'
    );
  }

  // 7. Typography-heavy In-Image Generation
  if (/\b(text|typography|poster with text|sign|words|quote|headline on image|label)\b/i.test(lower)) {
    return finalizeResult(
      FAL_MODELS_DIRECTORY['ideogram-v2'],
      0.95,
      'Selected Ideogram v2 for flawless in-image text spelling and graphic layout'
    );
  }

  // 8. Budget Mode: Fast Draft (Prioritize sub-second draft feedback)
  if (budgetMode === 'fast_draft') {
    return finalizeResult(
      FAL_MODELS_DIRECTORY['flux-schnell'],
      0.97,
      'Selected FLUX.1 [schnell] for rapid 4-step sub-second canvas draft generation'
    );
  }

  // 9. 4K Ultra Photorealism / High Fidelity Mode
  if (budgetMode === 'high_fidelity' || /\b(4k|ultra|medium format|editorial|masterpiece|maximum detail)\b/i.test(lower)) {
    return finalizeResult(
      FAL_MODELS_DIRECTORY['flux-1.1-pro-ultra'],
      0.96,
      'Selected FLUX 1.1 Pro Ultra for 4K medium-format photographic fidelity'
    );
  }

  // 10. Real-time / Schnell Speed
  if (/\b(instant|fast|real-time|quick draft|schnell)\b/i.test(lower)) {
    return finalizeResult(
      FAL_MODELS_DIRECTORY['flux-schnell'],
      0.96,
      'Selected FLUX.1 [schnell] for 4-step sub-second rapid generation'
    );
  }

  // Default: SOTA FLUX 1.1 Pro for master quality
  return finalizeResult(
    FAL_MODELS_DIRECTORY['flux-1.1-pro'],
    0.94,
    'Selected FLUX 1.1 Pro for industry-leading photorealism and detail'
  );
}

/**
 * Resilient multi-model fallback chain generator.
 * Used when primary endpoint is rate-limited, degraded, or offline.
 */
export function getModelFallbackChain(
  primaryModelId: string,
  budgetMode: BudgetMode = 'balanced'
): FalModelEntry[] {
  const fallbackGraph: Record<string, string[]> = {
    'flux-1.1-pro-ultra': ['flux-1.1-pro', 'flux-dev', 'flux-schnell'],
    'flux-1.1-pro': ['flux-dev', 'flux-schnell', 'luma-photon'],
    'flux-dev': ['flux-schnell', 'luma-photon'],
    'flux-schnell': ['luma-photon', 'flux-dev'],
    'luma-photon': ['flux-schnell', 'flux-1.1-pro'],
    'ideogram-v2': ['flux-1.1-pro', 'flux-dev'],
    'recraft-20b': ['flux-dev', 'flux-1.1-pro'],
    'kling-3-pro': ['wan-2.1', 'minimax-hailuo', 'ltx-video'],
    'wan-2.1': ['kling-3-pro', 'minimax-hailuo', 'ltx-video'],
    'minimax-hailuo': ['wan-2.1', 'ltx-video', 'kling-3-pro'],
    'ltx-video': ['minimax-hailuo', 'wan-2.1'],
    'hunyuan-video': ['kling-3-pro', 'wan-2.1', 'ltx-video'],
    'latentsync': ['ltx-video'],
    'bria-rembg': ['flux-inpaint'],
    'flux-inpaint': ['bria-rembg'],
    'clarity-upscaler': ['aura-sr'],
    'aura-sr': ['clarity-upscaler'],
    'hunyuan-3d': ['trellis-3d'],
    'trellis-3d': ['hunyuan-3d'],
    'f5-tts': ['stable-audio'],
    'stable-audio': ['f5-tts'],
  };

  const candidateIds = fallbackGraph[primaryModelId] || ['flux-1.1-pro', 'flux-schnell'];
  let models = candidateIds
    .map((id) => FAL_MODELS_DIRECTORY[id])
    .filter((entry): entry is FalModelEntry => Boolean(entry));

  if (budgetMode === 'fast_draft') {
    // Sort fastest first
    models = [...models].sort((a, b) => a.typicalLatencySeconds - b.typicalLatencySeconds);
  } else if (budgetMode === 'high_fidelity') {
    // Sort highest fidelity / detail first
    models = [...models].sort((a, b) => b.typicalLatencySeconds - a.typicalLatencySeconds);
  }

  return models;
}

export interface PrefetchPrediction {
  predictedKeywords: string[];
  suggestedModels: string[];
  suggestedToolAssets: ('svg_engine' | 'wasm_transformers' | 'canvas_filters' | 'paper_geometry' | 'video_canvas')[];
  confidence: number;
  newlyWarmed: string[];
}

const _warmedResources = new Set<string>();

/**
 * Resets the in-memory warm resource cache (useful for testing or cache clearing)
 */
export function resetPrefetchCache(): void {
  _warmedResources.clear();
}

/**
 * Sub-1ms predictive analysis of typing inputs.
 * Emits warming events and keeps an idempotent warm cache to avoid redundant network/WASM requests.
 */
export function predictAndPrefetchResources(
  partialPrompt: string,
  onPrefetch?: (resourceKey: string) => void
): PrefetchPrediction {
  const lower = (partialPrompt || '').trim().toLowerCase();
  if (lower.length < 3) {
    return {
      predictedKeywords: [],
      suggestedModels: [],
      suggestedToolAssets: [],
      confidence: 0,
      newlyWarmed: [],
    };
  }

  const predictedKeywords: string[] = [];
  const suggestedModels: string[] = [];
  const suggestedToolAssets: ('svg_engine' | 'wasm_transformers' | 'canvas_filters' | 'paper_geometry' | 'video_canvas')[] = [];
  const newlyWarmed: string[] = [];

  const checkAndWarm = (
    key: string,
    asset?: 'svg_engine' | 'wasm_transformers' | 'canvas_filters' | 'paper_geometry' | 'video_canvas',
    model?: string
  ) => {
    if (asset && !suggestedToolAssets.includes(asset)) {
      suggestedToolAssets.push(asset);
    }
    if (model && !suggestedModels.includes(model)) {
      suggestedModels.push(model);
    }
    if (!_warmedResources.has(key)) {
      _warmedResources.add(key);
      newlyWarmed.push(key);
      if (onPrefetch) {
        try {
          onPrefetch(key);
        } catch {
          // Ignore prefetch listener errors
        }
      }
    }
  };

  // Vector / SVG / Icons
  if (/\b(icon|svg|vector|logo|glyph|sticker)\b/i.test(lower)) {
    predictedKeywords.push('vector');
    checkAndWarm('module:paper_geometry', 'paper_geometry');
    checkAndWarm('pipeline:svg_engine', 'svg_engine', 'fal-ai/recraft-v3');
  }

  // Video / Motion
  if (/\b(vid|video|anim|motion|cinemat|reel|loop)\b/i.test(lower)) {
    predictedKeywords.push('video');
    checkAndWarm('module:video_canvas', 'video_canvas');
    checkAndWarm('model:fal-ai/kling-video/v3/pro', undefined, 'fal-ai/kling-video/v3/pro');
  }

  // Background removal / Inpainting / Cutout
  if (/\b(rembg|cutout|remove bg|inpaint|erase|mask)\b/i.test(lower)) {
    predictedKeywords.push('background_removal');
    checkAndWarm('module:wasm_transformers', 'wasm_transformers');
    checkAndWarm('model:fal-ai/bria/background/remove', undefined, 'fal-ai/bria/background/remove');
  }

  // Filters / Aesthetics
  if (/\b(blur|glow|shadow|contrast|filter|recolor|gradient)\b/i.test(lower)) {
    predictedKeywords.push('filters');
    checkAndWarm('module:canvas_filters', 'canvas_filters');
  }

  // General Image Diffusion
  if (/\b(photo|poster|flyer|banner|image|render|character|samurai|cyberpunk)\b/i.test(lower)) {
    predictedKeywords.push('image_diffusion');
    checkAndWarm('model:fal-ai/flux/schnell', undefined, 'fal-ai/flux/schnell');
  }

  const confidence = Math.min(1, 0.5 + predictedKeywords.length * 0.2);

  return {
    predictedKeywords,
    suggestedModels,
    suggestedToolAssets,
    confidence,
    newlyWarmed,
  };
}

