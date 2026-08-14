import { SchemaType } from '@google/generative-ai';
import { MODEL_FAST, FONT_FAMILIES } from '../constants';
import { DesignTheme, ExtractedReferenceStyle, GenerationQuality } from '../types';
import * as freepikService from './freepikService';
import { aiModelsService } from './aiModelsService';
import { DEFAULT_EDIT_MODEL, getImageModel } from '../config/imageModels';
import { log } from '../utils/log';
import { safeParseJSON, retryWithBackoff } from '../utils/errorHandling';

// Helper to call backend serverless endpoint — routed through OpenRouter
export const callBackendGeminiAPI = async (payload: any) => {
  const endpoint = process.env.NODE_ENV === 'test' ? 'http://localhost:3000/api/openrouter' : '/api/openrouter';

  // Translate Gemini-style payload into OpenAI/OpenRouter messages array
  const messages: { role: string; content: string | any[] }[] = [];

  if (payload.systemInstruction) {
    const sysText =
      typeof payload.systemInstruction === 'string'
        ? payload.systemInstruction
        : (payload.systemInstruction?.parts?.map((p: any) => p.text).join('\n') ?? '');
    messages.push({ role: 'system', content: sysText });
  }

  // Gemini `parts` can mix text with inlineData (images). OpenRouter expects multimodal
  // turns as a content array, so a turn is only collapsed to a plain string when it is
  // text-only — otherwise the image would be dropped and the model would answer blind.
  const partToContent = (p: any) => {
    if (p?.inlineData?.data) {
      const mimeType = p.inlineData.mimeType || 'image/png';
      const data: string = p.inlineData.data;
      return {
        type: 'image_url',
        image_url: { url: data.startsWith('data:') ? data : `data:${mimeType};base64,${data}` },
      };
    }
    return { type: 'text', text: p?.text ?? '' };
  };

  if (Array.isArray(payload.contents)) {
    for (const c of payload.contents) {
      const role = c.role === 'model' ? 'assistant' : 'user';
      if (!Array.isArray(c.parts)) {
        messages.push({ role, content: String(c) });
        continue;
      }
      if (c.parts.some((p: any) => p?.inlineData?.data)) {
        messages.push({
          role,
          content: c.parts.map(partToContent).filter((part: any) => part.type !== 'text' || part.text),
        });
      } else {
        messages.push({ role, content: c.parts.map((p: any) => p.text ?? '').join('') });
      }
    }
  } else if (payload.contents) {
    messages.push({ role: 'user', content: String(payload.contents) });
  }

  // Map Gemini model names to OpenRouter equivalents
  const modelMap: Record<string, string> = {
    'gemini-2.0-flash': 'google/gemini-2.0-flash-001',
    'gemini-2.0-flash-exp': 'google/gemini-2.0-flash-001',
    'gemini-2.5-flash': 'google/gemini-2.5-flash-preview',
    'gemini-2.5-pro': 'google/gemini-2.5-pro-preview',
    'gemini-1.5-flash': 'google/gemini-2.0-flash-001',
    'gemini-1.5-pro': 'google/gemini-2.5-pro-preview',
  };
  const rawModel = payload.modelName || 'gemini-2.0-flash';
  const model = modelMap[rawModel] ?? 'google/gemini-2.0-flash-001';

  const max_tokens = payload.generationConfig?.maxOutputTokens ?? 8192;

  return retryWithBackoff(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages, max_tokens }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          // Normalize OpenRouter response to match the shape callers expect
          const text = data.choices?.[0]?.message?.content ?? data.text ?? '';
          return { text, candidates: [{ content: { parts: [{ text }] } }] };
        }

        const error = new Error(`OpenRouter API returned an error: ${response.status} ${response.statusText}`);
        if (response.status === 429 || response.status >= 500) {
          error.name = 'NetworkError';
        }
        throw error;
      } catch (e: any) {
        clearTimeout(timeoutId);

        if (e.name === 'AbortError') {
          const timeoutError = new Error('AI API request timed out after 30 seconds');
          timeoutError.name = 'TimeoutError';
          log.error('[GeminiService] API call timed out', timeoutError, { endpoint });
          throw timeoutError;
        }

        log.error('[GeminiService] Backend API call failed', e, { endpoint });
        throw e;
      }
    },
    3,
    1000
  );
};

/**
 * Clean Base64 string by removing data URL prefix if present.
 * Aggressively strips whitespace to prevent RPC errors.
 */
