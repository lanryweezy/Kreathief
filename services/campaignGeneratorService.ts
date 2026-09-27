/**
 * AI Multi-Format Omnichannel Campaign Generator Service
 * Automatically synthesizes coordinated multi-format marketing campaigns across
 * 1:1 Feed, 9:16 Story, 16:9 Banner, and 4:5 Poster formats on the canvas simultaneously.
 */

import { v4 as uuidv4 } from 'uuid';
import { Artboard, Layer, CampaignArchetype, CampaignFormatId, CampaignFormatConfig, CampaignGenerationOptions } from '../types';
import { log } from '../utils/log';

export const CAMPAIGN_FORMATS: CampaignFormatConfig[] = [
  {
    id: 'feed_1_1',
    name: 'Instagram / Feed Post',
    category: 'Social',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
  },
  {
    id: 'story_9_16',
    name: 'Story / Reels / TikTok',
    category: 'Social Story',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
  },
  {
    id: 'banner_16_9',
    name: 'Web Banner / Header',
    category: 'Digital Banner',
    width: 1200,
    height: 630,
    aspectRatio: '16:9',
  },
  {
    id: 'poster_4_5',
    name: 'Marketing Poster / Flyer',
    category: 'Print & Promo',
    width: 1080,
    height: 1350,
    aspectRatio: '4:5',
  },
];

export interface CampaignArchetypeTheme {
  id: CampaignArchetype;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  textMutedColor: string;
  fontFamily: string;
  secondaryFont: string;
  buttonColor: string;
  buttonTextColor: string;
}

export const CAMPAIGN_ARCHETYPES: Record<CampaignArchetype, CampaignArchetypeTheme> = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    primaryColor: '#00f0ff',
    secondaryColor: '#d946ef',
    accentColor: '#facc15',
    backgroundColor: '#090a15',
    surfaceColor: '#131629',
    textColor: '#ffffff',
    textMutedColor: '#94a3b8',
    fontFamily: 'Kreathief001',
    secondaryFont: 'Kreathief005',
    buttonColor: '#00f0ff',
    buttonTextColor: '#090a15',
  },
  luxury: {
    id: 'luxury',
    name: 'Luxury Gold & Obsidian',
    primaryColor: '#d97706',
    secondaryColor: '#f59e0b',
    accentColor: '#fef3c7',
    backgroundColor: '#0b0c10',
    surfaceColor: '#1f242d',
    textColor: '#ffffff',
    textMutedColor: '#d1d5db',
    fontFamily: 'Kreathief003',
    secondaryFont: 'Kreathief002',
    buttonColor: '#f59e0b',
    buttonTextColor: '#0b0c10',
  },
  neo_brutalist: {
    id: 'neo_brutalist',
    name: 'Neo-Brutalist High Contrast',
    primaryColor: '#ccff00',
    secondaryColor: '#3b82f6',
    accentColor: '#ff0055',
    backgroundColor: '#121212',
    surfaceColor: '#1e1e1e',
    textColor: '#ffffff',
    textMutedColor: '#a3a3a3',
    fontFamily: 'Kreathief004',
    secondaryFont: 'Kreathief001',
    buttonColor: '#ccff00',
    buttonTextColor: '#000000',
  },
  synthwave: {
    id: 'synthwave',
    name: 'Retro Synthwave',
    primaryColor: '#ec4899',
    secondaryColor: '#8b5cf6',
    accentColor: '#06b6d4',
    backgroundColor: '#0f0c29',
    surfaceColor: '#1e1947',
    textColor: '#ffffff',
    textMutedColor: '#c084fc',
    fontFamily: 'Kreathief006',
    secondaryFont: 'Kreathief005',
    buttonColor: '#ec4899',
    buttonTextColor: '#ffffff',
  },
  modern_editorial: {
    id: 'modern_editorial',
    name: 'Modern Editorial',
    primaryColor: '#10b981',
    secondaryColor: '#064e3b',
    accentColor: '#34d399',
    backgroundColor: '#0f172a',
    surfaceColor: '#1e293b',
    textColor: '#f8fafc',
    textMutedColor: '#94a3b8',
    fontFamily: 'Kreathief002',
    secondaryFont: 'Kreathief003',
    buttonColor: '#10b981',
    buttonTextColor: '#ffffff',
  },
  corporate_tech: {
    id: 'corporate_tech',
    name: 'Corporate SaaS Tech',
    primaryColor: '#3b82f6',
    secondaryColor: '#6366f1',
    accentColor: '#38bdf8',
    backgroundColor: '#0b0f19',
    surfaceColor: '#151c2e',
    textColor: '#f8fafc',
    textMutedColor: '#94a3b8',
    fontFamily: 'Kreathief001',
    secondaryFont: 'Inter',
    buttonColor: '#3b82f6',
    buttonTextColor: '#ffffff',
  },
};

