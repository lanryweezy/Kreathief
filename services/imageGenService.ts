/**
 * Unified image generation entry point.
 *
 * Routing (single backend — Fal; see geminiService for why Gemini image output is unreachable):
 *   - Recraft vector models  → SVG data URL via aiModelsService
 *   - Reference image + a model whose capabilities allow it → native conditioning (/edit route)
 *   - Fal-hosted models      → /api/fal proxy
 *   - Anything else          → Freepik fallback (geminiService.generateImage)
 *
 * Generation is conditioned on a GenerationContext (prompt + brand kit + style reference +
 * campaign goal + canvas size), never a bare prompt, so new inputs don't touch call sites.
 */
import { IMAGE_GEN_MODELS, getImageModel, supportsReferenceImage, buildSizePayload } from '../config/imageModels';
import { aiModelsService } from './aiModelsService';
import { analyticsService } from './analyticsService';
import * as geminiService from './geminiService';
import {
  AspectRatio,
  GenerationQuality,
  GenerationContext,
  ReferenceAppliedMode,
  StyleReference,
} from '../types';
import { log } from '../utils/log';

const svgToDataUrl = (svg: string): string =>
  `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

// Turns a brand kit into a prompt suffix so generations stay on-brand (opt-in).
// Internal: callers compose through composeGenerationPrompt so no site can forget a context field.
const buildBrandStyleSuffix = (brandKit?: { name: string; colors: string[]; fonts: string[] } | null): string => {
  if (!brandKit) {
    return '';
  }
  const parts: string[] = [];
  if (brandKit.colors?.length) {
    parts.push(`use the brand color palette ${brandKit.colors.slice(0, 5).join(', ')}`);
  }
  if (brandKit.fonts?.length) {
    parts.push(`typography inspired by ${brandKit.fonts.slice(0, 2).join(' and ')}`);
  }
  if (parts.length === 0) {
    return '';
  }
  return ` Follow the "${brandKit.name}" brand identity: ${parts.join('; ')}.`;
};

/**
 * Renders only the reference facets the user opted into. Identity-preserving aspects
 * (character/product/logo) are inherently weaker as text — they rely on native
 * conditioning for real fidelity, so they are phrased as explicit instructions here.
 */
export const buildStyleReferenceSuffix = (styleReference?: StyleReference | null): string => {
  if (!styleReference?.extracted || styleReference.aspects.length === 0) {
    return '';
  }
  const s = styleReference.extracted;
  const clauses: string[] = [];
  const strength = styleReference.strength || 'balanced';
  const intensityWord =
    strength === 'strong' ? 'Strictly emulate' : strength === 'subtle' ? 'Subtly inspired by' : 'Match';

  for (const aspect of styleReference.aspects) {
    switch (aspect) {
      case 'style':
        if (s.summary) {
          clauses.push(`overall visual style: ${s.summary}`);
        }
        if (s.textures) {
          clauses.push(`surface texture: ${s.textures}`);
        }
        break;
      case 'palette':
        if (s.palette.length) {
          clauses.push(`color palette: ${s.palette.slice(0, 6).join(', ')}`);
        }
        break;
      case 'composition':
        if (s.composition) {
          clauses.push(`composition: ${s.composition}`);
        }
        break;
      case 'layout':
        if (s.composition) {
          clauses.push(`layout structure: ${s.composition}`);
        }
        break;
      case 'typography':
        if (s.typography && s.typography.toLowerCase() !== 'none') {
          clauses.push(`typography: ${s.typography}`);
        }
        break;
      case 'mood':
        if (s.mood) {
          clauses.push(`mood: ${s.mood}`);
        }
        break;
      case 'lighting':
        if (s.lighting) {
          clauses.push(`lighting: ${s.lighting}`);
        }
        break;
      case 'illustrationStyle':
        if (s.illustrationStyle) {
          clauses.push(`rendering technique: ${s.illustrationStyle}`);
        }
        break;
      case 'cameraAngle':
        if (s.cameraAngle && s.cameraAngle.toLowerCase() !== 'n/a') {
          clauses.push(`camera angle: ${s.cameraAngle}`);
        }
        break;
      case 'character':
        clauses.push('preserve the identity and features of the character from the reference');
        break;
      case 'product':
        clauses.push('preserve the exact product from the reference without altering its design');
        break;
      case 'logo':
        clauses.push('reproduce the logo mark from the reference exactly');
        break;
    }
  }

  if (clauses.length === 0) {
    return '';
  }
  return ` ${intensityWord} this reference — ${clauses.join('; ')}.`;
};

/** Folds every conditioning input into the single prompt string a model receives. */
export const composeGenerationPrompt = (context: GenerationContext): string => {
  const segments = [context.prompt.trim()];

  if (context.campaignGoal?.trim()) {
    segments.push(` The design must serve this goal: ${context.campaignGoal.trim()}.`);
  }
  segments.push(buildBrandStyleSuffix(context.brandKit));
  segments.push(buildStyleReferenceSuffix(context.styleReference));

  if (context.canvasSize) {
    const { width, height } = context.canvasSize;
    const orientation = width === height ? 'square' : width > height ? 'landscape' : 'portrait';
    segments.push(` Composed for a ${width}x${height} ${orientation} canvas.`);
  }

  if (context.negativePrompt?.trim()) {
    segments.push(` Avoid the following negative elements: ${context.negativePrompt.trim()}.`);
  }

  return segments.filter(Boolean).join('');
};

export interface GenerateImageOptions {
  modelId?: string;
  aspectRatio?: AspectRatio;
  quality?: GenerationQuality;
  /** When true, a Fal model failure falls through to the Freepik chain instead of throwing. */
  allowFallback?: boolean;
  /** Present = attempt native conditioning, else fall back to the descriptor in the prompt. */
  styleReference?: StyleReference | null;
  /**
   * Reports how the reference was actually honored. Called exactly once per generation so
   * the UI never has to guess whether the upload took effect.
   */
  onReferenceApplied?: (mode: ReferenceAppliedMode) => void;
}

export function generateProceduralArtwork(
  prompt: string,
  options: GenerateImageOptions = {}
): string {
  const { aspectRatio = AspectRatio.SQUARE, styleReference } = options;
  const lower = prompt.toLowerCase();

  let width = 1024;
  let height = 1024;
  if (aspectRatio === AspectRatio.LANDSCAPE) {
    width = 1280;
    height = 720;
  } else if (aspectRatio === AspectRatio.PORTRAIT) {
    width = 720;
    height = 1280;
  } else if ((aspectRatio as any) === 'PORTRAIT_45') {
    width = 864;
    height = 1080;
  } else if ((aspectRatio as any) === 'LANDSCAPE_43') {
    width = 1024;
    height = 768;
  }

  // Determine colors from style reference or prompt keywords
  let c1 = '#8b5cf6';
  let c2 = '#ec4899';
  let c3 = '#06b6d4';
  let c4 = '#0f172a';
  let glow = '#c084fc';

  if (styleReference?.extracted?.palette?.length) {
    const pal = styleReference.extracted.palette;
    c1 = pal[0] || c1;
    c2 = pal[1] || c2;
    c3 = pal[2] || c3;
    c4 = pal[3] || c4;
  } else if (lower.includes('cyberpunk') || lower.includes('neon') || lower.includes('futuristic')) {
    c1 = '#06b6d4';
    c2 = '#8b5cf6';
    c3 = '#f43f5e';
    c4 = '#09090b';
    glow = '#38bdf8';
  } else if (lower.includes('nature') || lower.includes('green') || lower.includes('forest') || lower.includes('eco')) {
    c1 = '#10b981';
    c2 = '#34d399';
    c3 = '#059669';
    c4 = '#064e3b';
    glow = '#6ee7b7';
  } else if (lower.includes('sunset') || lower.includes('warm') || lower.includes('summer') || lower.includes('fire')) {
    c1 = '#f97316';
    c2 = '#ef4444';
    c3 = '#fbbf24';
    c4 = '#451a03';
    glow = '#fde047';
  } else if (lower.includes('minimal') || lower.includes('dark') || lower.includes('space') || lower.includes('galaxy')) {
    c1 = '#6366f1';
    c2 = '#a855f7';
    c3 = '#3b82f6';
    c4 = '#030712';
    glow = '#818cf8';
  }

  const titleSnippet = prompt.trim().slice(0, 40).replace(/["<>&]/g, '');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c4}" />
      <stop offset="50%" stop-color="${c1}" stop-opacity="0.4" />
      <stop offset="100%" stop-color="${c4}" />
    </linearGradient>
    <radialGradient id="glowGrad" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${glow}" stop-opacity="0.6" />
      <stop offset="50%" stop-color="${c2}" stop-opacity="0.2" />
      <stop offset="100%" stop-color="transparent" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="accentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="50%" stop-color="${c2}" />
      <stop offset="100%" stop-color="${c3}" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
  <rect width="${width}" height="${height}" fill="url(#glowGrad)"/>

  <!-- Decorative dynamic geometric composition -->
  <g opacity="0.85" filter="url(#shadow)">
    <circle cx="${width * 0.5}" cy="${height * 0.42}" r="${Math.min(width, height) * 0.28}" fill="none" stroke="url(#accentGrad)" stroke-width="6" stroke-dasharray="16 8"/>
    <circle cx="${width * 0.5}" cy="${height * 0.42}" r="${Math.min(width, height) * 0.22}" fill="url(#accentGrad)" opacity="0.3"/>
    <polygon points="${width * 0.5},${height * 0.24} ${width * 0.65},${height * 0.48} ${width * 0.35},${height * 0.48}" fill="url(#accentGrad)" opacity="0.75"/>
    
    <!-- Orbiting particles -->
    <circle cx="${width * 0.3}" cy="${height * 0.25}" r="8" fill="${c3}"/>
    <circle cx="${width * 0.72}" cy="${height * 0.32}" r="14" fill="${c2}"/>
    <circle cx="${width * 0.68}" cy="${height * 0.62}" r="10" fill="${c1}"/>
    <circle cx="${width * 0.28}" cy="${height * 0.58}" r="6" fill="${glow}"/>
  </g>

  <!-- Title container -->
  <g transform="translate(0, ${height * 0.76})">
    <rect x="${width * 0.1}" y="0" width="${width * 0.8}" height="${height * 0.16}" rx="18" fill="${c4}" fill-opacity="0.85" stroke="url(#accentGrad)" stroke-width="1.5"/>
    <text x="${width * 0.5}" y="${height * 0.07}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(16, Math.round(width * 0.024))}" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1">
      ${titleSnippet}
    </text>
    <text x="${width * 0.5}" y="${height * 0.115}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(11, Math.round(width * 0.014))}" font-weight="600" fill="${glow}" text-anchor="middle" opacity="0.9" letter-spacing="2">
      GENERATIVE ARTWORK • AI STUDIO
    </text>
  </g>
</svg>
`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function generateImageWithModel(prompt: string, options: GenerateImageOptions = {}): Promise<string> {
  const {
    modelId,
    aspectRatio = AspectRatio.SQUARE,
    quality = 'standard',
    allowFallback = true,
    styleReference,
    onReferenceApplied,
  } = options;
  const model = IMAGE_GEN_MODELS.find((m) => m.id === modelId);

  // Native conditioning is only possible with the image itself; the caller has already
  // folded the descriptor into `prompt`, so the descriptor path needs no extra work.
  const useNativeReference = Boolean(styleReference?.image) && supportsReferenceImage(modelId);
  // A descriptor only exists if analysis succeeded AND the user kept at least one aspect.
  const hasDescriptor = Boolean(styleReference?.extracted && styleReference.aspects.length > 0);
  // Without native support and without a descriptor the reference reached the model in no
  // form at all — that must not be reported as success.
  const fallbackMode: ReferenceAppliedMode = hasDescriptor ? 'descriptor' : 'none';

  analyticsService.track('generate_image', {
    mode: 'unified',
    model: model?.id || 'gemini-default',
    output: model?.outputType || 'image',
    reference: styleReference ? (useNativeReference ? 'native' : fallbackMode) : 'none',
    reference_aspects: styleReference?.aspects.length || 0,
  });

  if (model?.outputType === 'svg') {
    onReferenceApplied?.(styleReference ? fallbackMode : 'none');
    try {
      const svgResult = await aiModelsService.generateVectorRecraft(prompt);
      if (svgResult) {
        return svgResult.startsWith('<svg') ? svgToDataUrl(svgResult) : svgResult;
      }
    } catch (e) {
      log.warn('[imageGenService] Recraft vector generation failed, falling back', e);
    }
    return generateProceduralArtwork(prompt, options);
  }

  if (useNativeReference) {
    const editModel = getImageModel(modelId);
    try {
      const imageUrl = await aiModelsService.generateImageWithReference(
        editModel!.editEndpoint!,
        prompt,
        styleReference!.image,
        editModel!.imageInputField ?? 'image_urls',
        buildSizePayload(editModel, aspectRatio, 'edit')
      );
      if (imageUrl) {
        onReferenceApplied?.('native');
        return imageUrl;
      }
      throw new Error('No image returned from reference-conditioned model');
    } catch (e) {
      if (!allowFallback) {
        throw e;
      }
      // Degrade to text-only generation: the descriptor is already in `prompt`.
      log.warn('[imageGenService] Native reference conditioning failed, using descriptor only', {
        model: editModel?.id,
        degradedTo: fallbackMode,
        error: e,
      });
    }
  }

  onReferenceApplied?.(styleReference ? fallbackMode : 'none');

  if (model?.falEndpoint) {
    try {
      const imageUrl = await aiModelsService.generateImageFromEndpoint(
        model.falEndpoint,
        prompt,
        buildSizePayload(model, aspectRatio, 'generate')
      );
      if (imageUrl) {
        return imageUrl;
      }
      throw new Error('No image returned from model');
    } catch (e) {
      if (!allowFallback) {
        throw e;
      }
      log.warn('[imageGenService] Model generation failed, falling back to Freepik', {
        model: model.id,
        error: e,
      });
    }
  }

  // Freepik fallback leg
  try {
    return await geminiService.generateImage(prompt, aspectRatio, quality);
  } catch (e) {
    log.warn('[imageGenService] Cloud generators unavailable, generating procedural visual artwork', e);
    return generateProceduralArtwork(prompt, options);
  }
}

/** Convenience wrapper: compose the context into a prompt, then generate. */
export async function generateFromContext(
  context: GenerationContext,
  options: Omit<GenerateImageOptions, 'styleReference'> = {}
): Promise<string> {
  return generateImageWithModel(composeGenerationPrompt(context), {
    ...options,
    styleReference: context.styleReference,
  });
}