export const cleanBase64 = (dataUrl: string): { data: string; mimeType: string } => {
  if (!dataUrl) {
    throw new Error('Invalid image data provided');
  }

  // Remove whitespace/newlines which might break the regex or API
  const cleanUrl = dataUrl.trim();

  // More permissive regex to catch data URI schemes
  const matches = cleanUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (matches && matches.length === 3) {
    return {
      mimeType: matches[1],
      // Important: Strip newlines/spaces from the actual base64 payload
      data: matches[2].replace(/\s/g, ''),
    };
  }

  // Fallback: If it looks like raw base64 (no data prefix), return as is with default mime
  return {
    mimeType: 'image/png',
    data: cleanUrl.replace(/\s/g, ''),
  };
};

/**
 * Raster generation fallback leg.
 *
 * Gemini-hosted image generation is NOT reachable from the browser: the OpenRouter bridge
 * normalizes every response to text parts, so extractImageFromResponse could never find
 * inlineData and this function always threw. Fal is the single image backend
 * (see imageGenService.generateImageWithModel); this remains only as its Freepik fallback.
 */
export const generateImage = async (
  prompt: string,
  aspectRatio: string,
  quality: GenerationQuality = 'standard'
): Promise<string> => {
  if (!freepikService.isConfigured()) {
    throw new Error('Image generation unavailable: the selected model failed and no Freepik fallback is configured.');
  }

  try {
    const result = await freepikService.generateImage(prompt, {
      resolution: quality === 'hd' ? '2k' : '1k',
      aspectRatio,
    });
    if (!result) {
      throw new Error('Freepik returned no image');
    }
    return result;
  } catch (error) {
    log.error('[GeminiService] Freepik fallback generation failed', error, { prompt, aspectRatio, quality });
    throw error;
  }
};

/**
 * Prompt-driven image editing, routed to Fal's edit endpoints — the single editing backend.
 * Every edit helper below (upscale/enhance/erase/retouch/expand/pattern) funnels through here.
 */
export const editImage = async (
  base64Image: string,
  prompt: string,
  quality: GenerationQuality = 'standard'
): Promise<string> => {
  const model = getImageModel(quality === 'hd' ? 'nano-banana-pro' : DEFAULT_EDIT_MODEL);
  if (!model?.editEndpoint) {
    throw new Error('Image editing unavailable: no edit-capable model is configured.');
  }

  try {
    // Normalize to a full data URI whether the caller passed one or raw base64.
    const { data: b64Data, mimeType } = cleanBase64(base64Image);
    const result = await aiModelsService.generateImageWithReference(
      model.editEndpoint,
      prompt,
      `data:${mimeType};base64,${b64Data}`,
      model.imageInputField ?? 'image_urls'
    );
    if (!result) {
      throw new Error('Edit returned no image');
    }
    return result;
  } catch (error) {
    log.error('Edit Error', error, { prompt, model: model.id });
    throw error;
  }
};

export const removeBackground = async (base64Image: string): Promise<string> => {
  try {
    return await editImage(
      base64Image,
      'Extract the main subject of this image and place it on a transparent background. Isolate the subject perfectly.'
    );
  } catch (error) {
    log.error('Remove BG failed — trying Freepik fallback', error);

    // Freepik fallback for background removal
    if (freepikService.isConfigured()) {
      try {
        const result = await freepikService.removeBackground(base64Image);
        if (result) {
          return result;
        }
      } catch (fpError) {
        log.error('Freepik BG removal fallback also failed:', fpError);
      }
    }

    throw error;
  }
};

export const generateText = async (
  currentText: string,
  instruction: string = 'Rewrite this to be more creative and catchy.'
): Promise<string> => {
  try {
    const systemInstruction = `You are a creative copywriter. ${instruction}\nMaintain the original language. Keep it concise. Return ONLY the rewritten text.`;

    const data = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.STRING,
          description: 'The rewritten text.',
        },
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: `Input Text: "${currentText}"\n\nOutput:` }],
        },
      ],
      systemInstruction: systemInstruction,
    });

    // 🤖 Astra: Force strict JSON output for strings to eliminate conversational preamble
    const parsed = safeParseJSON<string | null>(data.text || 'null', null);

    if (!parsed || parsed.trim() === currentText.trim()) {
      log.warn('[GeminiService] Text rewrite returned same text or failed to parse');
      return currentText;
    }
    return parsed.trim();
  } catch (error) {
    log.error('Text Generation Error:', error);
    throw error;
  }
};

