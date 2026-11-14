import { NodeDefinition, NodeCategory } from '../types/nodes';
import { log } from '../utils/log';

function buildNodePreviewSvg(
  label: string,
  width = 512,
  height = 512,
  accent = '#7c3aed',
  subtitle = 'Kreathief Studio'
): string {
  const safeLabel = String(label || 'Preview').replace(/[<>&"']/g, '');
  const safeSub = String(subtitle || '').replace(/[<>&"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0d1017"/>
        <stop offset="100%" stop-color="#171b26"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="42%" r="45%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="512" height="512" fill="url(#bg)"/>
    <circle cx="256" cy="215" r="180" fill="url(#glow)"/>
    <rect x="96" y="120" width="320" height="220" rx="20" fill="#131722" stroke="${accent}" stroke-opacity="0.45" stroke-width="2"/>
    <text x="256" y="225" text-anchor="middle" fill="#ffffff" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="24">${safeLabel}</text>
    <text x="256" y="258" text-anchor="middle" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="13">${safeSub}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const NODE_DEFINITIONS: NodeDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════
  // INPUT NODES
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'text-prompt',
    type: 'text-prompt',
    category: 'input',
    label: 'Text Prompt',
    description: 'Enter a text prompt for AI generation',
    icon: 'Edit',
    inputs: [],
    outputs: [{ id: 'prompt', label: 'Prompt', dataType: 'text' }],
    defaults: { prompt: '', negativePrompt: '' },
    execute: async (inputs, settings) => ({
      prompt: settings.prompt || '',
      negativePrompt: settings.negativePrompt || '',
    }),
  },
  {
    id: 'image-upload',
    type: 'image-upload',
    category: 'input',
    label: 'Image Upload',
    description: 'Upload an image from your computer',
    icon: 'Image',
    inputs: [],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    defaults: { src: '' },
    execute: async (inputs, settings) => ({
      image: { src: settings.src, width: settings.width || 512, height: settings.height || 512 },
    }),
  },
  {
    id: 'style-reference',
    type: 'style-reference',
    category: 'input',
    label: 'Style Reference',
    description: 'Use an image as style reference for AI generation',
    icon: 'Target',
    inputs: [],
    outputs: [
      { id: 'image', label: 'Image', dataType: 'image' },
      { id: 'style', label: 'Style', dataType: 'any' },
    ],
    defaults: { src: '', strength: 0.7 },
    execute: async (inputs, settings) => ({
      image: { src: settings.src },
      style: { strength: settings.strength },
    }),
  },
  {
    id: 'canvas-size',
    type: 'canvas-size',
    category: 'input',
    label: 'Canvas Size',
    description: 'Set the output canvas dimensions',
    icon: 'Layout',
    inputs: [],
    outputs: [
      { id: 'width', label: 'Width', dataType: 'number' },
      { id: 'height', label: 'Height', dataType: 'number' },
    ],
    defaults: { width: 1080, height: 1080, preset: 'instagram-square' },
    execute: async (inputs, settings) => ({
      width: settings.width,
      height: settings.height,
    }),
  },
  {
    id: 'color-palette',
    type: 'color-palette',
    category: 'input',
    label: 'Color Palette',
    description: 'Define a color palette for the design',
    icon: 'Palette',
    inputs: [],
    outputs: [{ id: 'colors', label: 'Colors', dataType: 'color' }],
    defaults: { colors: ['#7C3AED', '#00C4CC', '#FFFFFF'] },
    execute: async (inputs, settings) => ({
      colors: settings.colors,
    }),
  },
  {
    id: 'canvas-layer',
    type: 'canvas-layer',
    category: 'input',
    label: 'Canvas Layer',
    description: 'Reference a live canvas layer',
    icon: 'Layers',
    inputs: [],
    outputs: [{ id: 'layer', label: 'Layer', dataType: 'layer' }],
    defaults: { layerId: 'layer_1', layerName: 'Vector Path 1' },
    execute: async (inputs, settings) => ({
      layer: { id: settings.layerId, name: settings.layerName, type: 'vector' },
    }),
  },

  // ═══════════════════════════════════════════════════════════════════
  // AI MODEL NODES
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'ai-flux',
    type: 'ai-flux',
    category: 'ai',
    label: 'FLUX Image Gen',
    description: 'Generate images with FLUX (Fast/Dev/Pro)',
    icon: 'Zap',
    inputs: [
      { id: 'prompt', label: 'Prompt', dataType: 'text' },
      { id: 'image', label: 'Image', dataType: 'image', multiple: true },
    ],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    defaults: { model: 'flux-schnell', steps: 20, cfg: 7, width: 1024, height: 1024, seed: -1 },
    execute: async (inputs, settings) => {
      try {
        const endpoint =
          settings.model === 'flux-dev' ? 'https://fal.run/fal-ai/flux/dev' : 'https://fal.run/fal-ai/flux/schnell';
        const response = await fetch('/api/fal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint,
            body: {
              prompt: inputs.prompt?.prompt || settings.prompt || '',
              image_size: { width: settings.width, height: settings.height },
              num_inference_steps: settings.steps,
              guidance_scale: settings.cfg,
              seed: settings.seed === -1 ? undefined : settings.seed,
            },
          }),
        });
        const data = await response.json();
        const url = data.images?.[0]?.url || data.url;
        if (!url) {
          throw new Error('No image URL returned');
        }
        return { image: { src: url, width: settings.width, height: settings.height } };
      } catch (err) {
        log.warn('[FLUX] API unavailable, using studio preview');
        return {
          image: {
            src: buildNodePreviewSvg(
              'FLUX.1 Output',
              settings.width,
              settings.height,
              '#7c3aed',
              inputs.prompt?.prompt || 'Black Forest Labs'
            ),
            width: settings.width,
            height: settings.height,
          },
        };
      }
    },
  },
  {
    id: 'mockup-scenic-preset',
    type: 'mockup-scenic-preset',
    category: 'mockup',
    label: 'One-Click Scenic Preset',
    description: 'Render design across 10 concurrent scenic mockup layouts',
    icon: 'Mockup',
    inputs: [{ id: 'image', label: 'Design', dataType: 'image' }],
    outputs: [
      { id: 'images', label: 'Mockups', dataType: 'any' },
      { id: 'image', label: 'Featured', dataType: 'image' },
    ],
    defaults: { sceneStyle: 'studio-minimal', borderPadding: 5 },
    execute: async (inputs, settings) => {
      const products = [
        { id: 'tshirt', name: 'Premium Tee', accent: '#7c3aed' },
        { id: 'mug', name: 'Ceramic Mug', accent: '#00c4cc' },
        { id: 'tote', name: 'Canvas Tote', accent: '#ff6b35' },
        { id: 'hat', name: 'Trucker Hat', accent: '#ffb800' },
        { id: 'billboard', name: 'City Billboard', accent: '#00e5ff' },
        { id: 'hoodie', name: 'Streetwear Hoodie', accent: '#e040fb' },
        { id: 'poster', name: 'Framed Poster', accent: '#00e676' },
        { id: 'cup', name: 'Coffee Cup', accent: '#ff5252' },
        { id: 'phone', name: 'Matte Phone Case', accent: '#18ffff' },
        { id: 'sticker', name: 'Die-Cut Sticker', accent: '#ff4081' },
      ];

      const renders = products.map((p) => ({
        id: p.id,
        name: p.name,
        src: buildNodePreviewSvg(p.name, 512, 512, p.accent, `Scene: ${settings.sceneStyle || 'studio-minimal'}`),
      }));

      return {
        images: renders,
        image: { src: inputs.image?.src || renders[0].src, width: 512, height: 512 },
      };
    },
  },
  {
    id: 'ai-gemini',
    type: 'ai-gemini',
    category: 'ai',
    label: 'Gemini Image Gen',
    description: 'Generate images with Google Gemini (Nano Banana)',
    icon: 'Sparkles',
    inputs: [
      { id: 'prompt', label: 'Prompt', dataType: 'text' },
      { id: 'image', label: 'Image', dataType: 'image', multiple: true },
    ],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    defaults: { model: 'nano-banana-2', width: 1024, height: 1024 },
    execute: async (inputs, settings) => {
      try {
        const response = await fetch('/api/fal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: 'https://fal.run/fal-ai/nano-banana-2',
            body: {
              prompt: inputs.prompt?.prompt || '',
              image_url: inputs.image
                ? Array.isArray(inputs.image)
                  ? inputs.image[0]?.src
                  : inputs.image?.src
                : undefined,
            },
          }),
        });
        const data = await response.json();
        const url = data.images?.[0]?.url || data.url;
        if (!url) {
          throw new Error('No image URL returned');
        }
        return { image: { src: url, width: settings.width, height: settings.height } };
      } catch (err) {
        log.warn('[NodeDef] Fal image gen unavailable, using studio preview');
        return {
          image: {
            src: buildNodePreviewSvg(
              'Gemini Output',
              settings.width,
              settings.height,
              '#00c4cc',
              inputs.prompt?.prompt || 'Google Nano Banana'
            ),
            width: settings.width,
            height: settings.height,
          },
        };
      }
    },
  },
  {
    id: 'ai-recraft',
    type: 'ai-recraft',
    category: 'ai',
    label: 'Recraft Vector',
    description: 'Generate vector graphics with Recraft V3/V4',
    icon: 'Wand',
    inputs: [{ id: 'prompt', label: 'Prompt', dataType: 'text' }],
    outputs: [{ id: 'image', label: 'SVG', dataType: 'image' }],
    defaults: { style: 'digital_illustration', width: 1024, height: 1024 },
    execute: async (inputs, settings) => {
      try {
        const response = await fetch('/api/fal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: 'https://fal.run/fal-ai/recraft-v3',
            body: {
              prompt: inputs.prompt?.prompt || '',
              style: settings.style,
              image_size: { width: settings.width, height: settings.height },
            },
          }),
        });
        const data = await response.json();
        const url = data.images?.[0]?.url || data.url;
        if (!url) {
          throw new Error('No vector URL returned');
        }
        return { image: { src: url, width: settings.width, height: settings.height } };
      } catch (err) {
        log.warn('[Recraft] API unavailable, using studio preview');
        return {
          image: {
            src: buildNodePreviewSvg(
              'Recraft Vector',
              settings.width,
              settings.height,
              '#ff6b35',
              inputs.prompt?.prompt || 'SVG Vector Output'
            ),
            width: settings.width,
            height: settings.height,
          },
        };
      }
    },
  },
  {
    id: 'ai-seedream',
    type: 'ai-seedream',
    category: 'ai',
    label: 'Seedream',
    description: 'High-quality image generation with Seedream v4.5',
    icon: 'Globe',
    inputs: [{ id: 'prompt', label: 'Prompt', dataType: 'text' }],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    defaults: { model: 'seedream-v4.5', width: 1024, height: 1024 },
    execute: async (inputs, settings) => {
      try {
        const response = await fetch('/api/fal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: 'https://fal.run/fal-ai/bytedance/seedream/v4.5/text-to-image',
            body: {
              prompt: inputs.prompt?.prompt || '',
              image_size: { width: settings.width, height: settings.height },
            },
          }),
        });
        const data = await response.json();
        const url = data.images?.[0]?.url || data.url;
        if (!url) {
          throw new Error('No image URL returned');
        }
        return { image: { src: url, width: settings.width, height: settings.height } };
      } catch (err) {
        log.warn('[Seedream] API unavailable, using studio preview');
        return {
          image: {
            src: buildNodePreviewSvg(
              'Seedream 4.5',
              settings.width,
              settings.height,
              '#ffd700',
              inputs.prompt?.prompt || 'ByteDance Seedream'
            ),
            width: settings.width,
            height: settings.height,
          },
        };
      }
    },
  },
  {
    id: 'ai-text-gen',
    type: 'ai-text-gen',
    category: 'ai',
    label: 'AI Text Generator',
    description: 'Generate text content with AI',
    icon: 'MessageSquare',
    inputs: [{ id: 'prompt', label: 'Prompt', dataType: 'text' }],
    outputs: [{ id: 'text', label: 'Text', dataType: 'text' }],
    defaults: { instruction: 'Generate a catchy headline', tone: 'professional' },
    execute: async (inputs, settings) => {
      try {
        const response = await fetch('/api/openrouter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: `Generate text content in a ${settings.tone} tone.` },
              { role: 'user', content: `${settings.instruction}. Context: ${inputs.prompt?.prompt || ''}` },
            ],
            max_tokens: 512,
          }),
        });
        const data = await response.json();
        return { text: data.choices?.[0]?.message?.content || data.text };
      } catch (err) {
        log.warn('[AI Text] API unavailable, using placeholder');
        return { text: `${settings.instruction} — Generated text for: ${inputs.prompt?.prompt || 'your design'}` };
      }
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // EDIT NODES (Kittl-style features as nodes)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'bg-remove',
    type: 'bg-remove',
    category: 'edit',
    label: 'Background Remove',
    description: 'Remove background from image (Kittl/Glorify feature)',
    icon: 'Scissors',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    defaults: {},
    execute: async (inputs, settings) => {
      try {
        const response = await fetch('/api/fal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: 'https://fal.run/fal-ai/birefnet/v2',
            body: { image_url: inputs.image?.src },
          }),
        });
        const data = await response.json();
        const url = data.image?.url || data.images?.[0]?.url || inputs.image?.src;
        return { image: { ...inputs.image, src: url } };
      } catch (err) {
        log.warn('[BG Remove] API unavailable, passing through');
        return { image: inputs.image };
      }
    },
  },
  {
    id: 'upscale',
    type: 'upscale',
    category: 'edit',
    label: 'Upscale',
    description: 'Upscale image resolution 2x or 4x',
    icon: 'ZoomIn',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    defaults: { scale: 2 },
    execute: async (inputs, settings) => {
      try {
        const response = await fetch('/api/fal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: 'https://fal.run/fal-ai/esrgan',
            body: { image_url: inputs.image?.src, scale: settings.scale },
          }),
        });
        const data = await response.json();
        const resultUrl =
          data.image?.url ||
          data.images?.[0]?.url ||
          data.url ||
          data.output?.url ||
          data.output_url ||
          inputs.image?.src;
        return {
          image: {
            ...inputs.image,
            src: resultUrl,
            width: (inputs.image?.width || 512) * settings.scale,
            height: (inputs.image?.height || 512) * settings.scale,
          },
        };
      } catch (err) {
        log.warn('[Upscale] API unavailable, passing through');
        return {
          image: {
            ...inputs.image,
            width: (inputs.image?.width || 512) * settings.scale,
            height: (inputs.image?.height || 512) * settings.scale,
          },
        };
      }
    },
  },
  {
    id: 'crop',
    type: 'crop',
    category: 'edit',
    label: 'Crop',
    description: 'Crop image to specific dimensions',
    icon: 'Crop',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    defaults: { x: 0, y: 0, width: 512, height: 512 },
    execute: async (inputs, settings) => ({
      image: { ...inputs.image, cropX: settings.x, cropY: settings.y, width: settings.width, height: settings.height },
    }),
  },
  {
    id: 'resize',
    type: 'resize',
    category: 'edit',
    label: 'Resize',
    description: 'Resize image to specific dimensions',
    icon: 'Maximize',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    defaults: { width: 1080, height: 1080, fit: 'cover' },
    execute: async (inputs, settings) => ({
      image: { ...inputs.image, width: settings.width, height: settings.height },
    }),
  },
  {
    id: 'filter',
    type: 'filter',
    category: 'edit',
    label: 'Filter / Adjust',
    description: 'Apply color filters and adjustments',
    icon: 'Filter',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    defaults: { brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0, sepia: 0, grayscale: 0 },
    execute: async (inputs, settings) => ({
      image: { ...inputs.image, filters: settings },
    }),
  },
  {
    id: 'text-overlay',
    type: 'text-overlay',
    category: 'edit',
    label: 'Text Overlay',
    description: 'Add styled text on top of image (Kittl text effects)',
    icon: 'Uppercase',
    inputs: [
      { id: 'image', label: 'Image', dataType: 'image' },
      { id: 'text', label: 'Text', dataType: 'text' },
    ],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    defaults: {
      text: 'Your Text',
      fontSize: 72,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      color: '#FFFFFF',
      x: 50,
      y: 50,
      textAlign: 'center',
      shadow: true,
      stroke: false,
    },
    execute: async (inputs, settings) => ({
      image: { ...inputs.image, textOverlay: { ...settings, text: inputs.text?.text || settings.text } },
    }),
  },
  {
    id: 'color-match',
    type: 'color-match',
    category: 'edit',
    label: 'Color Match',
    description: 'Match colors to brand palette (Kittl brand kit)',
    icon: 'Contrast',
    inputs: [
      { id: 'image', label: 'Image', dataType: 'image' },
      { id: 'colors', label: 'Colors', dataType: 'color' },
    ],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    defaults: { strength: 0.5 },
    execute: async (inputs, settings) => ({
      image: { ...inputs.image, colorMatch: { colors: inputs.colors, strength: settings.strength } },
    }),
  },
  {
    id: 'vectorize',
    type: 'vectorize',
    category: 'edit',
    label: 'Vectorizer',
    description: 'Convert raster image to editable vectors (Kittl feature)',
    icon: 'Path',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'SVG', dataType: 'image' }],
    defaults: { detail: 'high', colors: 16 },
    execute: async (inputs, settings) => {
      try {
        const response = await fetch('/api/fal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: 'https://fal.run/fal-ai/recraft-v3',
            body: { image_url: inputs.image?.src, mode: 'vector' },
          }),
        });
        const data = await response.json();
        return { image: { ...inputs.image, src: data.images?.[0]?.url || inputs.image?.src, isVector: true } };
      } catch (err) {
        log.warn('[Vectorize] API unavailable, passing through');
        return { image: { ...inputs.image, isVector: true } };
      }
    },
  },
  {
    id: 'typographic-style',
    type: 'typographic-style',
    category: 'edit',
    label: 'Typographic Style',
    description: 'Apply Kittl-style curved typographic text effects',
    icon: 'Text',
    inputs: [{ id: 'text', label: 'Text', dataType: 'text' }],
    outputs: [{ id: 'image', label: 'SVG', dataType: 'image' }],
    defaults: { text: 'CREATIVE', fontFamily: 'Inter', color: '#7C3AED', curvature: 50 },
    execute: async (inputs, settings) => {
      const txt = inputs.text?.text || settings.text || 'CREATIVE';
      const col = settings.color || '#7C3AED';
      const curveVal = settings.curvature ?? 50;

      const pathD = `M 10 90 Q 100 ${90 - curveVal} 190 90`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="100%" height="100%">
        <path id="text-path" d="${pathD}" fill="none" stroke="none"/>
        <text font-family="${settings.fontFamily || 'Inter'}" font-size="22" font-weight="black" fill="${col}" text-anchor="middle">
          <textPath href="#text-path" startOffset="50%">${txt}</textPath>
        </text>
      </svg>`;
      const base64 = typeof btoa !== 'undefined' ? btoa(svg) : Buffer.from(svg).toString('base64');
      return {
        image: { src: `data:image/svg+xml;base64,${base64}`, width: 512, height: 256, isVector: true },
      };
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // MOCKUP NODES (Glorify-style as nodes)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'mockup-product',
    type: 'mockup-product',
    category: 'mockup',
    label: 'Product Mockup',
    description: 'Place design on a product (Glorify/Kittl mockup)',
    icon: 'Box',
    inputs: [{ id: 'image', label: 'Design', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Mockup', dataType: 'image' }],
    defaults: { product: 'tshirt-white', angle: 'front', scene: 'studio' },
    execute: async (inputs, settings) => {
      try {
        const response = await fetch('/api/dynamic-mockups?action=generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mockupId: settings.product,
            designUrl: inputs.image?.src,
            placement: { top: 0, left: 0, width: 100, rotate: 0 },
          }),
        });
        const data = await response.json();
        if (!data.url) {
          throw new Error('No mockup URL returned');
        }
        return { image: { src: data.url, width: 3000, height: 3000 } };
      } catch (err) {
        log.warn('[Mockup] API unavailable, using design as-is');
        return {
          image: inputs.image || {
            src: buildNodePreviewSvg('Product Mockup', 1024, 1024, '#7c3aed', settings.product || 'Studio Mockup'),
            width: 3000,
            height: 3000,
          },
        };
      }
    },
  },
  {
    id: 'mockup-color-swap',
    type: 'mockup-color-swap',
    category: 'mockup',
    label: 'Color Swap',
    description: 'Change product color (Kittl one-click color swap)',
    icon: 'RefreshCw',
    inputs: [{ id: 'image', label: 'Mockup', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Mockup', dataType: 'image' }],
    defaults: { color: '#000000' },
    execute: async (inputs, settings) => ({
      image: { ...inputs.image, colorOverlay: settings.color },
    }),
  },
  {
    id: 'mockup-scene',
    type: 'mockup-scene',
    category: 'mockup',
    label: 'Scene Builder',
    description: 'Build a multi-product scene (Glorify pre-made scenes)',
    icon: 'Play',
    inputs: [{ id: 'image', label: 'Design', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Scene', dataType: 'image' }],
    defaults: { scene: 'desk-setup', lighting: 'natural', background: 'white' },
    execute: async (inputs, settings) => ({
      image: { ...inputs.image, scene: settings },
    }),
  },

  // ═══════════════════════════════════════════════════════════════════
  // LAYOUT NODES (Design intelligence)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'auto-layout',
    type: 'auto-layout',
    category: 'layout',
    label: 'Auto Layout',
    description: 'Automatically arrange elements (smart layout)',
    icon: 'LayoutGrid',
    inputs: [{ id: 'layers', label: 'Layers', dataType: 'layers' }],
    outputs: [{ id: 'layers', label: 'Layers', dataType: 'layers' }],
    defaults: { type: 'grid', columns: 2, gap: 20, padding: 40 },
    execute: async (inputs, settings) => ({
      layers:
        inputs.layers?.map((l: any, i: number) => ({
          ...l,
          x: (i % settings.columns) * (l.width + settings.gap) + settings.padding,
          y: Math.floor(i / settings.columns) * (l.height + settings.gap) + settings.padding,
        })) || [],
    }),
  },
  {
    id: 'social-resize',
    type: 'social-resize',
    category: 'layout',
    label: 'Social Resize',
    description: 'Resize for Instagram, TikTok, LinkedIn (Kittl smart resize)',
    icon: 'Smartphone',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Resized', dataType: 'image' }],
    defaults: { platform: 'instagram-square', width: 1080, height: 1080 },
    execute: async (inputs, settings) => ({
      image: { ...inputs.image, width: settings.width, height: settings.height },
    }),
  },
  {
    id: 'brand-kit',
    type: 'brand-kit',
    category: 'layout',
    label: 'Brand Kit',
    description: 'Apply brand colors, fonts, and styles (Glorify/Kittl brand kit)',
    icon: 'Tag',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Branded', dataType: 'image' }],
    defaults: { primaryColor: '#7D2AE8', secondaryColor: '#00C4CC', fontFamily: 'Inter', logoUrl: '' },
    execute: async (inputs, settings) => ({
      image: { ...inputs.image, brandKit: settings },
    }),
  },

  // ═══════════════════════════════════════════════════════════════════
  // COMPOSITE NODES
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'merge-layers',
    type: 'merge-layers',
    category: 'composite',
    label: 'Merge Layers',
    description: 'Combine multiple images into layers',
    icon: 'Layers',
    inputs: [{ id: 'layers', label: 'Layers', dataType: 'image', multiple: true }],
    outputs: [{ id: 'image', label: 'Merged', dataType: 'image' }],
    defaults: { blendMode: 'normal', opacity: 1 },
    execute: async (inputs, settings) => ({
      image: { layers: inputs.layers || [], blendMode: settings.blendMode, opacity: settings.opacity },
    }),
  },
  {
    id: 'split',
    type: 'split',
    category: 'composite',
    label: 'Split',
    description: 'Send one image to multiple processing paths',
    icon: 'Code',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [
      { id: 'out1', label: 'Output 1', dataType: 'image' },
      { id: 'out2', label: 'Output 2', dataType: 'image' },
    ],
    defaults: {},
    execute: async (inputs, settings) => ({
      out1: inputs.image,
      out2: inputs.image,
    }),
  },

  // ═══════════════════════════════════════════════════════════════════
  // EXPORT NODES
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'export-canvas',
    type: 'export-canvas',
    category: 'export',
    label: 'Export to Canvas',
    description: 'Send result to the KreaThief canvas',
    icon: 'Download',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [],
    defaults: { layerName: 'AI Generated' },
    execute: async (inputs, settings) => {
      return { canvas: { ...inputs.image, name: settings.layerName } };
    },
  },
  {
    id: 'export-download',
    type: 'export-download',
    category: 'export',
    label: 'Export & Download',
    description: 'Download as PNG, JPG, or PDF',
    icon: 'Download',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [],
    defaults: { format: 'png', quality: 100, dpi: 300 },
    execute: async (inputs, settings) => {
      return { download: { ...inputs.image, format: settings.format, quality: settings.quality, dpi: settings.dpi } };
    },
  },
  {
    id: 'export-social',
    type: 'export-social',
    category: 'export',
    label: 'Export for Social',
    description: 'Export platform-optimized versions (Kittl/Glorify export)',
    icon: 'Share2',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [],
    defaults: { platforms: ['instagram', 'tiktok', 'linkedin'], format: 'png' },
    execute: async (inputs, settings) => {
      const sizes: Record<string, { w: number; h: number }> = {
        'instagram-square': { w: 1080, h: 1080 },
        'instagram-story': { w: 1080, h: 1920 },
        tiktok: { w: 1080, h: 1920 },
        linkedin: { w: 1200, h: 627 },
        'youtube-thumb': { w: 1280, h: 720 },
        twitter: { w: 1200, h: 675 },
      };
      const exports = settings.platforms.map((p: string) => ({
        platform: p,
        ...inputs.image,
        width: sizes[p]?.w || 1080,
        height: sizes[p]?.h || 1080,
        format: settings.format,
      }));
      return { socialExports: exports };
    },
  },
];

export const getNodeDefinition = (type: string): NodeDefinition | undefined =>
  NODE_DEFINITIONS.find((n) => n.type === type);

export const getNodesByCategory = (category: NodeCategory): NodeDefinition[] =>
  NODE_DEFINITIONS.filter((n) => n.category === category);
