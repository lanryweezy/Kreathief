import {
  DesignCritique,
  DesignSuggestion,
  DesignContext,
  Layer,
  Artboard,
  BrandKit,
  ChatMessage,
  ShapeLayer,
  TextLayer,
} from '../types';
import { callBackendGeminiAPI } from './geminiService';
import { log } from '../utils/log';
import { safeParseJSON } from '../utils/errorHandling';
import { SchemaType } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import { resolveConstraints, resolveSemanticConstraints } from '../utils/layoutUtils';

// ─── Cache ───────────────────────────────────────────────────────────────────

const _cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = _cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data as T;
  }
  _cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  if (_cache.size > 50) {
    const oldest = _cache.keys().next().value;
    if (oldest) {
      _cache.delete(oldest);
    }
  }
  _cache.set(key, { data, timestamp: Date.now() });
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AgentVariant {
  id: string;
  themeIdea: string;
  layers: Layer[];
  performanceScore?: number;
  performanceReasoning?: string;
  criticFeedback?: string[];
}

// ─── Shared Helpers ──────────────────────────────────────────────────────────

function prepareDesignData(artboard: Artboard, context: DesignContext, brandKit?: BrandKit) {
  return {
    canvas: {
      width: artboard.width,
      height: artboard.height,
      backgroundColor: artboard.backgroundColor || context.canvasSize.name,
    },
    layers: artboard.layers.map((layer) => ({
      id: layer.id,
      type: layer.type,
      name: layer.name,
      dimensions: { x: layer.x, y: layer.y, width: layer.width, height: layer.height },
      visible: layer.visible,
      opacity: layer.opacity,
      ...(layer.type === 'text' && {
        text: (layer as any).text,
        fontSize: (layer as any).fontSize,
        fontFamily: (layer as any).fontFamily,
        color: (layer as any).color,
        textAlign: (layer as any).textAlign,
      }),
      ...(layer.type === 'image' && { hasAltText: !!(layer as any).altText }),
      ...((['rectangle', 'circle', 'triangle'] as const).includes(layer.type as any) && {
        color: (layer as any).color,
        cornerRadius: (layer as any).cornerRadius,
      }),
    })),
    context: {
      layerCount: context.layerCount,
      hasText: context.hasText,
      hasImages: context.hasImages,
      colorPalette: context.colorPalette,
      fontFamilies: context.fontFamilies,
      purpose: context.purpose,
    },
    brandKit: brandKit ? { colors: brandKit.colors, fonts: brandKit.fonts, name: brandKit.name } : null,
  };
}

// ─── Analyze (Assistant) ─────────────────────────────────────────────────────

export async function analyzeDesign(
  artboard: Artboard,
  context: DesignContext,
  brandKit?: BrandKit
): Promise<DesignCritique> {
  try {
    const designData = prepareDesignData(artboard, context, brandKit);

    const response = await callBackendGeminiAPI({
      modelName: 'gemini-2.0-flash',
      systemInstruction: `You are an expert design critic. Analyze this design and provide constructive feedback.
Focus on: visual hierarchy, color harmony, typography, brand consistency, accessibility, layout, and overall effectiveness.
Be specific, actionable, and encouraging. Rate 0-100 overall.`,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            overallScore: { type: SchemaType.NUMBER },
            strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            areas_for_improvement: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            suggestions: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  type: { type: SchemaType.STRING, enum: ['improvement', 'warning', 'tip', 'accessibility'] },
                  severity: { type: SchemaType.STRING, enum: ['low', 'medium', 'high'] },
                  title: { type: SchemaType.STRING },
                  message: { type: SchemaType.STRING },
                  layerId: { type: SchemaType.STRING },
                  category: {
                    type: SchemaType.STRING,
                    enum: ['layout', 'color', 'typography', 'accessibility', 'branding', 'composition'],
                  },
                },
                required: ['type', 'severity', 'title', 'message', 'category'],
              },
            },
          },
          required: ['overallScore', 'strengths', 'areas_for_improvement', 'suggestions'],
        },
      },
      contents: [{ role: 'user', parts: [{ text: `Analyze this design:\n\n${JSON.stringify(designData, null, 2)}` }] }],
    });

    // 🤖 Astra: Passed 'null' fallback string to safeParseJSON instead of '{}' to prevent silent failures on empty LLM output and ensure error catching logic executes.
    const parsed = safeParseJSON<Partial<DesignCritique> | null>(response.text || 'null', null);
    if (!parsed) {
      throw new Error('Failed to parse analysis JSON');
    }

    return {
      overallScore: parsed.overallScore || 75,
      score: parsed.score || parsed.overallScore || 75,
      summary: parsed.summary || '',
      suggestions: (parsed.suggestions || []).map((s: any) => ({ ...s, id: uuidv4() }) as DesignSuggestion),
      strengths: parsed.strengths || [],
      areas_for_improvement: parsed.areas_for_improvement || [],
      timestamp: Date.now(),
    };
  } catch (error) {
    log.error('[AI] Analysis failed', error);
    throw new Error('Failed to analyze design. Please try again.');
  }
}