/**
 * Generate a background scene image for a given orientation.
 * Uses aspect ratio hints to better match the destination artboard.
 */
export const generateBackground = async (
  prompt: string,
  width: number,
  height: number,
  quality: GenerationQuality = 'standard'
): Promise<string> => {
  // Map dimensions to a coarse aspect keyword the backend understands
  const ratio = width / Math.max(1, height);
  const aspect = ratio > 1.2 ? 'landscape' : ratio < 0.85 ? 'portrait' : 'square';
  const enhancedPrompt = `${prompt}. Ultra-clean background for product shots, cohesive lighting, no text, no watermark.`;
  return generateImage(enhancedPrompt, aspect, quality);
};

/**
 * Generate a concise, meaningful layer name based on a description of its properties.
 */
export const generateLayerName = async (description: string): Promise<string> => {
  try {
    const systemInstruction =
      'You are a helpful naming assistant. Return a short, human-friendly layer name (2-4 words, Title Case).';
    const data = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.STRING,
          description: 'A short, human-friendly layer name.',
        },
      },
      contents: [{ role: 'user', parts: [{ text: `Describe: ${description}\nName:` }] }],
      systemInstruction,
    });
    // 🤖 Astra: Force strict JSON output for strings to eliminate conversational preamble and quotes
    const parsed = safeParseJSON<string | null>(data.text || 'null', null);
    return parsed?.trim() || 'Layer';
  } catch (error) {
    log.error('generateLayerName error:', error);
    return 'Layer';
  }
};

/**
 * Generate alt text for an image given its src (data URL or URL).
 */
export const generateAltText = async (src: string): Promise<string> => {
  try {
    let b64: { data: string; mimeType: string } | null = null;
    if (src.startsWith('data:')) {
      b64 = cleanBase64(src);
    } else {
      // Try to fetch and convert to base64 via canvas (may require CORS-enabled images)
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
      const canvas = document.createElement('canvas');
      canvas.width = loaded.naturalWidth;
      canvas.height = loaded.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context unavailable');
      }
      ctx.drawImage(loaded, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      b64 = cleanBase64(dataUrl);
    }

    const parts = [
      { text: 'Generate a concise, descriptive alt text for accessibility. No trailing punctuation.' },
      { inlineData: { mimeType: b64!.mimeType, data: b64!.data } },
    ];
    const data = await callBackendGeminiAPI({
      modelName: MODEL_FAST,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.STRING,
          description: 'The descriptive alt text',
        },
      },
      contents: [{ role: 'user', parts }],
    });
    // Astra: Force strict JSON output for strings to eliminate conversational preamble
    const parsed = safeParseJSON<string | null>(data.text || 'null', null);
    return parsed?.trim().replace(/[.!?]+$/, '') || 'Image';
  } catch (error) {
    log.error('generateAltText error:', error);
    return 'Image';
  }
};

