import { log } from '../utils/log';
import { callBackendGeminiAPI } from './geminiService';
import * as unsplashService from './unsplashService';
import { safeParseJSON } from '../utils/errorHandling';
import { SchemaType } from '@google/generative-ai';

export interface RecommendedAsset {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  author: string;
  provider: string;
  reason: string;
}

interface DesignContext {
  colors?: string[];
  style?: string;
  tags?: string[];
  description?: string;
}

async function analyzeDesignContext(ctx: DesignContext): Promise<string[]> {
  try {
    // 🤖 Astra: Sanitize user input to prevent prompt injection and payload bloat
    const sanitizedCtx = {
      ...ctx,
      description: ctx.description?.substring(0, 500),
      style: ctx.style?.substring(0, 100),
      tags: ctx.tags?.map((t) => t.substring(0, 50)),
      colors: ctx.colors?.map((c) => c.substring(0, 20)),
    };

    // 🤖 Astra: Move system prompt out of the user content block to ensure separation of instructions
    const systemPrompt = `You are a design asset recommendation engine. Given this design context, suggest 5-8 search queries that would find relevant stock photos, icons, and illustrations. Return ONLY a JSON array of strings.`;

    const response = await callBackendGeminiAPI({
      modelName: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.STRING,
            description: 'Search query',
          },
        },
      },
      contents: [{ role: 'user', parts: [{ text: `Context: ${JSON.stringify(sanitizedCtx)}` }] }],
    });
    const text = response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      // 🤖 Astra: Wrap output parsing with safeParseJSON to avoid raw JSON.parse crashes.
      const parsed = safeParseJSON<string[] | null>(text, null);
      if (!parsed) {
        throw new Error('Failed to parse asset recommendations JSON');
      }
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 8);
      }
    }
  } catch (e) {
    log.error('[AssetRecommendations] AI analysis failed', e);
  }
  return buildFallbackQueries(ctx);
}

function buildFallbackQueries(ctx: DesignContext): string[] {
  const queries: string[] = [];
  if (ctx.description) {
    queries.push(ctx.description);
  }
  if (ctx.style) {
    queries.push(ctx.style);
  }
  if (ctx.tags) {
    queries.push(...ctx.tags.slice(0, 3));
  }
  if (ctx.colors?.length) {
    queries.push(`${ctx.colors[0]} background`);
  }
  if (queries.length === 0) {
    queries.push('abstract background');
  }
  return queries.slice(0, 5);
}

function normalizePhotos(photos: any[], provider: string): RecommendedAsset[] {
  return photos.map((p) => ({
    id: `${provider}-${p.id}`,
    url: p.url || p.largeImageURL,
    thumbnail: p.thumbnail || p.webformatURL,
    alt: p.alt || p.tags || `${provider} photo`,
    author: p.author || p.user || p.photographer || provider,
    provider,
    reason: '',
  }));
}

export async function getRecommendedAssets(designContext: DesignContext, limit = 20): Promise<RecommendedAsset[]> {
  const queries = await analyzeDesignContext(designContext);
  const allResults: RecommendedAsset[] = [];
  const seen = new Set<string>();

  for (const query of queries.slice(0, 4)) {
    try {
      const usResults = await unsplashService.searchPhotos(query).catch(() => []);

      normalizePhotos(usResults, 'unsplash').forEach((asset) => {
        if (!seen.has(asset.url) && allResults.length < limit) {
          seen.add(asset.url);
          allResults.push({ ...asset, reason: `Matches "${query}"` });
        }
      });
    } catch (e) {
      log.error('[AssetRecommendations] Search failed', e, { query });
    }
  }
  return allResults;
}
