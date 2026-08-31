/**
 * aiModelsService.ts
 * Unified service for high-end AI models (Flux, SDXL, Recraft)
 * Using Fal.ai as the primary provider (proxied via /api/fal for security)
 */
import { retryWithBackoff } from '../utils/errorHandling';
import { log } from '../utils/log';

interface FalResponse {
  images?: { url: string }[];
  image?: { url: string };
  vector_svg?: string;
}

/** Fields whose values are image payloads — logged by shape only, never by content. */
const IMAGE_FIELDS = new Set(['image_url', 'image_urls', 'mask_url']);

/**
 * Describes an outbound Fal request for the dev console. Endpoint schemas vary per model and
 * a wrong *field name* is the usual cause of a 422, so field names and value shapes are what
 * matter — base64 image data is deliberately reduced to a placeholder and long prompts are
 * truncated. Contains no credentials: the API key lives server-side in /api/fal.
 */
const describeFalPayload = (endpoint: string, body: Record<string, any>) => {
  const shape: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (IMAGE_FIELDS.has(key)) {
      shape[key] = Array.isArray(value) ? `<${value.length} image(s)>` : '<image>';
    } else if (typeof value === 'string' && value.length > 160) {
      shape[key] = `${value.slice(0, 160)}… (${value.length} chars)`;
    } else {
      shape[key] = value;
    }
  }
  return { endpoint, fields: Object.keys(body).sort(), shape };
};

const callFalAPI = async (endpoint: string, body: any, errorMessage: string) => {
  // Astra AI Quality fix: Wrapping external AI calls with a timeout and backoff
  // to ensure transient backend failures (429, 5xx) or hanging connections
  // don't silently lock up the application state.
  log.debug('[Fal] Outbound request', describeFalPayload(endpoint, body));

  const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  const timeoutMs = isTest ? 200 : 30000;
  const retries = 3;
  const backoffMs = isTest ? 10 : 1000;

  return retryWithBackoff(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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

        // A 4xx from Fal carries the schema complaint (e.g. "image_urls: field required")
        // in its body. Without it, a wrong field name is indistinguishable from an outage.
        let detail = '';
        if (response.status >= 400 && response.status < 500) {
          detail = await response.text().catch(() => '');
          log.warn('[Fal] Request rejected', {
            ...describeFalPayload(endpoint, body),
            status: response.status,
            detail: detail.slice(0, 500),
          });
        }

        const error = new Error(
          `${errorMessage}: ${response.status} ${response.statusText}${detail ? ` — ${detail.slice(0, 300)}` : ''}`
        );
        // Retry on 429 Too Many Requests and 5xx Server Errors
        if (response.status === 429 || response.status >= 500) {
          error.name = 'NetworkError';
        }
        throw error;
      } catch (e: any) {
        clearTimeout(timeoutId);

        if (e.name === 'AbortError') {
          const timeoutError = new Error(`${errorMessage}: Request timed out`);
          timeoutError.name = 'TimeoutError';
          throw timeoutError;
        }

        throw e;
      }
    },
    retries,
    backoffMs
  );
};

export const aiModelsService = {
  // Since we proxy via backend, we assume it's configured on the server
  isConfigured() {
    return true;
  },

  /**
   * Generic text-to-image against any allowlisted Fal endpoint (see config/imageModels.ts)
   *
   * `size` is a pre-resolved body fragment (see buildSizePayload) because the field name is
   * per-endpoint data, not something this transport should know about.
   */
  async generateImageFromEndpoint(
    endpoint: string,
    prompt: string,
    size: Record<string, string> = { image_size: 'square' }
  ) {
    const data: FalResponse = await callFalAPI(endpoint, { prompt, ...size }, 'Image generation failed');
    return data.images?.[0]?.url || data.image?.url;
  },

  /**
   * Reference-conditioned generation / prompt-driven edit against an allowlisted /edit route.
   * `imageField` differs per provider (see ImageGenModel.imageInputField), so it is passed
   * in as data rather than branched on here. Same for `size` (see buildSizePayload) — an
   * omitted `size` means "send nothing", which is what edit routes that inherit the input
   * image's dimensions require.
   */
  async generateImageWithReference(
    endpoint: string,
    prompt: string,
    referenceImage: string,
    imageField: 'image_url' | 'image_urls' = 'image_urls',
    size?: Record<string, string>
  ) {
    const body: Record<string, any> = { prompt, ...(size ?? {}) };
    body[imageField] = imageField === 'image_urls' ? [referenceImage] : referenceImage;

    const data: FalResponse = await callFalAPI(endpoint, body, 'Reference-conditioned generation failed');
    return data.images?.[0]?.url || data.image?.url;
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
      'https://fal.run/fal-ai/fast-sdxl/inpainting',
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