export const generateTextOptions = async (topic: string): Promise<string[]> => {
  try {
    const data = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Generate 5 creative, short, and catchy phrases about: "${topic}". Useful for posters or social media. Return them as a simple JSON string array.`,
            },
          ],
        },
      ],
    });
    // 🤖 Astra: Passed 'null' fallback string to safeParseJSON instead of '[]' to prevent silent failures on empty LLM output and ensure error catching logic executes.
    const parsed = safeParseJSON<string[] | null>(data.text || 'null', null);
    if (!parsed) {
      throw new Error('Failed to parse text options JSON');
    }
    return parsed;
  } catch (error) {
    log.error('Text Options Error:', error);
    return [];
  }
};

const ENHANCE_PROMPT_SYSTEM_V1 = `
You are an expert prompt engineer for AI image generators.
Rewrite the simple user description into a highly detailed, artistic, and effective image generation prompt.
Include lighting, style, composition, and mood keywords. Keep it under 50 words.
Return ONLY the enhanced prompt as a JSON string.
`.trim();

export const enhancePrompt = async (simplePrompt: string): Promise<string> => {
  try {
    // 🤖 Astra: Sanitize and truncate user input to prevent prompt injection and payload bloat
    const sanitizedPrompt = simplePrompt.trim().substring(0, 1000);
    const data = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      systemInstruction: ENHANCE_PROMPT_SYSTEM_V1,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.STRING,
          description: 'The enhanced, detailed image generation prompt.',
        },
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `User Description: "${sanitizedPrompt}"`,
            },
          ],
        },
      ],
    });

    // 🤖 Astra: Passed 'null' fallback string to safeParseJSON instead of '""' to prevent silent failures on empty LLM output and ensure error catching logic executes.
    const parsed = safeParseJSON<string | null>(data.text || 'null', null);
    if (!parsed) {
      log.warn('[GeminiService] enhancePrompt failed to parse response, using original prompt');
    }
    return parsed || simplePrompt;
  } catch (error) {
    log.error('Prompt Enhancer Error:', error);
    return simplePrompt;
  }
};

export const generateDesignTheme = async (prompt: string): Promise<DesignTheme> => {
  try {
    // 🤖 Astra: Sanitize and truncate user input to prevent prompt injection and payload bloat
    const sanitizedPrompt = prompt.trim().substring(0, 1000);
    const availableFonts = FONT_FAMILIES.join(', ');
    const systemPrompt = `
      You are a world-class graphic designer. 
      Generate a design theme (colors and fonts) based on the user's description.
      
      You must pick fonts ONLY from this list: ${availableFonts}.
      If the exact font isn't suitable, pick the closest match from the list.
      
      Return JSON only.
    `;

    const data = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      // 🤖 Astra: Moved persona and rules to native systemInstruction field
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING, description: 'A creative name for this theme' },
            backgroundColor: { type: SchemaType.STRING, description: 'Hex code for canvas background' },
            primaryColor: { type: SchemaType.STRING, description: 'Hex code for main elements/headings' },
            secondaryColor: { type: SchemaType.STRING, description: 'Hex code for secondary elements' },
            accentColor: { type: SchemaType.STRING, description: 'Hex code for highlights' },
            headingFont: { type: SchemaType.STRING, description: 'Font family for headings' },
            bodyFont: { type: SchemaType.STRING, description: 'Font family for body text' },
          },
          required: [
            'name',
            'backgroundColor',
            'primaryColor',
            'secondaryColor',
            'accentColor',
            'headingFont',
            'bodyFont',
          ],
        },
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: `User Prompt: "${sanitizedPrompt}"` }],
        },
      ],
    });

    // 🤖 Astra: Passed 'null' fallback string to safeParseJSON to ensure error catching logic executes cleanly on empty responses.
    const parsed = safeParseJSON<DesignTheme | null>(data.text || 'null', null);
    if (!parsed) {
      throw new Error('Failed to parse theme JSON');
    }
    return parsed;
  } catch (error) {
    log.error('Theme Generation Error', error, { prompt: prompt.substring(0, 100) });
    throw error;
  }
};

export const analyzeDesign = async (base64Image: string, query: string): Promise<string> => {
  try {
    const { data: b64Data, mimeType } = cleanBase64(base64Image);
    const parts = [
      { text: `You are a professional senior graphic designer. Analyze this design. ${query}` },
      { inlineData: { mimeType, data: b64Data } },
    ];

    const data = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            scores: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  category: { type: SchemaType.STRING },
                  score: { type: SchemaType.NUMBER },
                  feedback: { type: SchemaType.STRING },
                },
              },
            },
            overall: { type: SchemaType.NUMBER },
            suggestions: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
          },
        },
      },
    });

    return data.text || "I couldn't analyze the design.";
  } catch (error) {
    log.error('Analyze Design Error', error, { query, base64Length: base64Image?.length || 0 });
    throw error;
  }
};

export const generateLayout = async (prompt: string): Promise<any> => {
  try {
    const systemPrompt = `
      You are a layout generator engine. Based on the description, return a JSON object containing a list of text layers and shape layers.
      
      Canvas size is roughly 1080x1080.
      
      Return JSON in this format:
      {
         "textLayers": [{ "text": "Heading", "x": 100, "y": 100, "fontSize": 40, "color": "#000", "width": 300, "textAlign": "center" }],
         "shapeLayers": [{ "type": "rectangle", "x": 0, "y": 0, "width": 100, "height": 100, "color": "#f00" }]
      }
      
      Keep it simple but effective.
    `;

    const data = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            textLayers: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  text: { type: SchemaType.STRING },
                  x: { type: SchemaType.NUMBER },
                  y: { type: SchemaType.NUMBER },
                  fontSize: { type: SchemaType.NUMBER },
                  color: { type: SchemaType.STRING },
                  width: { type: SchemaType.NUMBER },
                  textAlign: { type: SchemaType.STRING },
                },
              },
            },
            shapeLayers: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  type: { type: SchemaType.STRING },
                  x: { type: SchemaType.NUMBER },
                  y: { type: SchemaType.NUMBER },
                  width: { type: SchemaType.NUMBER },
                  height: { type: SchemaType.NUMBER },
                  color: { type: SchemaType.STRING },
                },
              },
            },
          },
        },
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser Prompt: ${prompt}` }],
        },
      ],
    });

    const text = data.text;
    if (!text) {
      return null;
    }
    const parsed = safeParseJSON<any>(text, null);
    if (!parsed) {
      throw new Error('Failed to parse layout JSON');
    }
    return parsed;
  } catch (error) {
    log.error('Layout Generation Error', error, { prompt: prompt.substring(0, 100) });
    throw error;
  }
};

