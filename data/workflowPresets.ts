import { WorkflowPreset } from '../types/nodes';

export const WORKFLOW_PRESETS: WorkflowPreset[] = [
  // ═══════════════════════════════════════════════════════════════════
  // KITTL-STYLE PRESETS
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'kittl-tshirt',
    name: 'T-Shirt Design',
    description: 'Generate a t-shirt design with AI, vectorize, and mockup',
    category: 'kittl',
    icon: '👕',
    graph: {
      name: 'T-Shirt Design Pipeline',
      description: 'AI generate → Vectorize → Text overlay → Product mockup',
      nodes: [
        { id: 'n1', type: 'text-prompt', x: 50, y: 200, settings: { prompt: 'vintage retro sunset logo, minimalist' } },
        { id: 'n2', type: 'ai-recraft', x: 300, y: 200, settings: { style: 'digital_illustration', width: 1024, height: 1024 } },
        { id: 'n3', type: 'bg-remove', x: 550, y: 200, settings: {} },
        { id: 'n4', type: 'vectorize', x: 800, y: 200, settings: { detail: 'high' } },
        { id: 'n5', type: 'text-overlay', x: 1050, y: 200, settings: { text: 'YOUR BRAND', fontSize: 48, color: '#FFFFFF' } },
        { id: 'n6', type: 'mockup-product', x: 1300, y: 200, settings: { product: 'tshirt-white', angle: 'front' } },
        { id: 'n7', type: 'export-canvas', x: 1550, y: 200, settings: { layerName: 'T-Shirt Mockup' } },
      ],
      wires: [
        { id: 'w1', fromNode: 'n1', fromPort: 'prompt', toNode: 'n2', toPort: 'prompt' },
        { id: 'w2', fromNode: 'n2', fromPort: 'image', toNode: 'n3', toPort: 'image' },
        { id: 'w3', fromNode: 'n3', fromPort: 'image', toNode: 'n4', toPort: 'image' },
        { id: 'w4', fromNode: 'n4', fromPort: 'image', toNode: 'n5', toPort: 'image' },
        { id: 'w5', fromNode: 'n5', fromPort: 'image', toNode: 'n6', toPort: 'image' },
        { id: 'w6', fromNode: 'n6', fromPort: 'image', toNode: 'n7', toPort: 'image' },
      ],
    },
  },
  {
    id: 'kittl-social-post',
    name: 'Social Media Post',
    description: 'Generate an Instagram post with AI text and image',
    category: 'kittl',
    icon: '📱',
    graph: {
      name: 'Social Post Pipeline',
      description: 'AI image + AI text + resize for Instagram',
      nodes: [
        { id: 'n1', type: 'text-prompt', x: 50, y: 150, settings: { prompt: 'vibrant tropical smoothie on marble counter, overhead shot' } },
        { id: 'n2', type: 'ai-flux', x: 300, y: 150, settings: { model: 'flux-schnell', width: 1080, height: 1080 } },
        { id: 'n3', type: 'bg-remove', x: 550, y: 150, settings: {} },
        { id: 'n4', type: 'ai-text-gen', x: 300, y: 400, settings: { instruction: 'Generate a catchy Instagram caption for a smoothie brand', tone: 'fun' } },
        { id: 'n5', type: 'text-overlay', x: 800, y: 150, settings: { text: '50% OFF', fontSize: 96, color: '#FF6B35', shadow: true } },
        { id: 'n6', type: 'social-resize', x: 1050, y: 150, settings: { platform: 'instagram-square', width: 1080, height: 1080 } },
        { id: 'n7', type: 'export-canvas', x: 1300, y: 150, settings: { layerName: 'Instagram Post' } },
      ],
      wires: [
        { id: 'w1', fromNode: 'n1', fromPort: 'prompt', toNode: 'n2', toPort: 'prompt' },
        { id: 'w2', fromNode: 'n2', fromPort: 'image', toNode: 'n3', toPort: 'image' },
        { id: 'w3', fromNode: 'n3', fromPort: 'image', toNode: 'n5', toPort: 'image' },
        { id: 'w4', fromNode: 'n4', fromPort: 'text', toNode: 'n5', toPort: 'text' },
        { id: 'w5', fromNode: 'n5', fromPort: 'image', toNode: 'n6', toPort: 'image' },
        { id: 'w6', fromNode: 'n6', fromPort: 'image', toNode: 'n7', toPort: 'image' },
      ],
    },
  },
  {
    id: 'kittl-logo-gen',
    name: 'Logo Generator',
    description: 'Generate a logo with AI, vectorize, and color match',
    category: 'kittl',
    icon: '🎨',
    graph: {
      name: 'Logo Generator Pipeline',
      description: 'AI logo → Vectorize → Brand color match',
      nodes: [
        { id: 'n1', type: 'text-prompt', x: 50, y: 200, settings: { prompt: 'minimalist geometric logo, modern tech company' } },
        { id: 'n2', type: 'ai-recraft', x: 300, y: 200, settings: { style: 'digital_illustration', width: 1024, height: 1024 } },
        { id: 'n3', type: 'bg-remove', x: 550, y: 200, settings: {} },
        { id: 'n4', type: 'vectorize', x: 800, y: 200, settings: { detail: 'high', colors: 8 } },
        { id: 'n5', type: 'color-palette', x: 550, y: 400, settings: { colors: ['#7D2AE8', '#00C4CC'] } },
        { id: 'n6', type: 'color-match', x: 1050, y: 200, settings: { strength: 0.8 } },
        { id: 'n7', type: 'export-canvas', x: 1300, y: 200, settings: { layerName: 'Logo' } },
      ],
      wires: [
        { id: 'w1', fromNode: 'n1', fromPort: 'prompt', toNode: 'n2', toPort: 'prompt' },
        { id: 'w2', fromNode: 'n2', fromPort: 'image', toNode: 'n3', toPort: 'image' },
        { id: 'w3', fromNode: 'n3', fromPort: 'image', toNode: 'n4', toPort: 'image' },
        { id: 'w4', fromNode: 'n4', fromPort: 'image', toNode: 'n6', toPort: 'image' },
        { id: 'w5', fromNode: 'n5', fromPort: 'colors', toNode: 'n6', toPort: 'colors' },
        { id: 'w6', fromNode: 'n6', fromPort: 'image', toNode: 'n7', toPort: 'image' },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // GLORIFY-STYLE PRESETS
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'glorify-product-shot',
    name: 'Product Shot',
    description: 'Generate a product photo with AI and add to scene',
    category: 'glorify',
    icon: '📦',
    graph: {
      name: 'Product Shot Pipeline',
      description: 'AI product image → BG remove → Scene placement',
      nodes: [
        { id: 'n1', type: 'text-prompt', x: 50, y: 200, settings: { prompt: 'professional product photo, white background, studio lighting' } },
        { id: 'n2', type: 'ai-gemini', x: 300, y: 200, settings: { model: 'nano-banana-2', width: 1024, height: 1024 } },
        { id: 'n3', type: 'bg-remove', x: 550, y: 200, settings: {} },
        { id: 'n4', type: 'mockup-scene', x: 800, y: 200, settings: { scene: 'desk-setup', lighting: 'natural' } },
        { id: 'n5', type: 'upscale', x: 1050, y: 200, settings: { scale: 2 } },
        { id: 'n6', type: 'export-canvas', x: 1300, y: 200, settings: { layerName: 'Product Shot' } },
      ],
      wires: [
        { id: 'w1', fromNode: 'n1', fromPort: 'prompt', toNode: 'n2', toPort: 'prompt' },
        { id: 'w2', fromNode: 'n2', fromPort: 'image', toNode: 'n3', toPort: 'image' },
        { id: 'w3', fromNode: 'n3', fromPort: 'image', toNode: 'n4', toPort: 'image' },
        { id: 'w4', fromNode: 'n4', fromPort: 'image', toNode: 'n5', toPort: 'image' },
        { id: 'w5', fromNode: 'n5', fromPort: 'image', toNode: 'n6', toPort: 'image' },
      ],
    },
  },
  {
    id: 'glorify-amazon-listing',
    name: 'Amazon Listing',
    description: 'Create Amazon-optimized product images with annotations',
    category: 'glorify',
    icon: '🛒',
    graph: {
      name: 'Amazon Listing Pipeline',
      description: 'Product image → Annotate → Export for Amazon',
      nodes: [
        { id: 'n1', type: 'text-prompt', x: 50, y: 150, settings: { prompt: 'wireless headphones product photo, clean white background' } },
        { id: 'n2', type: 'ai-flux', x: 300, y: 150, settings: { model: 'flux-schnell', width: 2000, height: 2000 } },
        { id: 'n3', type: 'bg-remove', x: 550, y: 150, settings: {} },
        { id: 'n4', type: 'text-overlay', x: 800, y: 150, settings: { text: '40hr Battery Life', fontSize: 36, color: '#333333', x: 70, y: 30 } },
        { id: 'n5', type: 'upscale', x: 1050, y: 150, settings: { scale: 2 } },
        { id: 'n6', type: 'export-download', x: 1300, y: 150, settings: { format: 'jpg', quality: 95, dpi: 300 } },
      ],
      wires: [
        { id: 'w1', fromNode: 'n1', fromPort: 'prompt', toNode: 'n2', toPort: 'prompt' },
        { id: 'w2', fromNode: 'n2', fromPort: 'image', toNode: 'n3', toPort: 'image' },
        { id: 'w3', fromNode: 'n3', fromPort: 'image', toNode: 'n4', toPort: 'image' },
        { id: 'w4', fromNode: 'n4', fromPort: 'image', toNode: 'n5', toPort: 'image' },
        { id: 'w5', fromNode: 'n5', fromPort: 'image', toNode: 'n6', toPort: 'image' },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // WEAVE-STYLE PRESETS (Multi-model AI pipelines)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'weave-multi-model',
    name: 'Multi-Model Pipeline',
    description: 'Combine multiple AI models in one workflow',
    category: 'weave',
    icon: '🔗',
    graph: {
      name: 'Multi-Model Pipeline',
      description: 'FLUX for base → Gemini for refinement → Recraft for vector',
      nodes: [
        { id: 'n1', type: 'text-prompt', x: 50, y: 250, settings: { prompt: 'futuristic city skyline at sunset, cyberpunk style' } },
        { id: 'n2', type: 'ai-flux', x: 300, y: 150, settings: { model: 'flux-schnell', width: 1024, height: 1024 } },
        { id: 'n3', type: 'ai-gemini', x: 550, y: 350, settings: { model: 'nano-banana-2' } },
        { id: 'n4', type: 'ai-recraft', x: 800, y: 250, settings: { style: 'digital_illustration' } },
        { id: 'n5', type: 'split', x: 1050, y: 250, settings: {} },
        { id: 'n6', type: 'export-canvas', x: 1300, y: 150, settings: { layerName: 'AI Generated (Raster)' } },
        { id: 'n7', type: 'export-canvas', x: 1300, y: 400, settings: { layerName: 'AI Generated (Vector)' } },
      ],
      wires: [
        { id: 'w1', fromNode: 'n1', fromPort: 'prompt', toNode: 'n2', toPort: 'prompt' },
        { id: 'w2', fromNode: 'n1', fromPort: 'prompt', toNode: 'n3', toPort: 'prompt' },
        { id: 'w3', fromNode: 'n2', fromPort: 'image', toNode: 'n4', toPort: 'image' },
        { id: 'w4', fromNode: 'n4', fromPort: 'image', toNode: 'n5', toPort: 'image' },
        { id: 'w5', fromNode: 'n5', fromPort: 'out1', toNode: 'n6', toPort: 'image' },
        { id: 'w6', fromNode: 'n5', fromPort: 'out2', toNode: 'n7', toPort: 'image' },
      ],
    },
  },
  {
    id: 'weave-enhance-pipeline',
    name: 'Enhance Pipeline',
    description: 'Remove BG → Upscale → Filter → Text overlay',
    category: 'weave',
    icon: '✨',
    graph: {
      name: 'Enhance Pipeline',
      description: 'Full image enhancement pipeline',
      nodes: [
        { id: 'n1', type: 'image-upload', x: 50, y: 200, settings: { src: '' } },
        { id: 'n2', type: 'bg-remove', x: 300, y: 200, settings: {} },
        { id: 'n3', type: 'upscale', x: 550, y: 200, settings: { scale: 2 } },
        { id: 'n4', type: 'filter', x: 800, y: 200, settings: { brightness: 110, contrast: 110, saturation: 120 } },
        { id: 'n5', type: 'text-overlay', x: 1050, y: 200, settings: { text: 'ENHANCED', fontSize: 48, color: '#FFFFFF' } },
        { id: 'n6', type: 'export-canvas', x: 1300, y: 200, settings: { layerName: 'Enhanced Image' } },
      ],
      wires: [
        { id: 'w1', fromNode: 'n1', fromPort: 'image', toNode: 'n2', toPort: 'image' },
        { id: 'w2', fromNode: 'n2', fromPort: 'image', toNode: 'n3', toPort: 'image' },
        { id: 'w3', fromNode: 'n3', fromPort: 'image', toNode: 'n4', toPort: 'image' },
        { id: 'w4', fromNode: 'n4', fromPort: 'image', toNode: 'n5', toPort: 'image' },
        { id: 'w5', fromNode: 'n5', fromPort: 'image', toNode: 'n6', toPort: 'image' },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // KREATHIEF-STYLE PRESETS (Unique to KreaThief)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'kreathief-batch-social',
    name: 'Batch Social Media',
    description: 'Generate one design, export for all platforms at once',
    category: 'kreathief',
    icon: '📱',
    graph: {
      name: 'Batch Social Pipeline',
      description: 'One design → Multiple platform exports',
      nodes: [
        { id: 'n1', type: 'text-prompt', x: 50, y: 200, settings: { prompt: 'modern fitness brand social media graphic' } },
        { id: 'n2', type: 'ai-flux', x: 300, y: 200, settings: { model: 'flux-schnell', width: 1080, height: 1080 } },
        { id: 'n3', type: 'text-overlay', x: 550, y: 200, settings: { text: 'GET FIT', fontSize: 72, color: '#FF4444' } },
        { id: 'n4', type: 'split', x: 800, y: 200, settings: {} },
        { id: 'n5', type: 'social-resize', x: 1050, y: 100, settings: { platform: 'instagram-square', width: 1080, height: 1080 } },
        { id: 'n6', type: 'social-resize', x: 1050, y: 300, settings: { platform: 'tiktok', width: 1080, height: 1920 } },
        { id: 'n7', type: 'export-social', x: 1300, y: 200, settings: { platforms: ['instagram', 'tiktok', 'linkedin'] } },
      ],
      wires: [
        { id: 'w1', fromNode: 'n1', fromPort: 'prompt', toNode: 'n2', toPort: 'prompt' },
        { id: 'w2', fromNode: 'n2', fromPort: 'image', toNode: 'n3', toPort: 'image' },
        { id: 'w3', fromNode: 'n3', fromPort: 'image', toNode: 'n4', toPort: 'image' },
        { id: 'w4', fromNode: 'n4', fromPort: 'out1', toNode: 'n5', toPort: 'image' },
        { id: 'w5', fromNode: 'n4', fromPort: 'out2', toNode: 'n6', toPort: 'image' },
        { id: 'w6', fromNode: 'n5', fromPort: 'image', toNode: 'n7', toPort: 'image' },
      ],
    },
  },
  {
    id: 'kreathief-brand-kit',
    name: 'Full Brand Kit',
    description: 'Generate logo, colors, and social templates from a prompt',
    category: 'kreathief',
    icon: '🏷️',
    graph: {
      name: 'Brand Kit Generator',
      description: 'Generate complete brand identity from one prompt',
      nodes: [
        { id: 'n1', type: 'text-prompt', x: 50, y: 250, settings: { prompt: 'modern organic food brand, earthy tones, clean' } },
        { id: 'n2', type: 'ai-recraft', x: 300, y: 150, settings: { style: 'digital_illustration', width: 1024, height: 1024 } },
        { id: 'n3', type: 'ai-text-gen', x: 300, y: 350, settings: { instruction: 'Generate brand colors for this brand description', tone: 'professional' } },
        { id: 'n4', type: 'vectorize', x: 550, y: 150, settings: { detail: 'high' } },
        { id: 'n5', type: 'bg-remove', x: 800, y: 150, settings: {} },
        { id: 'n6', type: 'mockup-product', x: 1050, y: 150, settings: { product: 'tshirt-white' } },
        { id: 'n7', type: 'export-canvas', x: 1300, y: 150, settings: { layerName: 'Brand Logo on Product' } },
      ],
      wires: [
        { id: 'w1', fromNode: 'n1', fromPort: 'prompt', toNode: 'n2', toPort: 'prompt' },
        { id: 'w2', fromNode: 'n1', fromPort: 'prompt', toNode: 'n3', toPort: 'prompt' },
        { id: 'w3', fromNode: 'n2', fromPort: 'image', toNode: 'n4', toPort: 'image' },
        { id: 'w4', fromNode: 'n4', fromPort: 'image', toNode: 'n5', toPort: 'image' },
        { id: 'w5', fromNode: 'n5', fromPort: 'image', toNode: 'n6', toPort: 'image' },
        { id: 'w6', fromNode: 'n6', fromPort: 'image', toNode: 'n7', toPort: 'image' },
      ],
    },
  },
];

export const getPresetsByCategory = (category: WorkflowPreset['category']) =>
  WORKFLOW_PRESETS.filter((p) => p.category === category);
