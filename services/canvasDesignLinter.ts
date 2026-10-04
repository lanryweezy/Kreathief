/**
 * Canvas Design Linter & Real-Time Health Engine
 *
 * Real-time, deterministic, client-side design audit engine (<5ms execution).
 * Evaluates layered canvas artboards against WCAG contrast, safe-zone margins,
 * optical alignment, typography hierarchy, and readability rules.
 * Generates surgical 1-click auto-fixes for every discovered defect.
 */

import { Artboard, Layer, TextLayer, ShapeLayer } from '../types';
import { getContrastRatio } from '../utils/colorUtils';
import { classifyLayerRole } from './smartResizeEngine';

export type LintRuleId =
  | 'RULE_WCAG_CONTRAST'
  | 'RULE_SAFE_ZONE_BLEED'
  | 'RULE_HIERARCHY_INVERSION'
  | 'RULE_OFF_AXIS_DRIFT'
  | 'RULE_CROWDED_TYPOGRAPHY'
  | 'RULE_EMPTY_PLACEHOLDER';

export interface DesignLintIssue {
  id: string;
  rule: LintRuleId;
  severity: 'error' | 'warning' | 'info';
  layerId: string;
  layerName: string;
  message: string;
  category: 'contrast' | 'alignment' | 'hierarchy' | 'geometry' | 'content';
  autoFix?: {
    label: string;
    patch: Partial<Layer>;
  };
}

export interface DesignLintReport {
  score: number; // 0 to 100
  passed: boolean;
  issues: DesignLintIssue[];
  metrics: {
    contrastIssues: number;
    alignmentIssues: number;
    safeZoneIssues: number;
    hierarchyIssues: number;
    contentIssues: number;
  };
}

/**
 * Finds the effective background color underneath a specific layer.
 * Looks for overlapping shapes immediately beneath the layer; falls back to canvas background.
 */
export function getEffectiveBackgroundColor(
  layer: Layer,
  allLayers: Layer[],
  canvasBg: string
): string {
  const layerIndex = allLayers.findIndex((l) => l.id === layer.id);
  const lx = layer.x;
  const ly = layer.y;
  const lw = (layer as any).width || 100;
  const lh = (layer as any).height || 40;
  const centerX = lx + lw / 2;
  const centerY = ly + lh / 2;

  // Search downwards through layers below this layer
  for (let i = layerIndex - 1; i >= 0; i--) {
    const candidate = allLayers[i];
    if (!candidate || !candidate.visible || candidate.opacity === 0) continue;

    const cx = candidate.x;
    const cy = candidate.y;
    const cw = (candidate as any).width || 0;
    const ch = (candidate as any).height || 0;

    // Check if the center of our layer falls inside the candidate's bounds
    const containsCenter =
      centerX >= cx &&
      centerX <= cx + cw &&
      centerY >= cy &&
      centerY <= cy + ch;

    if (containsCenter) {
      if (candidate.type === 'rectangle' || candidate.type === 'circle') {
        const color = (candidate as ShapeLayer).color;
        if (color && typeof color === 'string' && color.startsWith('#')) {
          return color;
        }
      }
    }
  }

  return canvasBg || '#ffffff';
}

/**
 * Executes a full deterministic lint audit on an Artboard.
 */