export interface CampaignCopy {
  brandName: string;
  badge: string;
  headline: string;
  subheadline: string;
  featureTag: string;
  ctaText: string;
  offer?: string;
  promoCode?: string;
}

/**
 * Extracts punchy marketing copy structured for multi-format display
 */
export function extractCampaignCopy(prompt: string, brandOverride?: string, ctaOverride?: string): CampaignCopy {
  const p = prompt.trim();
  const words = p.split(/\s+/);

  // Intelligent brand detection
  let brandName = brandOverride || '';
  if (!brandName) {
    if (p.includes(':')) {
      const beforeColon = p.split(':')[0].trim();
      if (beforeColon.length <= 30) {
        brandName = beforeColon;
      }
    } else if (words.length > 0 && /^[A-Z0-9_-]{3,}$/.test(words[0])) {
      // First word is fully uppercase acronym or brand (e.g., HYPERDRIVE, NIKE, SONY)
      brandName = words[0];
    } else if (words.length >= 2) {
      brandName = words.slice(0, 2).join(' ');
    } else {
      brandName = 'KREATHIEF';
    }
  }

  let headline = p.toUpperCase();
  if (headline.length > 42) {
    headline = words.slice(0, 5).join(' ').toUpperCase();
  }

  // Extract offer / discount percentage
  const discountMatch = p.match(/(\d+%\s*(?:OFF|DISCOUNT)?)/i);
  const offer = discountMatch ? discountMatch[1].toUpperCase() : undefined;

  // Extract promo code
  const codeMatch = p.match(/(?:code|promo)\s+([A-Za-z0-9_-]+)/i);
  const promoCode = codeMatch
    ? `USE CODE: ${codeMatch[1].toUpperCase()}`
    : 'USE CODE: KREA2026';

  const badge = offer
    ? `SPECIAL OFFER • ${offer}`
    : p.toLowerCase().includes('drop') || p.toLowerCase().includes('launch')
      ? 'NEW COLLECTION DROP'
      : 'EXCLUSIVE ACCESS';

  const subheadline = p.length > 20
    ? `Discover premium quality engineered for visionary creators.`
    : `Elevate your workflow with state of the art creative tools.`;

  const ctaText = ctaOverride || (p.toLowerCase().includes('shop') || p.toLowerCase().includes('buy')
    ? 'SHOP NOW'
    : p.toLowerCase().includes('event') || p.toLowerCase().includes('join')
      ? 'RESERVE SPOT'
      : 'EXPLORE COLLECTION');

  return {
    brandName,
    badge,
    headline,
    subheadline,
    featureTag: '✦ VERIFIED OFFICIAL RELEASE',
    ctaText,
    offer,
    promoCode,
  };
}

/**
 * Generates coordinated layers for the 1:1 Feed Post format
 */