// ─── Conversation (Assistant) ────────────────────────────────────────────────

export async function handleConversation(
  message: string,
  artboard: Artboard,
  context: DesignContext,
  conversationHistory: ChatMessage[]
): Promise<ChatMessage> {
  try {
    // 🤖 Astra: Sanitize and truncate user input to prevent prompt injection and payload bloat
    const sanitizedMessage = message.trim().substring(0, 1000);

    const designData = prepareDesignData(artboard, context);
    const recentHistory = conversationHistory.slice(-6);

    const conversationContext =
      recentHistory.length > 0
        ? `Recent conversation:\n${recentHistory.map((msg) => `${msg.role}: ${msg.content}`).join('\n')}\n\n`
        : '';

    const response = await callBackendGeminiAPI({
      modelName: 'gemini-2.0-flash',
      systemInstruction: `You are Kiro, an AI design assistant built into Kreathief. You help users improve their designs through conversation.
Context: You can see the current design state and should provide specific, actionable advice.
Style: Be friendly, encouraging, and specific. Use design terminology but explain it simply.
Capabilities: Suggest improvements, explain principles, help with color/typography/layout, provide accessibility guidance, answer questions about the design.
Always be constructive and helpful.`,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${conversationContext}Current design state:\n${JSON.stringify(designData, null, 2)}\n\nUser message: ${sanitizedMessage}`,
            },
          ],
        },
      ],
    });

    return {
      id: uuidv4(),
      role: 'assistant',
      content: response.text || 'I apologize, but I could not process your request. Please try again.',
      timestamp: Date.now(),
    };
  } catch (error) {
    log.error('[AI] Conversation failed', error);
    throw new Error('Failed to process your message. Please try again.');
  }
}

// ─── Real-time Suggestions (Assistant) ───────────────────────────────────────

export async function getRealtimeSuggestions(
  artboard: Artboard,
  context: DesignContext,
  lastChange?: { type: string; layerId?: string }
): Promise<DesignSuggestion[]> {
  try {
    const designData = prepareDesignData(artboard, context);

    const response = await callBackendGeminiAPI({
      modelName: 'gemini-2.0-flash',
      systemInstruction: `You are a real-time design assistant. Provide 1-3 quick, actionable suggestions based on the current design state.
Focus on: immediate improvements, common mistakes, quick accessibility fixes, color/contrast issues.
Be concise and specific.`,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              type: { type: SchemaType.STRING, enum: ['improvement', 'warning', 'tip'] },
              severity: { type: SchemaType.STRING, enum: ['low', 'medium', 'high'] },
              title: { type: SchemaType.STRING },
              message: { type: SchemaType.STRING },
              category: {
                type: SchemaType.STRING,
                enum: ['layout', 'color', 'typography', 'accessibility', 'branding', 'composition'],
              },
            },
            required: ['type', 'severity', 'title', 'message', 'category'],
          },
        },
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Design state: ${JSON.stringify(designData, null, 2)}\nRecent change: ${JSON.stringify(lastChange || {}, null, 2)}`,
            },
          ],
        },
      ],
    });

    // 🤖 Astra: Passed 'null' fallback string to safeParseJSON instead of '[]' to prevent silent failures on empty LLM output and ensure error catching logic executes.
    const suggestions = safeParseJSON<any[] | null>(response.text || 'null', null);
    if (!suggestions) {
      throw new Error('Failed to parse realtime suggestions JSON');
    }
    return suggestions.map((s) => ({ ...s, id: uuidv4() }) as DesignSuggestion);
  } catch (error) {
    log.error('[AI] Realtime suggestions failed', error);
    return [];
  }
}

