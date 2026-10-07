import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLogoUrl, searchBrandLogos, fetchBrandKitFromDomain, CURATED_BRANDS } from '../../../services/logoDevService';

describe('logoDevService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getLogoUrl', () => {
    it('generates a clean Logo.dev URL for a domain', () => {
      const url = getLogoUrl('stripe.com');
      expect(url).toContain('img.logo.dev/stripe.com');
      expect(url).toContain('size=256');
    });

    it('sanitizes https:// protocol and paths', () => {
      const url = getLogoUrl('https://apple.com/iphone');
      expect(url).toContain('img.logo.dev/apple.com');
      expect(url).not.toContain('https://apple.com/iphone');
    });

    it('appends token if provided', () => {
      const url = getLogoUrl('nike.com', { token: 'pk_test123' });
      expect(url).toContain('token=pk_test123');
    });
  });

  describe('searchBrandLogos', () => {
    it('returns curated brands when query is empty', async () => {
      const results = await searchBrandLogos('');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((b) => b.name === 'Apple')).toBe(true);
      expect(results.some((b) => b.name === 'Stripe')).toBe(true);
    });

    it('filters curated brands by query', async () => {
      const results = await searchBrandLogos('spotify');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Spotify');
      expect(results[0].domain).toBe('spotify.com');
    });

    it('creates direct domain brand if domain is typed', async () => {
      const results = await searchBrandLogos('acmecorp.io');
      expect(results.some((b) => b.domain === 'acmecorp.io')).toBe(true);
    });
  });

  describe('fetchBrandKitFromDomain', () => {
    it('extracts brand kit info for a domain', async () => {
      const brand = await fetchBrandKitFromDomain('spotify.com');
      expect(brand.name).toBe('Spotify');
      expect(brand.domain).toBe('spotify.com');
      expect(brand.logoUrl).toContain('spotify.com');
      expect(brand.colors.length).toBeGreaterThan(0);
      expect(brand.fonts.length).toBeGreaterThan(0);
    });
  });
});