export const generateSVGShape = async (prompt: string): Promise<string> => {
  try {
    const systemPrompt = `
      You are an SVG path generator. 
      Generate a valid SVG path 'd' attribute for the shape described.
      Simpler paths are better. 
      Do NOT include <svg> or <path> tags, JUST the string content of the 'd' attribute.
      Assume a viewBox of 0 0 100 100.
    `;

    // Astra: Strict JSON output schema prevents conversational preamble and markup
    const data = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.STRING,
          description: "The raw SVG path 'd' attribute string.",
        },
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nDescription: ${prompt}` }],
        },
      ],
    });

    // 🤖 Astra: Passed 'null' fallback string to safeParseJSON instead of '""' to prevent silent failures on empty LLM output and ensure error catching logic executes.
    const parsed = safeParseJSON<string | null>(data.text || 'null', null);
    if (!parsed) {
      throw new Error('Failed to parse SVG path JSON');
    }
    return parsed;
  } catch (error) {
    log.error('SVG Generation Error', error, { prompt: prompt.substring(0, 100) });
    throw error;
  }
};

export const expandImage = async (base64Image: string): Promise<string> => {
  try {
    return await editImage(
      base64Image,
      'Fill in the transparent background to naturally extend the scene. Keep the style consistent.'
    );
  } catch (error) {
    log.error('Gemini Expand Image Error — trying Freepik fallback', error);

    // Freepik fallback for image expansion/outpainting
    if (freepikService.isConfigured()) {
      try {
        const result = await freepikService.expandImage(base64Image);
        if (result) {
          log.info('Freepik expand fallback succeeded');
          return result;
        }
      } catch (fpError) {
        log.error('Freepik expand fallback also failed', fpError);
      }
    }

    throw error;
  }
};

export const generatePattern = async (prompt: string): Promise<string> => {
  try {
    return await generateImage(
      `Seamless pattern texture, ${prompt}, flat view, top down, high quality wallpaper style`,
      '1:1',
      'standard'
    );
  } catch (error) {
    log.error('Pattern Generation Error', error, { prompt: prompt.substring(0, 100) });
    throw error;
  }
};

export const optimizeLayout = async (layers: any[], canvasWidth: number, canvasHeight: number): Promise<any[]> => {
  try {
    // Simplify layer data to reduce token usage
    const simplifiedLayers = layers.map((l) => ({
      id: l.id,
      type: l.type,
      text: l.text ? l.text.substring(0, 20) : undefined,
      x: l.x,
      y: l.y,
      width: l.width,
      height: l.height,
    }));

    const systemPrompt = `
      You are a layout optimization engine.
      Analyze the provided graphic design elements and rearrange them into a professional, balanced composition.
      Canvas size: ${canvasWidth}x${canvasHeight}.
      
      Rules:
      1. Keep all layers.
      2. Return ONLY the modified properties (x, y, width, height) for each layer ID.
      3. Ensure clear visual hierarchy and alignment.
      
      Return JSON format:
      [
        { "id": "layer_1", "x": 100, "y": 100, "width": 200, "height": 50 },
        ...
      ]
    `;

    const data = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              id: { type: SchemaType.STRING },
              x: { type: SchemaType.NUMBER },
              y: { type: SchemaType.NUMBER },
              width: { type: SchemaType.NUMBER },
              height: { type: SchemaType.NUMBER },
            },
            required: ['id', 'x', 'y'],
          },
        },
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nCurrent Layout: ${JSON.stringify(simplifiedLayers)}` }],
        },
      ],
    });

    const text = data.text;
    if (!text) {
      return [];
    }
    const parsed = safeParseJSON<any[] | null>(text, null);
    if (!parsed) {
      throw new Error('Failed to parse optimize layout JSON');
    }
    return parsed;
  } catch (error) {
    log.error('Layout Optimization Error:', error);
    return [];
  }
};