// ─── Generate Variants (Agent — Stage 1) ─────────────────────────────────────

export async function creativeAgentDraft(
  intent: string,
  canvasSize: { width: number; height: number },
  variantCount: number = 3
): Promise<AgentVariant[]> {
  const cacheKey = `draft:${intent}:${canvasSize.width}x${canvasSize.height}:${variantCount}`;
  const cached = getCached<AgentVariant[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const layerSchema = {
    type: SchemaType.OBJECT,
    properties: {
      type: { type: SchemaType.STRING },
      constraints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      width: { type: SchemaType.NUMBER },
      height: { type: SchemaType.NUMBER },
      color: { type: SchemaType.STRING },
      text: { type: SchemaType.STRING },
      fontSize: { type: SchemaType.NUMBER },
    },
    required: ['type', 'constraints', 'width', 'height', 'color'],
  };

  const data = await callBackendGeminiAPI({
    modelName: 'gemini-2.5-flash',
    systemInstruction: `You are a Master Creative Design Director Engine. Generate ${variantCount} highly distinct, professional layout variants based on the user's core intent/prompt.
Canvas dimensions are ${canvasSize.width}x${canvasSize.height}.
For each variant, provide a creative "themeIdea" string and an array of "layers" with type (text/rectangle/circle), constraints (center-x, top, bottom, left, right, full-width, inset-20), width, height, color, text (if text), fontSize (if text).
Ensure perfect visual composition and contrast.`,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            themeIdea: { type: SchemaType.STRING },
            layers: { type: SchemaType.ARRAY, items: layerSchema },
          },
          required: ['themeIdea', 'layers'],
        },
      },
      temperature: 0.85,
    },
    contents: [{ role: 'user', parts: [{ text: `Creative Intent: "${intent}"` }] }],
  });

  try {
    // 🤖 Astra: Passed 'null' fallback string to safeParseJSON instead of '' to prevent JSON.parse throws and ensure error catching logic executes cleanly.
    const rawVariants = safeParseJSON<any[] | null>(data.text || 'null', null);
    if (!rawVariants) {
      throw new Error('Creative Agent returned malformed JSON');
    }

    const result = rawVariants.map((v: any) => ({
      ...v,
      id: uuidv4(),
      layers: v.layers.map((l: any): Layer => {
        const resolvedPos = resolveConstraints(l, canvasSize);
        const structuredConstraints = resolveSemanticConstraints(l.constraints || []);
        const base = {
          ...l,
          ...resolvedPos,
          constraints: structuredConstraints,
          id: uuidv4(),
          name: l.text ? l.text.substring(0, 15) : l.type,
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'normal',
          rotation: 0,
        };
        if (l.type === 'text') {
          return { ...base, type: 'text', fontFamily: 'Inter' } as TextLayer;
        }
        return { ...base, type: 'rectangle' } as ShapeLayer;
      }),
    }));

    setCache(cacheKey, result);
    return result;
  } catch (err) {
    log.error('[AI] Creative Agent parsing failed', err);
    throw new Error('Failed to generate structural layouts.');
  }
}

