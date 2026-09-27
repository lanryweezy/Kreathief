/**
 * vectorQuality/analyzer.ts
 * ------------------------------------------------------------------
 * Pure, DOM-free SVG quality analyzer used by the vector output-quality
 * benchmark. It answers a single, falsifiable question about a *string*
 * of SVG: is this real, editable vector — or a raster wearing a trench
 * coat?
 *
 * Everything is regex/character scanning (no DOMParser) so the same code
 * runs under Node in the vitest benchmark and can score competitor exports
 * dropped into `verification/vector-quality/competitors/`.
 *
 * NOTE: this is deliberately separate from `metrics.ts` (MultiJudgeEvalService,
 * the geometry-judge). Same folder, different concern — do not merge them.
 */

export interface VectorQualityMetrics {
  label: string;
  // Structural sanity
  wellFormed: boolean;
  hasViewBox: boolean;
  nanTokens: number;
  undefinedTokens: number;
  emptyGroups: number;
  // The critical claim: no smuggled raster
  rasterImages: number;
  hiddenRasterInClip: number;
  // Editable vector content
  vectorPrimitives: number;
  pathElements: number;
  editableText: number;
  // Curve / anchor profile (traced-raster tell)
  totalCurves: number;
  curveRatio: number;
  totalAnchors: number;
  maxAnchorsPerPath: number;
  distinctFills: number;
  // Composite 0-100 (higher = cleaner, more editable)
  score: number;
}

const GEOMETRY_TAGS = ['path', 'rect', 'ellipse', 'circle', 'line', 'polygon', 'polyline'];

const countMatches = (haystack: string, re: RegExp): number => (haystack.match(re) || []).length;

/** Count anchor-producing commands in a single path `d` (Z/ZZ are excluded). */
const anchorsInPath = (d: string): number => countMatches(d, /[MLHVCTSAmlhvctsa]/g);

/** Count curve commands (bezier / arc) in a single path `d`. */
const curvesInPath = (d: string): number => countMatches(d, /[CSQTAcsqta]/g);

const extractPathDs = (svg: string): string[] => {
  const ds: string[] = [];
  const re = /<path\b[^>]*\sd="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg)) !== null) ds.push(m[1]);
  return ds;
};

const extractFills = (svg: string): string[] => {
  const fills: string[] = [];
  for (const tag of GEOMETRY_TAGS) {
    const re = new RegExp(`<${tag}\\b[^>]*\\sfill="([^"]*)"`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(svg)) !== null) {
      const v = m[1].trim();
      if (v && v.toLowerCase() !== 'none' && v.toLowerCase() !== 'transparent') fills.push(v.toLowerCase());
    }
  }
  return fills;
};

export function analyzeSvg(svg: string, label = 'untitled'): VectorQualityMetrics {
  const trimmed = svg.trim();

  const wellFormed = /^<svg\b[\s\S]*<\/svg>$/.test(trimmed);
  const hasViewBox = /\sviewBox="/i.test(trimmed);
  const nanTokens = countMatches(svg, /NaN/g);
  const undefinedTokens = countMatches(svg, /undefined/g);
  // A <g> with only whitespace (and optional comments) between its tags.
  const emptyGroups =
    countMatches(svg, /<g\b[^>]*>(?:\s|<!--[\s\S]*?-->)*<\/g>/g);

  // Raster detection.
  const imageTags = svg.match(/<image\b[^>]*>/g) || [];
  const rasterImages = imageTags.length;
  const hiddenRasterInClip = imageTags.filter(
    (t) =>
      /\sclip-path\s*=/.test(t) ||
      /display\s*:\s*none/i.test(t) ||
      /visibility\s*:\s*hidden/i.test(t) ||
      /\sopacity\s*=\s*["']0["']/.test(t),
  ).length;

  // Editable geometry.
  const pathElements = countMatches(svg, /<path\b/g);
  const primitiveCounts = GEOMETRY_TAGS.map((tag) => countMatches(svg, new RegExp(`<${tag}\\b`, 'g')));
  const vectorPrimitives = primitiveCounts.reduce((a, b) => a + b, 0);
  const editableText = countMatches(svg, /<text\b/g);

  // Curve / anchor profile.
  const ds = extractPathDs(svg);
  let totalAnchors = 0;
  let totalCurves = 0;
  let maxAnchorsPerPath = 0;
  for (const d of ds) {
    const a = anchorsInPath(d);
    totalAnchors += a;
    totalCurves += curvesInPath(d);
    if (a > maxAnchorsPerPath) maxAnchorsPerPath = a;
  }
  const curveRatio = totalAnchors > 0 ? totalCurves / totalAnchors : 0;

  const distinctFills = new Set(extractFills(svg)).size;

  // ---- Composite score (falsifiable, penalises the real failure modes) ----
  let score = 100;
  if (!wellFormed) score -= 40;
  if (!hasViewBox) score -= 15;
  score -= Math.min(40, nanTokens * 20);
  score -= Math.min(40, undefinedTokens * 20);
  score -= Math.min(15, emptyGroups * 5);
  score -= Math.min(60, rasterImages * 40);
  score -= Math.min(30, hiddenRasterInClip * 15);
  if (maxAnchorsPerPath >= 200) score -= 20; // suspiciously dense → likely auto-traced
  if (vectorPrimitives + editableText === 0) score -= 30; // nothing editable at all
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    label,
    wellFormed,
    hasViewBox,
    nanTokens,
    undefinedTokens,
    emptyGroups,
    rasterImages,
    hiddenRasterInClip,
    vectorPrimitives,
    pathElements,
    editableText,
    totalCurves,
    curveRatio,
    totalAnchors,
    maxAnchorsPerPath,
    distinctFills,
    score,
  };
}
