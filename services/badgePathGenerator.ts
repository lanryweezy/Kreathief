/**
 * Vintage & Modern Badge Emblem Generator
 * Procedural multi-layer circular stamp and badge generator with curved arc typography.
 */

import { Layer, TextLayer, ShapeLayer } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface BadgeConfig {
  id: string;
  name: string;
  category: 'vintage' | 'retro' | 'athletic' | 'luxury';
  icon: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  topText: string;
  centerText: string;
  bottomText: string;
  fontFamily: string;
}

export const BADGE_PRESETS: BadgeConfig[] = [
  // 1. Classic Circular Stamp
  {
    id: 'classicStamp',
    name: 'Vintage Seal Stamp',
    category: 'vintage',
    icon: '🏵️',
    description: 'Double concentric rings with star dividers and top/bottom curved typography',
    primaryColor: '#854d0e', // Vintage bronze
    secondaryColor: '#fef3c7', // Cream parchment
    accentColor: '#ca8a04',
    topText: 'AUTHENTIC HANDCRAFTED',
    centerText: 'KREATHIEF',
    bottomText: 'EST. 2026 • TRADEMARK',
    fontFamily: 'Playfair Display',
  },

  // 2. Retro Diner & Coffee Seal
  {
    id: 'retroDiner',
    name: 'Retro 50s Diner',
    category: 'retro',
    icon: '☕',
    description: 'Vibrant turquoise and coral emblem with pop typography',
    primaryColor: '#0891b2', // Cyan
    secondaryColor: '#ec4899', // Coral pink
    accentColor: '#ffffff',
    topText: 'FRESHLY ROASTED DAILY',
    centerText: 'ESPRESSO',
    bottomText: 'FINEST PREMIUM BLEND',
    fontFamily: 'Montserrat',
  },

  // 3. Collegiate Athletic Crest
  {
    id: 'athleticCrest',
    name: 'Varsity Athletic Crest',
    category: 'athletic',
    icon: '🏆',
    description: 'Heavy varsity block geometry with collegiate arc lettering',
    primaryColor: '#1e3a8a', // Deep navy
    secondaryColor: '#f59e0b', // Athletic gold
    accentColor: '#ffffff',
    topText: 'ALL-STAR DIVISION',
    centerText: 'CHAMPIONS',
    bottomText: 'VARSITY LEAGUE 2026',
    fontFamily: 'Anton',
  },

  // 4. Art Deco Luxury Medallion
  {
    id: 'artDecoMedallion',
    name: 'Art Deco Medallion',
    category: 'luxury',
    icon: '🍸',
    description: 'Opulent gilded Gatsby gold concentric medallion with serif lettering',
    primaryColor: '#ca8a04', // Rich gold
    secondaryColor: '#0a0a14', // Midnight
    accentColor: '#fef08a', // Pale gold
    topText: 'THE GRAND HERITAGE',
    centerText: 'METROPOLIS',
    bottomText: 'EXCELLENCE & DISTINCTION',
    fontFamily: 'Cinzel',
  },
];

/**
 * Generates a complete set of coordinated layers forming a centered badge emblem on the canvas
 */