// ─── Refine Variants (Agent — Stage 1 Refinement) ───────────────────────────

export async function creativeAgentRefine(
  intent: string,
  targetLayers: Layer[],
  contextLayers: Layer[],
  canvasSize: { width: number; height: number },
  variantCount: number = 3
): Promise<AgentVariant[]> {
  const layerSchema = {
    type: SchemaType.OBJECT,
    properties: {
      id: { type: SchemaType.STRING },
      type: { type: SchemaType.STRING },
      x: { type: SchemaType.NUMBER },
      y: { type: SchemaType.NUMBER },
      width: { type: SchemaType.NUMBER },
      height: { type: SchemaType.NUMBER },
      color: { type: SchemaType.STRING },
      text: { type: SchemaType.STRING },
      fontSize: { type: SchemaType.NUMBER },
    },
    required: ['id', 'type', 'x', 'y', 'width', 'height', 'color'],
  };

  const data = await callBackendGeminiAPI({
    modelName: 'gemini-2.5-flash',
    systemInstruction: `You are a Senior Design Refinement Engine. You are given TARGET layers (to be improved) and CONTEXT layers (to be respected). Based on the user's intent, generate ${variantCount} improved versions of the TARGET layers. Canvas size is ${canvasSize.width}x${canvasSize.height}.
Rules: Only return modified TARGET layers. Align visually with CONTEXT layers. You can change positions, colors, text, sizes.`,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            themeIdea: { type: SchemaType.STRING },
            layers: { type: SchemaType.ARRAY, items: layerSchema },
          },
          required: ['themeIdea', 'layers'],
        },
      },
      temperature: 0.7,
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `User Intent: "${intent}"\n\nTARGET LAYERS: ${JSON.stringify(targetLayers)}\n\nCONTEXT LAYERS: ${JSON.stringify(contextLayers)}`,
          },
        ],
      },
    ],
  });

  try {
    // 🤖 Astra: Passed 'null' fallback string to safeParseJSON instead of '' to prevent JSON.parse throws and ensure error catching logic executes cleanly.
    const rawVariants = safeParseJSON<any[] | null>(data.text || 'null', null);
    if (!rawVariants) {
      throw new Error('Creative Refine returned malformed JSON');
    }

    return rawVariants.map((v: any) => ({
      ...v,
      id: uuidv4(),
      layers: v.layers.map((l: any): Layer => {
        const existing = targetLayers.find((tl) => tl.id === l.id);
        return {
          ...existing,
          ...l,
          id: l.id === 'new' ? uuidv4() : l.id,
          name: l.text ? l.text.substring(0, 15) : existing?.name || l.type,
          visible: true,
          locked: false,
          opacity: 1,
        } as Layer;
      }),
    }));
  } catch (err) {
    log.error('[AI] Creative Refine parsing failed', err);
    throw new Error('Failed to refine selection.');
  }
}

// ─── Critic Review (Agent — Stage 2) ─────────────────────────────────────────