function buildFeed1x1Layers(
  theme: CampaignArchetypeTheme,
  copy: CampaignCopy,
  W: number,
  H: number
): Layer[] {
  const layers: Layer[] = [];

  // Decorative background ambient glow circle
  layers.push({
    id: `glow_${uuidv4().slice(0, 6)}`,
    type: 'circle',
    name: 'Ambient Glow',
    x: W / 2 - 350,
    y: H / 2 - 350,
    width: 700,
    height: 700,
    color: theme.primaryColor,
    opacity: 0.12,
    rotation: 0,
    locked: true,
    visible: true,
    zIndex: 1,
  } as any);

  // Top pill badge container
  layers.push({
    id: `badge_bg_${uuidv4().slice(0, 6)}`,
    type: 'rectangle',
    name: 'Badge Container',
    x: W / 2 - 180,
    y: 80,
    width: 360,
    height: 44,
    color: theme.surfaceColor,
    cornerRadius: 22,
    stroke: { width: 1.5, color: theme.primaryColor },
    opacity: 0.9,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 2,
  } as any);

  // Top badge text
  layers.push({
    id: `badge_txt_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Badge Label',
    text: copy.badge,
    x: W / 2 - 170,
    y: 92,
    width: 340,
    height: 30,
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    color: theme.primaryColor,
    textAlign: 'center',
    letterSpacing: 2,
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 3,
  } as any);

  // Main Hero Headline
  layers.push({
    id: `headline_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Hero Headline',
    text: copy.headline,
    x: 80,
    y: 240,
    width: W - 160,
    height: 220,
    fontSize: 68,
    fontWeight: '900',
    fontFamily: theme.fontFamily,
    color: theme.textColor,
    textAlign: 'center',
    lineHeight: 1.15,
    letterSpacing: -0.5,
    warpParams: {
      is3dExtrusion: true,
      depth3d: 8,
      lightAngle: 45,
    },
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 4,
  } as any);

  // Subheadline Copy
  layers.push({
    id: `subheadline_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Subheadline',
    text: copy.subheadline,
    x: 140,
    y: 490,
    width: W - 280,
    height: 80,
    fontSize: 22,
    fontWeight: 'normal',
    fontFamily: theme.secondaryFont,
    color: theme.textMutedColor,
    textAlign: 'center',
    lineHeight: 1.4,
    opacity: 0.9,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 5,
  } as any);

  // Promo Feature Tag Box
  layers.push({
    id: `promo_box_${uuidv4().slice(0, 6)}`,
    type: 'rectangle',
    name: 'Promo Feature Box',
    x: W / 2 - 160,
    y: 630,
    width: 320,
    height: 48,
    color: 'rgba(255, 255, 255, 0.05)',
    cornerRadius: 8,
    stroke: { width: 1, color: 'rgba(255, 255, 255, 0.15)' },
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 6,
  } as any);

  layers.push({
    id: `promo_txt_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Promo Code Text',
    text: copy.promoCode || '✦ VERIFIED OFFICIAL',
    x: W / 2 - 150,
    y: 644,
    width: 300,
    height: 24,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    color: theme.accentColor,
    textAlign: 'center',
    letterSpacing: 2,
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 7,
  } as any);

  // Bottom CTA Button shape
  layers.push({
    id: `cta_btn_${uuidv4().slice(0, 6)}`,
    type: 'rectangle',
    name: 'CTA Button',
    x: W / 2 - 190,
    y: 840,
    width: 380,
    height: 74,
    color: theme.buttonColor,
    cornerRadius: 16,
    shadow: {
      offsetX: 0,
      offsetY: 10,
      blur: 24,
      color: `${theme.primaryColor}55`,
    },
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 8,
  } as any);

  // Bottom CTA text
  layers.push({
    id: `cta_txt_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'CTA Label',
    text: `${copy.ctaText} →`,
    x: W / 2 - 180,
    y: 862,
    width: 360,
    height: 36,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: theme.fontFamily,
    color: theme.buttonTextColor,
    textAlign: 'center',
    letterSpacing: 1.5,
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 9,
  } as any);

  return layers;
}

/**
 * Generates coordinated layers for the 9:16 Story / Reels format
 */
function buildStory9x16Layers(
  theme: CampaignArchetypeTheme,
  copy: CampaignCopy,
  W: number,
  H: number
): Layer[] {
  const layers: Layer[] = [];

  // Top Brand Header
  layers.push({
    id: `story_brand_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Brand Identifier',
    text: `— ${copy.brandName.toUpperCase()} —`,
    x: 80,
    y: 180,
    width: W - 160,
    height: 30,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    color: theme.primaryColor,
    textAlign: 'center',
    letterSpacing: 4,
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 1,
  } as any);

  // Story Upper-Third Main Title (Big & Punchy)
  layers.push({
    id: `story_head_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Story Main Headline',
    text: copy.headline,
    x: 80,
    y: 380,
    width: W - 160,
    height: 360,
    fontSize: 82,
    fontWeight: '900',
    fontFamily: theme.fontFamily,
    color: theme.textColor,
    textAlign: 'center',
    lineHeight: 1.15,
    warpParams: {
      is3dExtrusion: true,
      depth3d: 12,
      lightAngle: 60,
    },
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 2,
  } as any);

  // Mid Focal Graphic Container
  layers.push({
    id: `story_card_${uuidv4().slice(0, 6)}`,
    type: 'rectangle',
    name: 'Feature Card',
    x: 90,
    y: 840,
    width: W - 180,
    height: 380,
    color: theme.surfaceColor,
    cornerRadius: 24,
    stroke: { width: 2, color: `${theme.primaryColor}55` },
    shadow: {
      offsetX: 0,
      offsetY: 16,
      blur: 40,
      color: 'rgba(0,0,0,0.6)',
    },
    opacity: 0.95,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 3,
  } as any);

  // Card Content
  layers.push({
    id: `card_tag_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Card Tag',
    text: copy.badge,
    x: 130,
    y: 900,
    width: W - 260,
    height: 30,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    color: theme.accentColor,
    textAlign: 'center',
    letterSpacing: 2,
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 4,
  } as any);

  layers.push({
    id: `card_body_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Card Subheadline',
    text: copy.subheadline,
    x: 130,
    y: 960,
    width: W - 260,
    height: 120,
    fontSize: 26,
    fontWeight: 'normal',
    fontFamily: theme.secondaryFont,
    color: theme.textMutedColor,
    textAlign: 'center',
    lineHeight: 1.45,
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 5,
  } as any);

  if (copy.promoCode) {
    layers.push({
      id: `card_code_${uuidv4().slice(0, 6)}`,
      type: 'text',
      name: 'Card Promo Code',
      text: copy.promoCode,
      x: 130,
      y: 1120,
      width: W - 260,
      height: 36,
      fontSize: 16,
      fontWeight: 'bold',
      fontFamily: theme.fontFamily,
      color: theme.primaryColor,
      textAlign: 'center',
      letterSpacing: 3,
      opacity: 1,
      rotation: 0,
      locked: false,
      visible: true,
      zIndex: 6,
    } as any);
  }

  // Bottom CTA Button (Thumb Friendly Position)
  layers.push({
    id: `story_cta_${uuidv4().slice(0, 6)}`,
    type: 'rectangle',
    name: 'Bottom Story CTA',
    x: 110,
    y: 1560,
    width: W - 220,
    height: 90,
    color: theme.buttonColor,
    cornerRadius: 20,
    shadow: {
      offsetX: 0,
      offsetY: 12,
      blur: 32,
      color: `${theme.primaryColor}66`,
    },
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 7,
  } as any);

  layers.push({
    id: `story_cta_txt_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Story CTA Label',
    text: `⚡ ${copy.ctaText} ⚡`,
    x: 120,
    y: 1588,
    width: W - 240,
    height: 40,
    fontSize: 24,
    fontWeight: '900',
    fontFamily: theme.fontFamily,
    color: theme.buttonTextColor,
    textAlign: 'center',
    letterSpacing: 2,
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 8,
  } as any);

  return layers;
}

