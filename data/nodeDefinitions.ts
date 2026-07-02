import { NodeDefinition, NodeCategory } from '../types/nodes';

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
    icon: '📝',
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
    icon: '🖼️',
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
    icon: '🎯',
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
    icon: '📐',
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
    icon: '🎨',
    inputs: [],
    outputs: [{ id: 'colors', label: 'Colors', dataType: 'color' }],
    defaults: { colors: ['#7D2AE8', '#00C4CC', '#FFFFFF'] },
    execute: async (inputs, settings) => ({
      colors: settings.colors,
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
    icon: '⚡',
    inputs: [
      { id: 'prompt', label: 'Prompt', dataType: 'text' },
      { id: 'image', label: 'Image', dataType: 'image', multiple: true },
    ],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    defaults: { model: 'flux-schnell', steps: 20, cfg: 7, width: 1024, height: 1024, seed: -1 },
    execute: async (inputs, settings) => {
      const response = await fetch('/api/fal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `fal-ai/${settings.model}`,
          prompt: inputs.prompt?.prompt || settings.prompt || '',
          image_size: { width: settings.width, height: settings.height },
          num_inference_steps: settings.steps,
          guidance_scale: settings.cfg,
          seed: settings.seed === -1 ? undefined : settings.seed,
        }),
      });
      const data = await response.json();
      return { image: { src: data.images?.[0]?.url || data.url, width: settings.width, height: settings.height } };
    },
  },
  {
    id: 'ai-gemini',
    type: 'ai-gemini',
    category: 'ai',
    label: 'Gemini Image Gen',
    description: 'Generate images with Google Gemini (Nano Banana)',
    icon: '🔮',
    inputs: [
      { id: 'prompt', label: 'Prompt', dataType: 'text' },
      { id: 'image', label: 'Image', dataType: 'image', multiple: true },
    ],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    defaults: { model: 'nano-banana-2', width: 1024, height: 1024 },
    execute: async (inputs, settings) => {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.model,
          prompt: inputs.prompt?.prompt || '',
          images: inputs.image ? (Array.isArray(inputs.image) ? inputs.image : [inputs.image]) : [],
        }),
      });
      const data = await response.json();
      return { image: { src: data.imageUrl || data.url, width: settings.width, height: settings.height } };
    },
  },
  {
    id: 'ai-recraft',
    type: 'ai-recraft',
    category: 'ai',
    label: 'Recraft Vector',
    description: 'Generate vector graphics with Recraft V3/V4',
    icon: '✨',
    inputs: [{ id: 'prompt', label: 'Prompt', dataType: 'text' }],
    outputs: [{ id: 'image', label: 'SVG', dataType: 'image' }],
    defaults: { style: 'digital_illustration', width: 1024, height: 1024 },
    execute: async (inputs, settings) => {
      const response = await fetch('/api/fal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'fal-ai/recraft-v3',
          prompt: inputs.prompt?.prompt || '',
          style: settings.style,
          image_size: { width: settings.width, height: settings.height },
        }),
      });
      const data = await response.json();
      return { image: { src: data.images?.[0]?.url, width: settings.width, height: settings.height } };
    },
  },
  {
    id: 'ai-seedream',
    type: 'ai-seedream',
    category: 'ai',
    label: 'Seedream',
    description: 'High-quality image generation with Seedream v4.5',
    icon: '🇨🇳',
    inputs: [{ id: 'prompt', label: 'Prompt', dataType: 'text' }],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    defaults: { model: 'seedream-v4.5', width: 1024, height: 1024 },
    execute: async (inputs, settings) => {
      const response = await fetch('/api/fal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `fal-ai/${settings.model}`,
          prompt: inputs.prompt?.prompt || '',
          image_size: { width: settings.width, height: settings.height },
        }),
      });
      const data = await response.json();
      return { image: { src: data.images?.[0]?.url, width: settings.width, height: settings.height } };
    },
  },
  {
    id: 'ai-text-gen',
    type: 'ai-text-gen',
    category: 'ai',
    label: 'AI Text Generator',
    description: 'Generate text content with AI',
    icon: '💬',
    inputs: [{ id: 'prompt', label: 'Prompt', dataType: 'text' }],
    outputs: [{ id: 'text', label: 'Text', dataType: 'text' }],
    defaults: { instruction: 'Generate a catchy headline', tone: 'professional' },
    execute: async (inputs, settings) => {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${settings.instruction}. Tone: ${settings.tone}. Context: ${inputs.prompt?.prompt || ''}`,
        }),
      });
      const data = await response.json();
      return { text: data.text || data.response };
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
    icon: '✂️',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    defaults: {},
    execute: async (inputs, settings) => {
      const response = await fetch('/api/fal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'fal-ai/background-removal', image_url: inputs.image?.src }),
      });
      const data = await response.json();
      return { image: { ...inputs.image, src: data.image?.url || data.images?.[0]?.url } };
    },
  },
  {
    id: 'upscale',
    type: 'upscale',
    category: 'edit',
    label: 'Upscale',
    description: 'Upscale image resolution 2x or 4x',
    icon: '🔍',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    defaults: { scale: 2 },
    execute: async (inputs, settings) => {
      const response = await fetch('/api/fal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'fal-ai/esrgan', image_url: inputs.image?.src, scale: settings.scale }),
      });
      const data = await response.json();
      return { image: { ...inputs.image, src: data.image?.url, width: (inputs.image?.width || 512) * settings.scale, height: (inputs.image?.height || 512) * settings.scale } };
    },
  },
  {
    id: 'crop',
    type: 'crop',
    category: 'edit',
    label: 'Crop',
    description: 'Crop image to specific dimensions',
    icon: '✂️',
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
    icon: '📐',
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
    icon: '🎭',
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
    icon: '📝',
    inputs: [
      { id: 'image', label: 'Image', dataType: 'image' },
      { id: 'text', label: 'Text', dataType: 'text' },
    ],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    defaults: { text: 'Your Text', fontSize: 72, fontFamily: 'Inter', fontWeight: 'bold', color: '#FFFFFF', x: 50, y: 50, textAlign: 'center', shadow: true, stroke: false },
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
    icon: '🎨',
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
    icon: '🔀',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'SVG', dataType: 'image' }],
    defaults: { detail: 'high', colors: 16 },
    execute: async (inputs, settings) => {
      const response = await fetch('/api/fal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'fal-ai/recraft-v3', image_url: inputs.image?.src, mode: 'vector' }),
      });
      const data = await response.json();
      return { image: { ...inputs.image, src: data.images?.[0]?.url, isVector: true } };
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
    icon: '📦',
    inputs: [{ id: 'image', label: 'Design', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Mockup', dataType: 'image' }],
    defaults: { product: 'tshirt-white', angle: 'front', scene: 'studio' },
    execute: async (inputs, settings) => {
      const response = await fetch('/api/dynamic-mockups?action=generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockupId: settings.product, designUrl: inputs.image?.src, placement: { top: 0, left: 0, width: 100, rotate: 0 } }),
      });
      const data = await response.json();
      return { image: { src: data.url, width: 3000, height: 3000 } };
    },
  },
  {
    id: 'mockup-color-swap',
    type: 'mockup-color-swap',
    category: 'mockup',
    label: 'Color Swap',
    description: 'Change product color (Kittl one-click color swap)',
    icon: '🔄',
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
    icon: '🎬',
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
    icon: '📐',
    inputs: [{ id: 'layers', label: 'Layers', dataType: 'layers' }],
    outputs: [{ id: 'layers', label: 'Layers', dataType: 'layers' }],
    defaults: { type: 'grid', columns: 2, gap: 20, padding: 40 },
    execute: async (inputs, settings) => ({
      layers: inputs.layers?.map((l: any, i: number) => ({
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
    icon: '📱',
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
    icon: '🏷️',
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
    icon: '📚',
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
    icon: '🔀',
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
    icon: '💾',
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
    icon: '📥',
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
    icon: '📱',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [],
    defaults: { platforms: ['instagram', 'tiktok', 'linkedin'], format: 'png' },
    execute: async (inputs, settings) => {
      const sizes: Record<string, { w: number; h: number }> = {
        'instagram-square': { w: 1080, h: 1080 },
        'instagram-story': { w: 1080, h: 1920 },
        'tiktok': { w: 1080, h: 1920 },
        'linkedin': { w: 1200, h: 627 },
        'youtube-thumb': { w: 1280, h: 720 },
        'twitter': { w: 1200, h: 675 },
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
