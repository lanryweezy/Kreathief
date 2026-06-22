import { Layer, Artboard } from '../types';

/**
 * Utility functions for design analysis and critique
 */

/**
 * Calculate color contrast ratio between two colors
 */
export const calculateContrast = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (lightest + 0.05) / (darkest + 0.05);
};

/**
 * Check if contrast meets WCAG standards
 */
export const meetsWCAGContrast = (
  color1: string,
  color2: string,
  isLargeText: boolean = false
): { passes: boolean; ratio: number; level: 'AA' | 'AAA' | 'fail' } => {
  const ratio = calculateContrast(color1, color2);
  const minRatio = isLargeText ? 3 : 4.5;
  const aaaRatio = isLargeText ? 4.5 : 7;

  if (ratio >= aaaRatio) {
    return { passes: true, ratio, level: 'AAA' };
  } else if (ratio >= minRatio) {
    return { passes: true, ratio, level: 'AA' };
  } else {
    return { passes: false, ratio, level: 'fail' };
  }
};

/**
 * Analyze text layers for readability issues
 */
export const analyzeTextReadability = (textLayers: Layer[], backgroundColor: string) => {
  const issues: Array<{
    layerId: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
  }> = [];

  textLayers.forEach((layer) => {
    const textLayer = layer as any; // Type assertion for text properties

    // Check contrast
    if (textLayer.color && backgroundColor) {
      const contrast = meetsWCAGContrast(textLayer.color, backgroundColor, textLayer.fontSize >= 18);

      if (!contrast.passes) {
        issues.push({
          layerId: layer.id,
          issue: `Low contrast ratio (${contrast.ratio.toFixed(1)}:1). Text may be hard to read.`,
          severity: contrast.ratio < 3 ? 'high' : 'medium',
        });
      }
    }

    // Check font size
    if (textLayer.fontSize < 12) {
      issues.push({
        layerId: layer.id,
        issue: 'Font size is very small and may be hard to read.',
        severity: 'medium',
      });
    }

    // Check text length on small fonts
    if (textLayer.fontSize < 16 && textLayer.text?.length > 100) {
      issues.push({
        layerId: layer.id,
        issue: 'Long text with small font size reduces readability.',
        severity: 'medium',
      });
    }

    // Check for all caps
    if (textLayer.text === textLayer.text?.toUpperCase() && textLayer.text.length > 20) {
      issues.push({
        layerId: layer.id,
        issue: 'Long text in all caps can be hard to read.',
        severity: 'low',
      });
    }
  });

  return issues;
};

/**
 * Analyze layout and composition
 */
export const analyzeLayout = (artboard: Artboard) => {
  const issues: Array<{
    issue: string;
    severity: 'low' | 'medium' | 'high';
    category: string;
  }> = [];

  const layers = artboard.layers.filter((l) => l.visible);

  // Check for overcrowding
  const layerDensity = (layers.length / (artboard.width * artboard.height)) * 1000000;
  if (layerDensity > 5) {
    issues.push({
      issue: 'Design may be overcrowded. Consider simplifying or using more whitespace.',
      severity: 'medium',
      category: 'layout',
    });
  }

  // Check for proper hierarchy
  const textLayers = layers.filter((l) => l.type === 'text') as any[];
  const fontSizes = textLayers.map((l) => l.fontSize || 16).sort((a, b) => b - a);

  if (fontSizes.length > 1) {
    const sizeDifference = fontSizes[0] - fontSizes[1];
    if (sizeDifference < 4) {
      issues.push({
        issue: 'Text hierarchy could be improved with more distinct font sizes.',
        severity: 'low',
        category: 'typography',
      });
    }
  }

  // Check for alignment
  const leftAlignedElements = layers.filter((l) => l.x < artboard.width * 0.1).length;
  const centerAlignedElements = layers.filter(
    (l) => Math.abs(l.x + l.width / 2 - artboard.width / 2) < artboard.width * 0.05
  ).length;
  const rightAlignedElements = layers.filter((l) => l.x + l.width > artboard.width * 0.9).length;

  if (leftAlignedElements === 0 && centerAlignedElements === 0 && rightAlignedElements === 0) {
    issues.push({
      issue: 'Elements appear randomly positioned. Consider using alignment for better visual structure.',
      severity: 'medium',
      category: 'layout',
    });
  }

  // Check for whitespace
  const totalLayerArea = layers.reduce((sum, layer) => sum + layer.width * layer.height, 0);
  const canvasArea = artboard.width * artboard.height;
  const whitespaceRatio = (canvasArea - totalLayerArea) / canvasArea;

  if (whitespaceRatio < 0.3) {
    issues.push({
      issue: 'Consider adding more whitespace to improve visual breathing room.',
      severity: 'low',
      category: 'layout',
    });
  }

  return issues;
};

