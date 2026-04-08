/**
 * aiModelsService.ts
 * Unified service for high-end AI models (Flux, SDXL, Recraft)
 * Using Fal.ai as the primary provider
 */

const FAL_KEY = import.meta.env.VITE_FAL_KEY;

interface FalResponse {
  images?: { url: string }[];
  image?: { url: string };
  vector_svg?: string;
}

export const aiModelsService = {
  isConfigured() {
    return !!FAL_KEY;
  },

  /**
   * FLUX.1 [dev] - Top-tier Text-to-Image
   */
  async generateFluxImage(prompt: string, aspectRatio: string = '1:1') {
    if (!this.isConfigured()) {throw new Error('Fal.ai API Key missing');}

    const response = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: aspectRatio === '1:1' ? 'square' : aspectRatio === '16:9' ? 'landscape_hd' : 'portrait_hd',
      }),
    });

    if (!response.ok) {throw new Error('Flux Generation failed');}
    const data: FalResponse = await response.json();
    return data.images?.[0]?.url || data.image?.url;
  },

  /**
   * Stable Diffusion XL - Inpainting / Generative Fill
   */
  async generativeFillSDXL(baseImage: string, maskImage: string, prompt: string) {
    if (!this.isConfigured()) {throw new Error('Fal.ai API Key missing');}

    const response = await fetch('https://fal.run/fal-ai/sdxl/inpainting', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: baseImage,
        mask_url: maskImage,
        prompt: prompt,
      }),
    });

    if (!response.ok) {throw new Error('SDXL Inpainting failed');}
    const data: FalResponse = await response.json();
    return data.images?.[0]?.url || data.image?.url;
  },

  /**
   * Recraft V3 - Vector (SVG) generation
   */
  async generateVectorRecraft(prompt: string) {
    if (!this.isConfigured()) {throw new Error('Fal.ai API Key missing');}

    const response = await fetch('https://fal.run/fal-ai/recraft-v3/vector', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        style: 'vector_art',
      }),
    });

    if (!response.ok) {throw new Error('Recraft Vector Generation failed');}
    const data: FalResponse = await response.json();
    return data.vector_svg || data.images?.[0]?.url;
  },

  /**
   * AuraSR - Super Resolution Upscaler (up to 4K)
   */
  async upscaleImage(imageUrl: string) {
    if (!this.isConfigured()) {throw new Error('Fal.ai API Key missing');}

    const response = await fetch('https://fal.run/fal-ai/aura-sr', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
      }),
    });

    if (!response.ok) {throw new Error('Upscaling failed');}
    const data: any = await response.json();
    return data.image?.url;
  }
};
