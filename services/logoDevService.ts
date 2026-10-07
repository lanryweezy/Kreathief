import { log } from '../utils/log';

export interface LogoDevBrand {
  id: string;
  name: string;
  domain: string;
  logoUrl: string;
  format?: 'png' | 'svg';
  category?: string;
  primaryColor?: string;
}

// Token can be configured via .env.local: VITE_LOGO_DEV_TOKEN=pk_...
const LOGO_DEV_TOKEN = (import.meta.env?.VITE_LOGO_DEV_TOKEN as string) || '';

/**
 * Curated list of popular global brands with exact domains and branding colors
 * Available immediately out-of-the-box even before entering an API key.
 */
export const CURATED_BRANDS: LogoDevBrand[] = [
  // Tech Giants
  { id: 'brand-apple', name: 'Apple', domain: 'apple.com', logoUrl: '', primaryColor: '#000000', category: 'Tech' },
  { id: 'brand-google', name: 'Google', domain: 'google.com', logoUrl: '', primaryColor: '#4285f4', category: 'Tech' },
  { id: 'brand-microsoft', name: 'Microsoft', domain: 'microsoft.com', logoUrl: '', primaryColor: '#00a4ef', category: 'Tech' },
  { id: 'brand-meta', name: 'Meta', domain: 'meta.com', logoUrl: '', primaryColor: '#0668e1', category: 'Tech' },
  { id: 'brand-amazon', name: 'Amazon', domain: 'amazon.com', logoUrl: '', primaryColor: '#ff9900', category: 'Tech' },
  { id: 'brand-openai', name: 'OpenAI', domain: 'openai.com', logoUrl: '', primaryColor: '#10a37f', category: 'Tech' },
  { id: 'brand-github', name: 'GitHub', domain: 'github.com', logoUrl: '', primaryColor: '#181717', category: 'Developer' },
  { id: 'brand-vercel', name: 'Vercel', domain: 'vercel.com', logoUrl: '', primaryColor: '#000000', category: 'Developer' },
  { id: 'brand-stripe', name: 'Stripe', domain: 'stripe.com', logoUrl: '', primaryColor: '#635bff', category: 'Finance' },
  { id: 'brand-figma', name: 'Figma', domain: 'figma.com', logoUrl: '', primaryColor: '#f24e1e', category: 'Design' },
  { id: 'brand-adobe', name: 'Adobe', domain: 'adobe.com', logoUrl: '', primaryColor: '#ff0000', category: 'Design' },
  { id: 'brand-canva', name: 'Canva', domain: 'canva.com', logoUrl: '', primaryColor: '#00c4cc', category: 'Design' },
  { id: 'brand-notion', name: 'Notion', domain: 'notion.so', logoUrl: '', primaryColor: '#000000', category: 'Productivity' },
  { id: 'brand-slack', name: 'Slack', domain: 'slack.com', logoUrl: '', primaryColor: '#4a154b', category: 'Productivity' },
  { id: 'brand-discord', name: 'Discord', domain: 'discord.com', logoUrl: '', primaryColor: '#5865f2', category: 'Social' },
  { id: 'brand-spotify', name: 'Spotify', domain: 'spotify.com', logoUrl: '', primaryColor: '#1ed760', category: 'Media' },
  { id: 'brand-netflix', name: 'Netflix', domain: 'netflix.com', logoUrl: '', primaryColor: '#e50914', category: 'Media' },
  { id: 'brand-youtube', name: 'YouTube', domain: 'youtube.com', logoUrl: '', primaryColor: '#ff0000', category: 'Media' },
  { id: 'brand-tiktok', name: 'TikTok', domain: 'tiktok.com', logoUrl: '', primaryColor: '#000000', category: 'Social' },
  { id: 'brand-twitter', name: 'X / Twitter', domain: 'x.com', logoUrl: '', primaryColor: '#000000', category: 'Social' },
  { id: 'brand-linkedin', name: 'LinkedIn', domain: 'linkedin.com', logoUrl: '', primaryColor: '#0a66c2', category: 'Social' },
  { id: 'brand-uber', name: 'Uber', domain: 'uber.com', logoUrl: '', primaryColor: '#000000', category: 'Tech' },
  { id: 'brand-airbnb', name: 'Airbnb', domain: 'airbnb.com', logoUrl: '', primaryColor: '#ff5a5f', category: 'Travel' },
  { id: 'brand-shopify', name: 'Shopify', domain: 'shopify.com', logoUrl: '', primaryColor: '#96bf48', category: 'Commerce' },

  // Payments & Finance
  { id: 'brand-visa', name: 'Visa', domain: 'visa.com', logoUrl: '', primaryColor: '#1a1f71', category: 'Finance' },
  { id: 'brand-mastercard', name: 'Mastercard', domain: 'mastercard.com', logoUrl: '', primaryColor: '#eb001b', category: 'Finance' },
  { id: 'brand-paypal', name: 'PayPal', domain: 'paypal.com', logoUrl: '', primaryColor: '#003087', category: 'Finance' },
  { id: 'brand-amex', name: 'American Express', domain: 'americanexpress.com', logoUrl: '', primaryColor: '#006fcf', category: 'Finance' },
  { id: 'brand-coinbase', name: 'Coinbase', domain: 'coinbase.com', logoUrl: '', primaryColor: '#0052ff', category: 'Crypto' },

  // Lifestyle & Apparel
  { id: 'brand-nike', name: 'Nike', domain: 'nike.com', logoUrl: '', primaryColor: '#111111', category: 'Apparel' },
  { id: 'brand-adidas', name: 'Adidas', domain: 'adidas.com', logoUrl: '', primaryColor: '#000000', category: 'Apparel' },
  { id: 'brand-starbucks', name: 'Starbucks', domain: 'starbucks.com', logoUrl: '', primaryColor: '#00704a', category: 'Food' },
  { id: 'brand-cocacola', name: 'Coca-Cola', domain: 'coca-cola.com', logoUrl: '', primaryColor: '#f40009', category: 'Food' },
  { id: 'brand-pepsi', name: 'Pepsi', domain: 'pepsi.com', logoUrl: '', primaryColor: '#004b93', category: 'Food' },
  { id: 'brand-mcdonalds', name: "McDonald's", domain: 'mcdonalds.com', logoUrl: '', primaryColor: '#ffbc0d', category: 'Food' },
  { id: 'brand-tesla', name: 'Tesla', domain: 'tesla.com', logoUrl: '', primaryColor: '#e82127', category: 'Auto' },
];

