import { log } from '../utils/log';

interface BackgroundGenParams {
  prompt: string;
  width: number;
  height: number;
  style?: 'realistic' | 'minimal' | 'abstract' | 'nature' | 'studio';
  lighting?: 'natural' | 'studio' | 'dramatic' | 'soft';
}

/**
 * Feature 5: AI Background Generation — generates scene contexts for product photos.
 * Upload a product photo → AI generates a matching background scene.
 */
export async function generateBackground(params: BackgroundGenParams): Promise<string | null> {
  const { prompt, width, height, style = 'realistic', lighting = 'natural' } = params;

  const stylePrompts: Record<string, string> = {
    realistic: 'photorealistic, high quality, professional photography',
    minimal: 'clean, minimal, white space, modern design',
    abstract: 'abstract geometric, colorful, modern art style',
    nature: 'natural environment, outdoor, organic textures',
    studio: 'professional studio setup, soft lighting, clean backdrop',
  };

  const lightingPrompts: Record<string, string> = {
    natural: 'natural daylight, soft shadows',
    studio: 'studio lighting, softbox, controlled shadows',
    dramatic: 'dramatic lighting, high contrast, cinematic',
    soft: 'diffused soft lighting, even illumination, no harsh shadows',
  };

  const fullPrompt = `${prompt}, ${stylePrompts[style]}, ${lightingPrompts[lighting]}, ${width}x${height}, high resolution, professional quality`;

  try {
    // Try Gemini first
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generateImage',
        prompt: fullPrompt,
        width,
        height,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.image || result.url) {
        return result.image || result.url;
      }
    }
  } catch (err) {
    log.warn('[BackgroundGen] Gemini failed, trying Freepik', { error: err });
  }

  // Fallback to Freepik
  try {
    const response = await fetch('/api/freepik', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate',
        prompt: fullPrompt,
        width,
        height,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.url) {
        return result.url;
      }
    }
  } catch (err) {
    log.warn('[BackgroundGen] Freepik also failed', { error: err });
  }

  return null;
}

/**
 * Generate a context-aware background based on the product image.
 * Analyzes the image and generates a matching scene.
 */
export async function generateContextualBackground(
  productImageUrl: string,
  width: number,
  height: number
): Promise<string | null> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'analyzeAndGenerate',
        image: productImageUrl,
        prompt: `Analyze this product image and generate a complementary background scene. The background should match the product's style, colors, and context. For example: a coffee cup gets a kitchen counter, a sneaker gets a studio floor, a plant gets a windowsill. Output only the background image.`,
        width,
        height,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.image || result.url || null;
    }
  } catch (err) {
    log.warn('[BackgroundGen] Contextual generation failed', { error: err });
  }
  return null;
}
