import { SchemaType } from '@google/generative-ai';
import { MODEL_FAST, MODEL_PRO, FONT_FAMILIES } from '../constants';
import { DesignTheme, GenerationQuality } from '../types';
import * as freepikService from './freepikService';
import { log } from '../utils/log';

// Helper to call backend serverless endpoint
const callBackendGeminiAPI = async (payload: any) => {
  const endpoint = process.env.NODE_ENV === 'test' ? 'http://localhost:3000/api/gemini' : '/api/gemini';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'generateContent', ...payload }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    const error = new Error(data.error || 'API request failed');
    log.error('Gemini API call failed', error);
    throw error;
  }
  
  return data;
};

/**
 * Clean Base64 string by removing data URL prefix if present.
 * Aggressively strips whitespace to prevent RPC errors.
 */
const cleanBase64 = (dataUrl: string): { data: string; mimeType: string } => {
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

export const generateImage = async (
  prompt: string,
  aspectRatio: string,
  quality: GenerationQuality = 'standard'
): Promise<string> => {
  try {
    const modelName = quality === 'hd' ? MODEL_PRO : MODEL_FAST;
    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio,
      },
    };

    if (quality === 'hd') {
      config.imageConfig.imageSize = '1K';
    }

    const data = await callBackendGeminiAPI({
      modelName,
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: config,
    });

    return extractImageFromResponse(data);
  } catch (error) {
    log.error('[GeminiService] Image generation failed, attempting Freepik fallback', error);

    // Freepik fallback
    if (freepikService.isConfigured()) {
      try {
        const result = await freepikService.generateImage(prompt, {
          resolution: quality === 'hd' ? '2k' : '1k',
          aspectRatio,
        });
        if (result) {
          return result;
        }
      } catch (fpError) {
        console.error('Freepik fallback also failed:', fpError);
      }
    }

    throw error;
  }
};

export const editImage = async (
  base64Image: string,
  prompt: string,
  quality: GenerationQuality = 'standard'
): Promise<string> => {
  try {
    const { data: b64Data, mimeType } = cleanBase64(base64Image);
    const modelName = quality === 'hd' ? MODEL_PRO : MODEL_FAST;

    const parts = [
      {
        text: prompt,
      },
      {
        inlineData: {
          mimeType,
          data: b64Data,
        },
      },
    ];

    const data = await callBackendGeminiAPI({
      modelName,
      contents: [{ role: 'user', parts }],
    });

    return extractImageFromResponse(data);
  } catch (error) {
    console.error('Edit Error:', error);
    throw error;
  }
};

export const removeBackground = async (base64Image: string): Promise<string> => {
  try {
    const { data: b64Data, mimeType } = cleanBase64(base64Image);
    const prompt =
      'Extract the main subject of this image and place it on a transparent background. Isolate the subject perfectly.';

    const parts = [{ text: prompt }, { inlineData: { mimeType, data: b64Data } }];

    const data = await callBackendGeminiAPI({
      modelName: MODEL_FAST,
      contents: [{ role: 'user', parts }],
    });

    return extractImageFromResponse(data);
  } catch (error) {
    console.error('Gemini Remove BG Error — trying Freepik fallback:', error);

    // Freepik fallback for background removal
    if (freepikService.isConfigured()) {
      try {
        const result = await freepikService.removeBackground(base64Image);
        if (result) {
          return result;
        }
      } catch (fpError) {
        console.error('Freepik BG removal fallback also failed:', fpError);
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
    const systemInstruction = `You are a creative copywriter. ${instruction}\nMaintain the original language. Keep it concise. Return ONLY the rewritten text without quotes or explanations.`;

    const data = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `Input Text: "${currentText}"\n\nOutput:` }],
        },
      ],
      systemInstruction: systemInstruction,
    });

    return (
      data.text
        ?.trim()
        .replace(/^["']|["']$/g, '') || currentText
    );
  } catch (error) {
    console.error('Text Generation Error:', error);
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
    const systemInstruction = 'You are a helpful naming assistant. Return a short, human-friendly layer name (2-4 words, Title Case). No quotes.';
    const data = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `Describe: ${description}\nName:` }] },
      ],
      systemInstruction,
    });
    return (data.text?.trim().replace(/^["']|["']$/g, '') || 'Layer');
  } catch (error) {
    console.error('generateLayerName error:', error);
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
      if (!ctx) {throw new Error('Canvas 2D context unavailable');}
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
      contents: [{ role: 'user', parts }],
    });
    return (data.text?.trim().replace(/[.!?]+$/, '') || 'Image');
  } catch (error) {
    console.error('generateAltText error:', error);
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
    return JSON.parse(data.text || '[]');
  } catch (error) {
    console.error('Text Options Error:', error);
    return [];
  }
};

