import { v4 as uuidv4 } from 'uuid';
import { MarketplaceTemplate, SubmitTemplateData, templateMarketplace } from './templateMarketplace';
import { generateMultiLayerDesign, ArtboardDesignResult } from './aiDesignDirector';
import { log } from '../utils/log';

export interface GenerateTemplateOptions {
  prompt: string;
  category?: string;
  width?: number;
  height?: number;
  tags?: string[];
  publishImmediately?: boolean;
}

const CATEGORY_DIMENSIONS: Record<string, { width: number; height: number }> = {
  Posters: { width: 1080, height: 1350 },
  Social: { width: 1080, height: 1080 },
  Print: { width: 1200, height: 1600 },
  Corporate: { width: 1200, height: 630 },
  Branding: { width: 1080, height: 1080 },
  'UI/UX': { width: 1440, height: 900 },
  Illustration: { width: 1080, height: 1080 },
};

/**
 * Extracts descriptive keywords from a prompt to use as marketplace tags
 */
export function extractTagsFromPrompt(prompt: string, category: string): string[] {
  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['make', 'create', 'generate', 'with', 'that', 'this', 'from'].includes(w));

  const unique = Array.from(new Set([category.toLowerCase(), 'ai-generated', ...words.slice(0, 5)]));
  return unique;
}

/**
 * Generates a full production-ready template JSON structure from a user prompt using Gemini.
 */
export async function generateTemplateWithAI(
  options: GenerateTemplateOptions
): Promise<MarketplaceTemplate> {
  const category = options.category || 'Social';
  const defaultDims = CATEGORY_DIMENSIONS[category] || { width: 1080, height: 1080 };
  const width = options.width || defaultDims.width;
  const height = options.height || defaultDims.height;

  log.info('[aiTemplateService] Generating template with AI', {
    prompt: options.prompt,
    category,
    width,
    height,
  });

  let design: ArtboardDesignResult;
  try {
    design = await generateMultiLayerDesign(options.prompt, width, height, category);
  } catch (err) {
    log.warn('[aiTemplateService] Multi-layer design generation failed, using fallback', err);
    design = {
      title: options.prompt.slice(0, 30),
      description: options.prompt,
      width,
      height,
      backgroundColor: '#0f172a',
      layers: [],
    };
  }

  const tags = options.tags && options.tags.length > 0
    ? options.tags
    : extractTagsFromPrompt(options.prompt, category);

  const templateData = {
    name: design.title || 'AI Generated Template',
    description: design.description || options.prompt,
    version: '2.0',
    width: design.width,
    height: design.height,
    artboard: {
      id: `artboard_${uuidv4().slice(0, 8)}`,
      name: design.title || 'Artboard',
      x: 0,
      y: 0,
      width: design.width,
      height: design.height,
      backgroundColor: design.backgroundColor || '#0f172a',
      backgroundGradient: design.backgroundGradient,
      layers: design.layers || [],
    },
    meta: {
      generatedBy: 'Gemini 2.5 Flash',
      prompt: options.prompt,
      category,
      createdAt: new Date().toISOString(),
    },
  };

  const templateId = `ai_tmpl_${uuidv4().slice(0, 8)}`;
  const now = Date.now();

  const generatedTemplate: MarketplaceTemplate = {
    id: templateId,
    title: design.title || 'AI Generated Template',
    description: design.description || options.prompt,
    category,
    tags,
    authorId: 'gemini-ai',
    authorName: 'Gemini Creative AI',
    authorAvatar: undefined,
    likes: 1,
    downloads: 0,
    thumbnailUrl: null,
    templateData,
    status: 'approved',
    createdAt: now,
    updatedAt: now,
  };

  if (options.publishImmediately) {
    try {
      const submitData: SubmitTemplateData = {
        title: generatedTemplate.title,
        description: generatedTemplate.description,
        category: generatedTemplate.category,
        tags: generatedTemplate.tags,
        templateData: generatedTemplate.templateData,
      };
      await templateMarketplace.submitTemplate(submitData);
    } catch (publishErr) {
      log.warn('[aiTemplateService] Auto-publish to Supabase failed (proceeding locally)', publishErr);
    }
  }

  return generatedTemplate;
}
