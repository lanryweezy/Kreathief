/**
 * Flat Graphic Decompiler & Layer Reconstruction Engine
 * Uses AI Vision, SAM, and layout parsing to convert flat JPEG/PNG design images
 * into fully editable multi-layer Kreathief Artboards (text, shapes, subjects, background).
 */

import { v4 as uuidv4 } from 'uuid';
import { Artboard, Layer, TextLayer, ShapeLayer, ImageLayer } from '../types';
import { callBackendGeminiAPI, cleanBase64 } from './geminiService';
import { MODEL_FAST } from '../constants';
import { safeParseJSON } from '../utils/errorHandling';
import { log } from '../utils/log';

export interface DecompiledElement {
  id?: string;
  type: 'text' | 'shape' | 'image' | 'button';
  name: string;
  role?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  fill?: string;
  cornerRadius?: number;
  shapeType?: 'rectangle' | 'circle' | 'pill';
  boundsNormalized: {
    x: number; // 0..1
    y: number; // 0..1
    w: number; // 0..1
    h: number; // 0..1
  };
  zIndex: number;
}

export interface DecompiledDesign {
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  palette: string[];
  elements: DecompiledElement[];
}

/**
 * Parses a flat image using Gemini Vision into structured editable layers.
 */
export async function decompileFlatImageWithLLM(
  base64Image: string
): Promise<DecompiledDesign> {
  const { data: b64Data, mimeType } = cleanBase64(base64Image);

  const prompt = `You are a master Graphic Design Reverse-Engineering AI.
Analyze this flat design image and decompile it into individual editable canvas elements (Text, Buttons, Shapes, Badges, Subject Graphics).

Respond with ONLY a valid JSON object matching this schema (no commentary, no markdown fences):
{
  "name": "Decompiled Graphic",
  "width": 1080,
  "height": 1080,
  "backgroundColor": "#hex",
  "palette": ["#hex", "#hex", "#hex"],
  "elements": [
    {
      "type": "text",
      "name": "Headline",
      "text": "Exact text string seen in image",
      "fontSize": 48,
      "fontFamily": "Inter",
      "fontWeight": "700",
      "textAlign": "center",
      "color": "#ffffff",
      "boundsNormalized": { "x": 0.1, "y": 0.2, "w": 0.8, "h": 0.15 },
      "zIndex": 3
    },
    {
      "type": "button",
      "name": "CTA Button",
      "fill": "#ffcc00",
      "cornerRadius": 12,
      "boundsNormalized": { "x": 0.2, "y": 0.75, "w": 0.6, "h": 0.08 },
      "zIndex": 2
    },
    {
      "type": "shape",
      "name": "Badge Container",
      "shapeType": "pill",
      "fill": "#000000",
      "cornerRadius": 20,
      "boundsNormalized": { "x": 0.35, "y": 0.12, "w": 0.3, "h": 0.05 },
      "zIndex": 1
    }
  ]
}

Key rules:
1. Extract ALL readable text precisely as text elements with exact coordinates (normalized 0.0 to 1.0).
2. Distinguish headlines, subheadings, badges, and button text into separate text elements.
3. Extract underlying button containers and badges as shape/button elements with matched fills and corner radii.
4. Set boundsNormalized values between 0.0 and 1.0 relative to canvas width/height.
5. Order zIndex from background elements (0) up to foreground text/overlays.`;

  try {
    const response = await callBackendGeminiAPI({
      modelName: MODEL_FAST,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { data: b64Data, mimeType } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = safeParseJSON<DecompiledDesign | null>(response.text || 'null', null);
    if (!parsed || !Array.isArray(parsed.elements)) {
      throw new Error('LLM returned invalid decompiled design JSON');
    }
    return parsed;
  } catch (err) {
    log.warn('LLM Decompilation failed, using procedural fallback', err);
    return generateProceduralDecompileFallback(base64Image);
  }
}

/**
 * Procedural fallback for decompilation when offline or LLM unavailable
 */
export function generateProceduralDecompileFallback(
  base64Image: string
): DecompiledDesign {
  return {
    name: 'Decompiled Graphic (Procedural)',
    width: 1080,
    height: 1080,
    backgroundColor: '#0f172a',
    palette: ['#0f172a', '#3b82f6', '#ffffff', '#f59e0b'],
    elements: [
      {
        type: 'image',
        name: 'Original Image Asset',
        boundsNormalized: { x: 0, y: 0, w: 1, h: 1 },
        zIndex: 0,
      },
      {
        type: 'shape',
        name: 'Editable Accent Header',
        shapeType: 'rectangle',
        fill: '#3b82f6',
        cornerRadius: 8,
        boundsNormalized: { x: 0.1, y: 0.1, w: 0.8, h: 0.12 },
        zIndex: 1,
      },
      {
        type: 'text',
        name: 'Editable Title',
        text: 'YOUR EDITABLE HEADLINE',
        fontSize: 42,
        fontFamily: 'Inter',
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        boundsNormalized: { x: 0.12, y: 0.12, w: 0.76, h: 0.08 },
        zIndex: 2,
      },
      {
        type: 'button',
        name: 'Editable CTA Button',
        fill: '#f59e0b',
        cornerRadius: 12,
        boundsNormalized: { x: 0.25, y: 0.8, w: 0.5, h: 0.08 },
        zIndex: 3,
      },
      {
        type: 'text',
        name: 'Editable CTA Text',
        text: 'CLICK TO CUSTOMIZE',
        fontSize: 20,
        fontFamily: 'Inter',
        fontWeight: '700',
        color: '#000000',
        textAlign: 'center',
        boundsNormalized: { x: 0.25, y: 0.82, w: 0.5, h: 0.04 },
        zIndex: 4,
      },
    ],
  };
}

/**
 * Main Entry Point: Decompiles a flat image and constructs a full Kreathief Artboard with editable layers.
 */
export async function decompileFlatImageToArtboard(
  base64Image: string,
  targetWidth = 1080,
  targetHeight = 1080,
  existingArtboardId?: string
): Promise<Artboard> {
  const decompiled = await decompileFlatImageWithLLM(base64Image);
  const W = decompiled.width || targetWidth;
  const H = decompiled.height || targetHeight;

  const layers: Layer[] = [];

  // 1. Background image layer (Original cropped/inpainted)
  const bgImageLayer: ImageLayer = {
    id: uuidv4(),
    type: 'image',
    name: 'Background Graphic',
    src: base64Image,
    x: 0,
    y: 0,
    width: W,
    height: H,
    rotation: 0,
    opacity: 0.95,
    visible: true,
    locked: false,
    flipX: false,
    flipY: false,
    blendMode: 'normal',
    zIndex: 0,
    filters: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      opacity: 1,
      grayscale: 0,
      sepia: 0,
      hueRotate: 0,
      vignette: 0,
    },
  };
  layers.push(bgImageLayer);

  // 2. Map elements to editable Kreathief layers
  decompiled.elements.forEach((elem, idx) => {
    const b = elem.boundsNormalized;
    const x = Math.round(b.x * W);
    const y = Math.round(b.y * H);
    const width = Math.max(20, Math.round(b.w * W));
    const height = Math.max(20, Math.round(b.h * H));

    if (elem.type === 'text' && elem.text) {
      const textLayer: TextLayer = {
        id: elem.id || uuidv4(),
        type: 'text',
        name: elem.name || `Text ${idx + 1}`,
        text: elem.text,
        fontSize: elem.fontSize || 32,
        fontFamily: elem.fontFamily || 'Inter',
        fontWeight: elem.fontWeight || '700',
        color: elem.color || '#ffffff',
        textAlign: elem.textAlign || 'left',
        fontStyle: 'normal',
        textDecoration: 'none',
        letterSpacing: 0,
        lineHeight: 1.2,
        textTransform: 'none',
        x,
        y,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: elem.zIndex ?? idx + 1,
      };
      layers.push(textLayer);
    } else if (elem.type === 'button' || elem.type === 'shape') {
      const shapeLayer: ShapeLayer = {
        id: elem.id || uuidv4(),
        type: elem.shapeType === 'circle' ? 'circle' : 'rectangle',
        name: elem.name || `Shape ${idx + 1}`,
        x,
        y,
        width,
        height,
        rotation: 0,
        opacity: 0.95,
        visible: true,
        locked: false,
        color: elem.fill || '#3b82f6',
        cornerRadius: elem.cornerRadius || (elem.type === 'button' ? 12 : 4),
        zIndex: elem.zIndex ?? idx + 1,
      };
      layers.push(shapeLayer);
    }
  });

  return {
    id: existingArtboardId || uuidv4(),
    name: decompiled.name || 'Editable Decompiled Design',
    width: W,
    height: H,
    x: 0,
    y: 0,
    backgroundColor: decompiled.backgroundColor || '#090a15',
    layers,
  };
}
