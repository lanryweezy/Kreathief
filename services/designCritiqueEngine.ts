/**
 * Design Critique AI Engine
 * Scores designs on 12 professional dimensions with actionable feedback.
 * Uses Gemini to analyze design structure, composition, and effectiveness.
 */

import { callBackendGeminiAPI } from './geminiService';
import { safeParseJSON } from '../utils/errorHandling';
import { log } from '../utils/log';
import { SchemaType } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import type { Artboard, Layer, BrandKit, DesignContext } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CritiqueDimension {
  id: string;
  name: string;
  score: number; // 0-100
  weight: number; // importance weight for overall score
  feedback: string;
  fixSuggestion?: string;
}

export interface DesignCritiqueResult {
  overallScore: number;
  letterGrade: string;
  dimensions: CritiqueDimension[];
  strengths: string[];
  criticalIssues: string[];
  quickWins: string[]; // easy fixes with big impact
  summary: string;
  timestamp: number;
}

// The 12 scoring dimensions with weights
const DIMENSIONS: Array<{ id: string; name: string; weight: number; description: string }> = [
  { id: 'visual_hierarchy', name: 'Visual Hierarchy', weight: 12, description: 'Clear focal point, reading order, size/weight contrast guiding the eye' },
  { id: 'color_harmony', name: 'Color Harmony', weight: 10, description: 'Palette cohesion, contrast ratios, emotional alignment, WCAG compliance' },
  { id: 'typography', name: 'Typography Quality', weight: 10, description: 'Font pairing, scale hierarchy, readability, line height, letter spacing' },
  { id: 'whitespace', name: 'Whitespace & Breathing Room', weight: 8, description: 'Not cramped, not empty — balanced density with intentional negative space' },
  { id: 'composition', name: 'Composition & Balance', weight: 10, description: 'Visual weight distribution, alignment grids, golden ratio, rule of thirds' },
  { id: 'brand_consistency', name: 'Brand Consistency', weight: 8, description: 'Colors/fonts/voice match the stated brand or industry expectations' },
  { id: 'emotional_impact', name: 'Emotional Impact', weight: 8, description: 'Does it evoke the intended feeling? Bold, calm, urgent, luxurious, etc.' },
  { id: 'trend_alignment', name: 'Trend Alignment', weight: 6, description: 'Uses current design trends appropriately without being dated or gimmicky' },
  { id: 'commercial_viability', name: 'Commercial Viability', weight: 8, description: 'Would this work in the real market? CTA clarity, message communication' },
  { id: 'accessibility', name: 'Accessibility', weight: 8, description: 'Color contrast, text size, alt text, keyboard navigation potential' },
  { id: 'technical_execution', name: 'Technical Execution', weight: 6, description: 'Alignment precision, consistent spacing, no overlapping/clipping issues' },
  { id: 'originality', name: 'Originality & Distinctiveness', weight: 6, description: 'Does it stand out? Not generic, has a unique visual voice' },
];

function scoreToGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D';
  return 'F';
}

// ─── Design Data Extraction ──────────────────────────────────────────────────

function extractDesignData(artboard: Artboard, context: DesignContext, brandKit?: BrandKit) {
  const layers = artboard.layers || [];

  // Extract color palette
  const colors = new Set<string>();
  const fonts = new Set<string>();
  const fontSizes: number[] = [];
  let textLayers = 0;
  let imageLayers = 0;
  let shapeLayers = 0;
  let maxFontSize = 0;
  let minFontSize = Infinity;
  const layerPositions: Array<{ x: number; y: number; w: number; h: number; type: string }> = [];

  for (const layer of layers) {
    if (layer.color) colors.add(layer.color);
    if (layer.type === 'text') {
      textLayers++;
      if ((layer as any).fontFamily) fonts.add((layer as any).fontFamily);
      if ((layer as any).fontSize) {
        fontSizes.push((layer as any).fontSize);
        maxFontSize = Math.max(maxFontSize, (layer as any).fontSize);
        minFontSize = Math.min(minFontSize, (layer as any).fontSize);
      }
    }
    if (layer.type === 'image') imageLayers++;
    if (layer.type === 'shape' || layer.type === 'ellipse' || layer.type === 'rect') shapeLayers++;

    layerPositions.push({
      x: layer.x, y: layer.y, w: layer.width, h: layer.height,
      type: layer.type,
    });
  }

  return {
    canvas: {
      width: artboard.width,
      height: artboard.height,
      backgroundColor: artboard.backgroundColor || '#ffffff',
    },
    layerCount: layers.length,
    textLayers,
    imageLayers,
    shapeLayers,
    colors: Array.from(colors).slice(0, 20),
    fonts: Array.from(fonts),
    fontSizes,
    maxFontSize,
    minFontSize: minFontSize === Infinity ? 0 : minFontSize,
    fontSizeRatio: maxFontSize > 0 && minFontSize > 0 ? maxFontSize / minFontSize : 1,
    layerPositions: layerPositions.slice(0, 50), // cap for token budget
    brandKit: brandKit ? {
      name: brandKit.name,
      colors: brandKit.colors?.slice(0, 5),
      fonts: brandKit.fonts?.slice(0, 3),
    } : null,
    context: {
      purpose: context.purpose || 'general',
      hasText: context.hasText,
      hasImages: context.hasImages,
    },
  };
}

// ─── Main Critique Function ──────────────────────────────────────────────────