export function lintArtboardDesign(
  artboard: Artboard,
  canvasBg: string = '#090a15'
): DesignLintReport {
  const issues: DesignLintIssue[] = [];
  const layers = artboard.layers || [];
  const W = artboard.width || 1080;
  const H = artboard.height || 1080;
  const artboardBg = artboard.backgroundColor || canvasBg;

  const safeMargin = Math.max(16, Math.round(Math.min(W, H) * 0.025)); // 2.5% safe margin
  const textLayers = layers.filter((l) => l.visible !== false && l.type === 'text') as TextLayer[];

  // Determine primary headline
  let maxHeadlineFontSize = 0;
  let headlineLayer: TextLayer | null = null;
  for (const t of textLayers) {
    const role = classifyLayerRole(t, layers, W, H);
    if (role === 'headline' && (t.fontSize || 0) > maxHeadlineFontSize) {
      maxHeadlineFontSize = t.fontSize || 0;
      headlineLayer = t;
    }
  }

  for (const layer of layers) {
    if (layer.visible === false) continue;

    const lw = (layer as any).width || 0;
    const lh = (layer as any).height || 0;
    const name = layer.name || `${layer.type}_${layer.id.slice(0, 4)}`;
    const role = classifyLayerRole(layer, layers, W, H);
    const isBg = role === 'background' || (layer as any).isBackground || (lw >= W * 0.95 && lh >= H * 0.95);

    // ─── 1. SAFE ZONE BLEED CHECK ──────────────────────────────────────────
    if (!isBg) {
      const outLeft = layer.x < safeMargin;
      const outTop = layer.y < safeMargin;
      const outRight = layer.x + lw > W - safeMargin;
      const outBottom = layer.y + lh > H - safeMargin;

      if (outLeft || outTop || outRight || outBottom) {
        const clampedX = Math.max(safeMargin, Math.min(W - safeMargin - lw, layer.x));
        const clampedY = Math.max(safeMargin, Math.min(H - safeMargin - lh, layer.y));

        issues.push({
          id: `bleed_${layer.id}`,
          rule: 'RULE_SAFE_ZONE_BLEED',
          severity: layer.x < 0 || layer.y < 0 || layer.x + lw > W || layer.y + lh > H ? 'error' : 'warning',
          layerId: layer.id,
          layerName: name,
          category: 'geometry',
          message: `Element extends into the ${safeMargin}px canvas edge safe margin.`,
          autoFix: {
            label: 'Snap element inside safe-zone margin',
            patch: { x: clampedX, y: clampedY },
          },
        });
      }
    }

    // ─── 2. OFF-AXIS DRIFT (Almost centered) ─────────────────────────────────
    if (!isBg && lw > 0 && lw < W * 0.9) {
      const idealCenterX = Math.round((W - lw) / 2);
      const deltaCenter = Math.abs(layer.x - idealCenterX);
      if (deltaCenter >= 1 && deltaCenter <= 8) {
        issues.push({
          id: `drift_${layer.id}`,
          rule: 'RULE_OFF_AXIS_DRIFT',
          severity: 'info',
          layerId: layer.id,
          layerName: name,
          category: 'alignment',
          message: `Element is off-center by ${deltaCenter}px.`,
          autoFix: {
            label: 'Align perfectly to horizontal center axis',
            patch: { x: idealCenterX },
          },
        });
      }
    }

    // ─── 3. TEXT-SPECIFIC AUDITS ────────────────────────────────────────────
    if (layer.type === 'text') {
      const txt = layer as TextLayer;
      const textContent = (txt.text || '').trim();
      const lower = textContent.toLowerCase();

      // Placeholder content detection
      if (
        lower === 'lorem ipsum' ||
        lower.startsWith('lorem ipsum dolor') ||
        lower === 'headline here' ||
        lower === 'title here' ||
        lower === 'your text' ||
        textContent === ''
      ) {
        const suggestedCopy =
          role === 'headline'
            ? 'Craft Extraordinary Designs'
            : role === 'subheadline'
              ? 'Empowering modern creators with AI-accelerated workflows'
              : 'Explore Collection';

        issues.push({
          id: `placeholder_${layer.id}`,
          rule: 'RULE_EMPTY_PLACEHOLDER',
          severity: 'warning',
          layerId: layer.id,
          layerName: name,
          category: 'content',
          message: `Placeholder dummy copy detected ("${textContent || 'empty'}").`,
          autoFix: {
            label: `Replace placeholder with "${suggestedCopy}"`,
            patch: { text: suggestedCopy },
          },
        });
      }

      // Negative tracking on small text
      if ((txt.fontSize || 24) < 16 && (txt.letterSpacing || 0) < -0.5) {
        issues.push({
          id: `tracking_${layer.id}`,
          rule: 'RULE_CROWDED_TYPOGRAPHY',
          severity: 'warning',
          layerId: layer.id,
          layerName: name,
          category: 'hierarchy',
          message: `Negative letter spacing (${txt.letterSpacing}px) impairs legibility on small typography.`,
          autoFix: {
            label: 'Reset letter-spacing to 0px',
            patch: { letterSpacing: 0 },
          },
        });
      }

      // Hierarchy Inversion
      if (headlineLayer && txt.id !== headlineLayer.id && role === 'subheadline') {
        if ((txt.fontSize || 0) > (headlineLayer.fontSize || 0)) {
          const suggestedSize = Math.max(14, Math.round((headlineLayer.fontSize || 40) * 0.6));
          issues.push({
            id: `hierarchy_${layer.id}`,
            rule: 'RULE_HIERARCHY_INVERSION',
            severity: 'error',
            layerId: layer.id,
            layerName: name,
            category: 'hierarchy',
            message: `Subheadline (${txt.fontSize}px) is larger than headline (${headlineLayer.fontSize}px).`,
            autoFix: {
              label: `Scale subheadline font to ${suggestedSize}px`,
              patch: { fontSize: suggestedSize },
            },
          });
        }
      }

      // ─── 4. WCAG CONTRAST AUDIT ───────────────────────────────────────────
      const effectiveBg = getEffectiveBackgroundColor(layer, layers, artboardBg);
      const textColor = txt.color || '#ffffff';
      const contrast = getContrastRatio(textColor, effectiveBg);
      const isLargeText = (txt.fontSize || 24) >= 18 || ((txt.fontSize || 24) >= 14 && txt.fontWeight === 'bold');
      const minRequiredContrast = isLargeText ? 3.0 : 4.5;

      if (contrast < minRequiredContrast) {
        // Compute best auto-fix color
        const whiteContrast = getContrastRatio('#ffffff', effectiveBg);
        const blackContrast = getContrastRatio('#000000', effectiveBg);
        const optimalColor = whiteContrast >= blackContrast ? '#ffffff' : '#000000';

        issues.push({
          id: `contrast_${layer.id}`,
          rule: 'RULE_WCAG_CONTRAST',
          severity: contrast < 2.5 ? 'error' : 'warning',
          layerId: layer.id,
          layerName: name,
          category: 'contrast',
          message: `Contrast ratio is ${contrast.toFixed(2)}:1 against background (fails WCAG ${minRequiredContrast}:1 requirement).`,
          autoFix: {
            label: `Switch text color to ${optimalColor === '#ffffff' ? 'White (#ffffff)' : 'Black (#000000)'}`,
            patch: { color: optimalColor },
          },
        });
      }
    }
  }

  // Calculate Health Score (100 base, deducted by severity)
  let penalty = 0;
  for (const iss of issues) {
    if (iss.severity === 'error') penalty += 15;
    else if (iss.severity === 'warning') penalty += 5;
    else penalty += 2;
  }
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return {
    score,
    passed: score >= 85 && issues.every((i) => i.severity !== 'error'),
    issues,
    metrics: {
      contrastIssues: issues.filter((i) => i.category === 'contrast').length,
      alignmentIssues: issues.filter((i) => i.category === 'alignment').length,
      safeZoneIssues: issues.filter((i) => i.category === 'geometry').length,
      hierarchyIssues: issues.filter((i) => i.category === 'hierarchy').length,
      contentIssues: issues.filter((i) => i.category === 'content').length,
    },
  };
}

/**
 * Applies a single surgical 1-click fix to an Artboard.
 */
export function applyLintAutoFix(artboard: Artboard, issue: DesignLintIssue): Artboard {
  if (!issue.autoFix) return artboard;
  const patch = issue.autoFix.patch;

  return {
    ...artboard,
    layers: artboard.layers.map((l) => (l.id === issue.layerId ? { ...l, ...patch } as unknown as Layer : l)),
  };
}

/**
 * Applies all available deterministic auto-fixes to an Artboard in one pass.
 */
export function applyAllLintAutoFixes(artboard: Artboard, issues: DesignLintIssue[]): Artboard {
  const patchesByLayerId = new Map<string, any>();

  for (const issue of issues) {
    if (issue.autoFix) {
      const existing = patchesByLayerId.get(issue.layerId) || {};
      patchesByLayerId.set(issue.layerId, { ...existing, ...issue.autoFix.patch });
    }
  }

  return {
    ...artboard,
    layers: artboard.layers.map((l) => {
      const patch = patchesByLayerId.get(l.id);
      return patch ? { ...l, ...patch } as unknown as Layer : l;
    }),
  };
}

/** Alias for lintArtboardDesign */
export const lintCanvasDesign = lintArtboardDesign;
