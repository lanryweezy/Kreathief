
import { GoogleGenAI, Part, Type } from "@google/genai";
import { MODEL_FAST, MODEL_PRO, FONT_FAMILIES } from '../constants';
import { DesignTheme, GenerationQuality } from '../types';

// Helper to get fresh client instance (important for key switching)
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Clean Base64 string by removing data URL prefix if present.
 * Aggressively strips whitespace to prevent RPC errors.
 */
const cleanBase64 = (dataUrl: string): { data: string, mimeType: string } => {
  if (!dataUrl) {
    throw new Error("Invalid image data provided");
  }

  // Remove whitespace/newlines which might break the regex or API
  const cleanUrl = dataUrl.trim();
  
  // More permissive regex to catch data URI schemes
  const matches = cleanUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (matches && matches.length === 3) {
    return { 
      mimeType: matches[1], 
      // Important: Strip newlines/spaces from the actual base64 payload
      data: matches[2].replace(/\s/g, '') 
    };
  }
  
  // Fallback: If it looks like raw base64 (no data prefix), return as is with default mime
  return { 
    mimeType: 'image/png', 
    data: cleanUrl.replace(/\s/g, '') 
  };
};

export const generateImage = async (
  prompt: string,
  aspectRatio: string,
  quality: GenerationQuality = 'standard'
): Promise<string> => {
  try {
    const ai = getClient();
    const modelName = quality === 'hd' ? MODEL_PRO : MODEL_FAST;
    
    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    };

    if (quality === 'hd') {
      config.imageConfig.imageSize = '1K';
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [{ text: prompt }]
      },
      config: config
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Generation Error:", error);
    throw error;
  }
};

export const editImage = async (
  base64Image: string,
  prompt: string,
  quality: GenerationQuality = 'standard'
): Promise<string> => {
  try {
    const ai = getClient();
    const { data, mimeType } = cleanBase64(base64Image);
    const modelName = quality === 'hd' ? MODEL_PRO : MODEL_FAST;
    
    const parts: Part[] = [
      {
        text: prompt
      },
      {
        inlineData: {
          mimeType,
          data
        }
      }
    ];

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Edit Error:", error);
    throw error;
  }
};

export const removeBackground = async (
  base64Image: string
): Promise<string> => {
  try {
    const ai = getClient();
    const { data, mimeType } = cleanBase64(base64Image);
    
    const prompt = "Extract the main subject of this image and place it on a transparent background. Isolate the subject perfectly.";

    const parts: Part[] = [
      { text: prompt },
      { inlineData: { mimeType, data } }
    ];

    const response = await ai.models.generateContent({
      model: MODEL_FAST, // Flash-image is good at this
      contents: { parts },
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Remove BG Error:", error);
    throw error;
  }
};

export const generateText = async (
  currentText: string,
  instruction: string = "Rewrite this to be more creative and catchy."
): Promise<string> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `System Instruction: ${instruction}\n\nInput Text: "${currentText}"\n\nOutput (just the rewritten text):`,
    });

    return response.text?.trim() || currentText;
  } catch (error) {
    console.error("Text Generation Error:", error);
    throw error;
  }
};

export const generateTextOptions = async (topic: string): Promise<string[]> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 5 creative, short, and catchy phrases about: "${topic}". Useful for posters or social media. Return them as a simple JSON string array.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Text Options Error:", error);
    return [];
  }
};