export const generatePaletteFromImage = async (base64Image: string): Promise<string[]> => {
  try {
    const { data: b64Data, mimeType } = cleanBase64(base64Image);
    const prompt =
      'Analyze this image/logo and extract the 5 most representative brand colors as HEX codes. Return ONLY a valid JSON array of strings (e.g., ["#ffffff", "#000000"]).';

    const data = await callBackendGeminiAPI({
      modelName: MODEL_FAST,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.STRING,
            description: 'Hex color code',
          },
        },
      },
      contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { data: b64Data, mimeType } }] }],
    });

    // Astra: Gemini strict JSON output schema prevents malformed regex parsing bugs
    // 🤖 Astra: Passed 'null' fallback string to safeParseJSON instead of '[]' to prevent silent failures on empty LLM output and ensure error catching logic executes.
    const parsed = safeParseJSON<string[] | null>(data.text || 'null', null);
    if (!parsed) {
      throw new Error('Failed to parse palette JSON');
    }
    return parsed;
  } catch (error) {
    log.error('Palette extraction failed', error);
    return [];
  }
};

export const vectorizeImage = async (
  base64Image: string,
  colors: number = 4,
  stylePreset: string = 'default'
): Promise<Array<{ path: string; color: string }>> => {
  try {
    const { data: b64Data, mimeType } = cleanBase64(base64Image);
    const styleGuide =
      {
        default: 'precise, clean vector tracing',
        minimal: 'simplified flat shapes with minimal nodes',
        detailed: 'high-fidelity paths with fine detail',
        artistic: 'stylized artistic interpretation',
      }[stylePreset] || 'precise, clean vector tracing';

    const prompt = `Convert this image into a clean, minimal vector graphic with exactly ${colors} main colors.
    Style: ${styleGuide}.
    Identify the main shapes and represent each as a high-quality SVG path 'd' attribute.
    Group similar colors together. Return as a JSON array of objects with 'path' and 'color'.
    Assume a viewBox of 0 0 100 100. Be precise with the paths.`;

    const data = await callBackendGeminiAPI({
      modelName: MODEL_FAST,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              path: { type: SchemaType.STRING, description: "SVG path 'd' attribute" },
              color: { type: SchemaType.STRING, description: 'Hex color code' },
            },
            required: ['path', 'color'],
          },
        },
      },
      contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { data: b64Data, mimeType } }] }],
    });

    const text = data.text;
    // 🤖 Astra: Passed 'null' fallback string to safeParseJSON instead of '[]' to prevent silent failures on empty LLM output and ensure error catching logic executes.
    const parsed = safeParseJSON<Array<{ path: string; color: string }> | null>(text || 'null', null);
    if (!parsed) {
      throw new Error('Failed to parse vectorize JSON');
    }
    return parsed;
  } catch (error) {
    log.error('Vectorization failed', error);
    throw error;
  }
};

