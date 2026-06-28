import { log } from '../utils/log';

/**
 * Feature 8: SVG AI Generation — generate editable SVG icons/illustrations from text prompts.
 * "Describe an icon" → AI generates editable SVG paths.
 */
export async function generateSVGFromPrompt(
  prompt: string,
  width: number = 100,
  height: number = 100,
  style: 'filled' | 'outlined' | 'duotone' = 'filled'
): Promise<string | null> {
  const stylePrompts: Record<string, string> = {
    filled: 'solid filled vector icon, flat design, clean edges',
    outlined: 'outline vector icon, stroke-based, minimal',
    duotone: 'duotone vector icon, two-color design, modern',
  };

  const fullPrompt = `Generate a clean SVG icon: ${prompt}. Style: ${stylePrompts[style]}. Output only valid SVG markup with proper viewBox, no text, no raster elements, only paths and shapes. Keep it simple and iconic.`;

  try {
    // Try Gemini for SVG generation
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generateSVG',
        prompt: fullPrompt,
        width,
        height,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const svgContent = result.svg || result.text || result.image;

      if (svgContent && svgContent.includes('<svg')) {
        // Extract and clean the SVG
        const cleaned = cleanSVG(svgContent, width, height);
        return cleaned;
      }
    }
  } catch (err) {
    log.warn('[SVGGen] Gemini SVG generation failed', { error: err });
  }

  // Fallback: generate from a curated icon library
  return generateFallbackSVG(prompt, width, height, style);
}

/**
 * Clean and validate SVG output from AI.
 */
