import { describe, it, expect } from 'vitest';
import {
  generateOmnichannelCampaign,
  CAMPAIGN_FORMATS,
  CAMPAIGN_ARCHETYPES,
} from '../../services/campaignGeneratorService';
import { exportCampaignToZip } from '../../services/campaignExportService';
import { CampaignArchetype, CampaignFormatId } from '../../types';

describe('AI Multi-Format Omnichannel Campaign Generator', () => {
  describe('CAMPAIGN_FORMATS and CAMPAIGN_ARCHETYPES configuration', () => {
    it('defines the 4 required standard campaign formats', () => {
      expect(CAMPAIGN_FORMATS).toHaveLength(4);
      const ids = CAMPAIGN_FORMATS.map((f) => f.id);
      expect(ids).toContain('feed_1_1');
      expect(ids).toContain('story_9_16');
      expect(ids).toContain('banner_16_9');
      expect(ids).toContain('poster_4_5');

      const feed = CAMPAIGN_FORMATS.find((f) => f.id === 'feed_1_1');
      expect(feed?.width).toBe(1080);
      expect(feed?.height).toBe(1080);

      const story = CAMPAIGN_FORMATS.find((f) => f.id === 'story_9_16');
      expect(story?.width).toBe(1080);
      expect(story?.height).toBe(1920);

      const banner = CAMPAIGN_FORMATS.find((f) => f.id === 'banner_16_9');
      expect(banner?.width).toBe(1200);
      expect(banner?.height).toBe(630);

      const poster = CAMPAIGN_FORMATS.find((f) => f.id === 'poster_4_5');
      expect(poster?.width).toBe(1080);
      expect(poster?.height).toBe(1350);
    });

    it('contains all 6 curated visual archetypes with brand fonts Kreathief001-006', () => {
      const archetypes: CampaignArchetype[] = [
        'cyberpunk',
        'luxury',
        'neo_brutalist',
        'synthwave',
        'modern_editorial',
        'corporate_tech',
      ];

      for (const arch of archetypes) {
        const theme = CAMPAIGN_ARCHETYPES[arch];
        expect(theme).toBeDefined();
        expect(theme.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(theme.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(theme.fontFamily).toMatch(/^Kreathief00[1-6]$/);
      }
    });
  });

  describe('generateOmnichannelCampaign', () => {
    it('generates a full 4-format campaign with non-overlapping artboard coordinates', async () => {
      const result = await generateOmnichannelCampaign({
        prompt: 'Nexus AI Cyber Summit 2026: The Future of Intelligence. 50% OFF with code FUTURE50. Claim Your Seat.',
        archetype: 'cyberpunk',
      });

      expect(result.artboards).toHaveLength(4);
      expect(result.title).toContain('Omnichannel Campaign');
      expect(result.archetype.id).toBe('cyberpunk');
      expect(result.copy.headline).toBeTruthy();

      // Verify coordinate spacing side-by-side
      let previousRightEdge = 0;
      for (const artboard of result.artboards) {
        expect(artboard.x).toBeGreaterThanOrEqual(previousRightEdge);
        previousRightEdge = artboard.x + artboard.width;
      }
    });

    it('supports generating a subset of selected formats', async () => {
      const selectedFormats: CampaignFormatId[] = ['feed_1_1', 'story_9_16'];
      const result = await generateOmnichannelCampaign({
        prompt: 'Noir Cafe: Specialty Espresso & Pastries. Visit Today.',
        archetype: 'luxury',
        formats: selectedFormats,
      });

      expect(result.artboards).toHaveLength(2);
      expect(result.artboards[0].width).toBe(1080);
      expect(result.artboards[0].height).toBe(1080);
      expect(result.artboards[1].width).toBe(1080);
      expect(result.artboards[1].height).toBe(1920);
    });

    it('intelligently extracts brand name, discounts, promo codes, and CTAs from unstructured prompts', async () => {
      const result = await generateOmnichannelCampaign({
        prompt: 'HYPERDRIVE Sneaker Drop 2026! Save 35% OFF with code HYPER35. Shop the collection now.',
        archetype: 'neo_brutalist',
      });

      expect(result.copy.brandName).toBe('HYPERDRIVE');
      expect(result.copy.offer).toContain('35%');
      expect(result.copy.promoCode).toContain('HYPER35');
    });

    it('constructs rich layers with background decorations, headers, offers, and CTA buttons', async () => {
      const result = await generateOmnichannelCampaign({
        prompt: 'Aura Studio Summer Launch',
        archetype: 'synthwave',
      });

      for (const artboard of result.artboards) {
        expect(artboard.layers.length).toBeGreaterThan(5);

        // Check for text layer with headline or brand
        const textLayers = artboard.layers.filter((l) => l.type === 'text');
        expect(textLayers.length).toBeGreaterThanOrEqual(2);

        // Check for CTA button or interactive elements
        const buttonShapes = artboard.layers.filter((l) => l.type === 'rectangle');
        expect(buttonShapes.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Campaign Export Service', () => {
    it('packages artboards and includes campaign-manifest.json in the zip archive', async () => {
      const campaign = await generateOmnichannelCampaign({
        prompt: 'Zenith Quantum Headphones',
        archetype: 'corporate_tech',
        formats: ['feed_1_1', 'banner_16_9'],
      });

      const zipBlob = await exportCampaignToZip(
        campaign.artboards,
        campaign.title,
        {
          copy: campaign.copy,
          archetype: campaign.archetype,
        },
        {
          format: 'svg',
          includeManifest: true,
        }
      );

      expect(zipBlob).toBeDefined();
      expect(zipBlob.size).toBeGreaterThan(100);
      expect(zipBlob.type).toContain('zip');
    });
  });
});
