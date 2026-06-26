const BASE_URL = 'https://getillustrations.com/api/v1/plugin';
const API_KEY = import.meta.env.VITE_GETILLUSTRATION_KEY || '';

const headers = () => ({
  Authorization: `Bearer ${API_KEY}`,
});

export interface GIAsset {
  id: string;
  name?: string;
  imageUrl: string;
  thumbnailUrl: string;
  tags?: string;
  packId?: string;
  pack?: { id: string; name: string; urlName?: string };
  svgAvailable?: boolean;
  hasAccess?: boolean;
}

export interface GIPack {
  id: string;
  name: string;
  urlName?: string;
  iconCount?: number;
  illustrationCount?: number;
  heroPhoto?: string;
  shortDescription?: string;
}

export interface GIIconPack {
  id: string;
  name: string;
  urlName?: string;
  iconCount?: number;
  heroPhoto?: string;
}

export interface GISearchResult {
  illustrations: GIAsset[];
  icons: GIAsset[];
  packs: GIPack[];
  iconPacks: GIIconPack[];
}

export async function searchAll(query: string, limit = 20): Promise<GISearchResult> {
  if (!API_KEY) return { illustrations: [], icons: [], packs: [], iconPacks: [] };
  try {
    const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      headers: headers(),
    });
    if (!res.ok) return { illustrations: [], icons: [], packs: [], iconPacks: [] };
    const data = await res.json();
    return data.results || { illustrations: [], icons: [], packs: [], iconPacks: [] };
  } catch {
    return { illustrations: [], icons: [], packs: [], iconPacks: [] };
  }
}

export async function searchIllustrations(query: string, limit = 20): Promise<GIAsset[]> {
  const result = await searchAll(query, limit);
  return result.illustrations;
}

export async function searchIcons(query: string, limit = 20): Promise<GIAsset[]> {
  const result = await searchAll(query, limit);
  return result.icons;
}

export async function listIconPacks(page = 1, limit = 20, freeOnly = false): Promise<GIIconPack[]> {
  if (!API_KEY) return [];
  try {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (freeOnly) params.set('free', 'true');
    const res = await fetch(`${BASE_URL}/icon-packs?${params}`, { headers: headers() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export async function listPacks(page = 1, limit = 20, freeOnly = false): Promise<GIPack[]> {
  if (!API_KEY) return [];
  try {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (freeOnly) params.set('free', 'true');
    const res = await fetch(`${BASE_URL}/packs?${params}`, { headers: headers() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export async function getPackIllustrations(packId: string, page = 1, limit = 20): Promise<GIAsset[]> {
  if (!API_KEY) return [];
  try {
    const res = await fetch(`${BASE_URL}/packs/${packId}/illustrations?page=${page}&limit=${limit}`, {
      headers: headers(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export async function getPackIcons(packId: string, page = 1, limit = 20): Promise<GIAsset[]> {
  if (!API_KEY) return [];
  try {
    const res = await fetch(`${BASE_URL}/icon-packs/${packId}/icons?page=${page}&limit=${limit}`, {
      headers: headers(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export async function getRandomIcons(count = 24, pack?: string): Promise<GIAsset[]> {
  if (!API_KEY) return [];
  try {
    const params = new URLSearchParams({ count: String(count) });
    if (pack) params.set('pack', pack);
    const res = await fetch(`${BASE_URL}/icons/random?${params}`, { headers: headers() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || data.icons || [];
  } catch {
    return [];
  }
}

export function isConfigured(): boolean {
  return !!API_KEY;
}
