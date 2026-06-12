import { SchemaType } from '@google/generative-ai';
import { Layer, ShapeLayer, TextLayer } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { resolveConstraints, resolveSemanticConstraints } from '../utils/layoutUtils';
import { callBackendGeminiAPI } from './geminiService';
import { safeParseJSON } from '../utils/errorHandling';
import { isTextLayer } from '../utils/canvasUtils';


export interface AgentVariant {
  id: string;
  themeIdea: string;
  layers: Layer[];
  performanceScore?: number;
  performanceReasoning?: string;
  criticFeedback?: string[];
}

/**
 * Stage 1: Creative Agent
 * Generates N layout variants based on the user's intent.
 */
export const creativeAgentDraft = async (
  _intent: string,
  canvasSize: { width: number; height: number },
  _variantCount: number = 3
): Promise<AgentVariant[]> => {
  const systemPrompt = `You are a Master Creative Design Director Engine. 
Generate ${_variantCount} highly distinct, professional layout variants based on the user's core intent/prompt.
Canvas dimensions are ${canvasSize.width}x${canvasSize.height}.

For each variant, provide:
1. A creative "themeIdea" string.
2. An array of "layers" specifying:
   - "type": "text" or "rectangle" or "circle"
   - "constraints": an array of semantic constraints like "center-x", "center-y", "top", "bottom", "left", "right", "full-width", "inset-20"
   - "width": number
   - "height": number
   - "color": Hex string
   - "text": string (if text type)
   - "fontSize": number (if text type)

Ensure perfect visual composition and contrast.`;

  const layerSchema = {
    type: SchemaType.OBJECT,
    properties: {
      type: { type: SchemaType.STRING },
      constraints: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
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
    systemInstruction: systemPrompt,
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
    contents: [
      {
        role: 'user',
        parts: [{ text: `Creative Intent: "${_intent}"` }],
      },
    ],
  });

  try {
    // 🤖 Astra: Wrap output parsing with safeParseJSON to avoid raw JSON.parse crashes.
    const rawVariants = safeParseJSON<any[] | null>(data.text || '', null);
    if (!rawVariants) {
      throw new Error('Creative Agent returned malformed JSON');
    }
    return rawVariants.map((v: any) => ({
      ...v,
      id: uuidv4(),
      layers: v.layers.map((l: any): Layer => {
        // Resolve Constraints into X/Y
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

        if (isTextLayer(l)) {
          return {
            ...base,
            type: 'text',
            fontFamily: 'Inter',
          } ;
        } else {
          return {
            ...base,
            type: 'rectangle', // Default to rectangle if unspecified
          } as ShapeLayer;
        }
      }),
    }));
  } catch (err) {
    console.error('Creative Agent parsing failed', err);
    throw new Error('Failed to generate structural layouts.');
  }
};

/**
 * Stage 1 (Refinement): Creative Agent Refine
 * Mutates specific target layers based on an intent, using other layers as context.
 */
