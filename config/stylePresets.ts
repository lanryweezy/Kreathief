/**
 * Curated Style Reference Presets
 * Instant visual styles users can apply with one click without uploading an image.
 */
import { ExtractedReferenceStyle, ReferenceAspect, StyleReference } from '../types';

export interface StylePresetItem {
  id: string;
  name: string;
  category: 'Cinematic' | 'Design' | 'Artistic' | 'Digital' | '2026 Trends';
  thumbnailGradient: string;
  palette: string[];
  aspects: ReferenceAspect[];
  extracted: ExtractedReferenceStyle;
}

export const CURATED_STYLE_PRESETS: StylePresetItem[] = [
  {
    id: 'cyberpunk-hologram',
    name: 'Cyberpunk Neon',
    category: 'Digital',
    thumbnailGradient: 'from-cyan-500 via-purple-600 to-pink-500',
    palette: ['#06b6d4', '#8b5cf6', '#ec4899', '#0f172a', '#3b82f6'],
    aspects: ['style', 'palette', 'lighting', 'mood'],
    extracted: {
      summary: 'futuristic cyberpunk aesthetic with neon rim lights, dark reflective surfaces, and glowing holographic elements',
      palette: ['#06b6d4', '#8b5cf6', '#ec4899', '#0f172a', '#3b82f6'],
      textures: 'glass, polished chrome, wet asphalt, glowing plasma',
      composition: 'dynamic angled framing with high depth and vibrant luminous accents',
      typography: 'sleek monospace and bold geometric sans-serif',
      mood: 'futuristic, electric, cinematic, high-energy',
      lighting: 'vibrant multi-color neon rim lighting with deep cinematic shadows and ray-traced reflections',
      illustrationStyle: '3D hyperrealistic digital render',
      cameraAngle: 'low-angle wide shot with shallow depth of field',
    },
  },
  {
    id: 'bauhaus-editorial',
    name: 'Bauhaus Editorial',
    category: 'Design',
    thumbnailGradient: 'from-amber-600 via-red-600 to-slate-900',
    palette: ['#dc2626', '#d97706', '#1e293b', '#f8fafc', '#2563eb'],
    aspects: ['style', 'palette', 'composition', 'illustrationStyle'],
    extracted: {
      summary: 'clean Bauhaus modernist graphic design with bold primary color blocks, clean geometric grids, and purposeful asymmetry',
      palette: ['#dc2626', '#d97706', '#1e293b', '#f8fafc', '#2563eb'],
      textures: 'matte uncoated paper, clean flat print finish',
      composition: 'strict mathematical grid layout with stark contrasting negative space',
      typography: 'grotesque bold Swiss modernist typography',
      mood: 'sophisticated, minimalist, timeless, artistic',
      lighting: 'flat studio lighting with minimal soft shadows',
      illustrationStyle: 'vector graphic constructivism',
      cameraAngle: 'straight-on flat lay orthographic view',
    },
  },
  {
    id: 'glassmorphism-3d',
    name: 'Glassmorphism 3D',
    category: 'Digital',
    thumbnailGradient: 'from-indigo-400 via-sky-300 to-emerald-300',
    palette: ['#818cf8', '#38bdf8', '#34d399', '#ffffff', '#1e1b4b'],
    aspects: ['style', 'palette', 'lighting'],
    extracted: {
      summary: 'frosted glassmorphism 3D render with soft chromatic diffusion, smooth rounded edges, and pastel iridescence',
      palette: ['#818cf8', '#38bdf8', '#34d399', '#ffffff', '#1e1b4b'],
      textures: 'translucent frosted glass, subtle iridescent sheen, smooth silicone',
      composition: 'floating central isometric composition with layered depth',
      typography: 'modern rounded geometric sans',
      mood: 'clean, premium, serene, futuristic',
      lighting: 'soft diffused ambient studio lighting with delicate caustic refractions',
      illustrationStyle: '3D Octane / Blender glass render',
      cameraAngle: 'isometric perspective 45 degree angle',
    },
  },
  {
    id: 'vintage-risograph',
    name: 'Vintage Risograph',
    category: 'Artistic',
    thumbnailGradient: 'from-rose-500 via-orange-400 to-teal-600',
    palette: ['#f43f5e', '#fb923c', '#0d9488', '#fef3c7', '#475569'],
    aspects: ['style', 'palette', 'illustrationStyle'],
    extracted: {
      summary: 'retro risograph print style with tactile halftone dot grain, organic ink overlay misalignment, and vibrant spot colors',
      palette: ['#f43f5e', '#fb923c', '#0d9488', '#fef3c7', '#475569'],
      textures: 'textured recycled paper, distinct risograph halftone dot grain, slight ink bleed',
      composition: 'artistic poster composition with layered screen-printed shapes',
      typography: 'retro display serif and typewriter text',
      mood: 'nostalgic, handcrafted, warm, indie',
      lighting: 'warm natural daylight on matte print',
      illustrationStyle: 'hand-pulled screen print / risograph illustration',
      cameraAngle: 'direct frontal top-down view',
    },
  },
  {
    id: 'nordic-studio',
    name: 'Nordic Minimalist',
    category: 'Cinematic',
    thumbnailGradient: 'from-stone-300 via-stone-400 to-stone-800',
    palette: ['#f5f5f4', '#d6d3d1', '#78716c', '#292524', '#b45309'],
    aspects: ['style', 'palette', 'lighting', 'mood'],
    extracted: {
      summary: 'minimalist Scandinavian studio photography with warm organic materials, neutral earth tones, and soft natural sunlight',
      palette: ['#f5f5f4', '#d6d3d1', '#78716c', '#292524', '#b45309'],
      textures: 'raw natural linen, light oak wood, smooth ceramic, limewash plaster',
      composition: 'spacious airy composition with balanced negative space',
      typography: 'refined light-weight sans-serif',
      mood: 'calm, organic, sophisticated, peaceful',
      lighting: 'gentle morning window light casting soft architectural shadows',
      illustrationStyle: 'high-end interior & architectural editorial photography',
      cameraAngle: 'eye-level architectural perspective',
    },
  },
  {
    id: 'anime-ghibli',
    name: 'Anime Watercolor',
    category: 'Artistic',
    thumbnailGradient: 'from-emerald-400 via-sky-400 to-amber-300',
    palette: ['#10b981', '#38bdf8', '#fbbf24', '#f0fdf4', '#1e3a8a'],
    aspects: ['style', 'palette', 'mood', 'illustrationStyle'],
    extracted: {
      summary: 'nostalgic hand-painted anime landscape inspired by Studio Ghibli, featuring lush greenery, puffy cumulus clouds, and watercolor washes',
      palette: ['#10b981', '#38bdf8', '#fbbf24', '#f0fdf4', '#1e3a8a'],
      textures: 'gouache and watercolor paint on rough watercolor paper',
      composition: 'wide panoramic landscape with rich foreground detailing and vast sky',
      typography: 'handcrafted brush calligraphy',
      mood: 'wondrous, nostalgic, serene, heartwarming',
      lighting: 'warm golden-hour sunbeams breaking through soft clouds',
      illustrationStyle: 'traditional Japanese anime background painting',
      cameraAngle: 'wide establishing landscape shot',
    },
  },
  // ─── 2026 Trends (VistaPrint/99designs Expert Survey) ─────────────────────
  {
    id: 'elemental-folk-2026',
    name: 'Elemental Folk',
    category: '2026 Trends',
    thumbnailGradient: 'from-amber-700 via-emerald-800 to-rose-900',
    palette: ['#C5A258', '#2D6A4F', '#8B0000', '#F2E8D5', '#5C4033'],
    aspects: ['style', 'palette', 'composition', 'illustrationStyle'],
    extracted: {
      summary: 'folk art motifs with ornamental borders, hand-drawn flora and fauna, rich jewel tones balanced with earthy neutrals, rooted in regional craft traditions',
      palette: ['#C5A258', '#2D6A4F', '#8B0000', '#F2E8D5', '#5C4033'],
      textures: 'hand-drawn botanical illustrations, ornamental borders, artisanal paper, woven textile references',
      composition: 'symmetrical arrangements with ornamental frames creating visual rhythm, folk-inspired balanced layouts',
      typography: 'rustic artisanal serifs with handcrafted flair, decorative display with ornamental flourishes',
      mood: 'warm, authentic, culturally rooted, heritage, artisanal',
      lighting: 'warm natural daylight on textured paper, soft ambient glow',
      illustrationStyle: 'folk art illustration with botanical motifs, hand-drawn flora and fauna',
      cameraAngle: 'direct frontal view with decorative border framing',
    },
  },
  {
    id: 'hyper-individualism-2026',
    name: 'Hyper-Individualism',
    category: '2026 Trends',
    thumbnailGradient: 'from-purple-600 via-pink-500 to-amber-400',
    palette: ['#B8A9C9', '#E8A598', '#A3B18A', '#F5F0E8', '#FF1744'],
    aspects: ['style', 'palette', 'composition', 'mood'],
    extracted: {
      summary: 'surreal abstract juxtapositions with twisted geometry, optical illusions, soft psychedelic palettes, and bold custom typography that doubles as artwork — a rebellion against AI-generated sameness',
      palette: ['#B8A9C9', '#E8A598', '#A3B18A', '#F5F0E8', '#FF1744'],
      textures: 'mixed smooth digital forms with raw organic surfaces, layered 2D and 3D elements',
      composition: 'surreal juxtapositions with twisted geometry, optical illusions, unexpected depth through 2D/3D fusion',
      typography: 'big bold custom type that functions as both text and artwork, distorted experimental letterforms',
      mood: 'trippy, dreamlike, bold, individualistic, anti-corporate',
      lighting: 'soft psychedelic glow, muted neon washes, atmospheric haze',
      illustrationStyle: 'surreal digital art with mixed media collage and abstract geometry',
      cameraAngle: 'dynamic perspective with warped spatial relationships',
    },
  },
  {
    id: 'tactile-craft-2026',
    name: 'Tactile Craft',
    category: '2026 Trends',
    thumbnailGradient: 'from-rose-400 via-amber-300 to-teal-500',
    palette: ['#F43F5E', '#D4A373', '#0D9488', '#FEF3C7', '#475569'],
    aspects: ['style', 'palette', 'textures', 'illustrationStyle'],
    extracted: {
      summary: 'digitally created embroidery, stitching, felt and fabric textures, paper cutouts, patchwork compositions with visible seams and crafted imperfections — handmade warmth as counterpoint to AI slickness',
      palette: ['#F43F5E', '#D4A373', '#0D9488', '#FEF3C7', '#475569'],
      textures: 'digitally-created embroidery, felt, wool, cotton fabric, paper cutouts, stitched borders, glued-edge effects',
      composition: 'patchwork compositions combining contrasting textures, collage-style layering with visible craft marks',
      typography: 'mixed hand-stitched lettering, sewn-looking text, hand-drawn imperfect letterforms',
      mood: 'handmade, warm, approachable, authentic, wabi-sabi',
      lighting: 'warm natural daylight on textured materials, soft shadows on tactile surfaces',
      illustrationStyle: 'mixed-media collage with embroidery textures, paper cutouts, and fabric effects',
      cameraAngle: 'close-up detail shots showing texture and craft, overhead flat-lay',
    },
  },
  {
    id: 'neon-noir-2026',
    name: 'Neon-Noir',
    category: '2026 Trends',
    thumbnailGradient: 'from-red-700 via-black to-cyan-400',
    palette: ['#0A0A0A', '#E63946', '#00F0FF', '#FFFFFF', '#FFD700'],
    aspects: ['style', 'palette', 'lighting', 'mood'],
    extracted: {
      summary: 'bold red-and-black palettes with neon accents, gritty high-contrast photography, blurred motion effects, oversized bold typography — inspired by Japanese street culture and noir cinema',
      palette: ['#0A0A0A', '#E63946', '#00F0FF', '#FFFFFF', '#FFD700'],
      textures: 'gritty urban surfaces, wet asphalt reflections, film grain, motion blur streaks',
      composition: 'high-contrast cinematic compositions with dramatic focal points, underground print culture layouts',
      typography: 'oversized bold condensed type cutting through busy compositions, stark and commanding',
      mood: 'urgent, cinematic, rebellious, darkly romantic, alive',
      lighting: 'dramatic chiaroscuro, neon rim lighting, deep cinematic shadows, single-color accent illumination',
      illustrationStyle: 'cinematic photography with motion blur, gritty textures, and graphic elements',
      cameraAngle: 'low-angle dramatic perspective, Dutch tilt, cinematic framing',
    },
  },
  {
    id: 'frutiger-aero-2026',
    name: 'Frutiger Aero Revival',
    category: '2026 Trends',
    thumbnailGradient: 'from-sky-400 via-emerald-300 to-amber-200',
    palette: ['#4FC3F7', '#66BB6A', '#FFD54F', '#FFFFFF', '#1565C0'],
    aspects: ['style', 'palette', 'lighting', 'mood'],
    extracted: {
      summary: 'early-2000s techno-optimism revival with bright utopian gradients, bubbly rounded typography, organic nature-meets-tech imagery, and glossy skeuomorphic details — catalyzed by Apple iOS 26',
      palette: ['#4FC3F7', '#66BB6A', '#FFD54F', '#FFFFFF', '#1565C0'],
      textures: 'glossy surfaces, translucent glass, water droplets, fresh leaves, smooth silicone, iridescent sheen',
      composition: 'optimistic compositions communicating harmony between nature and technology, floating elements with depth',
      typography: 'bubbly rounded sans-serif with soft edges, friendly and approachable, Web 2.0 nostalgia',
      mood: 'optimistic, utopian, fresh, hopeful, nature-tech harmony',
      lighting: 'bright diffused daylight, soft lens flares, luminous gradients, golden hour warmth',
      illustrationStyle: '3D glossy renders with organic nature elements, floating objects, translucent layers',
      cameraAngle: 'wide establishing shots with nature-tech fusion, isometric product views',
    },
  },
  {
    id: 'candid-camera-roll-2026',
    name: 'Candid Camera Roll',
    category: '2026 Trends',
    thumbnailGradient: 'from-amber-200 via-rose-200 to-stone-400',
    palette: ['#D4A373', '#E8A598', '#A3B18A', '#F5F0E8', '#475569'],
    aspects: ['style', 'palette', 'mood', 'lighting'],
    extracted: {
      summary: 'grainy film photography with light leaks, faded colors, harsh flash, cropped frames, and hand-drawn captions — closer to memory than marketing, unapologetically authentic',
      palette: ['#D4A373', '#E8A598', '#A3B18A', '#F5F0E8', '#475569'],
      textures: 'film grain, light leaks, faded color shifts, Polaroid borders, flash photography harshness',
      composition: 'cropped frames cutting off subjects unexpectedly, casual unstaged compositions, accidental-feeling framing',
      typography: 'hand-drawn scrawled captions, doodles, underlined words, marker annotations',
      mood: 'nostalgic, authentic, raw, personal, Gen Z allergic-to-perfection',
      lighting: 'harsh direct flash, warm film grain, golden hour haze, light leak artifacts',
      illustrationStyle: 'documentary photography with film-stock processing, candid snapshots',
      cameraAngle: 'eye-level casual snapshots, off-center framing, accidental compositions',
    },
  },
  {
    id: 'hyper-bloom-2026',
    name: 'Hyper-Bloom',
    category: '2026 Trends',
    thumbnailGradient: 'from-pink-300 via-sky-300 to-green-200',
    palette: ['#F4C2C2', '#87CEEB', '#7CB342', '#FFD54F', '#C4B7D4'],
    aspects: ['style', 'palette', 'mood', 'lighting'],
    extracted: {
      summary: 'digitally amplified botanical landscapes and surreal florals with hazy Gen Z blur, romantic pastel palettes, and painterly gradients — escapist, cinematic, tender',
      palette: ['#F4C2C2', '#87CEEB', '#7CB342', '#FFD54F', '#C4B7D4'],
      textures: 'soft petal layers, hazy atmospheric fog, painterly watercolor washes, botanical detail',
      composition: 'immersive cinematic compositions with surreal depth, amplified scale botanical elements',
      typography: 'elegant flowing type, often secondary to immersive botanical imagery',
      mood: 'romantic, dreamy, escapist, tender, emotionally rich',
      lighting: 'soft golden hour haze, diffused botanical light, dreamy atmospheric glow',
      illustrationStyle: 'digitally amplified botanical photography, surreal floral landscapes, painterly digital art',
      cameraAngle: 'macro botanical close-ups, wide dreamy landscapes, soft-focus depth',
    },
  },
  {
    id: 'digi-cute-2026',
    name: 'Digi-Cute',
    category: '2026 Trends',
    thumbnailGradient: 'from-pink-400 via-violet-400 to-cyan-300',
    palette: ['#FF7F6B', '#5BA4A4', '#F5C542', '#B8A9C9', '#F5F0E8'],
    aspects: ['style', 'palette', 'mood', 'illustrationStyle'],
    extracted: {
      summary: 'kawaii-inspired characters with pixel art accents, toy-like shapes, Y2K aesthetics updated with clean layouts and bright gradients — nostalgic yet polished, playful and approachable',
      palette: ['#FF7F6B', '#5BA4A4', '#F5C542', '#B8A9C9', '#F5F0E8'],
      textures: 'smooth glossy surfaces, pixel grids, sticker-like elements, toy plastic finishes',
      composition: 'clean structured layouts with fun character details, balanced neutral bases with saturated accent pops',
      typography: 'clean modern sans-serif contrasting playful visuals, pixel-style fonts for tech elements',
      mood: 'playful, nostalgic, fun, approachable, character-driven',
      lighting: 'bright even lighting, colorful gradient backgrounds, cheerful illumination',
      illustrationStyle: 'kawaii character design, pixel art, emoji expressions, Y2K digital aesthetics',
      cameraAngle: 'flat frontal character views, isometric product displays',
    },
  },
  {
    id: 'micro-industrial-2026',
    name: 'Micro-Industrial',
    category: '2026 Trends',
    thumbnailGradient: 'from-gray-700 via-gray-500 to-red-600',
    palette: ['#1A1A1A', '#9E9E9E', '#FF0000', '#FFFFFF', '#4A6274'],
    aspects: ['style', 'palette', 'composition', 'typography'],
    extracted: {
      summary: 'utilitarian layouts inspired by technical documentation, shipping labels, and industrial packaging — barcodes, QR codes, regulatory marks, and tiny text used as deliberate stylistic design elements',
      palette: ['#1A1A1A', '#9E9E9E', '#FF0000', '#FFFFFF', '#4A6274'],
      textures: 'industrial label surfaces, technical documentation grids, barcode patterns, regulatory stamp marks',
      composition: 'dense information-driven layouts mimicking technical documentation, structured hierarchies with deliberate precision',
      typography: 'stark mechanical monospaced type, tiny text blocks scattered intentionally, utilitarian sans-serif',
      mood: 'precise, technical, authoritative, functional, deliberately stark',
      lighting: 'flat even industrial lighting, high-contrast black and white with single accent',
      illustrationStyle: 'technical diagrams, barcode patterns, regulatory marks, utilitarian graphic elements',
      cameraAngle: 'straight-on technical documentation perspective, label-style flat views',
    },
  },
  {
    id: 'distorted-cut-2026',
    name: 'Distorted Cut',
    category: '2026 Trends',
    thumbnailGradient: 'from-red-600 via-black to-yellow-400',
    palette: ['#FF0000', '#000000', '#FFD700', '#FFFFFF', '#FF6B00'],
    aspects: ['style', 'palette', 'composition', 'mood'],
    extracted: {
      summary: 'bold edgy collage with sharp angular cuts, fragmented photography, raw layering of text and shapes, distorted proportions — punk zine energy meets contemporary design',
      palette: ['#FF0000', '#000000', '#FFD700', '#FFFFFF', '#FF6B00'],
      textures: 'torn paper edges, photocopier grain, ripped surfaces, clashing material layers',
      composition: 'angular cutouts with raw layering, fragmented imagery reassembled with sharp cuts, deliberate visual chaos',
      typography: 'raw distorted mixed sizes and weights, torn and reassembled letterforms, punk-inspired placement',
      mood: 'rebellious, energetic, raw, confrontational, underground',
      lighting: 'high-contrast black and white with selective color, photocopier degradation effects',
      illustrationStyle: 'punk zine collage, fragmented photography, torn paper layering, raw mixed media',
      cameraAngle: 'aggressive cropping, fragmented perspectives, deconstructed framing',
    },
  },
];

/**
 * Converts a StylePresetItem into a ready-to-use StyleReference object.
 */
export function presetToStyleReference(preset: StylePresetItem): StyleReference {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${preset.palette[0] || '#8b5cf6'}"/>
        <stop offset="50%" stop-color="${preset.palette[1] || '#ec4899'}"/>
        <stop offset="100%" stop-color="${preset.palette[2] || '#06b6d4'}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#g)"/>
    <circle cx="200" cy="200" r="120" fill="${preset.palette[3] || '#ffffff'}" opacity="0.2"/>
    <text x="200" y="210" font-family="sans-serif" font-weight="bold" font-size="24" fill="#ffffff" text-anchor="middle">${preset.name}</text>
  </svg>`;

  const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return {
    id: `preset-${preset.id}`,
    name: preset.name,
    image: svgDataUrl,
    aspects: [...preset.aspects],
    extracted: { ...preset.extracted },
    analysisStatus: 'ready',
    strength: 'balanced',
  };
}