/**
 * Generates coordinated layers for the 16:9 Landscape Web Banner format
 */
function buildBanner16x9Layers(
  theme: CampaignArchetypeTheme,
  copy: CampaignCopy,
  W: number,
  H: number
): Layer[] {
  const layers: Layer[] = [];

  // Left Column Layout (Content & CTA)
  layers.push({
    id: `ban_badge_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Banner Badge',
    text: `✦ ${copy.badge}`,
    x: 80,
    y: 80,
    width: 480,
    height: 28,
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    color: theme.primaryColor,
    textAlign: 'left',
    letterSpacing: 2.5,
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 1,
  } as any);

  layers.push({
    id: `ban_head_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Banner Headline',
    text: copy.headline,
    x: 80,
    y: 140,
    width: 620,
    height: 180,
    fontSize: 54,
    fontWeight: '900',
    fontFamily: theme.fontFamily,
    color: theme.textColor,
    textAlign: 'left',
    lineHeight: 1.15,
    letterSpacing: -0.5,
    warpParams: {
      is3dExtrusion: true,
      depth3d: 6,
      lightAngle: 45,
    },
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 2,
  } as any);

  layers.push({
    id: `ban_sub_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Banner Subtitle',
    text: copy.subheadline,
    x: 80,
    y: 340,
    width: 580,
    height: 60,
    fontSize: 18,
    fontWeight: 'normal',
    fontFamily: theme.secondaryFont,
    color: theme.textMutedColor,
    textAlign: 'left',
    lineHeight: 1.4,
    opacity: 0.9,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 3,
  } as any);

  layers.push({
    id: `ban_cta_${uuidv4().slice(0, 6)}`,
    type: 'rectangle',
    name: 'Banner CTA Button',
    x: 80,
    y: 450,
    width: 280,
    height: 64,
    color: theme.buttonColor,
    cornerRadius: 12,
    shadow: {
      offsetX: 0,
      offsetY: 8,
      blur: 20,
      color: `${theme.primaryColor}55`,
    },
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 4,
  } as any);

  layers.push({
    id: `ban_cta_txt_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Banner CTA Text',
    text: `${copy.ctaText} →`,
    x: 90,
    y: 468,
    width: 260,
    height: 30,
    fontSize: 16,
    fontWeight: '900',
    fontFamily: theme.fontFamily,
    color: theme.buttonTextColor,
    textAlign: 'center',
    letterSpacing: 1,
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 5,
  } as any);

  // Right Column Decorative Hero Card
  layers.push({
    id: `ban_hero_card_${uuidv4().slice(0, 6)}`,
    type: 'rectangle',
    name: 'Hero Graphic Card',
    x: 760,
    y: 70,
    width: 360,
    height: 480,
    color: theme.surfaceColor,
    cornerRadius: 24,
    stroke: { width: 1.5, color: `${theme.primaryColor}40` },
    shadow: {
      offsetX: 0,
      offsetY: 16,
      blur: 36,
      color: 'rgba(0,0,0,0.5)',
    },
    opacity: 0.95,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 6,
  } as any);

  layers.push({
    id: `ban_hero_badge_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Hero Card Badge',
    text: '★ OFFICIAL LAUNCH',
    x: 790,
    y: 130,
    width: 300,
    height: 30,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    color: theme.accentColor,
    textAlign: 'center',
    letterSpacing: 2,
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 7,
  } as any);

  layers.push({
    id: `ban_hero_title_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Hero Card Title',
    text: copy.brandName.toUpperCase(),
    x: 790,
    y: 220,
    width: 300,
    height: 120,
    fontSize: 38,
    fontWeight: '900',
    fontFamily: theme.fontFamily,
    color: theme.textColor,
    textAlign: 'center',
    lineHeight: 1.2,
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 8,
  } as any);

  if (copy.promoCode) {
    layers.push({
      id: `ban_code_${uuidv4().slice(0, 6)}`,
      type: 'text',
      name: 'Banner Code',
      text: copy.promoCode,
      x: 790,
      y: 430,
      width: 300,
      height: 30,
      fontSize: 13,
      fontWeight: 'bold',
      fontFamily: theme.fontFamily,
      color: theme.primaryColor,
      textAlign: 'center',
      letterSpacing: 2,
      opacity: 1,
      rotation: 0,
      locked: false,
      visible: true,
      zIndex: 9,
    } as any);
  }

  return layers;
}

