export interface FeatureFAQ {
  question: string;
  answer: string;
}

export interface FeatureStep {
  step: string;
  title: string;
  description: string;
}

export interface FeatureBenefit {
  title: string;
  description: string;
  iconName: string;
}

export interface FeaturePageData {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  badge: string;
  headline: string;
  subheadline: string;
  heroCta: string;
  editorToolParam?: string;
  demoType: 'eraser' | 'bg_remove' | 'mockup' | 'vector' | 'resize' | 'styles';
  beforeImage?: string;
  afterImage?: string;
  benefits: FeatureBenefit[];
  steps: FeatureStep[];
  faqs: FeatureFAQ[];
  relatedSlugs: string[];
}

export const FEATURES_DATA: Record<string, FeaturePageData> = {
  'magic-eraser': {
    slug: 'magic-eraser',
    title: 'AI Magic Object Eraser',
    metaTitle: 'Free AI Magic Object Eraser Online — Remove People & Blemishes | Kreathief',
    metaDescription: 'Effortlessly erase unwanted objects, people, watermarks, and photo blemishes in seconds with Kreathief AI Magic Eraser. 100% free, browser-based, and non-destructive.',
    badge: 'AI Generative Inpainting',
    headline: 'Erase unwanted objects from photos like magic.',
    subheadline: 'Brush over people, watermarks, text, or background clutter. Our generative AI reconstructs textures, lighting, and patterns seamlessly.',
    heroCta: 'Start Erasing Free',
    editorToolParam: 'magic_eraser',
    demoType: 'eraser',
    beforeImage: '/images/downloads/travel_photo_crowd.jpg',
    afterImage: '/images/downloads/travel_photo_clean.jpg',
    benefits: [
      {
        title: 'Pixel-Perfect Texture Fill',
        description: 'Replaces erased areas with context-aware textures, lighting gradients, and shadows so the photo looks unedited.',
        iconName: 'Wand',
      },
      {
        title: 'Non-Destructive Workflow',
        description: 'Every erase patch is preserved as an editable layer on the canvas. Revert or readjust anytime with Ctrl+Z.',
        iconName: 'Undo',
      },
      {
        title: 'On-Device Privacy Mode',
        description: 'Runs via local WebAssembly LaMa models or ultra-fast cloud inpainting without selling or training on your photos.',
        iconName: 'Shield',
      },
      {
        title: 'Full Resolution 4K Export',
        description: 'Download crisp, high-definition PNGs and JPEGs without downsampling or artificial watermarks.',
        iconName: 'Download',
      },
    ],
    steps: [
      {
        step: '01',
        title: 'Upload or drop your photo',
        description: 'Drag and drop any JPEG, PNG, or WebP image directly onto the interactive canvas.',
      },
      {
        step: '02',
        title: 'Brush over what to remove',
        description: 'Use the Magic Eraser brush to paint a quick mask over any unwanted person, object, or text.',
      },
      {
        step: '03',
        title: 'Click Erase and download',
        description: 'Watch the object disappear in seconds. Export your clean photo or continue designing in Kreathief.',
      },
    ],
    faqs: [
      {
        question: 'Is the Kreathief Magic Eraser free to use?',
        answer: 'Yes! Kreathief includes free credits to erase objects, remove blemishes, and clean up photos directly in your web browser with no credit card required.',
      },
      {
        question: 'How does AI object removal work?',
        answer: 'Our tool uses deep-learning generative fill (LaMa and SDXL inpainting) to analyze surrounding pixels and predict what was behind the removed object, matching lighting and textures seamlessly.',
      },
      {
        question: 'Can I remove text, logos, and watermarks?',
        answer: 'Yes, simply brush over any text, watermark, timestamp, or sticker. The algorithm fills the background without blurring.',
      },
      {
        question: 'Will my image quality be reduced?',
        answer: 'No. Kreathief preserves the original dimensions and dpi of your photo, exporting in crystal clear high definition.',
      },
    ],
    relatedSlugs: ['background-remover', 'vectorizer', 'mockup-generator'],
  },

  'background-remover': {
    slug: 'background-remover',
    title: 'AI Background Remover',
    metaTitle: 'Free AI Background Remover — Instant Transparent PNG Cutouts | Kreathief',
    metaDescription: 'Remove backgrounds from photos instantly with AI. Create transparent PNG cutouts for eCommerce, portraits, and marketing with sub-pixel hair and edge accuracy.',
    badge: '1-Click Edge Isolation',
    headline: 'Instant transparent backgrounds with sub-pixel edge precision.',
    subheadline: 'Cut out subjects, products, portraits, and cars in 1 click. Zero manual lasso work, perfect edge feathering, and instant PNG export.',
    heroCta: 'Remove Background Now',
    editorToolParam: 'rmbg',
    demoType: 'bg_remove',
    benefits: [
      {
        title: 'Sub-Pixel Hair & Fur Detailing',
        description: 'Detects intricate flyaway hairs, transparent glass, and fine textures without jagged halo artifacts.',
        iconName: 'Sparkles',
      },
      {
        title: 'eCommerce Ready',
        description: 'Easily swap transparent backgrounds for Amazon white, studio lighting, or vibrant brand gradients.',
        iconName: 'Layers',
      },
      {
        title: 'Batch Background Removal',
        description: 'Select multiple product shots and isolate their backgrounds simultaneously to build catalog assets faster.',
        iconName: 'Zap',
      },
      {
        title: 'Vector Path Mask Export',
        description: 'Export as transparent PNG or save the cutout contour as an editable SVG clipping path.',
        iconName: 'Crop',
      },
    ],
    steps: [
      {
        step: '01',
        title: 'Drop your image',
        description: 'Upload any product photo, portrait, or graphics asset.',
      },
      {
        step: '02',
        title: 'Click Remove Background',
        description: 'Our neural network isolates your foreground subject with sub-pixel hair accuracy in under 2 seconds.',
      },
      {
        step: '03',
        title: 'Replace background or export',
        description: 'Download your transparent PNG or drop your cutout directly into our 3D mockup generator.',
      },
    ],
    faqs: [
      {
        question: 'Does the background remover work on complex hair and fur?',
        answer: 'Yes, our matting model is trained specifically on complex edge boundaries including human hair, animal fur, transparent jewelry, and fine fabrics.',
      },
      {
        question: 'Can I replace the background with a custom color or gradient?',
        answer: 'Absolutely. Once isolated, you can choose solid studio white, colorful brand gradients, or place the subject into a scenic 3D backdrop.',
      },
      {
        question: 'What file formats can I download?',
        answer: 'You can download transparent PNGs, WebP files, layered SVGs, or keep editing on the Kreathief canvas.',
      },
    ],
    relatedSlugs: ['magic-eraser', 'mockup-generator', 'smart-resize'],
  },

  'mockup-generator': {
    slug: 'mockup-generator',
    title: '3D Mockup Generator',
    metaTitle: 'Free 3D Mockup Generator — Apparel, T-Shirts & Devices | Kreathief',
    metaDescription: 'Generate hyper-realistic 3D apparel and product mockups. Displacement mapping and perspective warping wrap your artwork across real fabric wrinkles and curves.',
    badge: 'Displacement Mapping Engine',
    headline: 'Hyper-realistic 3D product mockups with natural fabric physics.',
    subheadline: 'Wrap your artwork onto t-shirts, hoodies, mugs, packaging, and digital devices with realistic wrinkles, lighting highlights, and depth maps.',
    heroCta: 'Create Free Mockup',
    editorToolParam: 'mockup',
    demoType: 'mockup',
    benefits: [
      {
        title: 'Real Fabric Luma Displacement',
        description: 'Artwork bends realistically along cloth creases, seams, and folds instead of looking like a flat sticker.',
        iconName: 'Cube',
      },
      {
        title: '4-Corner Perspective Warp',
        description: 'Interactive homography matrix handles angles, tilts, and perspective depth with GPU acceleration.',
        iconName: 'Maximize',
      },
      {
        title: 'Extensive Studio Scene Library',
        description: 'Choose from streetwear models, lifestyle desk setups, billboards, and clean studio packaging.',
        iconName: 'Grid',
      },
      {
        title: 'Print-on-Demand (POD) Ready',
        description: 'Export commercial high-res renders ready for Shopify, Etsy, Amazon, and social media campaigns.',
        iconName: 'Download',
      },
    ],
    steps: [
      {
        step: '01',
        title: 'Select a mockup scene',
        description: 'Pick from over 100+ streetwear, apparel, packaging, and digital device templates.',
      },
      {
        step: '02',
        title: 'Apply your design',
        description: 'Upload your vector logo or illustration. The displacement engine automatically maps it across folds and shadows.',
      },
      {
        step: '03',
        title: 'Fine-tune & export',
        description: 'Adjust fabric color, lighting blend mode, and displacement intensity, then download in high-res.',
      },
    ],
    faqs: [
      {
        question: 'How is Kreathief different from standard mockup tools?',
        answer: 'Most online mockup tools paste a flat PNG on top of a photo. Kreathief calculates lighting shadows and displacement maps from the fabric texture, so your artwork wrinkles and bends naturally.',
      },
      {
        question: 'Can I customize the color of the garment?',
        answer: 'Yes! You can change t-shirt, hoodie, or background colors using exact HEX codes or palette recommendations.',
      },
      {
        question: 'Can I use mockups for commercial sales on Shopify and Etsy?',
        answer: 'Yes, all mockups exported from Kreathief include a full commercial license for personal and business use.',
      },
    ],
    relatedSlugs: ['magic-eraser', 'vectorizer', 'smart-resize'],
  },

  'vectorizer': {
    slug: 'vectorizer',
    title: 'AI Image to Vector & SVG Converter',
    metaTitle: 'Free AI Image to Vector & SVG Converter — Clean Anchor Points | Kreathief',
    metaDescription: 'Convert raster PNG, JPG, and sketches into infinitely scalable SVG vector graphics. Clean bezier curves, optimized path counts, and full color support.',
    badge: 'Sub-Pixel Bezier Vectorization',
    headline: 'Turn raster images and sketches into crisp, scalable SVGs.',
    subheadline: 'Convert pixelated logos, illustrations, and line art into clean vector paths. Infinite scalability, editable anchor points, and lightweight SVG exports.',
    heroCta: 'Convert to Vector Free',
    editorToolParam: 'vectorize',
    demoType: 'vector',
    benefits: [
      {
        title: 'Infinite Resolution Scalability',
        description: 'Scale your artwork from a 16px favicon up to a 50-foot billboard without losing sharpness.',
        iconName: 'Maximize',
      },
      {
        title: 'Clean Bezier Anchor Points',
        description: 'Intelligent curve simplification avoids bloated path counts, giving you clean, easily editable vectors in Illustrator or Figma.',
        iconName: 'PenTool',
      },
      {
        title: 'Multi-Color Layer Separation',
        description: 'Automatically clusters color palettes into distinct, editable vector shape layers on the canvas.',
        iconName: 'Layers',
      },
      {
        title: 'Laser Cutting & Print Ready',
        description: 'Ideal for vinyl cutters, laser engravers, embroidery, screen printing, and responsive web icons.',
        iconName: 'CheckCircle',
      },
    ],
    steps: [
      {
        step: '01',
        title: 'Upload your bitmap artwork',
        description: 'Drop any low-res logo, icon, drawing, or pixelated graphic.',
      },
      {
        step: '02',
        title: 'Select vector fidelity',
        description: 'Choose between High Fidelity (detailed color artwork) or Low Poly / Silhouette (monochrome logos).',
      },
      {
        step: '03',
        title: 'Edit paths and export SVG',
        description: 'Tweak anchor points directly on the canvas or download the production-ready SVG file.',
      },
    ],
    faqs: [
      {
        question: 'What is the difference between raster and vector graphics?',
        answer: 'Raster graphics (JPEG, PNG) are made of fixed pixels that become blurry when enlarged. Vectors (SVG) are mathematical paths that scale infinitely to any size without quality loss.',
      },
      {
        question: 'Can I edit the vector paths after converting?',
        answer: 'Yes! Kreathief includes a full vector pen tool and anchor point editor so you can adjust curves, colors, and nodes on the canvas.',
      },
      {
        question: 'Is there a limit on how many colors can be vectorized?',
        answer: 'Our vectorizer supports full 16-color to 64-color palettes as well as high-contrast monochrome tracing.',
      },
    ],
    relatedSlugs: ['magic-eraser', 'mockup-generator', 'design-styles'],
  },

  'smart-resize': {
    slug: 'smart-resize',
    title: 'Smart Canvas Auto-Resize',
    metaTitle: '1-Click Social Media Smart Resize — Multi-Format Campaigns | Kreathief',
    metaDescription: 'Automatically adapt 1 design into Instagram, TikTok, YouTube, and LinkedIn formats. Intelligent layer constraint preservation prevents warped images or squashed text.',
    badge: 'Responsive Layout Engine',
    headline: '1 design adapted to every social media format in 1 click.',
    subheadline: 'Never recreate banner sizes manually again. Our layout engine auto-balances text hierarchy, scales imagery, and rearranges layouts for 16:9, 1:1, and 9:16.',
    heroCta: 'Try Smart Resize',
    editorToolParam: 'resize',
    demoType: 'resize',
    benefits: [
      {
        title: 'Constraint-Aware Auto Layout',
        description: 'Maintains padding, visual hierarchy, and aspect ratios across drastic aspect ratio shifts.',
        iconName: 'Layers',
      },
      {
        title: 'Multi-Artboard Matrix View',
        description: 'View all resized variations simultaneously side-by-side on an infinite canvas.',
        iconName: 'Grid',
      },
      {
        title: 'Preset Platform Sizes',
        description: 'Instant presets for Instagram Posts/Reels, YouTube Thumbnails, TikTok, Twitter/X banners, and print sizes.',
        iconName: 'Sparkles',
      },
      {
        title: 'Batch Export in Seconds',
        description: 'Export all formats in one zip file with standardized file naming ready for scheduling.',
        iconName: 'Download',
      },
    ],
    steps: [
      {
        step: '01',
        title: 'Design your primary artboard',
        description: 'Create your visual in any starting dimension (e.g. 1080x1080 Instagram post).',
      },
      {
        step: '02',
        title: 'Select target platforms',
        description: 'Check off Story (9:16), Banner (16:9), and Reel covers with a single click.',
      },
      {
        step: '03',
        title: 'Watch the matrix auto-balance',
        description: 'Kreathief instantly generates and refines all target artboards with balanced typography and focal points.',
      },
    ],
    faqs: [
      {
        question: 'Will my text get squashed or stretched during resize?',
        answer: 'No. Kreathief uses intelligent layer pinning and proportional font scaling rather than naive CSS stretching.',
      },
      {
        question: 'Can I edit individual resized artboards separately?',
        answer: 'Yes, each resized variation is an independent, fully editable artboard on your infinite canvas.',
      },
      {
        question: 'Which social media presets are included?',
        answer: 'Instagram Square/Portrait/Stories, YouTube Thumbnails & Banners, TikTok 9:16, Twitter/X Header, Facebook Feed, LinkedIn Post, and A4/Letter print formats.',
      },
    ],
    relatedSlugs: ['mockup-generator', 'background-remover', 'design-styles'],
  },

  'design-styles': {
    slug: 'design-styles',
    title: 'Aesthetic Design Style Presets',
    metaTitle: '60+ Aesthetic Graphic Design Styles & Presets — Memphis to Bauhaus | Kreathief',
    metaDescription: 'Explore 60+ curated aesthetic design movements: Memphis, Cyberpunk, Bauhaus, Art Nouveau, Synthwave, Y2K, and Swiss International with 1-click style transfer.',
    badge: 'Art Direction Intelligence',
    headline: 'Explore 60+ iconic graphic design styles and movements.',
    subheadline: 'Apply curated art direction, typography pairings, color palettes, and texture overlays from historical and modern design eras with 1 click.',
    heroCta: 'Explore Design Styles',
    editorToolParam: 'styles',
    demoType: 'styles',
    benefits: [
      {
        title: 'Historical & Modern Movements',
        description: 'From 1920s Bauhaus and Art Deco to 1980s Memphis, 90s Grunge, and 2020s Bento Grids.',
        iconName: 'Sparkles',
      },
      {
        title: 'Complete Style Kits',
        description: 'Each preset applies authentic typography hierarchies, color swatches, paper grain textures, and decorative accents.',
        iconName: 'Palette',
      },
      {
        title: '1-Click Style Transfer',
        description: 'Transform an existing plain flyer into any style without redesigning elements from scratch.',
        iconName: 'Wand',
      },
      {
        title: 'Curated Font Pairings',
        description: 'Includes over 120+ pre-licensed open-source and studio display fonts matched to each era.',
        iconName: 'Type',
      },
    ],
    steps: [
      {
        step: '01',
        title: 'Browse the style library',
        description: 'Filter styles by mood, era, or aesthetic (Minimalist, Retro, Futuristic, Editorial).',
      },
      {
        step: '02',
        title: 'Preview live on your artwork',
        description: 'Hover to see fonts, color harmonies, and textures applied dynamically to your canvas.',
      },
      {
        step: '03',
        title: 'Customize and make it your own',
        description: 'Tweak contrast, swap colors from the brand palette, and export ready-to-publish art.',
      },
    ],
    faqs: [
      {
        question: 'What styles are included?',
        answer: 'Over 60 movements including Bauhaus, Memphis, Cyberpunk, Art Nouveau, Neoclassical, Y2K, Brutalism, Swiss International, Flat Design, Synthwave, and Japanese Minimalist.',
      },
      {
        question: 'Can I apply a style to an existing project?',
        answer: 'Yes! The Style Transfer Engine can restyle your existing artboards, adapting colors, typography, and background textures in one click.',
      },
      {
        question: 'Are the fonts and graphics safe for commercial use?',
        answer: 'Yes, all style assets, textures, and fonts bundled in Kreathief are cleared for commercial and personal design projects.',
      },
    ],
    relatedSlugs: ['magic-eraser', 'vectorizer', 'mockup-generator'],
  },
  'image-upscaler': {
    slug: 'image-upscaler',
    title: 'AI Image Upscaler',
    metaTitle: 'Free AI Image Upscaler — Enhance Resolution to 4K & 8K | Kreathief',
    metaDescription: 'Upscale and enhance image resolution by 2x, 4x, and 8x without quality loss. Deep-learning super-resolution sharpens details, eliminates compression artifacts, and restores skin textures.',
    badge: 'AI Super-Resolution',
    headline: 'Upscale and enhance image quality up to 8K resolution.',
    subheadline: 'Transform blurry, low-resolution photos and logos into ultra-crisp, print-ready visual assets using state-of-the-art Real-ESRGAN and neural enhancement.',
    heroCta: 'Upscale Image Free',
    editorToolParam: 'upscale',
    demoType: 'eraser',
    benefits: [
      {
        title: '2x, 4x, and 8x Resolution Boost',
        description: 'Increase pixel dimensions up to 800% while hallucinating genuine sub-pixel textures and crisp micro-details.',
        iconName: 'Maximize',
      },
      {
        title: 'JPEG & Compression Denoising',
        description: 'Cleans blocky compression noise and color banding from web-scraped images and social thumbnails.',
        iconName: 'Sparkles',
      },
      {
        title: 'Facial & Texture Reconstruction',
        description: 'Specialized face-enhancement networks restore eyes, hair, and clothing fabrics naturally.',
        iconName: 'User',
      },
      {
        title: 'Batch & Vector-Safe',
        description: 'Combine with Kreathief vectorizer for logos or download pristine 4K PNGs for professional billboards.',
        iconName: 'Download',
      },
    ],
    steps: [
      { step: '01', title: 'Upload low-res photo', description: 'Drop your pixelated, low-DPI image onto the canvas.' },
      { step: '02', title: 'Choose upscale factor', description: 'Select 2x, 4x, or 8x super-resolution enhancement.' },
      { step: '03', title: 'Export in ultra HD', description: 'Download pristine high-definition PNGs or continue editing on canvas.' },
    ],
    faqs: [
      { question: 'Is the image upscaler free?', answer: 'Yes! Kreathief includes free credits to upscale and enhance images with no software installation.' },
      { question: 'Does upscaling cause blurriness?', answer: 'No. Unlike traditional bicubic interpolation, our deep learning models reconstruct actual textures, sharpness, and clean edges.' },
      { question: 'What file formats are supported?', answer: 'JPG, PNG, WebP, and TIFF files up to 25MB can be upscaled.' },
    ],
    relatedSlugs: ['background-remover', 'magic-eraser', 'ai-photo-editor'],
  },
  'ai-image-generator': {
    slug: 'ai-image-generator',
    title: 'AI Image Generator',
    metaTitle: 'AI Image Generator — Text to Image & Editable Artboards | Kreathief',
    metaDescription: 'Generate stunning photorealistic visuals, 3D renders, and fully editable multi-layer graphic designs from natural text descriptions. Powered by Fal Flux, SDXL, and Recraft V3.',
    badge: 'Multi-Model Generative AI',
    headline: 'Turn any prompt into breathtaking imagery & editable designs.',
    subheadline: 'Type your creative vision to generate photorealistic assets, concept art, vector graphics, or complete layered design layouts in seconds.',
    heroCta: 'Generate Image Free',
    editorToolParam: 'ai_generate',
    demoType: 'styles',
    benefits: [
      {
        title: 'Text to Editable Layers',
        description: 'Unlike other AI tools that give flat JPEGs, Kreathief can generate editable typography, shapes, and backgrounds.',
        iconName: 'Layers',
      },
      {
        title: 'Cinematic, 3D & Vector Archetypes',
        description: 'Choose from curated styles: cinematic photography, Octane 3D render, minimalist vector, or editorial fashion.',
        iconName: 'Palette',
      },
      {
        title: 'Style Reference Conditioning',
        description: 'Upload an existing brand visual to guide colors, lighting, and mood across new generations.',
        iconName: 'Wand',
      },
      {
        title: 'Anti-AI-Slop Curation',
        description: 'Trained to eliminate tacky AI aesthetics, plastic skin, and generic purple gradients in favor of editorial realism.',
        iconName: 'Shield',
      },
    ],
    steps: [
      { step: '01', title: 'Enter your prompt', description: 'Describe what you want to create or pick an inspirational template.' },
      { step: '02', title: 'Choose style & aspect ratio', description: 'Select 1:1, 16:9, 9:16, or 4:5 with your preferred artistic archetype.' },
      { step: '03', title: 'Customize on canvas', description: 'Edit text, rearrange layers, and export for marketing campaigns.' },
    ],
    faqs: [
      { question: 'Which AI models power the generator?', answer: 'Kreathief integrates industry-leading models including Flux Schnell/Dev, Fal AI, Stable Diffusion XL, and Recraft V3.' },
      { question: 'Can I edit the generated designs?', answer: 'Yes! When using Layer-Aware generation, text and graphic elements remain 100% editable on the canvas.' },
      { question: 'Can I use generated images commercially?', answer: 'Yes, all images generated with your paid or free credits come with full commercial rights.' },
    ],
    relatedSlugs: ['image-upscaler', 'product-staging', 'change-background'],
  },
  'ai-expand-image': {
    slug: 'ai-expand-image',
    title: 'AI Expand Image (Outpainting)',
    metaTitle: 'AI Image Expander Online — Outpaint & Extend Canvas | Kreathief',
    metaDescription: 'Extend and uncrop images beyond their original borders using AI outpainting. Expand horizontal photos to vertical 9:16 reels, enlarge backgrounds, and fill canvas margins.',
    badge: 'Generative Canvas Outpainting',
    headline: 'Extend any photo beyond its original borders.',
    subheadline: 'Uncrop tight headshots, turn landscape photos into vertical reels, or expand backgrounds seamlessly with context-aware generative fill.',
    heroCta: 'Expand Image Free',
    editorToolParam: 'magic_expand',
    demoType: 'resize',
    benefits: [
      {
        title: 'Aspect Ratio Transformation',
        description: 'Turn a 16:9 widescreen photo into a 9:16 TikTok video background without cropping out your subject.',
        iconName: 'Maximize',
      },
      {
        title: 'Context-Aware Horizon Fill',
        description: 'Continuously extends skies, beaches, office walls, and landscapes matching focal lighting and perspective.',
        iconName: 'Image',
      },
      {
        title: 'Zero Edge Seams',
        description: 'Blends surrounding pixels so the expanded canvas appears original and untouched.',
        iconName: 'Sparkles',
      },
      {
        title: 'One-Click Canvas Adapt',
        description: 'Drag canvas bounding handles outwards and let the AI fill the extra space automatically.',
        iconName: 'Wand',
      },
    ],
    steps: [
      { step: '01', title: 'Place photo on canvas', description: 'Add your image and resize the artboard to your target dimensions.' },
      { step: '02', title: 'Click Magic Expand', description: 'Trigger AI outpainting to analyze the scene and generate extended surroundings.' },
      { step: '03', title: 'Download expanded visual', description: 'Save your newly uncropped visual asset in full resolution.' },
    ],
    faqs: [
      { question: 'What is AI Image Expansion?', answer: 'AI Expansion (also known as outpainting) uses generative diffusion to imagine and draw what exists outside the original crop of a photo.' },
      { question: 'Can I expand only one side of an image?', answer: 'Yes, you can extend top, bottom, left, or right independently to fit any ad format.' },
      { question: 'Does it work on phone photos?', answer: 'Yes, works on any smartphone portrait, product shot, or landscape photo.' },
    ],
    relatedSlugs: ['magic-eraser', 'smart-resize', 'change-background'],
  },
  'image-to-video': {
    slug: 'image-to-video',
    title: 'Image to Video Generator',
    metaTitle: 'AI Image to Video Generator — Animate Still Photos & Graphics | Kreathief',
    metaDescription: 'Convert still designs, photos, and posters into cinematic videos with AI. Add intelligent camera zoom, parallax depth, kinetic text, and export in 60fps MP4.',
    badge: 'AI Motion Director',
    headline: 'Bring still designs and photos to life with AI video motion.',
    subheadline: 'Transform static flyers, posters, and product photos into captivating social video ads with 3D parallax, kinetic typography, and smooth camera moves.',
    heroCta: 'Animate Photos Free',
    editorToolParam: 'motion',
    demoType: 'styles',
    benefits: [
      {
        title: 'Cinematic Camera Moves',
        description: 'Add slow zooms, sweeping pans, 3D orbits, and focus pulls to any still visual.',
        iconName: 'Play',
      },
      {
        title: 'Kinetic Layer Animation',
        description: 'Animate headline copy, floating badges, and background glow independently.',
        iconName: 'Zap',
      },
      {
        title: '60fps High-Definition Export',
        description: 'Render smooth MP4 and WebM videos optimized for Instagram Reels, YouTube Shorts, and TikTok.',
        iconName: 'Download',
      },
      {
        title: 'No Video Timeline Complexity',
        description: 'Apply motion director presets with 1 click without mastering complicated video keyframe editors.',
        iconName: 'Sparkles',
      },
    ],
    steps: [
      { step: '01', title: 'Open design or photo', description: 'Create an artboard or upload any still image on the canvas.' },
      { step: '02', title: 'Select motion style', description: 'Choose from cinematic zoom, pulse, parallax drift, or kinetic pop.' },
      { step: '03', title: 'Export video in seconds', description: 'Download your ready-to-post MP4 video.' },
    ],
    faqs: [
      { question: 'How long does video generation take?', answer: 'Standard animations render in 3–8 seconds directly in your web browser.' },
      { question: 'What formats can I download?', answer: 'Export in MP4 (H.264) or lightweight WebM format at 30fps or 60fps.' },
      { question: 'Can I animate text over a video?', answer: 'Yes, all text layers can be animated with stagger, fade, slide, and kinetic typography.' },
    ],
    relatedSlugs: ['ai-image-generator', 'product-staging', 'mockup-generator'],
  },
  'change-background': {
    slug: 'change-background',
    title: 'AI Background Changer',
    metaTitle: 'Change Image Background Online with AI — Free Background Replacer | Kreathief',
    metaDescription: 'Replace image backgrounds with AI in one click. Isolate subjects cleanly and generate photorealistic studio backdrops, lifestyle scenes, or transparent PNGs.',
    badge: 'Background Synthesis',
    headline: 'Change photo backgrounds into stunning AI scenes.',
    subheadline: 'Extract your subject and transport them anywhere: a sleek Parisian cafe, high-end studio pedestal, sunset rooftop, or corporate boardroom.',
    heroCta: 'Change Background Free',
    editorToolParam: 'bg_remover',
    demoType: 'bg_remove',
    benefits: [
      {
        title: 'Hair & Edge Precision',
        description: 'Clean extraction preserving wisps of hair, fur, transparent glass, and fine jewelry.',
        iconName: 'Scissors',
      },
      {
        title: 'Text-Prompted Backdrops',
        description: 'Describe any environment in plain English and watch AI generate lighting-matched surroundings.',
        iconName: 'Wand',
      },
      {
        title: 'Studio Lighting Harmonization',
        description: 'Adjusts ambient color tones and drop shadows on the subject so they integrate realistically.',
        iconName: 'Sun',
      },
      {
        title: 'E-Commerce White & Gradient Modes',
        description: 'Quickly switch to pure #ffffff white for Amazon/Shopify or branded pastel gradients.',
        iconName: 'Box',
      },
    ],
    steps: [
      { step: '01', title: 'Upload image', description: 'Drop your portrait, product photo, or pet picture.' },
      { step: '02', title: 'Choose new background', description: 'Describe a scene with AI or pick a studio color preset.' },
      { step: '03', title: 'Save your photo', description: 'Export the finished composite in crisp full-resolution PNG.' },
    ],
    faqs: [
      { question: 'Does it leave rough halo outlines?', answer: 'No, our dual-pass feathering and alpha-matte smoothing ensures clean edges without green-screen artifacts.' },
      { question: 'Can I add realistic contact shadows?', answer: 'Yes, Kreathief includes automatic contact shadows and ambient occlusion beneath subjects.' },
      { question: 'Is background changing free?', answer: 'Yes, background removal and studio backdrop replacements are available with free credits.' },
    ],
    relatedSlugs: ['background-remover', 'product-staging', 'magic-eraser'],
  },
  'remove-object-from-photo': {
    slug: 'remove-object-from-photo',
    title: 'Remove Objects from Photo',
    metaTitle: 'Remove Objects from Photo Online — Free AI Clean Up Tool | Kreathief',
    metaDescription: 'Easily remove unwanted objects, power lines, clutter, and text from photos with AI. Non-destructive, instant, and runs directly in your browser.',
    badge: 'AI Photo Cleanup',
    headline: 'Remove objects, clutter, and tourists from photos.',
    subheadline: 'Brush over unwanted items in your pictures. Deep learning generative inpainting reconstructs what was behind them with pixel perfection.',
    heroCta: 'Remove Objects Free',
    editorToolParam: 'magic_eraser',
    demoType: 'eraser',
    benefits: [
      {
        title: 'Zero Ghosting or Artifacts',
        description: 'Fills the gap with context-aware textures matching natural lighting and grain.',
        iconName: 'Wand',
      },
      {
        title: 'Watermark & Text Erasing',
        description: 'Quickly clean timestamps, camera logos, and unwanted watermarks from personal photos.',
        iconName: 'Shield',
      },
      {
        title: 'Private & Secure',
        description: 'Client-side WebAssembly models ensure your private photos stay on your machine.',
        iconName: 'Lock',
      },
      {
        title: 'Unlimited Re-Dos',
        description: 'Non-destructive canvas layers let you erase multiple elements and undo anytime.',
        iconName: 'Undo',
      },
    ],
    steps: [
      { step: '01', title: 'Select photo', description: 'Upload any image you want to clean up.' },
      { step: '02', title: 'Brush over object', description: 'Cover the unwanted item with a single stroke.' },
      { step: '03', title: 'Click Erase', description: 'Watch the object vanish with seamless texture reconstruction.' },
    ],
    faqs: [
      { question: 'Can I remove photobombers and tourists?', answer: 'Yes, brush over crowds or passersby to produce a clean, solitary portrait.' },
      { question: 'How is this different from clone stamp?', answer: 'Clone stamp requires manual copying; our AI generates completely new context-aware pixels automatically.' },
      { question: 'Does it lower photo quality?', answer: 'No, only the masked area is touched, preserving 100% of the original photo resolution.' },
    ],
    relatedSlugs: ['magic-eraser', 'change-background', 'ai-photo-editor'],
  },
  'product-staging': {
    slug: 'product-staging',
    title: 'AI Product Staging',
    metaTitle: 'AI Product Staging Online — Realistic Lifestyle Scenes | Kreathief',
    metaDescription: 'Stage your products in photorealistic lifestyle scenes with AI. Eliminate expensive studio photoshoots and produce high-converting e-commerce mockups.',
    badge: 'E-Commerce AI Staging',
    headline: 'Stage products in realistic lifestyle scenes without a studio.',
    subheadline: 'Place your cosmetics, apparel, electronics, or beverages into sun-drenched marble counters, cozy living rooms, or sleek modern pedestals.',
    heroCta: 'Stage Products Free',
    editorToolParam: 'mockup',
    demoType: 'mockup',
    benefits: [
      {
        title: 'Eliminate Expensive Photoshoots',
        description: 'Produce seasonal campaign imagery and product variations for a fraction of traditional production costs.',
        iconName: 'DollarSign',
      },
      {
        title: 'Lighting & Reflection Matching',
        description: 'Generates realistic floor reflections, surface shadows, and directional highlights matching your product.',
        iconName: 'Sun',
      },
      {
        title: 'Amazon & Shopify Ready',
        description: 'Export directly to high-resolution square (2000x2000px) and banner formats approved by e-commerce marketplaces.',
        iconName: 'ShoppingBag',
      },
      {
        title: '3D Surface Wrapping',
        description: 'Wrap your label designs onto 3D bottles, boxes, pouches, mugs, and apparel realistically.',
        iconName: 'Box',
      },
    ],
    steps: [
      { step: '01', title: 'Upload product packshot', description: 'Drop your product photo or transparent label graphic.' },
      { step: '02', title: 'Pick lifestyle environment', description: 'Choose a luxury bathroom, kitchen counter, wooden table, or studio pedestal.' },
      { step: '03', title: 'Generate & export', description: 'Export multiple lighting angles and marketing variations in minutes.' },
    ],
    faqs: [
      { question: 'Does this work for packaging labels?', answer: 'Yes! You can project flat label artwork onto 3D packaging with natural lighting curvature.' },
      { question: 'Will my product geometry be distorted?', answer: 'No, your actual product is preserved faithfully with shadows and reflections rendered around it.' },
      { question: 'Can I generate seasonal variants?', answer: 'Yes, effortlessly switch between holiday, summer, minimalist, and luxury environments.' },
    ],
    relatedSlugs: ['mockup-generator', 'change-background', 'ai-image-generator'],
  },
  'ai-photo-editor': {
    slug: 'ai-photo-editor',
    title: 'AI Photo Editor',
    metaTitle: 'Free AI Photo Editor Online — Retouch, Filter & Enhance | Kreathief',
    metaDescription: 'All-in-one AI photo editor for creators and brands. Retouch portraits, adjust colors, apply artistic filters, add typography, and erase blemishes.',
    badge: 'Pro Photo Studio',
    headline: 'All-in-one AI photo editor right in your browser.',
    subheadline: 'Combine generative AI tools with fine-grained layer editing: color grading, curves, lighting adjustments, and typography on an infinite canvas.',
    heroCta: 'Start Editing Free',
    editorToolParam: 'editor',
    demoType: 'eraser',
    benefits: [
      {
        title: 'Generative Retouching',
        description: 'Smooth skin blemishes, enhance eyes, retouch clothing, and remove unwanted background clutter.',
        iconName: 'Wand',
      },
      {
        title: 'Pro Color Grading',
        description: 'Fine-tune exposure, contrast, saturation, temperature, vignette, and film grain in real time.',
        iconName: 'Sliders',
      },
      {
        title: 'Layer-Based Compositing',
        description: 'Stack multiple images, graphics, vector shapes, and text layers with full blend mode support.',
        iconName: 'Layers',
      },
      {
        title: 'Zero Latency WebGL Engine',
        description: 'Butter-smooth 60fps canvas performance with hardware-accelerated filters and instant preview.',
        iconName: 'Zap',
      },
    ],
    steps: [
      { step: '01', title: 'Open your photo', description: 'Upload any JPEG, PNG, or RAW export into the editor.' },
      { step: '02', title: 'Enhance with AI tools', description: 'Apply smart retouching, lighting correction, and style filters.' },
      { step: '03', title: 'Add text & export', description: 'Add branded typography, logos, and export in 4K resolution.' },
    ],
    faqs: [
      { question: 'Is the photo editor browser-based?', answer: 'Yes, Kreathief runs 100% in your browser without requiring hefty desktop installs or plugins.' },
      { question: 'Are my edits saved automatically?', answer: 'Yes, your projects are saved locally and synced to your cloud account in real time.' },
      { question: 'Can I edit high-resolution 40MP photos?', answer: 'Yes, our WebGL canvas handles large camera files with GPU-accelerated rendering.' },
    ],
    relatedSlugs: ['image-upscaler', 'magic-eraser', 'change-background'],
  },
};