export const enhancePrompt = async (simplePrompt: string): Promise<string> => {
  try {
    const data = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are an expert prompt engineer for AI image generators. Rewrite the following simple user description into a highly detailed, artistic, and effective image generation prompt. Include lighting, style, composition, and mood keywords. Keep it under 50 words.
      
      User Description: "${simplePrompt}"
      
      Enhanced Prompt:`,
            },
          ],
        },
      ],
    });
    return data.text?.trim() || simplePrompt;
  } catch (error) {
    console.error('Prompt Enhancer Error:', error);
    return simplePrompt;
  }
};

export const generateDesignTheme = async (prompt: string): Promise<DesignTheme> => {
  try {
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
          parts: [{ text: `${systemPrompt}\n\nUser Prompt: ${prompt}` }],
        },
      ],
    });

    const text = data.text;
    if (!text) {
      throw new Error('No theme generated');
    }

    return JSON.parse(text) as DesignTheme;
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
    return JSON.parse(text);
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

    const data = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nDescription: ${prompt}` }],
        },
      ],
    });

    let d = data.text?.trim() || '';
    // Clean up if it returned markup
    d = d
      .replace(/<[^>]*>/g, '')
      .replace(/d="/g, '')
      .replace(/"/g, '')
      .trim();
    return d;
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

// Helper to find the image part in the response
const extractImageFromResponse = (response: any): string => {
  if (!response.candidates || response.candidates.length === 0) {
    if (response.text) {
      throw new Error(`Model Refusal/Message: ${response.text}`);
    }
    throw new Error('No candidates returned from Gemini.');
  }

  const parts = response.candidates[0].content.parts;
  if (!parts) {
      throw new Error('No valid payload format found.');
  }
  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) {
      const mimeType = part.inlineData.mimeType || 'image/png';
      return `data:${mimeType};base64,${part.inlineData.data}`;
    }
  }

  for (const part of parts) {
    if (part.text) {
      throw new Error(`Model Refusal/Message: ${part.text}`);
    }
  }

  throw new Error('No valid image data found in response.');
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
    return JSON.parse(text);
  } catch (error) {
    console.error('Layout Optimization Error:', error);
    return [];
  }
};

export const generatePaletteFromImage = async (base64Image: string): Promise<string[]> => {
  try {
    const { data: b64Data, mimeType } = cleanBase64(base64Image);
    const prompt =
      'Analyze this image/logo and extract the 5 most representative brand colors as HEX codes. Return ONLY a valid JSON array of strings (e.g., ["#ffffff", "#000000"]). Do not include markdown formatting.';

    const data = await callBackendGeminiAPI({
      modelName: MODEL_FAST,
      contents: [
        { role: 'user', parts: [{ text: prompt }, { inlineData: { data: b64Data, mimeType } }] }
      ]
    });
    
    const text = data.text;
    if (!text) {return [];}

    // Clean up response to ensure valid JSON
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Palette extraction failed', error);
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
    const styleGuide = {
      'default': 'precise, clean vector tracing',
      'minimal': 'simplified flat shapes with minimal nodes',
      'detailed': 'high-fidelity paths with fine detail',
      'artistic': 'stylized artistic interpretation',
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
      contents: [
        { role: 'user', parts: [{ text: prompt }, { inlineData: { data: b64Data, mimeType } }] }
      ]
    });

    const text = data.text;
    return JSON.parse(text || '[]');
  } catch (error) {
    console.error('Vectorization failed', error);
    throw error;
  }
};

export const generateAIVector = async (prompt: string, stylePreset: string = 'default'): Promise<Array<{ path: string; color: string }>> => {
  try {
    const styleGuide = {
      'default': 'Use precise, clean paths.',
      'minimal': 'Use simplified flat shapes with minimal nodes for a clean minimal look.',
      'detailed': 'Use high-fidelity paths with fine detail and many anchor points.',
      'artistic': 'Use a stylized, artistic interpretation with expressive shapes.',
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
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nPrompt: ${prompt}` }] }]
    });
    
    const text = data.text;
    return JSON.parse(text || '[]');
  } catch (error) {
    console.error('AI Vector Generation failed', error);
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
    Consider visual contrast, hierarchy, and harmony. Return ONLY the font name, nothing else.`;

    const data = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    return data.text?.trim() || primaryFont;
  } catch (error) {
    console.error('Font pairing suggestion failed', error);
    return primaryFont;
  }
};

export const generateAutoLayoutSuggestions = async (layers: any[], width: number, height: number): Promise<any[]> => {
  try {
    const simplifiedLayers = layers.map(l => ({ id: l.id, type: l.type, name: l.name }));
    const prompt = `Act as a senior UI/UX designer. Given these layers: ${JSON.stringify(simplifiedLayers)}, generate 5 distinct professional layout variations for a ${width}x${height} canvas. 
    Use design principles like the Golden Ratio, Rule of Thirds, and F-pattern. 
    Return a JSON array of objects, where each object is a map of layer IDs to new {x, y, width, height} coordinates.`;

    const data = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    return JSON.parse(data.text || '[]');
  } catch (error) {
    console.error('Auto-layout failed', error);
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
      generationConfig: { responseMimeType: 'application/json' }
    });

    return JSON.parse(data.text || '{}');
  } catch (error) {
    console.error('Style extraction failed', error);
    throw error;
  }
};