function cleanSVG(svg: string, targetWidth: number, targetHeight: number): string {
  // Remove any non-SVG content before/after
  const svgMatch = svg.match(/<svg[\s\S]*?<\/svg>/i);
  if (!svgMatch) {
    return svg;
  }

  let cleaned = svgMatch[0];

  // Ensure proper viewBox
  if (!cleaned.includes('viewBox')) {
    cleaned = cleaned.replace('<svg', `<svg viewBox="0 0 ${targetWidth} ${targetHeight}"`);
  }

  // Ensure xmlns
  if (!cleaned.includes('xmlns')) {
    cleaned = cleaned.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // Remove any script tags (security)
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Remove any event handlers
  cleaned = cleaned.replace(/\s*on\w+="[^"]*"/gi, '');

  return cleaned;
}

/**
 * Fallback SVG generation from a curated icon set.
 */
function generateFallbackSVG(prompt: string, width: number, height: number, style: string): string {
  const lower = prompt.toLowerCase();

  // Simple keyword-to-SVG mapping for common icons
  const iconMap: Record<string, string> = {
    star: `<polygon points="${width / 2},${height * 0.05} ${width * 0.618},${height * 0.382} ${width * 0.976},${height * 0.382} ${width * 0.682},${height * 0.618} ${width * 0.788},${height * 0.976} ${width / 2},${height * 0.75} ${width * 0.212},${height * 0.976} ${width * 0.318},${height * 0.618} ${width * 0.024},${height * 0.382} ${width * 0.382},${height * 0.382}" fill="currentColor"/>`,
    heart: `<path d="M${width / 2} ${height * 0.85} C${width * 0.2} ${height * 0.6} ${width * 0.05} ${height * 0.35} ${width * 0.05} ${height * 0.25} C${width * 0.05} ${height * 0.1} ${width * 0.2} ${height * 0.05} ${width / 2} ${height * 0.25} C${width * 0.8} ${height * 0.05} ${width * 0.95} ${height * 0.1} ${width * 0.95} ${height * 0.25} C${width * 0.95} ${height * 0.35} ${width * 0.8} ${height * 0.6} ${width / 2} ${height * 0.85}Z" fill="currentColor"/>`,
    circle: `<circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) * 0.45}" fill="${style === 'outlined' ? 'none' : 'currentColor'}" stroke="currentColor" stroke-width="${style === 'outlined' ? 3 : 0}"/>`,
    square: `<rect x="${width * 0.1}" y="${height * 0.1}" width="${width * 0.8}" height="${height * 0.8}" rx="${width * 0.05}" fill="${style === 'outlined' ? 'none' : 'currentColor'}" stroke="currentColor" stroke-width="${style === 'outlined' ? 3 : 0}"/>`,
    triangle: `<polygon points="${width / 2},${height * 0.1} ${width * 0.9},${height * 0.9} ${width * 0.1},${height * 0.9}" fill="${style === 'outlined' ? 'none' : 'currentColor'}" stroke="currentColor" stroke-width="${style === 'outlined' ? 3 : 0}"/>`,
    arrow: `<path d="M${width * 0.2} ${height / 2} L${width * 0.7} ${height / 2} M${width * 0.5} ${height * 0.2} L${width * 0.7} ${height / 2} L${width * 0.5} ${height * 0.8}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    check: `<polyline points="${width * 0.2},${height * 0.55} ${width * 0.42},${height * 0.75} ${width * 0.8},${height * 0.3}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    plus: `<line x1="${width / 2}" y1="${height * 0.2}" x2="${width / 2}" y2="${height * 0.8}" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><line x1="${width * 0.2}" y1="${height / 2}" x2="${width * 0.8}" y2="${height / 2}" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`,
    minus: `<line x1="${width * 0.2}" y1="${height / 2}" x2="${width * 0.8}" y2="${height / 2}" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`,
    search: `<circle cx="${width * 0.4}" cy="${height * 0.4}" r="${width * 0.25}" fill="none" stroke="currentColor" stroke-width="3"/><line x1="${width * 0.58}" y1="${height * 0.58}" x2="${width * 0.82}" y2="${height * 0.82}" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`,
    user: `<circle cx="${width / 2}" cy="${height * 0.35}" r="${width * 0.15}" fill="currentColor"/><path d="M${width * 0.2} ${height * 0.85} Q${width / 2} ${height * 0.65} ${width * 0.8} ${height * 0.85}" fill="currentColor"/>`,
    home: `<path d="M${width * 0.15} ${height * 0.55} L${width / 2} ${height * 0.15} L${width * 0.85} ${height * 0.55} L${width * 0.85} ${height * 0.85} L${width * 0.55} ${height * 0.85} L${width * 0.55} ${height * 0.6} L${width * 0.45} ${height * 0.6} L${width * 0.45} ${height * 0.85} L${width * 0.15} ${height * 0.85}Z" fill="${style === 'outlined' ? 'none' : 'currentColor'}" stroke="currentColor" stroke-width="${style === 'outlined' ? 3 : 0}"/>`,
    settings: `<circle cx="${width / 2}" cy="${height / 2}" r="${width * 0.12}" fill="none" stroke="currentColor" stroke-width="3"/><path d="M${width / 2} ${height * 0.05} L${width / 2} ${height * 0.2} M${width / 2} ${height * 0.8} L${width / 2} ${height * 0.95} M${width * 0.05} ${height / 2} L${width * 0.2} ${height / 2} M${width * 0.8} ${height / 2} L${width * 0.95} ${height / 2} M${width * 0.16} ${height * 0.16} L${width * 0.27} ${height * 0.27} M${width * 0.73} ${height * 0.73} L${width * 0.84} ${height * 0.84} M${width * 0.84} ${height * 0.16} L${width * 0.73} ${height * 0.27} M${width * 0.27} ${height * 0.73} L${width * 0.16} ${height * 0.84}" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`,
    camera: `<rect x="${width * 0.15}" y="${height * 0.3}" width="${width * 0.7}" height="${height * 0.55}" rx="4" fill="${style === 'outlined' ? 'none' : 'currentColor'}" stroke="currentColor" stroke-width="${style === 'outlined' ? 3 : 0}"/><circle cx="${width / 2}" cy="${height * 0.55}" r="${width * 0.15}" fill="none" stroke="currentColor" stroke-width="3"/><rect x="${width * 0.35}" y="${height * 0.2}" width="${width * 0.3}" height="${height * 0.12}" rx="2" fill="currentColor"/>`,
  };

  // Find best match
  for (const [key, svg] of Object.entries(iconMap)) {
    if (lower.includes(key)) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${svg}</svg>`;
    }
  }

  // Default: return a generic shape
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect x="${width * 0.1}" y="${height * 0.1}" width="${width * 0.8}" height="${height * 0.8}" rx="${width * 0.1}" fill="none" stroke="currentColor" stroke-width="3"/></svg>`;
}