export function generateBadgeLayers(
  badge: BadgeConfig,
  canvasWidth: number = 1080,
  canvasHeight: number = 1080
): Layer[] {
  const badgeSize = Math.min(canvasWidth, canvasHeight) * 0.52; // ~560px on a 1080 canvas
  const centerX = (canvasWidth - badgeSize) / 2;
  const centerY = (canvasHeight - badgeSize) / 2;
  const badgeRadius = badgeSize / 2;

  const baseZ = 10;
  const layers: Layer[] = [];

  // 1. Outer Circle Fill (Base)
  layers.push({
    id: `badge_bg_${uuidv4().slice(0, 8)}`,
    type: 'circle',
    name: `${badge.name} - Outer Base`,
    x: centerX,
    y: centerY,
    width: badgeSize,
    height: badgeSize,
    color: badge.secondaryColor,
    cornerRadius: 0,
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: baseZ,
    stroke: {
      color: badge.primaryColor,
      width: 6,
    },
    shadow: {
      color: 'rgba(0, 0, 0, 0.35)',
      blur: 24,
      offsetX: 0,
      offsetY: 8,
    },
  } as ShapeLayer);

  // 2. Inner Concentric Ring
  const innerRingMargin = 22;
  layers.push({
    id: `badge_ring_${uuidv4().slice(0, 8)}`,
    type: 'circle',
    name: `${badge.name} - Inner Ring`,
    x: centerX + innerRingMargin,
    y: centerY + innerRingMargin,
    width: badgeSize - innerRingMargin * 2,
    height: badgeSize - innerRingMargin * 2,
    color: 'transparent',
    cornerRadius: 0,
    opacity: 0.9,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: baseZ + 1,
    stroke: {
      color: badge.primaryColor,
      width: 2,
    },
  } as ShapeLayer);

  // 3. Inner Center Circle Core
  const coreMargin = 85;
  layers.push({
    id: `badge_core_${uuidv4().slice(0, 8)}`,
    type: 'circle',
    name: `${badge.name} - Center Core`,
    x: centerX + coreMargin,
    y: centerY + coreMargin,
    width: badgeSize - coreMargin * 2,
    height: badgeSize - coreMargin * 2,
    color: badge.primaryColor,
    cornerRadius: 0,
    opacity: 0.12,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: baseZ + 2,
    stroke: {
      color: badge.primaryColor,
      width: 2,
    },
  } as ShapeLayer);

  // 4. Top Curved Arc Text
  const topTextSize = Math.max(14, Math.round(badgeSize * 0.052));
  layers.push({
    id: `badge_text_top_${uuidv4().slice(0, 8)}`,
    type: 'text',
    name: `${badge.name} - Top Arc`,
    text: badge.topText,
    x: centerX + 20,
    y: centerY + 28,
    width: badgeSize - 40,
    height: topTextSize * 2.2,
    fontSize: topTextSize,
    fontFamily: badge.fontFamily,
    fontWeight: '800',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center',
    color: badge.primaryColor,
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: baseZ + 3,
    letterSpacing: 4,
    textTransform: 'uppercase',
    warpStyle: 'arc',
    curve: -24, // upward arc along the top curve of circle
  } as TextLayer);

  // 5. Center Hero Title Text
  const centerTextSize = Math.max(26, Math.round(badgeSize * 0.11));
  layers.push({
    id: `badge_text_center_${uuidv4().slice(0, 8)}`,
    type: 'text',
    name: `${badge.name} - Center Hero`,
    text: badge.centerText,
    x: centerX + 30,
    y: centerY + badgeRadius - centerTextSize * 0.75,
    width: badgeSize - 60,
    height: centerTextSize * 1.5,
    fontSize: centerTextSize,
    fontFamily: badge.fontFamily,
    fontWeight: '900',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center',
    color: badge.primaryColor,
    opacity: 1,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: baseZ + 4,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textStroke: {
      width: 1,
      color: badge.accentColor,
    },
    textShadow: {
      offsetX: 0,
      offsetY: 3,
      blur: 6,
      color: 'rgba(0, 0, 0, 0.25)',
    },
  } as TextLayer);

  // 6. Bottom Curved Arc Text
  const bottomTextSize = Math.max(12, Math.round(badgeSize * 0.046));
  layers.push({
    id: `badge_text_bottom_${uuidv4().slice(0, 8)}`,
    type: 'text',
    name: `${badge.name} - Bottom Arc`,
    text: badge.bottomText,
    x: centerX + 25,
    y: centerY + badgeSize - bottomTextSize * 3,
    width: badgeSize - 50,
    height: bottomTextSize * 2.2,
    fontSize: bottomTextSize,
    fontFamily: badge.fontFamily,
    fontWeight: '700',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center',
    color: badge.primaryColor,
    opacity: 0.9,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: baseZ + 5,
    letterSpacing: 3,
    textTransform: 'uppercase',
    warpStyle: 'arc',
    curve: 24, // downward arc along the bottom curve of circle
  } as TextLayer);

  return layers;
}