export async function criticAgentReview(variants: AgentVariant[]): Promise<AgentVariant[]> {
  const layerSchema = {
    type: SchemaType.OBJECT,
    properties: {
      id: { type: SchemaType.STRING },
      type: { type: SchemaType.STRING },
      x: { type: SchemaType.NUMBER },
      y: { type: SchemaType.NUMBER },
      width: { type: SchemaType.NUMBER },
      height: { type: SchemaType.NUMBER },
      color: { type: SchemaType.STRING },
      text: { type: SchemaType.STRING },
      fontSize: { type: SchemaType.NUMBER },
    },
    required: ['id', 'type', 'x', 'y', 'width', 'height'],
  };

  const simplifiedInput = variants.map((v) => ({
    id: v.id,
    themeIdea: v.themeIdea,
    layers: v.layers.map((l: any) => ({
      id: l.id,
      type: l.type,
      x: l.x,
      y: l.y,
      color: (l as ShapeLayer | TextLayer).color,
      text: (l as TextLayer).text,
      fontSize: (l as TextLayer).fontSize,
      width: l.width,
      height: l.height,
    })),
  }));

  const data = await callBackendGeminiAPI({
    modelName: 'gemini-2.5-flash',
    systemInstruction: `You are a strict QA Design Critic. Audit the design variants for alignment constraints, spacing overlaps, and contrast rules. Fix coordinates, widths, or colors directly. Provide a "criticFeedback" array explaining fixes. Return identical schema with improved values.`,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            id: { type: SchemaType.STRING },
            criticFeedback: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            layers: { type: SchemaType.ARRAY, items: layerSchema },
          },
          required: ['id', 'criticFeedback', 'layers'],
        },
      },
      temperature: 0.1,
    },
    contents: [{ role: 'user', parts: [{ text: `Variants to Audit: ${JSON.stringify(simplifiedInput)}` }] }],
  });

  try {
    // 🤖 Astra: Passed 'null' fallback string to safeParseJSON instead of '' to prevent JSON.parse throws and ensure error catching logic executes cleanly.
    const refined = safeParseJSON<any[] | null>(data.text || 'null', null);
    if (!refined) {
      throw new Error('Critic Agent returned malformed JSON');
    }

    return variants.map((v) => {
      const rf = refined.find((r: any) => r.id === v.id);
      if (!rf) {
        return v;
      }
      return {
        ...v,
        criticFeedback: rf.criticFeedback || ['Self-corrected layout spacing.'],
        layers: v.layers.map((l: any) => {
          const refinedLayer = rf.layers.find((rl: any) => rl.id === l.id);
          return refinedLayer ? { ...l, ...refinedLayer } : l;
        }),
      };
    });
  } catch (err) {
    log.error('[AI] Critic Agent failed, passing originals', err);
    return variants;
  }
}

// ─── Performance Score (Agent — Stage 3) ─────────────────────────────────────

export async function performanceAgentScore(variants: AgentVariant[]): Promise<AgentVariant[]> {
  const simplifiedInput = variants.map((v) => ({
    id: v.id,
    themeIdea: v.themeIdea,
    layersSummary: v.layers.map((l: any) => ({ type: l.type, x: l.x, y: l.y, text: (l as TextLayer).text })),
  }));

  const data = await callBackendGeminiAPI({
    modelName: 'gemini-2.5-flash',
    systemInstruction: `You are a Growth Marketing AI. Analyze design variants on reading flow, CTA visibility, whitespace usage, and emotional impact. Assign a score 0-100 with reasoning. Return [{ id, score, reasoning }].`,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            id: { type: SchemaType.STRING },
            score: { type: SchemaType.NUMBER },
            reasoning: { type: SchemaType.STRING },
          },
          required: ['id', 'score', 'reasoning'],
        },
      },
      temperature: 0.2,
    },
    contents: [{ role: 'user', parts: [{ text: `Variants to Score: ${JSON.stringify(simplifiedInput)}` }] }],
  });

  try {
    // 🤖 Astra: Passed 'null' fallback string to safeParseJSON instead of '' to prevent JSON.parse throws and ensure error catching logic executes cleanly.
    const scores = safeParseJSON<any[] | null>(data.text || 'null', null);
    if (!scores) {
      throw new Error('Performance Agent returned malformed JSON');
    }

    return variants
      .map((v) => {
        const match = scores.find((s: any) => s.id === v.id);
        return {
          ...v,
          performanceScore: match?.score || 50,
          performanceReasoning: match?.reasoning || 'Neutral baseline score.',
        };
      })
      .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0));
  } catch (err) {
    log.error('[AI] Performance Agent failed', err);
    return variants;
  }
}