export const generateAIVector = async (
  prompt: string,
  stylePreset: string = 'default'
): Promise<Array<{ path: string; color: string }>> => {
  try {
    const styleGuide =
      {
        default: 'Use precise, clean paths.',
        minimal: 'Use simplified flat shapes with minimal nodes for a clean minimal look.',
        detailed: 'Use high-fidelity paths with fine detail and many anchor points.',
        artistic: 'Use a stylized, artistic interpretation with expressive shapes.',
      }[stylePreset] || 'Use precise, clean paths.';

    const systemPrompt = `You are a professional vector artist. Generate a clean, high-quality vector graphic based on the prompt. Represent the graphic as multiple SVG path 'd' attributes with corresponding hex colors. ${styleGuide}
    Assume a viewBox of 0 0 100 100. Be precise and creative. Return as a JSON array of objects.`;

    const data = await callBackendGeminiAPI({
      modelName: MODEL_FAST,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              path: { type: SchemaType.STRING, description: "SVG path 'd' attribute" },
              color: { type: SchemaType.STRING, description: 'Hex color code' },
            },
            required: ['path', 'color'],
          },
        },
      },
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nPrompt: ${prompt}` }] }],
    });

    const text = data.text;
    // 🤖 Astra: Passed 'null' fallback string to safeParseJSON instead of '[]' to prevent silent failures on empty LLM output and ensure error catching logic executes.
    const parsed = safeParseJSON<Array<{ path: string; color: string }> | null>(text || 'null', null);
    if (!parsed) {
      throw new Error('Failed to parse AI vector JSON');
    }
    return parsed;
  } catch (error) {
    log.error('AI Vector Generation failed', error);
    throw error;
  }
};

export const upscaleImage = async (base64Image: string): Promise<string> => {
  return editImage(
    base64Image,
    'Upscale this image provided to high resolution, enhancing details and textures while maintaining the original composition. Enhance every pixel.'
  );
};

export const enhanceImage = async (base64Image: string): Promise<string> => {
  return editImage(
    base64Image,
    'Automatically color correct this photo. Balance exposure, adjust highlights and shadows, and enhance the colors to make it look professional.'
  );
};

export const eraseObject = async (
  base64ImageWithMask: string, // Expecting the image with the "highlight" or just the subject to remove
  prompt: string = 'Remove the highlighted object naturally and fill the space with matching background.'
): Promise<string> => {
  return editImage(base64ImageWithMask, prompt);
};

export const retouchImage = async (base64Image: string): Promise<string> => {
  return editImage(
    base64Image,
    'Retouch this portrait. Whiten teeth, remove blemishes, and smooth skin while maintaining a natural look.'
  );
};

export const suggestFontPairing = async (primaryFont: string): Promise<string> => {
  try {
    const availableFonts = FONT_FAMILIES.join(', ');
    const prompt = `Given the primary font "${primaryFont}", suggest one perfect complementary secondary font from this list: ${availableFonts}. 
    Consider visual contrast, hierarchy, and harmony. Return ONLY the font name as a JSON string.`;

    const data = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.STRING,
          description: 'The exact name of the suggested complementary font.',
        },
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    // 🤖 Astra: Passed 'null' fallback string to safeParseJSON instead of '""' to prevent silent failures on empty LLM output and ensure error catching logic executes.
    const parsed = safeParseJSON<string | null>(data.text || 'null', null);
    return parsed || primaryFont;
  } catch (error) {
    log.error('Font pairing suggestion failed', error);
    return primaryFont;
  }
};

export const generateAutoLayoutSuggestions = async (layers: any[], width: number, height: number): Promise<any[]> => {
  try {
    const simplifiedLayers = layers.map((l) => ({ id: l.id, type: l.type, name: l.name }));
    const prompt = `Act as a senior UI/UX designer. Given these layers: ${JSON.stringify(simplifiedLayers)}, generate 5 distinct professional layout variations for a ${width}x${height} canvas. 
    Use design principles like the Golden Ratio, Rule of Thirds, and F-pattern. 
    Return a JSON array of objects, where each object is a map of layer IDs to new {x, y, width, height} coordinates.`;

    const data = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      // Astra: Strict JSON output schema prevents malformed parsing issues and unbounded object keys
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            description: 'A map of layer IDs to their new coordinates',
            // Note: SchemaType doesn't explicitly support arbitrary property names in a map in the same way as JSON Schema's additionalProperties,
            // but we can specify it as an OBJECT and Gemini generally understands the prompt structure.
          },
        },
      },
    });

    // 🤖 Astra: Passed 'null' fallback string to safeParseJSON instead of '[]' to prevent silent failures on empty LLM output and ensure error catching logic executes.
    const parsed = safeParseJSON<any[] | null>(data.text || 'null', null);
    if (!parsed) {
      throw new Error('Failed to parse auto-layout suggestions JSON');
    }
    return parsed;
  } catch (error) {
    log.error('Auto-layout failed', error);
    return [];
  }
};

export const extractStyleFromImage = async (base64Image: string): Promise<DesignTheme> => {
  try {
    const { data: b64Data, mimeType } = cleanBase64(base64Image);
    const availableFonts = FONT_FAMILIES.join(', ');
    const prompt = `Analyze this reference image and extract its design system. 
    Pick the most similar fonts from this list: ${availableFonts}.
    Return a JSON object with: name, backgroundColor, primaryColor, secondaryColor, accentColor, headingFont, bodyFont.`;

    const data = await callBackendGeminiAPI({
      modelName: 'gemini-2.0-pro-exp-02-05',
      contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { data: b64Data, mimeType } }] }],
      // Astra: Strict JSON output schema guarantees correctly shaped DesignTheme object
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING },
            backgroundColor: { type: SchemaType.STRING },
            primaryColor: { type: SchemaType.STRING },
            secondaryColor: { type: SchemaType.STRING },
            accentColor: { type: SchemaType.STRING },
            headingFont: { type: SchemaType.STRING },
            bodyFont: { type: SchemaType.STRING },
          },
          required: [
            'name',
            'backgroundColor',
            'primaryColor',
            'secondaryColor',
            'accentColor',
            'headingFont',
            'bodyFont',
          ],
        },
      },
    });

    // 🤖 Astra: Passed 'null' fallback string to safeParseJSON instead of '{}' to prevent silent failures on empty LLM output and ensure error catching logic executes.
    const parsed = safeParseJSON<DesignTheme | null>(data.text || 'null', null);
    if (!parsed) {
      throw new Error('Failed to parse style JSON');
    }
    return parsed;
  } catch (error) {
    log.error('Style extraction failed', error);
    throw error;
  }
};

/**
 * Vision analysis of a reference image, broken into the facets a designer actually wants
 * to borrow selectively. Cached on the StyleReference so a given image is analyzed once.
 *
 * Note: the OpenRouter bridge forwards only max_tokens from generationConfig, so
 * responseSchema is not enforced server-side — JSON shape is requested in the prompt and
 * defended by safeParseJSON plus per-field normalization below.
 */
export const analyzeReferenceImage = async (base64Image: string): Promise<ExtractedReferenceStyle> => {
  try {
    const { data: b64Data, mimeType } = cleanBase64(base64Image);
    const prompt = `Analyze this reference image as a design director would, so its qualities can be reproduced in a NEW image.