/**
 * Extract dominant colors from design
 */
export const extractColorPalette = (artboard: Artboard): string[] => {
  const colors = new Set<string>();

  // Add background color
  if (artboard.backgroundColor) {
    colors.add(artboard.backgroundColor);
  }

  // Extract colors from layers
  artboard.layers.forEach((layer) => {
    if (layer.type === 'text' && (layer as any).color) {
      colors.add((layer as any).color);
    } else if (['rectangle', 'circle', 'triangle', 'star'].includes(layer.type) && (layer as any).color) {
      colors.add((layer as any).color);
    }
  });

  return Array.from(colors);
};

/**
 * Calculate design complexity score
 */
export const calculateComplexityScore = (
  artboard: Artboard
): {
  score: number; // 0-100, lower is simpler
  factors: Array<{ factor: string; impact: number; description: string }>;
} => {
  const factors: Array<{ factor: string; impact: number; description: string }> = [];
  let score = 0;

  const layers = artboard.layers.filter((l) => l.visible);

  // Layer count impact
  const layerImpact = Math.min(layers.length * 3, 30);
  score += layerImpact;
  factors.push({
    factor: 'Layer Count',
    impact: layerImpact,
    description: `${layers.length} visible layers`,
  });

  // Color variety impact
  const colors = extractColorPalette(artboard);
  const colorImpact = Math.min(colors.length * 2, 20);
  score += colorImpact;
  factors.push({
    factor: 'Color Variety',
    impact: colorImpact,
    description: `${colors.length} different colors`,
  });

  // Font variety impact
  const fonts = new Set(
    layers
      .filter((l) => l.type === 'text')
      .map((l) => (l as any).fontFamily)
      .filter(Boolean)
  );
  const fontImpact = Math.min(fonts.size * 5, 25);
  score += fontImpact;
  factors.push({
    factor: 'Font Variety',
    impact: fontImpact,
    description: `${fonts.size} different fonts`,
  });

  // Size variety impact
  const textSizes = layers.filter((l) => l.type === 'text').map((l) => (l as any).fontSize || 16);
  const uniqueSizes = new Set(textSizes);
  const sizeImpact = Math.min(uniqueSizes.size * 2, 15);
  score += sizeImpact;
  factors.push({
    factor: 'Size Variety',
    impact: sizeImpact,
    description: `${uniqueSizes.size} different text sizes`,
  });

  // Transformation complexity (rotation, skew, etc.)
  const transformedLayers = layers.filter(
    (l) =>
      (l.rotation && Math.abs(l.rotation) > 5) ||
      ((l as any).skewX && Math.abs((l as any).skewX) > 5) ||
      ((l as any).skewY && Math.abs((l as any).skewY) > 5)
  );
  const transformImpact = transformedLayers.length * 3;
  score += transformImpact;
  factors.push({
    factor: 'Transformations',
    impact: transformImpact,
    description: `${transformedLayers.length} transformed elements`,
  });

  return {
    score: Math.min(score, 100),
    factors,
  };
};
