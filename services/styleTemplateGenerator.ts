/**
 * Style Template Generator
 * Generates canvas-ready template configurations for each design style.
 * Templates are compatible with Kreathief's Layer/Artboard system.
 */

import { v4 as uuidv4 } from 'uuid';
import { Layer, TextLayer, ShapeLayer, Gradient } from '../types';
import { DesignStyleEntry, DESIGN_STYLE_DATABASE, getAllStyles } from './designStyleDatabase';

export interface StyleTemplate {
  id: string;
  styleId: string;
  styleName: string;
  name: string;
  description: string;
  category: 'social' | 'print' | 'web' | 'presentation';
  width: number;
  height: number;
  backgroundColor: string;
  backgroundGradient?: Gradient;
  layers: Layer[];
  previewColors: string[];
}

function makeId(): string {
  return `tmpl_${uuidv4().slice(0, 8)}`;
}

function textLayer(opts: Partial<TextLayer> & Pick<TextLayer, 'text' | 'x' | 'y' | 'width' | 'height'>): TextLayer {
  return {
    id: makeId(),
    type: 'text',
    name: opts.text.slice(0, 30),
    visible: true,
    locked: false,
    opacity: 1,
    rotation: 0,
    blendMode: 'normal',
    fontSize: 24,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0,
    lineHeight: 1.2,
    textTransform: 'none',
    ...opts,
  } as TextLayer;
}

function shapeLayer(opts: { shapeType: string; x: number; y: number; width: number; height: number; color?: string; cornerRadius?: number }): ShapeLayer {
  return {
    id: makeId(),
    type: 'shape' as const,
    name: opts.shapeType || 'Shape',
    visible: true,
    locked: false,
    opacity: 1,
    rotation: 0,
    blendMode: 'normal' as const,
    color: opts.color || '#ffffff',
    shapeType: opts.shapeType as any,
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    cornerRadius: opts.cornerRadius,
  } as unknown as ShapeLayer;
}

/**
 * Generate a set of templates for a given style
 */