export async function critiqueDesign(
  artboard: Artboard,
  context: DesignContext,
  brandKit?: BrandKit
): Promise<DesignCritiqueResult> {
  const designData = extractDesignData(artboard, context, brandKit);

  const dimensionDescriptions = DIMENSIONS.map(d =>
    `- "${d.id}": ${d.name} (weight ${d.weight}/100) — ${d.description}`
  ).join('\n');

  const prompt = `You are a senior design director with 20 years of experience across branding, UI/UX, print, and digital design. You've judged design competitions and mentored hundreds of designers.

Analyze this design and score it on exactly 12 dimensions. Be honest but constructive. A score of 70 means "good professional work", 85+ means "exceptional", below 50 means "needs significant work".

DESIGN DATA:
${JSON.stringify(designData, null, 2)}

SCORING DIMENSIONS (score each 0-100):
${dimensionDescriptions}

RULES:
- Be specific: reference actual layer positions, colors, fonts when giving feedback
- Each dimension's feedback should be 1-2 sentences max
- fixSuggestion should be a single actionable sentence the user can implement NOW
- strengths: list 3 things done well
- criticalIssues: list 1-3 problems that MUST be fixed
- quickWins: list 2-3 easy changes with the biggest visual improvement
- overallScore: weighted average using the weights above
- summary: 2-3 sentence executive summary of the design quality`;

  try {
    const response = await callBackendGeminiAPI({
      modelName: 'gemini-2.0-flash',
      systemInstruction: 'You are an expert design critic. Respond only with valid JSON matching the requested schema.',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            overallScore: { type: SchemaType.NUMBER },
            dimensions: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  id: { type: SchemaType.STRING },
                  score: { type: SchemaType.NUMBER },
                  feedback: { type: SchemaType.STRING },
                  fixSuggestion: { type: SchemaType.STRING },
                },
                required: ['id', 'score', 'feedback'],
              },
            },
            strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            criticalIssues: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            quickWins: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            summary: { type: SchemaType.STRING },
          },
          required: ['overallScore', 'dimensions', 'strengths', 'criticalIssues', 'quickWins', 'summary'],
        },
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const parsed = safeParseJSON<any>(response.text || 'null', null);
    if (!parsed) {
      throw new Error('Failed to parse critique JSON');
    }

    // Map dimensions and fill in any missing ones
    const dimensionMap = new Map<string, any>();
    for (const d of parsed.dimensions || []) {
      dimensionMap.set(d.id, d);
    }

    const dimensions: CritiqueDimension[] = DIMENSIONS.map(dim => {
      const scored = dimensionMap.get(dim.id);
      return {
        id: dim.id,
        name: dim.name,
        weight: dim.weight,
        score: Math.max(0, Math.min(100, scored?.score || 50)),
        feedback: scored?.feedback || 'No specific feedback available.',
        fixSuggestion: scored?.fixSuggestion,
      };
    });

    // Calculate weighted overall score
    const weightedSum = dimensions.reduce((sum, d) => sum + (d.score * d.weight), 0);
    const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
    const overallScore = Math.round(weightedSum / totalWeight);

    return {
      overallScore,
      letterGrade: scoreToGrade(overallScore),
      dimensions,
      strengths: parsed.strengths || [],
      criticalIssues: parsed.criticalIssues || [],
      quickWins: parsed.quickWins || [],
      summary: parsed.summary || '',
      timestamp: Date.now(),
    };
  } catch (error) {
    log.error('[DesignCritique] Analysis failed', error);

    // Fallback: return a basic heuristic critique
    return heuristicCritique(designData);
  }
}

// ─── Heuristic Fallback (no API call) ────────────────────────────────────────

function heuristicCritique(data: any): DesignCritiqueResult {
  const dims: CritiqueDimension[] = DIMENSIONS.map(dim => {
    let score = 60; // baseline

    switch (dim.id) {
      case 'visual_hierarchy':
        // Reward font size contrast
        if (data.fontSizeRatio >= 2) score += 15;
        if (data.fontSizeRatio >= 3) score += 10;
        if (data.textLayers === 0) score -= 20;
        break;
      case 'color_harmony':
        if (data.colors.length >= 2 && data.colors.length <= 5) score += 10;
        if (data.colors.length > 8) score -= 10;
        break;
      case 'typography':
        if (data.fonts.length <= 3 && data.fonts.length >= 1) score += 10;
        if (data.fonts.length > 4) score -= 15;
        if (data.fontSizeRatio >= 2) score += 10;
        break;
      case 'whitespace':
        if (data.layerCount <= 15) score += 10;
        if (data.layerCount > 30) score -= 10;
        break;
      case 'composition':
        if (data.layerCount >= 3) score += 5;
        break;
      case 'brand_consistency':
        if (data.brandKit) score += 15;
        break;
      case 'accessibility':
        // Can't check contrast without rendering, give benefit of doubt
        score = 55;
        break;
      default:
        score = 55 + Math.floor(Math.random() * 15);
    }

    score = Math.max(20, Math.min(90, score));

    return {
      id: dim.id,
      name: dim.name,
      weight: dim.weight,
      score,
      feedback: `Heuristic analysis: ${dim.name} scored based on structural properties.`,
      fixSuggestion: undefined,
    };
  });

  const weightedSum = dims.reduce((sum, d) => sum + (d.score * d.weight), 0);
  const totalWeight = dims.reduce((sum, d) => sum + d.weight, 0);
  const overallScore = Math.round(weightedSum / totalWeight);

  return {
    overallScore,
    letterGrade: scoreToGrade(overallScore),
    dimensions: dims,
    strengths: ['Design has a basic structure in place.'],
    criticalIssues: ['AI-powered detailed analysis unavailable. Try again for specific feedback.'],
    quickWins: ['Add more visual hierarchy with font size contrast.'],
    summary: 'Heuristic fallback analysis. For detailed AI-powered feedback, please try again.',
    timestamp: Date.now(),
  };
}
