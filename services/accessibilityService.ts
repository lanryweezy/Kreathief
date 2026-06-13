import { Artboard, TextLayer, ImageLayer } from '../types';
import { getContrastRatio } from '../utils/colorUtils';

export interface AccessibilityIssue {
  id: string;
  layerId: string;
  layerName: string;
  type: 'contrast' | 'alt-text' | 'font-size' | 'overlapping';
  severity: 'error' | 'warning';
  message: string;
  suggestion: string;
}

export interface AccessibilityAuditResult {
  score: number; // 0-100
  issues: AccessibilityIssue[];
  passedCount: number;
}

export const runAccessibilityAudit = (artboard: Artboard): AccessibilityAuditResult => {
  const issues: AccessibilityIssue[] = [];
  const layers = artboard.layers;
  const bg = artboard.backgroundColor || '#ffffff';

  let totalChecks = 0;
  let passedChecks = 0;

  layers.forEach((layer) => {
    if (!layer.visible) return;

    // 1. Check Contrast for Text
    if (layer.type === 'text') {
      totalChecks++;
      const textLayer = layer as TextLayer;
      const ratio = getContrastRatio(textLayer.color, bg);
      
      // WCAG AA: 4.5:1 for normal text, 3:1 for large text
      const isLarge = textLayer.fontSize >= 18 || (textLayer.fontSize >= 14 && textLayer.fontWeight === '700');
      const threshold = isLarge ? 3 : 4.5;

      if (ratio < threshold) {
        issues.push({
          id: `contrast_${layer.id}`,
          layerId: layer.id,
          layerName: layer.name || 'Text Layer',
          type: 'contrast',
          severity: ratio < 3 ? 'error' : 'warning',
          message: `Low contrast ratio (${ratio.toFixed(2)}:1). Minimum required is ${threshold}:1.`,
          suggestion: 'Adjust text or background color to improve legibility.'
        });
      } else {
        passedChecks++;
      }

      // 2. Check Font Size
      totalChecks++;
      if (textLayer.fontSize < 12) {
        issues.push({
          id: `font_size_${layer.id}`,
          layerId: layer.id,
          layerName: layer.name || 'Text Layer',
          type: 'font-size',
          severity: 'warning',
          message: `Small font size (${textLayer.fontSize}px).`,
          suggestion: 'Increase font size to at least 12px for better readability.'
        });
      } else {
        passedChecks++;
      }
    }

    // 3. Check Alt Text for Images
    if (layer.type === 'image') {
      totalChecks++;
      const imgLayer = layer as ImageLayer;
      if (!imgLayer.altText || imgLayer.altText.trim() === '') {
        issues.push({
          id: `alt_text_${layer.id}`,
          layerId: layer.id,
          layerName: layer.name || 'Image Layer',
          type: 'alt-text',
          severity: 'error',
          message: 'Missing alternative text.',
          suggestion: 'Add descriptive alt text for screen reader users.'
        });
      } else {
        passedChecks++;
      }
    }
  });

  const score = totalChecks === 0 ? 100 : Math.round((passedChecks / totalChecks) * 100);

  return {
    score,
    issues,
    passedCount: passedChecks
  };
};