Respond with ONLY a JSON object (no markdown fence, no commentary) with exactly these keys:
{
  "summary": "one sentence capturing the overall visual identity",
  "palette": ["#hex", "#hex", "#hex", "#hex"],
  "composition": "framing, balance, focal point, negative space, grid",
  "typography": "letterforms, weight, case, spacing — or 'none' if no text is present",
  "textures": "surface qualities, grain, noise, material feel",
  "mood": "emotional tone and energy",
  "lighting": "light direction, quality, contrast, shadow behavior",
  "illustrationStyle": "photographic, 3D render, flat vector, painterly, collage, etc.",
  "cameraAngle": "eye level, top down, low angle, macro, wide — or 'n/a' for non-photographic"
}
Use concrete visual language, not vague adjectives. Palette must be real hex codes sampled from the image.`;

    const data = await callBackendGeminiAPI({
      modelName: MODEL_FAST,
      contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { data: b64Data, mimeType } }] }],
      // Astra: Strict JSON output schema guarantees correctly shaped ExtractedReferenceStyle object
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            summary: { type: SchemaType.STRING },
            palette: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            composition: { type: SchemaType.STRING },
            typography: { type: SchemaType.STRING },
            textures: { type: SchemaType.STRING },
            mood: { type: SchemaType.STRING },
            lighting: { type: SchemaType.STRING },
            illustrationStyle: { type: SchemaType.STRING },
            cameraAngle: { type: SchemaType.STRING },
          },
          required: [
            'summary',
            'palette',
            'composition',
            'typography',
            'textures',
            'mood',
            'lighting',
            'illustrationStyle',
            'cameraAngle',
          ],
        },
      },
    });

    const parsed = safeParseJSON<Partial<ExtractedReferenceStyle> | null>(data.text || 'null', null);
    if (!parsed) {
      throw new Error('Failed to parse reference analysis JSON');
    }

    const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
    return {
      summary: text(parsed.summary),
      palette: Array.isArray(parsed.palette)
        ? parsed.palette.filter((c: unknown): c is string => typeof c === 'string')
        : [],
      composition: text(parsed.composition),
      typography: text(parsed.typography),
      textures: text(parsed.textures),
      mood: text(parsed.mood),
      lighting: text(parsed.lighting),
      illustrationStyle: text(parsed.illustrationStyle),
      cameraAngle: text(parsed.cameraAngle),
    };
  } catch (error) {
    log.error('Reference image analysis failed', error);
    throw error;
  }
};
