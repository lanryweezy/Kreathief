import { Layer, Gradient, CornerRadius, AutoLayoutSettings } from '../types';
import { callBackendGeminiAPI } from './geminiService';
import { log } from '../utils/log';
import { safeParseJSON } from '../utils/errorHandling';
import { v4 as uuidv4 } from 'uuid';
import { polishDesignOutput } from '../utils/designPolish';
import { buildCompositionForArchetype } from './designCompositionEngine';
import { classifyDesignMovement, buildCompositionByStyleId, GraphicDesignStyleId } from './graphicDesignStyles';
import { classifyStyleFromPrompt, getStyleById, DesignStyleEntry } from './designStyleDatabase';


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
export const FALLBACK_ARCHETYPES: Record<string, (width: number, height: number, prompt: string) => ArtboardDesignResult> = {
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
        filters: {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          grayscale: 0,
          blur: 40,
          sepia: 0,
          hueRotate: 0,
          vignette: 0,
          opacity: 0.25,
        },
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

  luxury: (width, height, prompt) => {
    const bgGrad: Gradient = {
      type: 'linear',
      angle: 160,
      colors: [
        { color: '#0a0703', position: 0 },
        { color: '#1a1209', position: 0.5 },
        { color: '#0e0c06', position: 1 },
      ],
    };

    const layers: Layer[] = [
      // Gold shimmer top accent
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Gold Top Rule',
        x: width * 0.28,
        y: height * 0.08,
        width: width * 0.44,
        height: 2,
        rotation: 0,
        opacity: 0.8,
        color: '#c9a84c',
        locked: false,
        visible: true,
      } as any,
      // Soft gold glow orb
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'ellipse',
        name: 'Gold Glow Orb',
        x: width * 0.25,
        y: height * 0.15,
        width: width * 0.5,
        height: width * 0.5,
        rotation: 0,
        opacity: 0.08,
        color: '#d4a017',
        locked: false,
        visible: true,
        blendMode: 'screen',
      } as any,
      // Brand name eyebrow
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Brand Name',
        text: 'MAISON DORÉE',
        x: width * 0.1,
        y: height * 0.14,
        width: width * 0.8,
        height: 28,
        fontSize: Math.max(11, Math.round(width * 0.022)),
        fontWeight: '300',
        fontFamily: 'Cinzel',
        color: '#c9a84c',
        letterSpacing: 8,
        lineHeight: 1.2,
        textAlign: 'center',
        textTransform: 'uppercase',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Thin divider
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Centre Rule',
        x: width * 0.4,
        y: height * 0.2,
        width: width * 0.2,
        height: 1,
        rotation: 0,
        opacity: 0.4,
        color: '#c9a84c',
        locked: false,
        visible: true,
      } as any,
      // Main editorial headline
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Editorial Headline',
        text: prompt.slice(0, 32) || 'The Art of Luxury Skincare',
        x: width * 0.08,
        y: height * 0.26,
        width: width * 0.84,
        height: 160,
        fontSize: Math.max(34, Math.round(width * 0.085)),
        fontWeight: '400',
        fontFamily: 'Playfair Display',
        color: '#f5ead8',
        letterSpacing: -0.5,
        lineHeight: 1.15,
        textAlign: 'center',
        textTransform: 'none',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        textShadow: { color: 'rgba(212, 160, 23, 0.2)', blur: 30, offsetX: 0, offsetY: 8 },
      } as any,
      // Italic descriptor
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Descriptor',
        text: 'An exquisite ritual crafted from rare botanical extracts and 24-karat gold infusion.',
        x: width * 0.15,
        y: height * 0.52,
        width: width * 0.7,
        height: 72,
        fontSize: Math.max(13, Math.round(width * 0.026)),
        fontWeight: '300',
        fontFamily: 'Playfair Display',
        color: '#a89060',
        letterSpacing: 0.5,
        lineHeight: 1.65,
        textAlign: 'center',
        textTransform: 'none',
        rotation: 0,
        opacity: 0.85,
        locked: false,
        visible: true,
      } as any,
      // Price badge
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Price Badge',
        x: width * 0.38,
        y: height * 0.68,
        width: width * 0.24,
        height: 48,
        rotation: 0,
        opacity: 1,
        color: '#c9a84c',
        cornerRadius: { tl: 0, tr: 0, br: 0, bl: 0 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Price Text',
        text: 'FROM $240',
        x: width * 0.38,
        y: height * 0.695,
        width: width * 0.24,
        height: 24,
        fontSize: Math.max(12, Math.round(width * 0.024)),
        fontWeight: '700',
        fontFamily: 'Cinzel',
        color: '#0a0703',
        letterSpacing: 2,
        lineHeight: 1.2,
        textAlign: 'center',
        textTransform: 'uppercase',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Gold bottom rule
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Gold Bottom Rule',
        x: width * 0.28,
        y: height * 0.88,
        width: width * 0.44,
        height: 2,
        rotation: 0,
        opacity: 0.8,
        color: '#c9a84c',
        locked: false,
        visible: true,
      } as any,
    ];

    return {
      title: 'Luxury Brand Editorial',
      description:
        'Sophisticated luxury product artboard with gold accents, Cinzel/Playfair typography, and editorial layout.',
      width,
      height,
      backgroundColor: '#0a0703',
      backgroundGradient: bgGrad,
      layers,
    };
  },

  food: (width, height, prompt) => {
    const bgGrad: Gradient = {
      type: 'linear',
      angle: 145,
      colors: [
        { color: '#1a0a00', position: 0 },
        { color: '#2d1200', position: 0.5 },
        { color: '#1a0a00', position: 1 },
      ],
    };

    const layers: Layer[] = [
      // Warm radial glow
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'ellipse',
        name: 'Warm Glow',
        x: width * 0.1,
        y: height * 0.1,
        width: width * 0.8,
        height: width * 0.8,
        rotation: 0,
        opacity: 0.18,
        color: '#ff6b00',
        locked: false,
        visible: true,
        blendMode: 'screen',
      } as any,
      // Category tag
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Tag Background',
        x: width * 0.34,
        y: height * 0.1,
        width: width * 0.32,
        height: 36,
        rotation: 0,
        opacity: 1,
        color: '#e85d04',
        cornerRadius: { tl: 4, tr: 4, br: 4, bl: 4 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Category Tag',
        text: "CHEF'S SPECIAL",
        x: width * 0.34,
        y: height * 0.118,
        width: width * 0.32,
        height: 20,
        fontSize: Math.max(11, Math.round(width * 0.022)),
        fontWeight: '800',
        fontFamily: 'Outfit',
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
      // Dish name headline
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Dish Headline',
        text: prompt.slice(0, 30) || 'Smoked Wagyu Brisket',
        x: width * 0.08,
        y: height * 0.22,
        width: width * 0.84,
        height: 150,
        fontSize: Math.max(38, Math.round(width * 0.095)),
        fontWeight: '800',
        fontFamily: 'Outfit',
        color: '#fff8f0',
        letterSpacing: -1,
        lineHeight: 1.1,
        textAlign: 'center',
        textTransform: 'none',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        textShadow: { color: 'rgba(232, 93, 4, 0.5)', blur: 30, offsetX: 0, offsetY: 8 },
      } as any,
      // Description
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Dish Description',
        text: '18-hour slow smoked · House dry-rub · Bourbon glaze · Pickled slaw',
        x: width * 0.12,
        y: height * 0.48,
        width: width * 0.76,
        height: 50,
        fontSize: Math.max(14, Math.round(width * 0.028)),
        fontWeight: '400',
        fontFamily: 'Inter',
        color: '#d4956a',
        letterSpacing: 0,
        lineHeight: 1.5,
        textAlign: 'center',
        textTransform: 'none',
        rotation: 0,
        opacity: 0.9,
        locked: false,
        visible: true,
      } as any,
      // Price circle badge
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'ellipse',
        name: 'Price Circle',
        x: width * 0.74,
        y: height * 0.6,
        width: width * 0.2,
        height: width * 0.2,
        rotation: -8,
        opacity: 1,
        color: '#e85d04',
        shadow: { color: 'rgba(232, 93, 4, 0.5)', blur: 24, offsetX: 0, offsetY: 6 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Price',
        text: '$48',
        x: width * 0.74,
        y: height * 0.66,
        width: width * 0.2,
        height: 40,
        fontSize: Math.max(22, Math.round(width * 0.045)),
        fontWeight: '900',
        fontFamily: 'Outfit',
        color: '#ffffff',
        letterSpacing: 0,
        lineHeight: 1.1,
        textAlign: 'center',
        textTransform: 'none',
        rotation: -8,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Order CTA
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Order Button',
        x: width * 0.2,
        y: height * 0.76,
        width: width * 0.6,
        height: 60,
        rotation: 0,
        opacity: 1,
        color: '#e85d04',
        cornerRadius: { tl: 8, tr: 8, br: 8, bl: 8 },
        shadow: { color: 'rgba(232, 93, 4, 0.5)', blur: 24, offsetX: 0, offsetY: 8 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Order CTA',
        text: 'ORDER NOW — TABLE 7',
        x: width * 0.2,
        y: height * 0.79,
        width: width * 0.6,
        height: 28,
        fontSize: Math.max(14, Math.round(width * 0.028)),
        fontWeight: '800',
        fontFamily: 'Outfit',
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
      title: 'Restaurant Feature Post',
      description:
        'Warm, appetizing food/restaurant artboard with burnt orange palette and bold food-forward typography.',
      width,
      height,
      backgroundColor: '#1a0a00',
      backgroundGradient: bgGrad,
      layers,
    };
  },

  africanMarket: (width, height, prompt) => {
    const bgGrad: Gradient = {
      type: 'linear',
      angle: 150,
      colors: [
        { color: '#0d1b2a', position: 0 },
        { color: '#1b2838', position: 0.6 },
        { color: '#0a1520', position: 1 },
      ],
    };

    const layers: Layer[] = [
      // Ankara-inspired accent strip
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Ankara Accent Strip',
        x: 0,
        y: height * 0.06,
        width: width * 0.08,
        height: height * 0.88,
        rotation: 0,
        opacity: 1,
        color: '#e63946',
        locked: false,
        visible: true,
      } as any,
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Accent Strip 2',
        x: width * 0.08,
        y: height * 0.06,
        width: width * 0.03,
        height: height * 0.88,
        rotation: 0,
        opacity: 1,
        color: '#f4a261',
        locked: false,
        visible: true,
      } as any,
      // Gold glow
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'ellipse',
        name: 'Gold Glow',
        x: width * 0.3,
        y: -height * 0.1,
        width: width * 0.7,
        height: width * 0.7,
        rotation: 0,
        opacity: 0.12,
        color: '#f4a261',
        locked: false,
        visible: true,
        blendMode: 'screen',
      } as any,
      // Eyebrow
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Eyebrow',
        text: '🌍 MADE IN AFRICA · EST. 2024',
        x: width * 0.15,
        y: height * 0.13,
        width: width * 0.8,
        height: 28,
        fontSize: Math.max(11, Math.round(width * 0.022)),
        fontWeight: '700',
        fontFamily: 'Inter',
        color: '#f4a261',
        letterSpacing: 3,
        lineHeight: 1.2,
        textAlign: 'left',
        textTransform: 'uppercase',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Main Headline
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Main Headline',
        text: prompt.slice(0, 28) || 'Elevate Your African Brand',
        x: width * 0.14,
        y: height * 0.23,
        width: width * 0.8,
        height: 160,
        fontSize: Math.max(34, Math.round(width * 0.088)),
        fontWeight: '900',
        fontFamily: 'Outfit',
        color: '#f0f4f8',
        letterSpacing: -0.5,
        lineHeight: 1.1,
        textAlign: 'left',
        textTransform: 'none',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        textShadow: { color: 'rgba(230, 57, 70, 0.4)', blur: 30, offsetX: 4, offsetY: 8 },
      } as any,
      // Body text
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Body Copy',
        text: 'Premium creative tools built for African creators, brands, and businesses ready to compete globally.',
        x: width * 0.14,
        y: height * 0.52,
        width: width * 0.76,
        height: 70,
        fontSize: Math.max(14, Math.round(width * 0.028)),
        fontWeight: '400',
        fontFamily: 'Inter',
        color: '#94a3b8',
        letterSpacing: 0,
        lineHeight: 1.55,
        textAlign: 'left',
        textTransform: 'none',
        rotation: 0,
        opacity: 0.9,
        locked: false,
        visible: true,
      } as any,
      // CTA button
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'CTA Button',
        x: width * 0.14,
        y: height * 0.72,
        width: width * 0.48,
        height: 60,
        rotation: 0,
        opacity: 1,
        color: '#e63946',
        cornerRadius: { tl: 8, tr: 8, br: 8, bl: 8 },
        shadow: { color: 'rgba(230, 57, 70, 0.5)', blur: 24, offsetX: 0, offsetY: 8 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'CTA Text',
        text: 'GET STARTED FREE →',
        x: width * 0.14,
        y: height * 0.745,
        width: width * 0.48,
        height: 28,
        fontSize: Math.max(14, Math.round(width * 0.028)),
        fontWeight: '800',
        fontFamily: 'Outfit',
        color: '#ffffff',
        letterSpacing: 1,
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
      title: 'African Market Banner',
      description:
        'Bold, vibrant artboard for African brands with ankara accent strip, warm palette, and confident typography.',
      width,
      height,
      backgroundColor: '#0d1b2a',
      backgroundGradient: bgGrad,
      layers,
    };
  },

  fitness: (width, height, prompt) => {
    const bgGrad: Gradient = {
      type: 'linear',
      angle: 135,
      colors: [
        { color: '#0f0f1a', position: 0 },
        { color: '#1a1028', position: 0.5 },
        { color: '#090812', position: 1 },
      ],
    };

    const layers: Layer[] = [
      // Glow energy orb
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'ellipse',
        name: 'Energy Glow Orb',
        x: width * 0.4,
        y: height * 0.05,
        width: width * 0.65,
        height: width * 0.65,
        rotation: 0,
        opacity: 0.2,
        color: '#ff3344',
        locked: false,
        visible: true,
        blendMode: 'screen',
      } as any,
      // Diagonal electric stripe
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Electric Stripe',
        x: width * 0.08,
        y: height * 0.12,
        width: width * 0.84,
        height: 4,
        rotation: 0,
        opacity: 1,
        color: '#a3ff12',
        locked: false,
        visible: true,
      } as any,
      // Eyebrow Tag
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Eyebrow Tag',
        text: '⚡ HIGH-PERFORMANCE TRAINING',
        x: width * 0.08,
        y: height * 0.16,
        width: width * 0.84,
        height: 28,
        fontSize: Math.max(12, Math.round(width * 0.024)),
        fontWeight: '800',
        fontFamily: 'Montserrat',
        color: '#a3ff12',
        letterSpacing: 4,
        lineHeight: 1.2,
        textAlign: 'left',
        textTransform: 'uppercase',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Main Headline
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Headline',
        text: prompt.toUpperCase().slice(0, 26) || 'UNLEASH YOUR LIMITS',
        x: width * 0.08,
        y: height * 0.24,
        width: width * 0.84,
        height: 160,
        fontSize: Math.max(36, Math.round(width * 0.092)),
        fontWeight: '900',
        fontFamily: 'Montserrat',
        color: '#ffffff',
        letterSpacing: -1,
        lineHeight: 1.05,
        textAlign: 'left',
        textTransform: 'uppercase',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        textShadow: { color: 'rgba(255, 51, 68, 0.4)', blur: 24, offsetX: 0, offsetY: 6 },
      } as any,
      // Subtitle
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Subtitle',
        text: 'Customized hybrid programming, biomechanical tracking, and elite strength regimens built for athletes.',
        x: width * 0.08,
        y: height * 0.5,
        width: width * 0.72,
        height: 60,
        fontSize: Math.max(13, Math.round(width * 0.027)),
        fontWeight: '500',
        fontFamily: 'Inter',
        color: '#94a3b8',
        letterSpacing: 0.5,
        lineHeight: 1.55,
        textAlign: 'left',
        rotation: 0,
        opacity: 0.9,
        locked: false,
        visible: true,
      } as any,
      // Floating Metric Badge Container
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Metric Badge',
        x: width * 0.65,
        y: height * 0.6,
        width: width * 0.26,
        height: 64,
        rotation: -5,
        opacity: 1,
        color: '#a3ff12',
        cornerRadius: { tl: 12, tr: 12, br: 12, bl: 12 },
        shadow: { color: 'rgba(163, 255, 18, 0.4)', blur: 20, offsetX: 0, offsetY: 6 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Metric Text',
        text: '-30% FAT',
        x: width * 0.65,
        y: height * 0.625,
        width: width * 0.26,
        height: 32,
        fontSize: Math.max(14, Math.round(width * 0.03)),
        fontWeight: '900',
        fontFamily: 'Montserrat',
        color: '#090812',
        letterSpacing: 1,
        lineHeight: 1.2,
        textAlign: 'center',
        textTransform: 'uppercase',
        rotation: -5,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // CTA Button
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'CTA Button',
        x: width * 0.08,
        y: height * 0.72,
        width: width * 0.5,
        height: 58,
        rotation: 0,
        opacity: 1,
        color: '#ff3344',
        cornerRadius: { tl: 8, tr: 8, br: 8, bl: 8 },
        shadow: { color: 'rgba(255, 51, 68, 0.5)', blur: 24, offsetX: 0, offsetY: 8 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'CTA Text',
        text: 'START 7-DAY TRIAL →',
        x: width * 0.08,
        y: height * 0.745,
        width: width * 0.5,
        height: 28,
        fontSize: Math.max(14, Math.round(width * 0.028)),
        fontWeight: '800',
        fontFamily: 'Montserrat',
        color: '#ffffff',
        letterSpacing: 1.5,
        lineHeight: 1.2,
        textAlign: 'center',
        textTransform: 'uppercase',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Bottom Accent Rule
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Bottom Accent Rule',
        x: width * 0.08,
        y: height * 0.88,
        width: width * 0.84,
        height: 1,
        rotation: 0,
        opacity: 0.3,
        color: '#a3ff12',
        locked: false,
        visible: true,
      } as any,
    ];

    return {
      title: 'Fitness High-Performance Poster',
      description: 'High-energy athletic composition with neon accents, bold typography, and performance metrics.',
      width,
      height,
      backgroundColor: '#0f0f1a',
      backgroundGradient: bgGrad,
      layers,
    };
  },

  fashion: (width, height, prompt) => {
    const bgGrad: Gradient = {
      type: 'linear',
      angle: 180,
      colors: [
        { color: '#09090b', position: 0 },
        { color: '#18181b', position: 0.6 },
        { color: '#09090b', position: 1 },
      ],
    };

    const layers: Layer[] = [
      // Minimal outer border frame
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Border Frame',
        x: width * 0.05,
        y: height * 0.05,
        width: width * 0.9,
        height: height * 0.9,
        rotation: 0,
        opacity: 0.4,
        color: 'transparent',
        stroke: { color: '#ffffff', width: 1 },
        locked: false,
        visible: true,
      } as any,
      // Brand tag
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Brand Label',
        text: 'ATELIER NOIR · PARIS',
        x: width * 0.1,
        y: height * 0.1,
        width: width * 0.8,
        height: 24,
        fontSize: Math.max(11, Math.round(width * 0.02)),
        fontWeight: '600',
        fontFamily: 'Inter',
        color: '#a1a1aa',
        letterSpacing: 6,
        lineHeight: 1.2,
        textAlign: 'center',
        textTransform: 'uppercase',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Headline
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Main Headline',
        text: prompt.slice(0, 28) || 'Autumn Monochrome',
        x: width * 0.08,
        y: height * 0.22,
        width: width * 0.84,
        height: 140,
        fontSize: Math.max(34, Math.round(width * 0.085)),
        fontWeight: '300',
        fontFamily: 'DM Sans',
        color: '#ffffff',
        letterSpacing: -0.5,
        lineHeight: 1.1,
        textAlign: 'center',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Pop Color Accent Block
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Color Pop Block',
        x: width * 0.45,
        y: height * 0.45,
        width: width * 0.1,
        height: 3,
        rotation: 0,
        opacity: 1,
        color: '#ff2d55',
        locked: false,
        visible: true,
      } as any,
      // Subtitle
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Subtitle',
        text: 'Structured outerwear, raw denim, and sculptural tailoring engineered for the metropolitan pulse.',
        x: width * 0.18,
        y: height * 0.52,
        width: width * 0.64,
        height: 60,
        fontSize: Math.max(13, Math.round(width * 0.026)),
        fontWeight: '400',
        fontFamily: 'Inter',
        color: '#71717a',
        letterSpacing: 0.5,
        lineHeight: 1.6,
        textAlign: 'center',
        rotation: 0,
        opacity: 0.9,
        locked: false,
        visible: true,
      } as any,
      // Floating Pop Badge
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Drop Badge',
        x: width * 0.38,
        y: height * 0.66,
        width: width * 0.24,
        height: 40,
        rotation: 0,
        opacity: 1,
        color: '#ff2d55',
        cornerRadius: { tl: 4, tr: 4, br: 4, bl: 4 },
        shadow: { color: 'rgba(255, 45, 85, 0.4)', blur: 16, offsetX: 0, offsetY: 4 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Badge Text',
        text: 'DROP 01 // 500 PCS',
        x: width * 0.38,
        y: height * 0.675,
        width: width * 0.24,
        height: 20,
        fontSize: Math.max(10, Math.round(width * 0.02)),
        fontWeight: '800',
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
      // CTA Outline Button
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'CTA Button',
        x: width * 0.3,
        y: height * 0.77,
        width: width * 0.4,
        height: 52,
        rotation: 0,
        opacity: 1,
        color: 'transparent',
        stroke: { color: '#ffffff', width: 1.5 },
        cornerRadius: { tl: 0, tr: 0, br: 0, bl: 0 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'CTA Text',
        text: 'EXPLORE LOOKBOOK',
        x: width * 0.3,
        y: height * 0.795,
        width: width * 0.4,
        height: 24,
        fontSize: Math.max(12, Math.round(width * 0.024)),
        fontWeight: '700',
        fontFamily: 'Inter',
        color: '#ffffff',
        letterSpacing: 3,
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
      title: 'Monochrome Fashion Editorial',
      description: 'Sophisticated dark streetwear layout with minimal typography, pop accents, and editorial framing.',
      width,
      height,
      backgroundColor: '#09090b',
      backgroundGradient: bgGrad,
      layers,
    };
  },

  realEstate: (width, height, prompt) => {
    const bgGrad: Gradient = {
      type: 'linear',
      angle: 150,
      colors: [
        { color: '#fbf9f6', position: 0 },
        { color: '#f3efe8', position: 1 },
      ],
    };

    const layers: Layer[] = [
      // Forest green card container
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Card Backdrop',
        x: width * 0.06,
        y: height * 0.06,
        width: width * 0.88,
        height: height * 0.88,
        rotation: 0,
        opacity: 1,
        color: '#1a3c34',
        cornerRadius: { tl: 16, tr: 16, br: 16, bl: 16 },
        shadow: { color: 'rgba(26, 60, 52, 0.25)', blur: 30, offsetX: 0, offsetY: 12 },
        locked: false,
        visible: true,
      } as any,
      // Gold top accent
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Gold Top Accent',
        x: width * 0.14,
        y: height * 0.12,
        width: width * 0.15,
        height: 3,
        rotation: 0,
        opacity: 1,
        color: '#c8a87c',
        locked: false,
        visible: true,
      } as any,
      // Eyebrow tag
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Category Tag',
        text: 'PREMIER LISTING · EXCLUSIVE',
        x: width * 0.14,
        y: height * 0.15,
        width: width * 0.72,
        height: 24,
        fontSize: Math.max(11, Math.round(width * 0.022)),
        fontWeight: '700',
        fontFamily: 'Inter',
        color: '#c8a87c',
        letterSpacing: 3,
        lineHeight: 1.2,
        textAlign: 'left',
        textTransform: 'uppercase',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Property Headline
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Property Title',
        text: prompt.slice(0, 32) || 'The Glass Pavilion Residence',
        x: width * 0.14,
        y: height * 0.22,
        width: width * 0.72,
        height: 120,
        fontSize: Math.max(30, Math.round(width * 0.075)),
        fontWeight: '400',
        fontFamily: 'Playfair Display',
        color: '#fdfbf7',
        letterSpacing: -0.5,
        lineHeight: 1.15,
        textAlign: 'left',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Location line
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Location',
        text: '📍 Beverly Hills, CA · 5 Beds · 7 Baths · 8,400 Sq Ft',
        x: width * 0.14,
        y: height * 0.44,
        width: width * 0.72,
        height: 36,
        fontSize: Math.max(13, Math.round(width * 0.027)),
        fontWeight: '500',
        fontFamily: 'Inter',
        color: '#a3b899',
        letterSpacing: 0,
        lineHeight: 1.4,
        textAlign: 'left',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Price badge
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Price Badge',
        x: width * 0.14,
        y: height * 0.54,
        width: width * 0.4,
        height: 48,
        rotation: 0,
        opacity: 1,
        color: 'rgba(200, 168, 124, 0.15)',
        stroke: { color: '#c8a87c', width: 1 },
        cornerRadius: { tl: 8, tr: 8, br: 8, bl: 8 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Price Text',
        text: '$12,850,000 USD',
        x: width * 0.14,
        y: height * 0.558,
        width: width * 0.4,
        height: 24,
        fontSize: Math.max(14, Math.round(width * 0.03)),
        fontWeight: '800',
        fontFamily: 'Outfit',
        color: '#c8a87c',
        letterSpacing: 1,
        lineHeight: 1.2,
        textAlign: 'center',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Schedule Viewing CTA
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'CTA Button',
        x: width * 0.14,
        y: height * 0.68,
        width: width * 0.48,
        height: 56,
        rotation: 0,
        opacity: 1,
        color: '#c8a87c',
        cornerRadius: { tl: 8, tr: 8, br: 8, bl: 8 },
        shadow: { color: 'rgba(200, 168, 124, 0.4)', blur: 20, offsetX: 0, offsetY: 6 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'CTA Text',
        text: 'SCHEDULE PRIVATE TOUR →',
        x: width * 0.14,
        y: height * 0.705,
        width: width * 0.48,
        height: 24,
        fontSize: Math.max(12, Math.round(width * 0.026)),
        fontWeight: '800',
        fontFamily: 'Inter',
        color: '#1a3c34',
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
      title: 'Luxury Real Estate Showcase',
      description: 'Elegant property presentation artboard with dark green card backdrop and refined serif typography.',
      width,
      height,
      backgroundColor: '#fbf9f6',
      backgroundGradient: bgGrad,
      layers,
    };
  },

  event: (width, height, prompt) => {
    const bgGrad: Gradient = {
      type: 'linear',
      angle: 140,
      colors: [
        { color: '#090214', position: 0 },
        { color: '#16042a', position: 0.5 },
        { color: '#04010a', position: 1 },
      ],
    };

    const layers: Layer[] = [
      // Magenta glow orb
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'ellipse',
        name: 'Magenta Glow',
        x: width * 0.15,
        y: height * 0.08,
        width: width * 0.7,
        height: width * 0.7,
        rotation: 0,
        opacity: 0.22,
        color: '#ff007f',
        locked: false,
        visible: true,
        blendMode: 'screen',
      } as any,
      // Date Pill
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Date Pill',
        x: width * 0.28,
        y: height * 0.13,
        width: width * 0.44,
        height: 38,
        rotation: 0,
        opacity: 1,
        color: 'rgba(255, 0, 127, 0.15)',
        stroke: { color: '#ff007f', width: 1.5 },
        cornerRadius: { tl: 19, tr: 19, br: 19, bl: 19 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Date Text',
        text: 'OCTOBER 28 · LIVE CONCERT',
        x: width * 0.28,
        y: height * 0.145,
        width: width * 0.44,
        height: 22,
        fontSize: Math.max(11, Math.round(width * 0.024)),
        fontWeight: '800',
        fontFamily: 'Inter',
        color: '#ff007f',
        letterSpacing: 2,
        lineHeight: 1.2,
        textAlign: 'center',
        textTransform: 'uppercase',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Main Event Headline
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Event Title',
        text: prompt.toUpperCase().slice(0, 24) || 'SYNTHESIS FESTIVAL',
        x: width * 0.08,
        y: height * 0.25,
        width: width * 0.84,
        height: 160,
        fontSize: Math.max(38, Math.round(width * 0.095)),
        fontWeight: '900',
        fontFamily: 'Outfit',
        color: '#ffffff',
        letterSpacing: -1,
        lineHeight: 1.05,
        textAlign: 'center',
        textTransform: 'uppercase',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        textShadow: { color: 'rgba(0, 240, 255, 0.5)', blur: 28, offsetX: 0, offsetY: 6 },
      } as any,
      // Subtitle
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Lineup Text',
        text: '3 STAGES · 40+ ARTISTS · IMMERSIVE AUDIOVISUALS · DOCKLANDS ARENA',
        x: width * 0.1,
        y: height * 0.52,
        width: width * 0.8,
        height: 48,
        fontSize: Math.max(12, Math.round(width * 0.026)),
        fontWeight: '600',
        fontFamily: 'Inter',
        color: '#00f0ff',
        letterSpacing: 1.5,
        lineHeight: 1.4,
        textAlign: 'center',
        rotation: 0,
        opacity: 0.9,
        locked: false,
        visible: true,
      } as any,
      // Ticket Badge
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Ticket Badge',
        x: width * 0.32,
        y: height * 0.65,
        width: width * 0.36,
        height: 48,
        rotation: -4,
        opacity: 1,
        color: '#00f0ff',
        cornerRadius: { tl: 8, tr: 8, br: 8, bl: 8 },
        shadow: { color: 'rgba(0, 240, 255, 0.5)', blur: 20, offsetX: 0, offsetY: 6 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Badge Text',
        text: 'EARLY BIRD $45',
        x: width * 0.32,
        y: height * 0.67,
        width: width * 0.36,
        height: 24,
        fontSize: Math.max(13, Math.round(width * 0.028)),
        fontWeight: '900',
        fontFamily: 'Outfit',
        color: '#090214',
        letterSpacing: 2,
        lineHeight: 1.2,
        textAlign: 'center',
        textTransform: 'uppercase',
        rotation: -4,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // CTA Button
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'CTA Button',
        x: width * 0.25,
        y: height * 0.77,
        width: width * 0.5,
        height: 58,
        rotation: 0,
        opacity: 1,
        color: '#ff007f',
        cornerRadius: { tl: 12, tr: 12, br: 12, bl: 12 },
        shadow: { color: 'rgba(255, 0, 127, 0.5)', blur: 24, offsetX: 0, offsetY: 8 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'CTA Text',
        text: 'GET PASSES NOW →',
        x: width * 0.25,
        y: height * 0.795,
        width: width * 0.5,
        height: 28,
        fontSize: Math.max(14, Math.round(width * 0.03)),
        fontWeight: '800',
        fontFamily: 'Outfit',
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
      title: 'Concert & Music Festival Flyer',
      description: 'High-voltage music event poster with vivid neon lighting, ticket pill, and commanding typography.',
      width,
      height,
      backgroundColor: '#090214',
      backgroundGradient: bgGrad,
      layers,
    };
  },

  education: (width, height, prompt) => {
    const bgGrad: Gradient = {
      type: 'linear',
      angle: 160,
      colors: [
        { color: '#eef2ff', position: 0 },
        { color: '#f8fafc', position: 0.6 },
        { color: '#fef3c7', position: 1 },
      ],
    };

    const layers: Layer[] = [
      // Light card container
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Card Container',
        x: width * 0.08,
        y: height * 0.08,
        width: width * 0.84,
        height: height * 0.84,
        rotation: 0,
        opacity: 1,
        color: '#ffffff',
        cornerRadius: { tl: 20, tr: 20, br: 20, bl: 20 },
        shadow: { color: 'rgba(99, 102, 241, 0.1)', blur: 30, offsetX: 0, offsetY: 12 },
        locked: false,
        visible: true,
      } as any,
      // Decorative corner pill
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Category Pill',
        x: width * 0.14,
        y: height * 0.14,
        width: width * 0.36,
        height: 34,
        rotation: 0,
        opacity: 1,
        color: '#e0e7ff',
        cornerRadius: { tl: 17, tr: 17, br: 17, bl: 17 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Category Text',
        text: '🎓 CERTIFIED BOOTCAMP',
        x: width * 0.14,
        y: height * 0.155,
        width: width * 0.36,
        height: 20,
        fontSize: Math.max(11, Math.round(width * 0.022)),
        fontWeight: '700',
        fontFamily: 'Inter',
        color: '#4338ca',
        letterSpacing: 1.5,
        lineHeight: 1.2,
        textAlign: 'center',
        textTransform: 'uppercase',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Main Headline
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Course Title',
        text: prompt.slice(0, 32) || 'Master Modern AI Engineering',
        x: width * 0.14,
        y: height * 0.24,
        width: width * 0.72,
        height: 120,
        fontSize: Math.max(30, Math.round(width * 0.075)),
        fontWeight: '800',
        fontFamily: 'Outfit',
        color: '#0f172a',
        letterSpacing: -0.5,
        lineHeight: 1.15,
        textAlign: 'left',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Subtitle
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Course Subtitle',
        text: 'From LLM foundations to autonomous agent orchestration. 8 weeks · Real-world capstones · 1-on-1 mentorship.',
        x: width * 0.14,
        y: height * 0.46,
        width: width * 0.7,
        height: 60,
        fontSize: Math.max(13, Math.round(width * 0.028)),
        fontWeight: '400',
        fontFamily: 'Inter',
        color: '#475569',
        letterSpacing: 0,
        lineHeight: 1.55,
        textAlign: 'left',
        rotation: 0,
        opacity: 0.9,
        locked: false,
        visible: true,
      } as any,
      // Rating / Social Proof
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Social Proof',
        text: '★★★★★ 4.9/5 from 1,200+ graduates',
        x: width * 0.14,
        y: height * 0.6,
        width: width * 0.5,
        height: 24,
        fontSize: Math.max(12, Math.round(width * 0.025)),
        fontWeight: '600',
        fontFamily: 'Inter',
        color: '#d97706',
        letterSpacing: 0.5,
        lineHeight: 1.2,
        textAlign: 'left',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // CTA Button
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'CTA Button',
        x: width * 0.14,
        y: height * 0.7,
        width: width * 0.44,
        height: 56,
        rotation: 0,
        opacity: 1,
        color: '#4f46e5',
        cornerRadius: { tl: 10, tr: 10, br: 10, bl: 10 },
        shadow: { color: 'rgba(79, 70, 229, 0.35)', blur: 20, offsetX: 0, offsetY: 6 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'CTA Text',
        text: 'ENROLL NOW →',
        x: width * 0.14,
        y: height * 0.725,
        width: width * 0.44,
        height: 24,
        fontSize: Math.max(13, Math.round(width * 0.028)),
        fontWeight: '800',
        fontFamily: 'Inter',
        color: '#ffffff',
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
      title: 'Online Course Showcase',
      description: 'Clean, trust-inspiring educational layout with ratings, curriculum overview, and enrollment CTA.',
      width,
      height,
      backgroundColor: '#f8fafc',
      backgroundGradient: bgGrad,
      layers,
    };
  },

  ecommerce: (width, height, prompt) => {
    const bgGrad: Gradient = {
      type: 'linear',
      angle: 170,
      colors: [
        { color: '#0b0f19', position: 0 },
        { color: '#161e31', position: 0.5 },
        { color: '#090d16', position: 1 },
      ],
    };

    const layers: Layer[] = [
      // Top urgency red banner bar
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Urgency Banner',
        x: 0,
        y: 0,
        width: width,
        height: height * 0.07,
        rotation: 0,
        opacity: 1,
        color: '#dc2626',
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Banner Text',
        text: '🔥 FLASH SALE ENDS IN 04:32:19 · FREE WORLDWIDE SHIPPING OVER $75',
        x: width * 0.05,
        y: height * 0.022,
        width: width * 0.9,
        height: 22,
        fontSize: Math.max(10, Math.round(width * 0.02)),
        fontWeight: '800',
        fontFamily: 'Inter',
        color: '#ffffff',
        letterSpacing: 1.5,
        lineHeight: 1.2,
        textAlign: 'center',
        textTransform: 'uppercase',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // Main Promo Headline
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Sale Headline',
        text: prompt.toUpperCase().slice(0, 26) || 'BIGGEST SALE OF 2026',
        x: width * 0.08,
        y: height * 0.18,
        width: width * 0.84,
        height: 140,
        fontSize: Math.max(34, Math.round(width * 0.09)),
        fontWeight: '900',
        fontFamily: 'Outfit',
        color: '#ffffff',
        letterSpacing: -1,
        lineHeight: 1.05,
        textAlign: 'center',
        textTransform: 'uppercase',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        textShadow: { color: 'rgba(220, 38, 38, 0.6)', blur: 24, offsetX: 0, offsetY: 6 },
      } as any,
      // Subtitle
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Sale Subtitle',
        text: 'Save up to 60% across all top-tier models, presets, and accessories.',
        x: width * 0.15,
        y: height * 0.42,
        width: width * 0.7,
        height: 48,
        fontSize: Math.max(13, Math.round(width * 0.028)),
        fontWeight: '500',
        fontFamily: 'Inter',
        color: '#94a3b8',
        letterSpacing: 0,
        lineHeight: 1.4,
        textAlign: 'center',
        rotation: 0,
        opacity: 0.9,
        locked: false,
        visible: true,
      } as any,
      // Giant Discount Badge
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'ellipse',
        name: 'Discount Badge Circle',
        x: width * 0.38,
        y: height * 0.52,
        width: width * 0.24,
        height: width * 0.24,
        rotation: -6,
        opacity: 1,
        color: '#dc2626',
        shadow: { color: 'rgba(220, 38, 38, 0.6)', blur: 28, offsetX: 0, offsetY: 8 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'Discount Badge Text',
        text: '60%\\nOFF',
        x: width * 0.38,
        y: height * 0.57,
        width: width * 0.24,
        height: 60,
        fontSize: Math.max(22, Math.round(width * 0.05)),
        fontWeight: '900',
        fontFamily: 'Outfit',
        color: '#ffffff',
        letterSpacing: 0,
        lineHeight: 1,
        textAlign: 'center',
        textTransform: 'uppercase',
        rotation: -6,
        opacity: 1,
        locked: false,
        visible: true,
      } as any,
      // CTA Button
      {
        id: `shape_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'CTA Button',
        x: width * 0.22,
        y: height * 0.77,
        width: width * 0.56,
        height: 60,
        rotation: 0,
        opacity: 1,
        color: '#ffffff',
        cornerRadius: { tl: 10, tr: 10, br: 10, bl: 10 },
        shadow: { color: 'rgba(255, 255, 255, 0.25)', blur: 20, offsetX: 0, offsetY: 6 },
        locked: false,
        visible: true,
      } as any,
      {
        id: `text_${uuidv4().slice(0, 8)}`,
        type: 'text',
        name: 'CTA Text',
        text: 'CLAIM DEAL NOW →',
        x: width * 0.22,
        y: height * 0.795,
        width: width * 0.56,
        height: 28,
        fontSize: Math.max(14, Math.round(width * 0.03)),
        fontWeight: '900',
        fontFamily: 'Outfit',
        color: '#0b0f19',
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
      title: 'High-Conversion E-Commerce Flash Sale',
      description: 'Urgency-driven promotional flyer with countdown header, prominent discount badge, and high-contrast CTA.',
      width,
      height,
      backgroundColor: '#0b0f19',
      backgroundGradient: bgGrad,
      layers,
    };
  },
};

// ─── Semantic Intent Classifier ──────────────────────────────────────────────

interface ArchetypeScore {
  archetype: string;
  score: number;
}

const ARCHETYPE_KEYWORDS: Record<string, { primary: string[]; secondary: string[]; negative: string[] }> = {
  cyberpunk: {
    primary: ['cyber', 'neon', 'gaming', 'futuristic', 'glitch', 'synthwave', 'hacker', 'retro-future'],
    secondary: ['dark', 'digital', 'night', 'electric', 'DJ', 'rave', 'club', 'arcade', 'metaverse'],
    negative: ['nature', 'organic', 'vintage', 'minimal'],
  },
  editorial: {
    primary: ['editorial', 'magazine', 'article', 'blog', 'journal', 'story', 'essay', 'publish'],
    secondary: ['minimal', 'clean', 'serif', 'classic', 'sophisticated', 'reading', 'newsletter'],
    negative: ['neon', 'gaming', 'sale', 'discount'],
  },
  saas: {
    primary: ['saas', 'startup', 'software', 'platform', 'dashboard', 'analytics', 'productivity'],
    secondary: ['cloud', 'tech', 'product', 'launch', 'pricing', 'feature', 'API', 'devtool', 'ai tool'],
    negative: ['food', 'fashion', 'beauty'],
  },
  luxury: {
    primary: ['luxury', 'premium', 'gold', 'skincare', 'beauty', 'jewelry', 'perfume', 'haute couture'],
    secondary: ['elegant', 'exclusive', 'boutique', 'refined', 'silk', 'diamond', 'champagne', 'spa'],
    negative: ['cheap', 'discount', 'budget', 'gaming'],
  },
  food: {
    primary: ['food', 'restaurant', 'menu', 'recipe', 'cafe', 'bakery', 'chef', 'kitchen'],
    secondary: ['eat', 'drink', 'cuisine', 'dining', 'brunch', 'organic', 'farm', 'gourmet', 'dessert', 'pizza', 'burger'],
    negative: ['tech', 'software', 'coding'],
  },
  africanMarket: {
    primary: ['africa', 'african', 'lagos', 'naija', 'ankara', 'ghana', 'afrobeat', 'kenya', 'nigeria'],
    secondary: ['vibrant', 'cultural', 'heritage', 'tribe', 'market', 'accra', 'jollof', 'kente'],
    negative: [],
  },
  fitness: {
    primary: ['fitness', 'gym', 'workout', 'sport', 'athletic', 'crossfit', 'bodybuilding'],
    secondary: ['health', 'muscle', 'training', 'runner', 'strong', 'energy', 'yoga', 'protein', 'marathon'],
    negative: ['food', 'restaurant'],
  },
  fashion: {
    primary: ['fashion', 'clothing', 'outfit', 'style', 'collection', 'runway', 'model', 'streetwear'],
    secondary: ['designer', 'lookbook', 'vogue', 'trend', 'wear', 'apparel', 'drop', 'sneaker', 'merch'],
    negative: ['tech', 'software'],
  },
  realEstate: {
    primary: ['real estate', 'property', 'house', 'apartment', 'listing', 'home', 'condo'],
    secondary: ['interior', 'architecture', 'modern', 'building', 'villa', 'penthouse', 'rent', 'mortgage'],
    negative: [],
  },
  event: {
    primary: ['event', 'concert', 'festival', 'party', 'conference', 'wedding', 'gala', 'summit'],
    secondary: ['ticket', 'invite', 'celebration', 'show', 'live', 'meetup', 'birthday', 'anniversary'],
    negative: [],
  },
  education: {
    primary: ['education', 'course', 'learning', 'school', 'university', 'webinar', 'bootcamp'],
    secondary: ['tutorial', 'class', 'student', 'study', 'certificate', 'workshop', 'masterclass', 'online class'],
    negative: [],
  },
  ecommerce: {
    primary: ['sale', 'discount', 'shop', 'store', 'black friday', 'deal', 'promo', 'flash sale'],
    secondary: ['offer', 'buy', 'price', 'limited', 'clearance', 'coupon', 'free shipping', 'cart'],
    negative: [],
  },
};

/**
 * Classify a prompt into the best-matching archetype using weighted keyword scoring.
 * Primary keywords score 3 points, secondary 1 point, negative keywords subtract 2.
 * Also checks the comprehensive design style database (65+ styles) for more specific matches.
 */
export function classifyDesignIntent(prompt: string): string {
  const pLower = prompt.toLowerCase();

  // First check the comprehensive style database (65+ styles)
  const styleMatch = classifyStyleFromPrompt(prompt);
  if (styleMatch) {
    const style = getStyleById(styleMatch);
    if (style) {
      log.info(`[DesignDirector] Style database match: ${style.name} (${styleMatch})`);
      // Map style categories to archetypes for backward compatibility
      const categoryToArchetype: Record<string, string> = {
        classical: 'luxury',
        modernist: 'editorial',
        retro: 'cyberpunk',
        raw: 'cyberpunk',
        dark: 'cyberpunk',
        organic: 'editorial',
        playful: 'editorial',
        typography: 'editorial',
        digital: 'saas',
        fantasy: 'luxury',
        trending: 'editorial',
      };
      return categoryToArchetype[style.category] || 'editorial';
    }
  }

  // Fallback to archetype keyword matching
  const scores: ArchetypeScore[] = Object.entries(ARCHETYPE_KEYWORDS).map(([archetype, kw]) => {
    let score = 0;
    kw.primary.forEach((k) => { if (pLower.includes(k)) score += 3; });
    kw.secondary.forEach((k) => { if (pLower.includes(k)) score += 1; });
    kw.negative.forEach((k) => { if (pLower.includes(k)) score -= 2; });
    return { archetype, score };
  });

  scores.sort((a, b) => b.score - a.score);
  return scores[0].score > 0 ? scores[0].archetype : 'editorial';
}

/**
 * Get the full style entry for a prompt, if matched from the style database.
 * Use this to provide style-specific guidance beyond the archetype.
 */
export function getMatchedStyle(prompt: string): DesignStyleEntry | null {
  const styleId = classifyStyleFromPrompt(prompt);
  return styleId ? getStyleById(styleId) ?? null : null;
}

// ─── Typography Pairing Rules ────────────────────────────────────────────────

const TYPOGRAPHY_PAIRINGS: Record<string, { headline: string; body: string; accent: string }> = {
  cyberpunk:     { headline: 'Outfit',           body: 'Inter',            accent: 'Space Mono' },
  editorial:     { headline: 'Playfair Display',  body: 'Inter',            accent: 'Inter' },
  saas:          { headline: 'Outfit',           body: 'Inter',            accent: 'Space Mono' },
  luxury:        { headline: 'Cinzel',           body: 'Cormorant Garamond', accent: 'Cinzel' },
  food:          { headline: 'Outfit',           body: 'Inter',            accent: 'Inter' },
  africanMarket: { headline: 'Outfit',           body: 'Inter',            accent: 'Inter' },
  fitness:       { headline: 'Montserrat',       body: 'Inter',            accent: 'Space Grotesk' },
  fashion:       { headline: 'DM Sans',          body: 'Inter',            accent: 'Bebas Neue' },
  realEstate:    { headline: 'Playfair Display',  body: 'Inter',            accent: 'Inter' },
  event:         { headline: 'Outfit',           body: 'Inter',            accent: 'Space Mono' },
  education:     { headline: 'Sora',             body: 'Inter',            accent: 'Inter' },
  ecommerce:     { headline: 'Outfit',           body: 'Inter',            accent: 'Inter' },
};

function getTypographyConstraint(archetype: string): string {
  const pairing = TYPOGRAPHY_PAIRINGS[archetype] || TYPOGRAPHY_PAIRINGS.editorial;
  return `TYPOGRAPHY PAIRING for this design:
- Headlines: "${pairing.headline}" (weight 700-900, large size)
- Body/Subtitle: "${pairing.body}" (weight 400-500)
- Eyebrows/Tags/Accents: "${pairing.accent}" (weight 600-700, UPPERCASE, letter-spacing 2-4px)
- NEVER use the same font for headlines and body text.`;
}

// ─── Few-Shot Example ────────────────────────────────────────────────────────

const FEW_SHOT_EXAMPLE = `
EXAMPLE OUTPUT (your output should have 10-15+ layers with this level of detail):
{
  "title": "Neon Tech Product Launch",
  "description": "Dark gradient hero with neon accents, floating badge, and bold CTA",
  "backgroundColor": "#0a0118",
  "backgroundGradient": { "type": "linear", "angle": 135, "colors": [{"color": "#0a0118", "position": 0}, {"color": "#1a0533", "position": 0.6}, {"color": "#05011a", "position": 1}] },
  "layers": [
    { "type": "ellipse", "name": "Glow Orb", "x": 200, "y": -100, "width": 700, "height": 700, "opacity": 0.2, "color": "#7c3aed", "blendMode": "screen" },
    { "type": "rect", "name": "Card Frame", "x": 86, "y": 86, "width": 908, "height": 908, "opacity": 0.9, "color": "rgba(15,10,30,0.8)", "cornerRadius": {"tl":16,"tr":16,"br":16,"bl":16}, "stroke": {"color": "#7c3aed", "width": 1}, "shadow": {"color": "rgba(124,58,237,0.3)", "blur": 30, "offsetX": 0, "offsetY": 8} },
    { "type": "rect", "name": "Eyebrow Pill", "x": 360, "y": 150, "width": 360, "height": 36, "opacity": 1, "color": "rgba(124,58,237,0.15)", "cornerRadius": {"tl":18,"tr":18,"br":18,"bl":18}, "stroke": {"color": "rgba(124,58,237,0.3)", "width": 1} },
    { "type": "text", "name": "Eyebrow Text", "text": "✦ NOW LIVE ON CLOUD", "x": 360, "y": 158, "width": 360, "height": 24, "fontSize": 13, "fontWeight": "700", "fontFamily": "Inter", "color": "#a78bfa", "letterSpacing": 3, "lineHeight": 1.2, "textAlign": "center", "textTransform": "uppercase" },
    { "type": "text", "name": "Headline", "text": "DESIGN THE\\nFUTURE TODAY", "x": 140, "y": 240, "width": 800, "height": 180, "fontSize": 72, "fontWeight": "900", "fontFamily": "Outfit", "color": "#ffffff", "letterSpacing": -1, "lineHeight": 1.05, "textAlign": "center", "textShadow": {"color": "rgba(124,58,237,0.4)", "blur": 30, "offsetX": 0, "offsetY": 8} },
    { "type": "text", "name": "Subtitle", "text": "Generate production-ready vector assets and layered artboards in seconds with AI.", "x": 190, "y": 460, "width": 700, "height": 60, "fontSize": 18, "fontWeight": "400", "fontFamily": "Inter", "color": "#94a3b8", "letterSpacing": 0, "lineHeight": 1.5, "textAlign": "center" },
    { "type": "rect", "name": "Floating Badge", "x": 740, "y": 600, "width": 200, "height": 56, "rotation": -6, "opacity": 1, "color": "#f59e0b", "cornerRadius": {"tl":28,"tr":28,"br":28,"bl":28}, "shadow": {"color": "rgba(245,158,11,0.5)", "blur": 20, "offsetX": 0, "offsetY": 6} },
    { "type": "text", "name": "Badge Text", "text": "NEW 2.0", "x": 740, "y": 615, "width": 200, "height": 28, "fontSize": 16, "fontWeight": "900", "fontFamily": "Inter", "color": "#0a0118", "letterSpacing": 2, "lineHeight": 1.2, "textAlign": "center", "textTransform": "uppercase", "rotation": -6 },
    { "type": "rect", "name": "CTA Button", "x": 340, "y": 700, "width": 400, "height": 60, "opacity": 1, "color": "#7c3aed", "cornerRadius": {"tl":12,"tr":12,"br":12,"bl":12}, "shadow": {"color": "rgba(124,58,237,0.5)", "blur": 24, "offsetX": 0, "offsetY": 8} },
    { "type": "text", "name": "CTA Text", "text": "START FREE TRIAL →", "x": 340, "y": 720, "width": 400, "height": 24, "fontSize": 16, "fontWeight": "800", "fontFamily": "Inter", "color": "#ffffff", "letterSpacing": 1.5, "lineHeight": 1.2, "textAlign": "center", "textTransform": "uppercase" },
    { "type": "text", "name": "Footnote", "text": "No credit card required • 14-day full access", "x": 300, "y": 790, "width": 480, "height": 20, "fontSize": 13, "fontWeight": "500", "fontFamily": "Inter", "color": "#64748b", "letterSpacing": 0, "lineHeight": 1.2, "textAlign": "center" },
    { "type": "rect", "name": "Bottom Accent", "x": 400, "y": 900, "width": 280, "height": 2, "opacity": 0.4, "color": "#7c3aed" }
  ]
}`;

/**
 * Main AI Multi-Layer Design Engine
 */
export const generateMultiLayerDesign = async (
  prompt: string,
  width: number = 1080,
  height: number = 1080,
  archetypeHint?: string
): Promise<ArtboardDesignResult> => {
  const combinedPrompt = prompt + ' ' + (archetypeHint || '');
  const archetype = classifyDesignIntent(combinedPrompt);
  const typographyConstraint = getTypographyConstraint(archetype);

  // Try calling AI structured output model
  try {
    const systemInstruction = `You are an elite Senior Art Director and Artboard Generator with 15 years at top agencies (Pentagram, Collins, Sagmeister). 

Your job: given a design prompt and canvas dimensions (${width}x${height}), generate a COMPLETE, HIGHLY POLISHED, PRODUCTION-READY EDITABLE MULTI-LAYER artboard in JSON.

DETECTED DESIGN CATEGORY: ${archetype.toUpperCase()}

DESIGN RULES — MANDATORY:
1. NEVER generate flat single-image layers. ALL layers must be coordinate-placed rectangles, ellipses, or text.
2. Build a full VISUAL HIERARCHY with at least 10–15 layers: background → decorative glow elements → content frame → eyebrow tag → headline → subtitle → body (optional) → floating badge → CTA button + text → footer accent.
3. Use RICH COLOR PALETTES — no plain primary colors. Use brand-specific palettes with HSL precision (e.g. #1a0533, #ff006e, #e8ff45, #003049).
4. Apply LAYERED DEPTH using background shapes, mid-ground decorative elements, and foreground content layers.
5. ${typographyConstraint}
6. EVERY design must include: background fill/gradient, at least 2 decorative shapes (glow orbs, accent lines, frames), eyebrow pill/tag, main headline (large, bold), supporting subtitle, and a CTA button shape + CTA text.
7. Use SHADOWS generously to create depth. Use GRADIENTS on backgrounds and key shapes.
8. CORNERRADIUS: pills = 999, cards = 16–24, buttons = 12, tags = 8.
9. PRECISE COORDINATES: place every layer pixel-perfectly relative to ${width}x${height}. Use percentages of canvas dimensions for responsive positioning.
10. ANTI-AI-SLOP: Avoid purple/teal generic gradients and generic AI illustrations. Use curated, campaign-quality colors specific to the "${archetype}" category.
11. TEXT CONTENT must feel REAL and campaign-ready — not placeholder text. Write compelling copy that matches the prompt's intent.
12. FLOATING BADGES and ACCENT ELEMENTS should have slight rotation (-3 to -8 degrees) for visual dynamism.

LAYER COMPOSITION GUIDELINES for ${width}x${height}:
- Background gradient shape (full-bleed): x=0, y=0, w=${width}, h=${height}
- Decorative glow orb (behind content): large ellipse, opacity 0.15–0.3, blendMode screen
- Decorative accent shapes: geometric accents, corner elements, floating badges
- Content frame/card: rounded rect with subtle stroke and shadow
- Eyebrow pill: small rounded rect with category text above headline
- Main headline: 60–90% of canvas width, centered or left-aligned, very bold
- Subheadline: 50–70% canvas width, lighter weight, secondary color
- Feature list or body text (optional)
- Floating badge/sticker shape + badge text (tilted -3 to -8 degrees for dynamism)
- CTA button shape (rounded rect) + CTA text
- Decorative bottom rule or footer text (optional)

${FEW_SHOT_EXAMPLE}

Return ONLY valid JSON, no markdown, no explanation:
{
  "title": string,
  "description": string,
  "backgroundColor": string (hex),
  "backgroundGradient": {
    "type": "linear" | "radial",
    "angle": number,
    "colors": [{"color": string (hex or rgba), "position": number (0-1)}]
  },
  "layers": [
    {
      "type": "rect" | "ellipse" | "text",
      "name": string (descriptive layer name),
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "rotation": number (degrees, default 0),
      "opacity": number (0-1, default 1),
      "color": string (hex or rgba),
      "gradient": {
        "type": "linear" | "radial",
        "angle": number,
        "colors": [{"color": string, "position": number}]
      } (optional, for shapes),
      "cornerRadius": {"tl": number, "tr": number, "br": number, "bl": number} (for rects),
      "stroke": {"color": string, "width": number} (optional),
      "shadow": {"color": string (rgba), "blur": number, "offsetX": number, "offsetY": number} (optional),
      "blendMode": "normal" | "screen" | "multiply" | "overlay" (optional),
      "text": string (text layers only),
      "fontSize": number (text layers only, in px),
      "fontWeight": "300" | "400" | "500" | "600" | "700" | "800" | "900",
      "fontFamily": "Outfit" | "Inter" | "Playfair Display" | "Montserrat" | "Cinzel" | "DM Sans" | "Sora" | "Space Grotesk" | "Space Mono" | "Cormorant Garamond" | "Bebas Neue" | "Roboto",
      "textAlign": "left" | "center" | "right",
      "letterSpacing": number (px, default 0),
      "lineHeight": number (multiplier, e.g. 1.2),
      "textTransform": "none" | "uppercase" | "lowercase",
      "textShadow": {"color": string, "blur": number, "offsetX": number, "offsetY": number} (optional)
    }
  ]
}`;

    const response = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      systemInstruction,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Design brief: "${prompt}"
Canvas: ${width}x${height}px
Goal: Production-ready, highly polished multi-layer artboard with at least 10 distinct, well-placed layers. Make it WOW.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.75,
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
          x: Math.max(-width * 0.5, Math.min(width * 1.5, Number(l.x) || 0)),
          y: Math.max(-height * 0.5, Math.min(height * 1.5, Number(l.y) || 0)),
          width: Math.max(10, Math.min(width * 3, Number(l.width) || 100)),
          height: Math.max(10, Math.min(height * 3, Number(l.height) || 50)),
          rotation: Number(l.rotation) || 0,
          opacity: typeof l.opacity === 'number' ? Math.max(0, Math.min(1, l.opacity)) : 1,
          color: l.color || '#3b82f6',
          locked: false,
          visible: true,
          cornerRadius: l.cornerRadius
            ? l.cornerRadius
            : typeof l.cornerRadius === 'number'
              ? { tl: l.cornerRadius, tr: l.cornerRadius, br: l.cornerRadius, bl: l.cornerRadius }
              : undefined,
          gradient: l.gradient,
          stroke: l.stroke,
          shadow: l.shadow,
          blendMode: l.blendMode,
          text: l.text,
          fontSize: l.fontSize || 24,
          fontWeight: l.fontWeight || '600',
          fontFamily: l.fontFamily || 'Inter',
          textAlign: l.textAlign || 'center',
          letterSpacing: l.letterSpacing || 0,
          lineHeight: l.lineHeight || 1.2,
          textTransform: l.textTransform || 'none',
          textShadow: l.textShadow,
        } as Layer;
      });

      return polishDesignOutput({
        title: parsed.title || 'AI Generated Artboard',
        description: parsed.description || prompt,
        width,
        height,
        backgroundColor: parsed.backgroundColor || '#0f172a',
        backgroundGradient: parsed.backgroundGradient,
        layers: sanitizedLayers,
      });
    }
  } catch (err) {
    log.warn(
      '[aiDesignDirector] Structured API call failed or timed out, utilizing intelligent archetype generation',
      err
    );
  }

  // Fallback to high-aesthetic photographic composition engine using semantic classifier
  try {
    return polishDesignOutput(buildCompositionForArchetype(archetype, width, height, prompt));
  } catch (compErr) {
    log.warn('[aiDesignDirector] Photographic composition failed, falling back to shape archetype', compErr);
    const fallbackFn = FALLBACK_ARCHETYPES[archetype] || FALLBACK_ARCHETYPES.editorial;
    return polishDesignOutput(fallbackFn(width, height, prompt));
  }
};
