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
  return ` Match this reference — ${clauses.join('; ')}.`;
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
    const svgResult = await aiModelsService.generateVectorRecraft(prompt);
    if (!svgResult) {
      throw new Error('Vector generation failed');
    }
    return svgResult.startsWith('<svg') ? svgToDataUrl(svgResult) : svgResult;
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
  return geminiService.generateImage(prompt, aspectRatio, quality);
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
