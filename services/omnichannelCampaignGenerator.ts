/**
 * Omnichannel Multi-Format Campaign Generator
 * Generates a synchronized 6-format graphic design campaign from a single prompt or brand brief:
 * 1. Instagram Post (1080x1080, 1:1)
 * 2. Instagram Story / TikTok (1080x1920, 9:16)
 * 3. YouTube / Video Thumbnail (1280x720, 16:9)
 * 4. Twitter / X Header Banner (1500x500, 3:1)
 * 5. Facebook / Meta Feed Ad (1200x628, 1.91:1)
 * 6. LinkedIn Company Banner (1584x396, 4:1)
 */

import { Artboard, Layer, BrandKit } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { polishDesignOutput } from '../utils/designPolish';
import { buildCompositionForArchetype } from './designCompositionEngine';
import { classifyDesignIntent } from './aiDesignDirector';
import { recommendPairingForStyle } from './typographyPairingEngine';

export interface CampaignFormatSpec {
  id: string;
  name: string;
  category: 'social' | 'video' | 'header' | 'ad';
  width: number;
  height: number;
  aspectRatio: string;
  layoutArchetype: 'square' | 'vertical_stack' | 'horizontal_split' | 'panoramic_left' | 'panoramic_center';
}

export const CAMPAIGN_FORMATS: CampaignFormatSpec[] = [
  {
    id: 'ig_post',
    name: 'Instagram Square Post',
    category: 'social',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    layoutArchetype: 'square',
  },
  {
    id: 'ig_story',
    name: 'Instagram Story / TikTok',
    category: 'social',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    layoutArchetype: 'vertical_stack',
  },
  {
    id: 'yt_thumbnail',
    name: 'YouTube Thumbnail',
    category: 'video',
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    layoutArchetype: 'horizontal_split',
  },
  {
    id: 'twitter_header',
    name: 'Twitter / X Header',
    category: 'header',
    width: 1500,
    height: 500,
    aspectRatio: '3:1',
    layoutArchetype: 'panoramic_left',
  },
  {
    id: 'fb_ad',
    name: 'Facebook Feed Ad',
    category: 'ad',
    width: 1200,
    height: 628,
    aspectRatio: '1.91:1',
    layoutArchetype: 'horizontal_split',
  },
  {
    id: 'linkedin_banner',
    name: 'LinkedIn Company Banner',
    category: 'header',
    width: 1584,
    height: 396,
    aspectRatio: '4:1',
    layoutArchetype: 'panoramic_left',
  },
];

export interface OmnichannelCampaignResult {
  campaignTitle: string;
  prompt: string;
  archetype: string;
  artboards: Artboard[];
}

/**
 * Generate a full 6-format synchronized campaign kit
 */
export async function generateOmnichannelCampaign(
  prompt: string,
  brandKit?: BrandKit | null
): Promise<OmnichannelCampaignResult> {
  const archetype = classifyDesignIntent(prompt);
  const pairing = recommendPairingForStyle(archetype);
  const fontHeading = brandKit?.fonts?.[0] || pairing.heading || 'Outfit';
  const fontBody = brandKit?.fonts?.[1] || pairing.body || 'Inter';

  const artboards: Artboard[] = [];

  for (let i = 0; i < CAMPAIGN_FORMATS.length; i++) {
    const format = CAMPAIGN_FORMATS[i];
    const { width, height, name, id } = format;

    // Generate base composition tailored for dimensions
    const compResult = buildCompositionForArchetype(
      archetype,
      width,
      height,
      prompt
    );

    // Apply master polish (grid alignment, typography hierarchy, auto-layout, WCAG AAA contrast)
    const polished = polishDesignOutput({
      ...compResult,
      width,
      height,
    });

    // Offset artboards in the world coordinate space for multi-artboard canvas layout
    const worldX = (i % 3) * 1700;
    const worldY = Math.floor(i / 3) * 2100;

    const artboard: Artboard = {
      id: `artboard_campaign_${id}_${uuidv4().slice(0, 8)}`,
      name: `${name} (${width}x${height})`,
      x: worldX,
      y: worldY,
      width,
      height,
      backgroundColor: polished.backgroundColor || '#0f172a',
      layers: polished.layers || [],
    };

    artboards.push(artboard);
  }

  return {
    campaignTitle: `${prompt.slice(0, 32)} — Multi-Channel Kit`,
    prompt,
    archetype,
    artboards,
  };
}