export const creativeAgentRefine = async (
  intent: string,
  targetLayers: Layer[],
  contextLayers: Layer[],
  canvasSize: { width: number; height: number },
  variantCount: number = 3
): Promise<AgentVariant[]> => {
  const systemPrompt = `You are a Senior Design Refinement Engine. 
You are given TARGET layers (to be improved/modified) and CONTEXT layers (to be respected/aligned with).
Based on the user's intent, generate ${variantCount} improved versions of the TARGET layers.
Canvas size is ${canvasSize.width}x${canvasSize.height}.

Rules:
1. Only return the modified versions of the TARGET layers.
2. Ensure they align visually with the CONTEXT layers.
3. You can change positions, colors, text content, or sizes to better fit the intent.
4. Return valid JSON matching the schema.`;

  const layerSchema = {
    type: SchemaType.OBJECT,
    properties: {
      id: {
        type: SchemaType.STRING,
        description: "Keep the original ID if you are modifying a layer, or 'new' if adding a sub-element",
      },
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
    systemInstruction: systemPrompt,
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
    // 🤖 Astra: Wrap output parsing with safeParseJSON to avoid raw JSON.parse crashes.
    const rawVariants = safeParseJSON<any[] | null>(data.text || '', null);
    if (!rawVariants) {
      throw new Error('Creative Refine returned malformed JSON');
    }
    return rawVariants.map((v: any) => ({
      ...v,
      id: uuidv4(),
      layers: v.layers.map((l: any): Layer => {
        // Find existing layer to preserve type-specific props not handled by LLM
        const existing = targetLayers.find((tl) => tl.id === l.id);
        const base = {
          ...existing,
          ...l,
          id: l.id === 'new' ? uuidv4() : l.id,
          name: l.text ? l.text.substring(0, 15) : existing?.name || l.type,
          visible: true,
          locked: false,
          opacity: 1,
        };

        return base as Layer;
      }),
    }));
  } catch (err) {
    console.error('Creative Refine Parsing failed', err);
    throw new Error('Failed to refine selection.');
  }
};

/**
 * Stage 2: Critic Agent
 * Reviews designs mathematically (alignment, contrast) and mutates the layers.
 */
export const criticAgentReview = async (variants: AgentVariant[]): Promise<AgentVariant[]> => {
  const systemPrompt = `You are a strict QA Design Critic. You are given an array of design variants (JSON).
Your job is to audit them:
1. Alignment constraints (e.g. text should be visually aligned left/center).
2. Spacing overlaps.
3. Contrast rules (e.g. light text on dark background).
Fix the layer coordinates, widths, or colors directly in the JSON.
Provide a "criticFeedback" array of strings explaining what you fixed for each variant.
You MUST return the identical schema structure for variants but with improved values.`;

  const simplifiedInput = variants.map((v) => ({
    id: v.id,
    themeIdea: v.themeIdea,
    layers: v.layers.map((l: any) => ({
      id: l.id,
      type: l.type,
      x: l.x,
      y: l.y,
      color: (l as ShapeLayer | TextLayer).color,
      text: (l ).text,
      fontSize: (l ).fontSize,
      width: l.width,
      height: l.height,
    })),
  }));

  const data = await callBackendGeminiAPI({
    modelName: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1, // Strict logic
    },
    contents: [{ role: 'user', parts: [{ text: `Variants to Audit: ${JSON.stringify(simplifiedInput)}` }] }],
  });

  try {
    // 🤖 Astra: Wrap output parsing with safeParseJSON to avoid raw JSON.parse crashes.
    const refined = safeParseJSON<any[] | null>(data.text || '', null);
    if (!refined) {
      throw new Error('Critic Agent returned malformed JSON');
    }
    // Map refined properties back into the original variant structure to preserve ID and internal structure
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
          if (refinedLayer) {
            return { ...l, ...refinedLayer };
          }
          return l;
        }),
      };
    });
  } catch (err) {
    console.error('Critic Agent failed, passing original variants', err);
    return variants; // Failsafe: return originals if critic breaks JSON
  }
};

/**
 * Stage 3: Performance Agent
 * Scores the variants based on growth heuristics.
 */
export const performanceAgentScore = async (variants: AgentVariant[]): Promise<AgentVariant[]> => {
  const systemPrompt = `You are a Growth Marketing AI. 
Analyze the provided design variants.
Evaluate them on: reading flow, Call-To-Action visibility, whitespace usage, and overall emotional impact.
Assign a "score" between 0 and 100 to each variant.
Provide "reasoning" for the score.
Only return an array of objects containing { id, score, reasoning }.`;

  const simplifiedInput = variants.map((v) => ({
    id: v.id,
    themeIdea: v.themeIdea,
    layersSummary: v.layers.map((l: any) => ({ type: l.type, x: l.x, y: l.y, text: (l ).text })),
  }));

  const data = await callBackendGeminiAPI({
    modelName: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
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
    // 🤖 Astra: Wrap output parsing with safeParseJSON to avoid raw JSON.parse crashes.
    const scores = safeParseJSON<any[] | null>(data.text || '', null);
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
      .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0)); // Sort highest first
  } catch (err) {
    console.error('Performance Agent failed', err);
    return variants;
  }
};
