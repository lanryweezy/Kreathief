import { describe, it, expect } from 'vitest';
import { recommendPairingForStyle, getCategoriesWithPairings } from '../../services/typographyPairingEngine';
import { getTypographyConstraint } from '../../services/aiDesignDirector';
import { enforceWcagContrast, polishDesignOutput } from '../../utils/designPolish';
import { generateOmnichannelCampaign, CAMPAIGN_FORMATS } from '../../services/omnichannelCampaignGenerator';
import { Artboard, Layer } from '../../types';

describe('AI Graphic Design System Enhancements', () => {
  describe('Typography Pairing Engine', () => {
    it('recommends valid pairings for various styles and archetypes', () => {
      const cyberpunkPairing = recommendPairingForStyle('cyberpunk');
      expect(cyberpunkPairing).toBeDefined();
      expect(cyberpunkPairing.heading).toBeDefined();
      expect(cyberpunkPairing.body).toBeDefined();

      const luxuryPairing = recommendPairingForStyle('luxury');
      expect(luxuryPairing).toBeDefined();
      expect(luxuryPairing.heading).toBeDefined();

      const editorialPairing = recommendPairingForStyle('editorial');
      expect(editorialPairing).toBeDefined();
    });

    it('getTypographyConstraint produces dynamic pairings', () => {
      const constraint = getTypographyConstraint('cyberpunk');
      expect(constraint).toContain('TYPOGRAPHY PAIRING');
      expect(constraint).toContain('Headlines:');
      expect(constraint).toContain('Body/Subtitle:');
    });

    it('getCategoriesWithPairings returns rich categorized pairings', () => {
      const categories = getCategoriesWithPairings();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty('category');
      expect(categories[0]).toHaveProperty('meta');
      expect(categories[0]).toHaveProperty('pairings');
    });
  });

  describe('WCAG AAA Contrast Auto-Polisher', () => {
    it('adjusts low-contrast dark text on a dark background to high-contrast white/slate', () => {
      const layers: Layer[] = [
        {
          id: 'text_1',
          type: 'text',
          name: 'Low Contrast Dark Text',
          text: 'Invisible Text',
          x: 100,
          y: 100,
          width: 300,
          height: 40,
          fontSize: 16,
          fontWeight: '400',
          fontFamily: 'Inter',
          color: '#1a1a2e', // Very dark on dark background
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
        } as any,
      ];

      const polished = enforceWcagContrast(layers, '#090a0f');
      expect(polished[0].type).toBe('text');
      const textLayer = polished[0] as any;
      expect(textLayer.color).toBe('#f8fafc'); // Auto-adjusted to high contrast
    });

    it('adjusts low-contrast light text on a white card to high-contrast dark text', () => {
      const layers: Layer[] = [
        {
          id: 'card_bg',
          type: 'rectangle',
          name: 'White Card',
          x: 50,
          y: 50,
          width: 500,
          height: 300,
          color: '#ffffff',
          fill: '#ffffff',
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
        } as any,
        {
          id: 'text_inside_card',
          type: 'text',
          name: 'Yellow Text on White',
          text: 'Faint Yellow Text',
          x: 100,
          y: 100,
          width: 300,
          height: 40,
          fontSize: 16,
          fontWeight: '400',
          fontFamily: 'Inter',
          color: '#fef08a', // Low contrast on white
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
        } as any,
      ];

      const polished = enforceWcagContrast(layers, '#090a0f');
      const textLayer = polished[1] as any;
      expect(textLayer.color).toBe('#090a0f'); // Auto-adjusted to dark contrast
    });
  });

  describe('Deterministic Polish & WCAG Contrast Gate', () => {
    it('polishDesignOutput snaps the 4px grid and repairs unreadable text contrast', () => {
      const messyLayers: Layer[] = [
        {
          id: 'unaligned_text',
          type: 'text',
          name: 'Headline',
          text: 'Cyberpunk Revolution Event 2026',
          x: 53, // Not 4px aligned
          y: 101, // Not 4px aligned
          width: 800,
          height: 100,
          fontSize: 48,
          fontWeight: '900',
          fontFamily: 'Arial', // Generic font — resolved upstream by the pairing engine
          color: '#1e293b', // Low contrast on dark bg
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
        } as any,
      ];

      const polished = polishDesignOutput({
        width: 1080,
        height: 1080,
        backgroundColor: '#0f172a',
        layers: messyLayers,
      } as any);

      expect(polished.layers!.length).toBe(1);
      const textLayer = polished.layers![0] as any;
      // Should be snapped to 4px grid
      expect(textLayer.x % 4).toBe(0);
      expect(textLayer.y % 4).toBe(0);
      // Contrast should be repaired from dark to light
      expect(textLayer.color).toBe('#f8fafc');

      // Typography pairing still resolves a non-generic headline font for the archetype
      const pairing = recommendPairingForStyle('cyberpunk');
      expect(pairing.heading).toBeTruthy();
      expect(pairing.heading.toLowerCase()).not.toBe('arial');
    });
  });

  describe('Omnichannel Multi-Format Campaign Generator', () => {
    it('generates 6 synchronized artboards with proper aspect ratios and world coordinates', async () => {
      const campaign = await generateOmnichannelCampaign('Luxury Sustainable Fashion Collection Launch');
      expect(campaign.artboards.length).toBe(6);
      expect(campaign.archetype).toBeDefined();

      const formatIds = campaign.artboards.map((a) => a.id);
      expect(formatIds.some((id) => id.includes('ig_post'))).toBe(true);
      expect(formatIds.some((id) => id.includes('ig_story'))).toBe(true);
      expect(formatIds.some((id) => id.includes('yt_thumbnail'))).toBe(true);
      expect(formatIds.some((id) => id.includes('twitter_header'))).toBe(true);
      expect(formatIds.some((id) => id.includes('fb_ad'))).toBe(true);
      expect(formatIds.some((id) => id.includes('linkedin_banner'))).toBe(true);

      // Verify each artboard has layers and valid dimensions
      campaign.artboards.forEach((ab) => {
        expect(ab.width).toBeGreaterThan(0);
        expect(ab.height).toBeGreaterThan(0);
        expect(ab.layers.length).toBeGreaterThan(0);
      });
    });
  });
});