/**
 * Formats a clean logo CDN URL using Logo.dev with intelligent fallback.
 */
export function getLogoUrl(
  domain: string,
  options: {
    format?: 'png' | 'svg';
    size?: number;
    greyscale?: boolean;
    token?: string;
  } = {}
): string {
  const cleanDomain = domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim().toLowerCase();
  if (!cleanDomain) {
    return '';
  }

  const token = options.token || LOGO_DEV_TOKEN;
  const size = options.size || 256;
  const format = options.format || 'png';

  if (token) {
    let url = `https://img.logo.dev/${cleanDomain}?token=${token}&format=${format}&size=${size}`;
    if (options.greyscale) {
      url += '&greyscale=true';
    }
    return url;
  }

  // Graceful fallback when no custom token is provided:
  // Logo.dev public preview CDN or unavatar fallback for crisp rendering
  return `https://img.logo.dev/${cleanDomain}?size=${size}&format=${format}`;
}

/**
 * Searches Logo.dev for brand logos matching a user's query.
 * Combines Logo.dev API, domain extraction, and curated top brands.
 */
export async function searchBrandLogos(query: string, token = LOGO_DEV_TOKEN): Promise<LogoDevBrand[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    // Return default curated popular brands
    return CURATED_BRANDS.slice(0, 24).map((b) => ({
      ...b,
      logoUrl: getLogoUrl(b.domain, { size: 256, token }),
    }));
  }

  const results: LogoDevBrand[] = [];
  const seenDomains = new Set<string>();

  // 1. Direct domain match (e.g. user typed "stripe.com" or "uber.co")
  const isDomainPattern = /^[a-z0-9-]+(\.[a-z]{2,})+$/i.test(trimmed);
  if (isDomainPattern) {
    const brandName = trimmed.split('.')[0].replace(/-/g, ' ');
    const formattedName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
    const domainBrand: LogoDevBrand = {
      id: `domain-${trimmed}`,
      name: formattedName,
      domain: trimmed,
      logoUrl: getLogoUrl(trimmed, { size: 256, token }),
    };
    results.push(domainBrand);
    seenDomains.add(trimmed);
  }

  // 2. Curated brands match
  const curatedMatches = CURATED_BRANDS.filter(
    (b) =>
      b.name.toLowerCase().includes(trimmed) ||
      b.domain.toLowerCase().includes(trimmed) ||
      b.category?.toLowerCase().includes(trimmed)
  );

  curatedMatches.forEach((b) => {
    if (!seenDomains.has(b.domain)) {
      results.push({
        ...b,
        logoUrl: getLogoUrl(b.domain, { size: 256, token }),
      });
      seenDomains.add(b.domain);
    }
  });

  // 3. Logo.dev Search API (if token provided)
  if (token) {
    try {
      const response = await fetch(`https://api.logo.dev/search?q=${encodeURIComponent(trimmed)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const apiData = await response.json();
        if (Array.isArray(apiData)) {
          apiData.forEach((item: any) => {
            const domain = item.domain || item.name;
            if (domain && !seenDomains.has(domain)) {
              results.push({
                id: `logodev-${domain}`,
                name: item.name || domain,
                domain: domain,
                logoUrl: item.logo_url || getLogoUrl(domain, { size: 256, token }),
                primaryColor: item.colors?.[0] || undefined,
              });
              seenDomains.add(domain);
            }
          });
        }
      }
    } catch (apiErr) {
      log.warn('[logoDevService] API search failed, falling back to local search', apiErr);
    }
  }

  // 4. If query doesn't match a top brand and isn't an explicit domain, synthesize a likely domain
  if (results.length === 0 && trimmed.length >= 2) {
    const candidateDomain = `${trimmed.replace(/\s+/g, '')}.com`;
    results.push({
      id: `guess-${candidateDomain}`,
      name: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
      domain: candidateDomain,
      logoUrl: getLogoUrl(candidateDomain, { size: 256, token }),
    });
  }

  return results;
}

/**
 * Extracts a complete Brand Kit profile from a domain (Logo + Palette).
 */
export async function fetchBrandKitFromDomain(domain: string, token = LOGO_DEV_TOKEN) {
  const cleanDomain = domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim().toLowerCase();
  const baseName = cleanDomain.split('.')[0].replace(/-/g, ' ');
  const displayName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
  const logoUrl = getLogoUrl(cleanDomain, { size: 512, format: 'png', token });

  // Known curated brand colors fallback
  const curated = CURATED_BRANDS.find((b) => b.domain === cleanDomain);
  const primaryColor = curated?.primaryColor || '#7D2AE8';

  return {
    name: displayName,
    domain: cleanDomain,
    logoUrl,
    colors: [primaryColor, '#ffffff', '#111827'],
    fonts: ['Space Grotesk', 'Inter'],
  };
}