/**
 * Generates coordinated layers for the 4:5 Poster / Flyer format
 */
function buildPoster4x5Layers(
  theme: CampaignArchetypeTheme,
  copy: CampaignCopy,
  W: number,
  H: number
): Layer[] {
  const layers: Layer[] = [];

  // Elegant Outer Border Frame
  layers.push({
    id: `post_border_${uuidv4().slice(0, 6)}`,
    type: 'rectangle',
    name: 'Editorial Outer Frame',
    x: 40,
    y: 40,
    width: W - 80,
    height: H - 80,
    color: 'transparent',
    cornerRadius: 16,
    stroke: { width: 1.5, color: `${theme.primaryColor}40` },
    opacity: 1,
    rotation: 0,
    locked: true,
    visible: true,
    zIndex: 1,
  } as any);

  // Top Header Line
  layers.push({
    id: `post_top_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Poster Top Tag',
    text: `✦ ${copy.brandName.toUpperCase()} PRESENTS ✦`,
    x: 80,
    y: 110,
    width: W - 160,
    height: 30,
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    color: theme.primaryColor,
    textAlign: 'center',
    letterSpacing: 4,
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 2,
  } as any);

  // Large Hero Title
  layers.push({
    id: `post_head_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Poster Title',
    text: copy.headline,
    x: 80,
    y: 280,
    width: W - 160,
    height: 260,
    fontSize: 78,
    fontWeight: '900',
    fontFamily: theme.fontFamily,
    color: theme.textColor,
    textAlign: 'center',
    lineHeight: 1.15,
    warpParams: {
      is3dExtrusion: true,
      depth3d: 10,
      lightAngle: 50,
    },
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 3,
  } as any);

  // Subheadline
  layers.push({
    id: `post_sub_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Poster Subtitle',
    text: copy.subheadline,
    x: 120,
    y: 580,
    width: W - 240,
    height: 90,
    fontSize: 24,
    fontWeight: 'normal',
    fontFamily: theme.secondaryFont,
    color: theme.textMutedColor,
    textAlign: 'center',
    lineHeight: 1.45,
    opacity: 0.9,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 4,
  } as any);

  // Center Feature Card Box
  layers.push({
    id: `post_card_${uuidv4().slice(0, 6)}`,
    type: 'rectangle',
    name: 'Center Feature Card',
    x: 100,
    y: 740,
    width: W - 200,
    height: 240,
    color: theme.surfaceColor,
    cornerRadius: 18,
    stroke: { width: 1.5, color: `${theme.primaryColor}55` },
    opacity: 0.9,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 5,
  } as any);

  layers.push({
    id: `post_card_txt_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Card Highlight',
    text: copy.badge,
    x: 130,
    y: 800,
    width: W - 260,
    height: 40,
    fontSize: 22,
    fontWeight: '900',
    fontFamily: theme.fontFamily,
    color: theme.accentColor,
    textAlign: 'center',
    letterSpacing: 2,
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 6,
  } as any);

  if (copy.promoCode) {
    layers.push({
      id: `post_card_code_${uuidv4().slice(0, 6)}`,
      type: 'text',
      name: 'Promo Details',
      text: copy.promoCode,
      x: 130,
      y: 870,
      width: W - 260,
      height: 30,
      fontSize: 15,
      fontWeight: 'bold',
      fontFamily: theme.fontFamily,
      color: theme.primaryColor,
      textAlign: 'center',
      letterSpacing: 3,
      opacity: 1,
      rotation: 0,
      locked: false,
      visible: true,
      zIndex: 7,
    } as any);
  }

  // Bottom CTA Button
  layers.push({
    id: `post_cta_${uuidv4().slice(0, 6)}`,
    type: 'rectangle',
    name: 'Poster CTA Button',
    x: W / 2 - 200,
    y: 1100,
    width: 400,
    height: 76,
    color: theme.buttonColor,
    cornerRadius: 16,
    shadow: {
      offsetX: 0,
      offsetY: 10,
      blur: 24,
      color: `${theme.primaryColor}66`,
    },
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 8,
  } as any);

  layers.push({
    id: `post_cta_txt_${uuidv4().slice(0, 6)}`,
    type: 'text',
    name: 'Poster CTA Text',
    text: `${copy.ctaText} →`,
    x: W / 2 - 190,
    y: 1124,
    width: 380,
    height: 36,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: theme.fontFamily,
    color: theme.buttonTextColor,
    textAlign: 'center',
    letterSpacing: 1.5,
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 9,
  } as any);

  return layers;
}

