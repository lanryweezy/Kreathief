// Core HSL manipulation
export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  if (hex.length !== 6) {
    hex = '000000'; // Default invalid
  }

  let r = parseInt(hex.slice(0, 2), 16) / 255;
  let g = parseInt(hex.slice(2, 4), 16) / 255;
  let b = parseInt(hex.slice(4, 6), 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generateAnalogousPalette(baseHex: string, count: number = 3): string[] {
  const { h, s, l } = hexToHSL(baseHex);
  const palette = [];
  const step = 30;
  for (let i = 0; i < count; i++) {
    palette.push(hslToHex((h + (i - Math.floor(count / 2)) * step + 360) % 360, s, l));
  }
  return palette;
}

export function generateComplementaryPalette(baseHex: string): string[] {
  const { h, s, l } = hexToHSL(baseHex);
  return [baseHex, hslToHex((h + 180) % 360, s, l)];
}

export function generateTriadicPalette(baseHex: string): string[] {
  const { h, s, l } = hexToHSL(baseHex);
  return [baseHex, hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)];
}

export function generateSplitComplementary(baseHex: string): string[] {
  const { h, s, l } = hexToHSL(baseHex);
  return [baseHex, hslToHex((h + 150) % 360, s, l), hslToHex((h + 210) % 360, s, l)];
}

export function getLuminance(hex: string): number {
  const { h, s, l } = hexToHSL(hex);
  return l;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (lightest + 5) / (darkest + 5);
}

export function deriveAccessibleTextColor(bgColor: string): '#ffffff' | '#000000' {
  const luminance = getLuminance(bgColor);
  return luminance > 50 ? '#000000' : '#ffffff';
}

export function generateBrandAwarePalette(brandColors: string[]): {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundDark: string;
  text: string;
  textMuted: string;
} {
  const primary = brandColors.length > 0 ? brandColors[0] : '#3b82f6';
  const secondary = brandColors.length > 1 ? brandColors[1] : generateAnalogousPalette(primary, 2)[1];
  const accent = brandColors.length > 2 ? brandColors[2] : generateComplementaryPalette(primary)[1];
  
  return {
    primary,
    secondary,
    accent,
    background: '#ffffff',
    backgroundDark: '#0f172a',
    text: '#0f172a',
    textMuted: '#64748b'
  };
}

export function generatePalettePromptConstraint(prompt: string, brandColors?: string[]): string {
  const lowerPrompt = prompt.toLowerCase();
  let baseColor = '#3b82f6'; 
  
  if (lowerPrompt.includes('warm')) baseColor = '#f59e0b';
  else if (lowerPrompt.includes('cool')) baseColor = '#0ea5e9';
  else if (lowerPrompt.includes('dark')) baseColor = '#1e1b4b';
  else if (lowerPrompt.includes('light')) baseColor = '#f0f9ff';
  else if (lowerPrompt.includes('neon')) baseColor = '#22c55e';
  else if (lowerPrompt.includes('pastel')) baseColor = '#fbcfe8';
  else if (lowerPrompt.includes('earth')) baseColor = '#78350f';
  else if (lowerPrompt.includes('ocean')) baseColor = '#0369a1';

  if (brandColors && brandColors.length > 0) {
    baseColor = brandColors[0];
  }

  const { h, s, l } = hexToHSL(baseColor);
  
  const primary = hslToHex(h, s, l);
  const secondary = hslToHex((h + 30) % 360, s, l);
  const accent = hslToHex((h + 180) % 360, s, l);
  
  const bgL = lowerPrompt.includes('dark') ? 10 : 98;
  const background = hslToHex(h, s * 0.2, bgL);
  const surface = hslToHex(h, s * 0.3, bgL > 50 ? bgL - 5 : bgL + 5);
  
  const text = deriveAccessibleTextColor(background);
  const textMuted = text === '#ffffff' ? '#94a3b8' : '#64748b';

  return `COLOR PALETTE CONSTRAINT: Use this curated palette as your primary color system:\nPrimary: ${primary}, Secondary: ${secondary}, Accent: ${accent}, Background: ${background}, Surface: ${surface}, Text: ${text}, TextMuted: ${textMuted}\nEnsure WCAG AA contrast (4.5:1) between text and backgrounds.`;
}