export const enhancePrompt = async (simplePrompt: string): Promise<string> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert prompt engineer for AI image generators. Rewrite the following simple user description into a highly detailed, artistic, and effective image generation prompt. Include lighting, style, composition, and mood keywords. Keep it under 50 words.
      
      User Description: "${simplePrompt}"
      
      Enhanced Prompt:`,
    });
    return response.text?.trim() || simplePrompt;
  } catch (error) {
    console.error("Prompt Enhancer Error:", error);
    return simplePrompt;
  }
};

export const generateDesignTheme = async (
  prompt: string
): Promise<DesignTheme> => {
  try {
    const ai = getClient();
    const availableFonts = FONT_FAMILIES.join(', ');
    const systemPrompt = `
      You are a world-class graphic designer. 
      Generate a design theme (colors and fonts) based on the user's description.
      
      You must pick fonts ONLY from this list: ${availableFonts}.
      If the exact font isn't suitable, pick the closest match from the list.
      
      Return JSON only.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemPrompt}\n\nUser Prompt: ${prompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "A creative name for this theme" },
            backgroundColor: { type: Type.STRING, description: "Hex code for canvas background" },
            primaryColor: { type: Type.STRING, description: "Hex code for main elements/headings" },
            secondaryColor: { type: Type.STRING, description: "Hex code for secondary elements" },
            accentColor: { type: Type.STRING, description: "Hex code for highlights" },
            headingFont: { type: Type.STRING, description: "Font family for headings" },
            bodyFont: { type: Type.STRING, description: "Font family for body text" },
          },
          required: ["name", "backgroundColor", "primaryColor", "secondaryColor", "accentColor", "headingFont", "bodyFont"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No theme generated");
    
    return JSON.parse(text) as DesignTheme;
  } catch (error) {
    console.error("Theme Generation Error:", error);
    throw error;
  }
};

export const analyzeDesign = async (
  base64Image: string,
  query: string
): Promise<string> => {
  try {
    const ai = getClient();
    const { data, mimeType } = cleanBase64(base64Image);
    const parts: Part[] = [
      { text: `You are a professional senior graphic designer. Analyze this design. ${query}` },
      { inlineData: { mimeType, data } }
    ];
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts }
    });
    
    return response.text || "I couldn't analyze the design.";
  } catch (error) {
    console.error("Analyze Design Error:", error);
    throw error;
  }
};

export const generateLayout = async (prompt: string): Promise<any> => {
  try {
    const ai = getClient();
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
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemPrompt}\n\nUser Prompt: ${prompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             textLayers: {
                type: Type.ARRAY,
                items: {
                   type: Type.OBJECT,
                   properties: {
                      text: { type: Type.STRING },
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                      fontSize: { type: Type.NUMBER },
                      color: { type: Type.STRING },
                      width: { type: Type.NUMBER },
                      textAlign: { type: Type.STRING }
                   }
                }
             },
             shapeLayers: {
                type: Type.ARRAY,
                items: {
                   type: Type.OBJECT,
                   properties: {
                      type: { type: Type.STRING },
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                      width: { type: Type.NUMBER },
                      height: { type: Type.NUMBER },
                      color: { type: Type.STRING }
                   }
                }
             }
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Layout Generation Error:", error);
    throw error;
  }
};

export const generateSVGShape = async (prompt: string): Promise<string> => {
  try {
    const ai = getClient();
    const systemPrompt = `
      You are an SVG path generator. 
      Generate a valid SVG path 'd' attribute for the shape described.
      Simpler paths are better. 
      Do NOT include <svg> or <path> tags, JUST the string content of the 'd' attribute.
      Assume a viewBox of 0 0 100 100.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemPrompt}\n\nDescription: ${prompt}`,
    });
    
    let d = response.text?.trim() || "";
    // Clean up if it returned markup
    d = d.replace(/<[^>]*>/g, '').replace(/d="/g, '').replace(/"/g, '').trim();
    return d;
  } catch (error) {
    console.error("SVG Generation Error:", error);
    throw error;
  }
};

export const expandImage = async (base64Image: string): Promise<string> => {
  try {
    return await editImage(base64Image, "Fill in the transparent background to naturally extend the scene. Keep the style consistent.");
  } catch (error) {
    console.error("Expand Image Error", error);
    throw error;
  }
};

export const generatePattern = async (prompt: string): Promise<string> => {
  try {
    return await generateImage(`Seamless pattern texture, ${prompt}, flat view, top down, high quality wallpaper style`, '1:1', 'standard');
  } catch (error) {
    console.error("Pattern Generation Error", error);
    throw error;
  }
};

// Helper to find the image part in the response
const extractImageFromResponse = (response: any): string => {
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("No candidates returned from Gemini.");
  }

  const parts = response.candidates[0].content.parts;
  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) {
      const mimeType = part.inlineData.mimeType || 'image/png';
      return `data:${mimeType};base64,${part.inlineData.data}`;
    }
  }

  // If we got here, maybe we only got text (error or refusal)
  for (const part of parts) {
    if (part.text) {
      throw new Error(`Model Refusal/Message: ${part.text}`);
    }
  }

  throw new Error("No valid image data found in response.");
};