export function generateStyleTemplates(style: DesignStyleEntry, format: 'instagram' | 'story' | 'presentation' = 'instagram'): StyleTemplate[] {
  const dims = {
    instagram: { width: 1080, height: 1080 },
    story: { width: 1080, height: 1920 },
    presentation: { width: 1920, height: 1080 },
  }[format];

  const templates: StyleTemplate[] = [];
  const p = style.palette;
  const t = style.typography;

  // Template 1: Bold Hero
  templates.push({
    id: makeId(),
    styleId: style.id,
    styleName: style.name,
    name: `${style.name} — Bold Hero`,
    description: `A high-impact ${style.name.toLowerCase()} design with bold typography and strong visual hierarchy.`,
    category: 'social',
    ...dims,
    backgroundColor: p.background,
    previewColors: [p.primary, p.secondary, p.accent],
    layers: [
      // Background accent shape
      shapeLayer({
        shapeType: 'rect',
        x: 0, y: 0,
        width: dims.width,
        height: dims.height * 0.45,
        color: p.primary,
      }),
      // Accent bar
      shapeLayer({
        shapeType: 'rect',
        x: dims.width * 0.08,
        y: dims.height * 0.42,
        width: dims.width * 0.15,
        height: 6,
        color: p.accent,
      }),
      // Main headline
      textLayer({
        text: 'YOUR HEADLINE',
        x: dims.width * 0.08,
        y: dims.height * 0.15,
        width: dims.width * 0.84,
        height: dims.height * 0.25,
        fontSize: Math.round(dims.width * 0.08),
        fontFamily: t.headlineFont,
        fontWeight: t.headlineWeight,
        color: p.text === p.background ? p.surface : p.text,
        textAlign: 'left',
        letterSpacing: t.letterSpacing,
        textTransform: t.textTransform,
      }),
      // Subtitle
      textLayer({
        text: 'Supporting text that explains your message',
        x: dims.width * 0.08,
        y: dims.height * 0.48,
        width: dims.width * 0.84,
        height: dims.height * 0.1,
        fontSize: Math.round(dims.width * 0.028),
        fontFamily: t.bodyFont,
        fontWeight: '400',
        color: p.textMuted,
        textAlign: 'left',
        lineHeight: 1.5,
      }),
      // CTA Button
      shapeLayer({
        shapeType: 'rect',
        x: dims.width * 0.08,
        y: dims.height * 0.62,
        width: dims.width * 0.35,
        height: dims.height * 0.06,
        color: p.accent,
        cornerRadius: 8,
      }),
      textLayer({
        text: 'LEARN MORE',
        x: dims.width * 0.08,
        y: dims.height * 0.62,
        width: dims.width * 0.35,
        height: dims.height * 0.06,
        fontSize: Math.round(dims.width * 0.022),
        fontFamily: t.accentFont,
        fontWeight: '700',
        color: p.background,
        textAlign: 'center',
        letterSpacing: 2,
        textTransform: 'uppercase',
      }),
      // Badge
      textLayer({
        text: style.badge,
        x: dims.width * 0.08,
        y: dims.height * 0.06,
        width: dims.width * 0.4,
        height: dims.height * 0.04,
        fontSize: Math.round(dims.width * 0.015),
        fontFamily: t.accentFont,
        fontWeight: '700',
        color: p.accent,
        textAlign: 'left',
        letterSpacing: 3,
        textTransform: 'uppercase',
      }),
    ],
  });

  // Template 2: Split Layout
  templates.push({
    id: makeId(),
    styleId: style.id,
    styleName: style.name,
    name: `${style.name} — Split Layout`,
    description: `A balanced ${style.name.toLowerCase()} layout with content on one side and visual on the other.`,
    category: 'social',
    ...dims,
    backgroundColor: p.background,
    previewColors: [p.primary, p.secondary, p.accent],
    layers: [
      // Left half color block
      shapeLayer({
        shapeType: 'rect',
        x: 0, y: 0,
        width: dims.width * 0.5,
        height: dims.height,
        color: p.primary,
      }),
      // Eyebrow
      textLayer({
        text: style.badge,
        x: dims.width * 0.06,
        y: dims.height * 0.2,
        width: dims.width * 0.4,
        height: dims.height * 0.04,
        fontSize: Math.round(dims.width * 0.015),
        fontFamily: t.accentFont,
        fontWeight: '700',
        color: p.accent,
        textAlign: 'left',
        letterSpacing: 3,
        textTransform: 'uppercase',
      }),
      // Headline on left
      textLayer({
        text: 'MAIN\nHEADLINE',
        x: dims.width * 0.06,
        y: dims.height * 0.28,
        width: dims.width * 0.4,
        height: dims.height * 0.3,
        fontSize: Math.round(dims.width * 0.065),
        fontFamily: t.headlineFont,
        fontWeight: t.headlineWeight,
        color: p.surface,
        textAlign: 'left',
        letterSpacing: t.letterSpacing,
        textTransform: t.textTransform,
        lineHeight: 1.1,
      }),
      // Body on right
      textLayer({
        text: 'Your supporting content goes here. Use this space to tell your story.',
        x: dims.width * 0.56,
        y: dims.height * 0.35,
        width: dims.width * 0.38,
        height: dims.height * 0.2,
        fontSize: Math.round(dims.width * 0.025),
        fontFamily: t.bodyFont,
        fontWeight: '400',
        color: p.textMuted,
        textAlign: 'left',
        lineHeight: 1.6,
      }),
      // Accent line on right
      shapeLayer({
        shapeType: 'rect',
        x: dims.width * 0.56,
        y: dims.height * 0.33,
        width: dims.width * 0.1,
        height: 3,
        color: p.accent,
      }),
    ],
  });

  // Template 3: Minimal Card
  templates.push({
    id: makeId(),
    styleId: style.id,
    styleName: style.name,
    name: `${style.name} — Minimal Card`,
    description: `A clean, minimal ${style.name.toLowerCase()} design centered on typography.`,
    category: 'social',
    ...dims,
    backgroundColor: p.surface,
    previewColors: [p.primary, p.accent, p.background],
    layers: [
      // Subtle background shape
      shapeLayer({
        shapeType: 'rect',
        x: dims.width * 0.05,
        y: dims.height * 0.05,
        width: dims.width * 0.9,
        height: dims.height * 0.9,
        color: p.background,
        cornerRadius: 16,
      }),
      // Category badge
      textLayer({
        text: style.badge,
        x: dims.width * 0.15,
        y: dims.height * 0.15,
        width: dims.width * 0.7,
        height: dims.height * 0.04,
        fontSize: Math.round(dims.width * 0.014),
        fontFamily: t.accentFont,
        fontWeight: '700',
        color: p.accent,
        textAlign: 'center',
        letterSpacing: 4,
        textTransform: 'uppercase',
      }),
      // Centered headline
      textLayer({
        text: 'YOUR\nHEADLINE',
        x: dims.width * 0.1,
        y: dims.height * 0.25,
        width: dims.width * 0.8,
        height: dims.height * 0.35,
        fontSize: Math.round(dims.width * 0.09),
        fontFamily: t.headlineFont,
        fontWeight: t.headlineWeight,
        color: p.primary,
        textAlign: 'center',
        letterSpacing: t.letterSpacing,
        textTransform: t.textTransform,
        lineHeight: 1.05,
      }),
      // Divider line
      shapeLayer({
        shapeType: 'rect',
        x: dims.width * 0.42,
        y: dims.height * 0.62,
        width: dims.width * 0.16,
        height: 2,
        color: p.accent,
      }),
      // Tagline
      textLayer({
        text: style.tagline,
        x: dims.width * 0.15,
        y: dims.height * 0.67,
        width: dims.width * 0.7,
        height: dims.height * 0.08,
        fontSize: Math.round(dims.width * 0.022),
        fontFamily: t.bodyFont,
        fontWeight: '400',
        color: p.textMuted,
        textAlign: 'center',
        lineHeight: 1.5,
      }),
    ],
  });

  return templates;
}

/**
 * Generate templates for ALL styles in the database.
 * Returns a flat array grouped by style.
 */
export function generateAllStyleTemplates(format: 'instagram' | 'story' | 'presentation' = 'instagram'): StyleTemplate[] {
  const allStyles = getAllStyles();
  const templates: StyleTemplate[] = [];

  for (const style of allStyles) {
    templates.push(...generateStyleTemplates(style, format));
  }

  return templates;
}

/**
 * Get a preview of templates for the style picker / dashboard
 */
export function getStylePreviewTemplates(count: number = 12): StyleTemplate[] {
  const allStyles = getAllStyles();
  // Pick one template from each of the first N styles
  return allStyles.slice(0, count).map(style => {
    const templates = generateStyleTemplates(style, 'instagram');
    return templates[0]; // Return the Bold Hero template for each
  });
}
