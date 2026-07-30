/**
 * aiModelsService.ts
 * Unified service for high-end AI models (Flux, SDXL, Recraft)
 * Using Fal.ai as the primary provider (proxied via /api/fal for security)
 */
import { retryWithBackoff } from '../utils/errorHandling';

interface FalResponse {
  images?: { url: string }[];
  image?: { url: string };
  vector_svg?: string;
}

const callFalAPI = async (endpoint: string, body: any, errorMessage: string) => {
  // Astra AI Quality fix: Wrapping external AI calls with a timeout and backoff
  // to ensure transient backend failures (429, 5xx) or hanging connections
  // don't silently lock up the application state.
  return retryWithBackoff(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      try {
        const response = await fetch('/api/fal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint, body }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return await response.json();
        }

        const error = new Error(`${errorMessage}: ${response.status} ${response.statusText}`);
        // Retry on 429 Too Many Requests and 5xx Server Errors
        if (response.status === 429 || response.status >= 500) {
          error.name = 'NetworkError';
        }
        throw error;
      } catch (e: any) {
        clearTimeout(timeoutId);

        if (e.name === 'AbortError') {
          const timeoutError = new Error(`${errorMessage}: Request timed out after 30 seconds`);
          timeoutError.name = 'TimeoutError';
          throw timeoutError;
        }

        throw e;
      }
    },
    3,
    1000
  );
};

export const aiModelsService = {
  // Since we proxy via backend, we assume it's configured on the server
  isConfigured() {
    return true;
  },

  /**
   * FLUX.1 [dev] - Top-tier Text-to-Image
   */
  async generateFluxImage(prompt: string, aspectRatio: string = '1:1') {
    const data: FalResponse = await callFalAPI(
      'https://fal.run/fal-ai/flux/dev',
      {
        prompt,
        image_size: aspectRatio === '1:1' ? 'square' : aspectRatio === '16:9' ? 'landscape_hd' : 'portrait_hd',
      },
      'Flux Generation failed'
    );
    return data.images?.[0]?.url || data.image?.url;
  },

  /**
   * Stable Diffusion XL - Inpainting / Generative Fill
   */
  async generativeFillSDXL(baseImage: string, maskImage: string, prompt: string) {
    const data: FalResponse = await callFalAPI(
      'https://fal.run/fal-ai/sdxl/inpainting',
      {
        image_url: baseImage,
        mask_url: maskImage,
        prompt: prompt,
      },
      'SDXL Inpainting failed'
    );
    return data.images?.[0]?.url || data.image?.url;
  },

  /**
   * Recraft V3 - Vector (SVG) generation
   */
  async generateVectorRecraft(prompt: string) {
    const data: FalResponse = await callFalAPI(
      'https://fal.run/fal-ai/recraft-v3/vector',
      {
        prompt: prompt,
        style: 'vector_art',
      },
      'Recraft Vector Generation failed'
    );
    return data.vector_svg || data.images?.[0]?.url;
  },

  /**
   * AuraSR - Super Resolution Upscaler (up to 4K)
   */
  async upscaleImage(imageUrl: string) {
    const data: any = await callFalAPI(
      'https://fal.run/fal-ai/aura-sr',
      {
        image_url: imageUrl,
      },
      'Upscaling failed'
    );
    return data.image?.url || data.images?.[0]?.url || data.url || data.output?.url || data.output_url;
  },
};
