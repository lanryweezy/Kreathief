import { Layer, Gradient, CornerRadius, AutoLayoutSettings } from '../types';
import { callBackendGeminiAPI } from './geminiService';
import { log } from '../utils/log';
import { safeParseJSON } from '../utils/errorHandling';
import { v4 as uuidv4 } from 'uuid';

export interface MultiLayerDesignNode {
  type: 'shape' | 'text' | 'container';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  color?: string;
  gradient?: Gradient;
  shapeType?: 'rect' | 'ellipse' | 'polygon' | 'star';
  cornerRadius?: CornerRadius | number;
  stroke?: {
    color: string;
    width: number;
  };
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  // Text specific
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase';
  // Auto-layout / Button specific
  autoLayout?: AutoLayoutSettings;
  groupId?: string;
  isGroup?: boolean;
}

export interface ArtboardDesignResult {
  title: string;
  description: string;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundGradient?: Gradient;
  layers: Layer[];
}

/**
 * Curated Archetype Fallback Presets for offline or instant multi-layer designs
 */
const FALLBACK_ARCHETYPES: Record<string, (width: number, height: number, prompt: string) => ArtboardDesignResult> = {
  cyberpunk: (width, height, prompt) => {
    const bgGrad: Gradient = {
      type: 'linear',
      angle: 135,
      colors: [
        { color: '#090a0f', position: 0 },
        { color: '#180829', position: 0.5 },
        { color: '#05021a', position: 1 },
      ],
    };

    const layers: Layer[] = [
      // Glow orb backdrop
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'ellipse',
        name: 'Neon Glow Orb',
        x: width * 0.5 - width * 0.35,
        y: height * 0.2,
        width: width * 0.7,
        height: width * 0.7,
        rotation: 0,
        opacity: 0.25,
        color: '#ff007f',
        locked: false,
        visible: true,
        filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 40, sepia: 0, hueRotate: 0, vignette: 0, opacity: 0.25 },
        blendMode: 'screen',
      } as any,
      // Grid Card Backdrop
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Cyber Frame',
        x: width * 0.08,
        y: height * 0.08,
        width: width * 0.84,
        height: height * 0.84,
        rotation: 0,
        opacity: 0.9,
        color: 'rgba(18, 16, 38, 0.75)',
        cornerRadius: { tl: 16, tr: 16, br: 16, bl: 16 },
        stroke: { color: '#00f0ff', width: 2 },
        shadow: { color: 'rgba(0, 240, 255, 0.4)', blur: 24, offsetX: 0, offsetY: 0 },
        locked: false,
        visible: true,
      } as any,
      // Eyebrow Tag
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Eyebrow Tag',
        text: '/// SPECIAL CYBER DROP ///',
        x: width * 0.12,
        y: height * 0.16,
        width: width * 0.76,
        height: 30,
        fontSize: Math.max(12, Math.round(width * 0.024)),
        fontWeight: '900',
        fontFamily: 'Inter',
        color: '#00f0ff',
        letterSpacing: 4,
        lineHeight: 1.2,
        textAlign: 'center',
        textTransform: 'uppercase',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        textShadow: { color: '#00f0ff', blur: 12, offsetX: 0, offsetY: 0 },
      } as any,
      // Main Headline
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Headline',
        text: prompt.toUpperCase().slice(0, 28) || 'CYBER MONDAY 2088',
        x: width * 0.1,
        y: height * 0.25,
        width: width * 0.8,
        height: 120,
        fontSize: Math.max(28, Math.round(width * 0.075)),
        fontWeight: '900',
        fontFamily: 'Outfit',
        color: '#ffffff',
        letterSpacing: 1,
        lineHeight: 1.1,
        textAlign: 'center',
        textTransform: 'uppercase',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        textShadow: { color: '#ff007f', blur: 18, offsetX: 0, offsetY: 4 },
      } as any,
      // Subtitle
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Subheadline',
        text: 'UP TO 70% OFF DIGITAL ASSETS & NEURAL RIGS',
        x: width * 0.15,
        y: height * 0.44,
        width: width * 0.7,
        height: 50,
        fontSize: Math.max(14, Math.round(width * 0.03)),
        fontWeight: '600',
        fontFamily: 'Inter',
        color: '#94a3b8',
        letterSpacing: 1,
        lineHeight: 1.3,
        textAlign: 'center',
        textTransform: 'none',
        rotation: 0,
        opacity: 0.9,
        locked: false,
        visible: true,
      } as any,
      // Floating Discount Badge Shape
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Badge Container',
        x: width * 0.35,
        y: height * 0.56,
        width: width * 0.3,
        height: 56,
        rotation: -4,
        opacity: 1,
        color: '#ff007f',
        cornerRadius: { tl: 28, tr: 28, br: 28, bl: 28 },
        shadow: { color: 'rgba(255, 0, 127, 0.6)', blur: 20, offsetX: 0, offsetY: 4 },
        locked: false,
        visible: true,
      } as any,
      // Badge Text
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Badge Text',
        text: 'LIMITED 24H',
        x: width * 0.35,
        y: height * 0.58,
        width: width * 0.3,
        height: 30,
        fontSize: Math.max(13, Math.round(width * 0.026)),
        fontWeight: '900',
        fontFamily: 'Inter',
        color: '#ffffff',
        letterSpacing: 2,
        lineHeight: 1.2,
        textAlign: 'center',
        textTransform: 'uppercase',
        rotation: -4,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // CTA Button Shape
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'CTA Button',
        x: width * 0.28,
        y: height * 0.72,
        width: width * 0.44,
        height: 60,
        rotation: 0,
        opacity: 1,
        color: '#00f0ff',
        cornerRadius: { tl: 12, tr: 12, br: 12, bl: 12 },
        shadow: { color: 'rgba(0, 240, 255, 0.5)', blur: 20, offsetX: 0, offsetY: 6 },
        locked: false,
        visible: true,
      } as any,
      // CTA Button Text
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'CTA Text',
        text: 'CLAIM ACCESS NOW →',
        x: width * 0.28,
        y: height * 0.745,
        width: width * 0.44,
        height: 30,
        fontSize: Math.max(14, Math.round(width * 0.03)),
        fontWeight: '900',
        fontFamily: 'Outfit',
        color: '#090a0f',
        letterSpacing: 1.5,
        lineHeight: 1.2,
        textAlign: 'center',
        textTransform: 'uppercase',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
    ];

    return {
      title: 'Cyberpunk Multi-Layer Banner',
      description: 'Editable multi-layer cyberpunk neon artboard with typography hierarchy and CTA.',
      width,
      height,
      backgroundColor: '#090a0f',
      backgroundGradient: bgGrad,
      layers,
    };
  },

  editorial: (width, height, prompt) => {
    const layers: Layer[] = [
      // Minimalist Frame
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Card Background',
        x: width * 0.06,
        y: height * 0.06,
        width: width * 0.88,
        height: height * 0.88,
        rotation: 0,
        opacity: 1,
        color: '#faf8f5',
        cornerRadius: { tl: 8, tr: 8, br: 8, bl: 8 },
        shadow: { color: 'rgba(0, 0, 0, 0.08)', blur: 30, offsetX: 0, offsetY: 12 },
        locked: false,
        visible: true,
      } as any,
      // Category Eyebrow
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Category Tag',
        text: 'ISSUE NO. 04 — AUTUMN / WINTER',
        x: width * 0.12,
        y: height * 0.14,
        width: width * 0.76,
        height: 24,
        fontSize: Math.max(11, Math.round(width * 0.022)),
        fontWeight: '700',
        fontFamily: 'Inter',
        color: '#8c7e72',
        letterSpacing: 3,
        lineHeight: 1.2,
        textAlign: 'left',
        textTransform: 'uppercase',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Divider Line
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Rule Divider',
        x: width * 0.12,
        y: height * 0.19,
        width: width * 0.76,
        height: 2,
        rotation: 0,
        opacity: 1,
        color: '#1a1815',
        locked: false,
        visible: true,
      } as any,
      // Big Editorial Title
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Editorial Title',
        text: prompt.slice(0, 36) || 'The Architecture of Silence',
        x: width * 0.12,
        y: height * 0.25,
        width: width * 0.76,
        height: 140,
        fontSize: Math.max(30, Math.round(width * 0.08)),
        fontWeight: '400',
        fontFamily: 'Playfair Display',
        fontStyle: 'normal',
        color: '#1a1815',
        letterSpacing: -0.5,
        lineHeight: 1.15,
        textAlign: 'left',
        textTransform: 'none',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Body Paragraph
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Body Paragraph',
        text: 'A curated exploration of monolithic forms, organic textures, and spatial stillness across contemporary Scandinavian interiors.',
        x: width * 0.12,
        y: height * 0.52,
        width: width * 0.65,
        height: 90,
        fontSize: Math.max(13, Math.round(width * 0.028)),
        fontWeight: '400',
        fontFamily: 'Inter',
        color: '#57524c',
        letterSpacing: 0,
        lineHeight: 1.6,
        textAlign: 'left',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Read More Pill
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Read Button',
        x: width * 0.12,
        y: height * 0.74,
        width: width * 0.35,
        height: 48,
        rotation: 0,
        opacity: 1,
        color: '#1a1815',
        cornerRadius: { tl: 4, tr: 4, br: 4, bl: 4 },
        locked: false,
        visible: true,
      } as any,
      // Button Text
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Button Label',
        text: 'EXPLORE STORY',
        x: width * 0.12,
        y: height * 0.76,
        width: width * 0.35,
        height: 24,
        fontSize: Math.max(12, Math.round(width * 0.024)),
        fontWeight: '600',
        fontFamily: 'Inter',
        color: '#ffffff',
        letterSpacing: 2,
        lineHeight: 1.2,
        textAlign: 'center',
        textTransform: 'uppercase',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
    ];

    return {
      title: 'Editorial Typography Layout',
      description: 'Sophisticated editorial artboard with serif typography hierarchy and minimalist layout.',
      width,
      height,
      backgroundColor: '#f2eee9',
      layers,
    };
  },

  saas: (width, height, prompt) => {
    const bgGrad: Gradient = {
      type: 'linear',
      angle: 180,
      colors: [
        { color: '#0f172a', position: 0 },
        { color: '#020617', position: 1 },
      ],
    };

    const layers: Layer[] = [
      // Top Pill
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Release Pill Background',
        x: width * 0.3,
        y: height * 0.14,
        width: width * 0.4,
        height: 36,
        rotation: 0,
        opacity: 1,
        color: 'rgba(56, 189, 248, 0.1)',
        stroke: { color: 'rgba(56, 189, 248, 0.3)', width: 1 },
        cornerRadius: { tl: 18, tr: 18, br: 18, bl: 18 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Release Pill Text',
        text: '✨ 2.0 IS LIVE • NOW ON CLOUD',
        x: width * 0.3,
        y: height * 0.155,
        width: width * 0.4,
        height: 20,
        fontSize: Math.max(11, Math.round(width * 0.022)),
        fontWeight: '700',
        fontFamily: 'Inter',
        color: '#38bdf8',
        letterSpacing: 1,
        lineHeight: 1.2,
        textAlign: 'center',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Headline
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'SaaS Headline',
        text: prompt.slice(0, 40) || 'Supercharge Your Creative Workflow With AI',
        x: width * 0.1,
        y: height * 0.25,
        width: width * 0.8,
        height: 120,
        fontSize: Math.max(26, Math.round(width * 0.065)),
        fontWeight: '800',
        fontFamily: 'Outfit',
        color: '#f8fafc',
        letterSpacing: -0.5,
        lineHeight: 1.15,
        textAlign: 'center',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Subtitle
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'SaaS Subtitle',
        text: 'Generate production-ready vector assets, clean layered artboards, and full marketing suites in seconds.',
        x: width * 0.15,
        y: height * 0.46,
        width: width * 0.7,
        height: 60,
        fontSize: Math.max(13, Math.round(width * 0.028)),
        fontWeight: '400',
        fontFamily: 'Inter',
        color: '#94a3b8',
        letterSpacing: 0,
        lineHeight: 1.5,
        textAlign: 'center',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Primary Action Button
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Primary Button',
        x: width * 0.32,
        y: height * 0.65,
        width: width * 0.36,
        height: 54,
        rotation: 0,
        opacity: 1,
        color: '#3b82f6',
        cornerRadius: { tl: 12, tr: 12, br: 12, bl: 12 },
        shadow: { color: 'rgba(59, 130, 246, 0.4)', blur: 20, offsetX: 0, offsetY: 8 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Button Text',
        text: 'Start Free Trial →',
        x: width * 0.32,
        y: height * 0.675,
        width: width * 0.36,
        height: 24,
        fontSize: Math.max(13, Math.round(width * 0.028)),
        fontWeight: '700',
        fontFamily: 'Inter',
        color: '#ffffff',
        letterSpacing: 0.5,
        lineHeight: 1.2,
        textAlign: 'center',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Footnote
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Footnote',
        text: 'No credit card required • 14-day full access',
        x: width * 0.2,
        y: height * 0.78,
        width: width * 0.6,
        height: 20,
        fontSize: Math.max(11, Math.round(width * 0.022)),
        fontWeight: '500',
        fontFamily: 'Inter',
        color: '#64748b',
        letterSpacing: 0,
        lineHeight: 1.2,
        textAlign: 'center',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
    ];

    return {
      title: 'Modern SaaS Showcase',
      description: 'High-converting SaaS product header with dark-mode gradient, badge pill, and primary CTA.',
      width,
      height,
      backgroundColor: '#0f172a',
      backgroundGradient: bgGrad,
      layers,
    };
  },
};

/**
 * Main AI Multi-Layer Design Engine
 */
export const generateMultiLayerDesign = async (
  prompt: string,
  width: number = 1080,
  height: number = 1080,
  archetypeHint?: string
): Promise<ArtboardDesignResult> => {
  const pLower = (prompt + ' ' + (archetypeHint || '')).toLowerCase();

  // Try calling AI structured output model
  try {
    const systemInstruction = `You are an elite Senior Design Director and Artboard Generator.
Given a design prompt and canvas dimensions (${width}x${height}), generate a COMPLETE, HIGHLY POLISHED, EDITABLE MULTI-LAYER artboard structure in JSON.
Do NOT generate flat single images. Generate separate coordinate-placed layers for:
1. Background decorative elements or glow cards
2. Category / Eyebrow pill or tag
3. Main headline text with bold font styling, color, and drop shadow
4. Subheadline or supporting description body text
5. Floating badge / discount chip / highlight shape & badge text
6. Call to Action (CTA) button container shape & button text

Return strictly JSON with:
{
  "title": string,
  "description": string,
  "backgroundColor": string (hex or rgba),
  "backgroundGradient": { "type": "linear" | "radial", "angle": number, "colors": [{"color": string, "position": number}] } (optional),
  "layers": [
    {
      "type": "rect" | "ellipse" | "text",
      "name": string,
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "rotation": number,
      "opacity": number,
      "color": string,
      "cornerRadius": { "tl": number, "tr": number, "br": number, "bl": number } (for rects),
      "stroke": { "color": string, "width": number } (optional),
      "shadow": { "color": string, "blur": number, "offsetX": number, "offsetY": number } (optional),
      "text": string (for text layers),
      "fontSize": number (for text layers),
      "fontWeight": "400" | "600" | "700" | "800" | "900",
      "fontFamily": "Inter" | "Outfit" | "Playfair Display" | "Roboto" | "Montserrat" | "Cinzel",
      "textAlign": "left" | "center" | "right",
      "letterSpacing": number,
      "lineHeight": number,
      "textTransform": "none" | "uppercase" | "lowercase"
    }
  ]
}`;

    const response = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      systemInstruction,
      contents: [{ role: 'user', parts: [{ text: `Generate multi-layer artboard for: "${prompt}". Dimensions: ${width}x${height}` }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    let rawText = '';
    const resAny = response as any;
    if (typeof response === 'string') {
      rawText = response;
    } else if (resAny?.candidates?.[0]?.content?.parts?.[0]?.text) {
      rawText = resAny.candidates[0].content.parts[0].text;
    } else if (resAny?.choices?.[0]?.message?.content) {
      rawText = resAny.choices[0].message.content;
    }

    const parsed = safeParseJSON<any>(rawText, null);
    if (parsed && Array.isArray(parsed.layers) && parsed.layers.length > 0) {
      const sanitizedLayers: Layer[] = parsed.layers.map((l: any, i: number) => {
        const id = `${l.type || 'layer'}_${uuidv4().slice(0, 8)}`;
        return {
          id,
          type: l.type || 'rect',
          name: l.name || `Layer ${i + 1}`,
          x: Math.max(0, Math.min(width, Number(l.x) || 0)),
          y: Math.max(0, Math.min(height, Number(l.y) || 0)),
          width: Math.max(10, Math.min(width * 2, Number(l.width) || 100)),
          height: Math.max(10, Math.min(height * 2, Number(l.height) || 50)),
          rotation: Number(l.rotation) || 0,
          opacity: typeof l.opacity === 'number' ? Math.max(0, Math.min(1, l.opacity)) : 1,
          color: l.color || '#3b82f6',
          locked: false,
          visible: true,
          cornerRadius: l.cornerRadius || (typeof l.cornerRadius === 'number' ? { tl: l.cornerRadius, tr: l.cornerRadius, br: l.cornerRadius, bl: l.cornerRadius } : undefined),
          stroke: l.stroke,
          shadow: l.shadow,
          text: l.text,
          fontSize: l.fontSize || 24,
          fontWeight: l.fontWeight || '600',
          fontFamily: l.fontFamily || 'Inter',
          textAlign: l.textAlign || 'center',
          letterSpacing: l.letterSpacing || 0,
          lineHeight: l.lineHeight || 1.2,
          textTransform: l.textTransform || 'none',
        } as Layer;
      });

      return {
        title: parsed.title || 'AI Generated Artboard',
        description: parsed.description || prompt,
        width,
        height,
        backgroundColor: parsed.backgroundColor || '#0f172a',
        backgroundGradient: parsed.backgroundGradient,
        layers: sanitizedLayers,
      };
    }
  } catch (err) {
    log.warn('[aiDesignDirector] Structured API call failed or timed out, utilizing intelligent archetype generation', err);
  }

  // Fallback to high-aesthetic archetype generators
  if (pLower.includes('cyber') || pLower.includes('neon') || pLower.includes('gaming') || pLower.includes('futuristic') || pLower.includes('sale') || pLower.includes('black friday')) {
    return FALLBACK_ARCHETYPES.cyberpunk(width, height, prompt);
  } else if (pLower.includes('saas') || pLower.includes('tech') || pLower.includes('app') || pLower.includes('cloud') || pLower.includes('startup')) {
    return FALLBACK_ARCHETYPES.saas(width, height, prompt);
  } else {
    return FALLBACK_ARCHETYPES.editorial(width, height, prompt);
  }
};