export interface CampaignGenerationResult {
  campaignId: string;
  title: string;
  archetype: CampaignArchetypeTheme;
  copy: CampaignCopy;
  artboards: Artboard[];
}

/**
 * Main synthesis function: Generates a complete synchronized campaign with multi-aspect artboards.
 */
export async function generateOmnichannelCampaign(
  options: CampaignGenerationOptions
): Promise<CampaignGenerationResult> {
  const archetypeKey = (options.archetype && CAMPAIGN_ARCHETYPES[options.archetype])
    ? options.archetype
    : 'cyberpunk';
  const theme = { ...CAMPAIGN_ARCHETYPES[archetypeKey] };

  if (options.primaryColor) {
    theme.primaryColor = options.primaryColor;
  }
  if (options.fontFamily) {
    theme.fontFamily = options.fontFamily;
  }

  const copy = extractCampaignCopy(options.prompt, options.brandName, options.ctaText);
  if (options.promoCode) {
    copy.promoCode = options.promoCode;
  }

  const selectedFormatIds = options.formats && options.formats.length > 0
    ? options.formats
    : (['feed_1_1', 'story_9_16', 'banner_16_9', 'poster_4_5'] as CampaignFormatId[]);

  const formatsToGenerate = CAMPAIGN_FORMATS.filter((f) => selectedFormatIds.includes(f.id));

  const campaignId = `campaign_${Date.now()}`;
  const artboards: Artboard[] = [];

  let currentXOffset = 0;
  const GAP_X = 140;

  for (const fmt of formatsToGenerate) {
    let layers: Layer[] = [];

    switch (fmt.id) {
      case 'feed_1_1':
        layers = buildFeed1x1Layers(theme, copy, fmt.width, fmt.height);
        break;
      case 'story_9_16':
        layers = buildStory9x16Layers(theme, copy, fmt.width, fmt.height);
        break;
      case 'banner_16_9':
        layers = buildBanner16x9Layers(theme, copy, fmt.width, fmt.height);
        break;
      case 'poster_4_5':
        layers = buildPoster4x5Layers(theme, copy, fmt.width, fmt.height);
        break;
    }

    const artboard: Artboard = {
      id: `${campaignId}_${fmt.id}`,
      name: `${copy.brandName} • ${fmt.name} (${fmt.aspectRatio})`,
      x: currentXOffset,
      y: 0,
      width: fmt.width,
      height: fmt.height,
      backgroundColor: theme.backgroundColor,
      layers,
    };

    artboards.push(artboard);
    currentXOffset += fmt.width + GAP_X;
  }

  log.info('[CampaignGenerator] Generated campaign successfully', {
    campaignId,
    artboardsCount: artboards.length,
    archetype: theme.id,
  });

  return {
    campaignId,
    title: `${copy.brandName} Omnichannel Campaign`,
    archetype: theme,
    copy,
    artboards,
  };
}
