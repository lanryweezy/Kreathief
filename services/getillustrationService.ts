import { log } from '../utils/log';

const BASE_URL = '/api/getillustration';

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
  try {
    const res = await fetch(`${BASE_URL}?action=search&query=${encodeURIComponent(query)}&limit=${limit}`);
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
  try {
    const params = new URLSearchParams({ action: 'icon-packs', page: String(page), limit: String(limit) });
    if (freeOnly) params.set('free', 'true');
    const res = await fetch(`${BASE_URL}?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export async function listPacks(page = 1, limit = 20, freeOnly = false): Promise<GIPack[]> {
  try {
    const params = new URLSearchParams({ action: 'packs', page: String(page), limit: String(limit) });
    if (freeOnly) params.set('free', 'true');
    const res = await fetch(`${BASE_URL}?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export async function getPackIllustrations(packId: string, page = 1, limit = 20): Promise<GIAsset[]> {
  try {
    const res = await fetch(
      `${BASE_URL}?action=pack-illustrations&packId=${encodeURIComponent(packId)}&page=${page}&limit=${limit}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export async function getPackIcons(packId: string, page = 1, limit = 20): Promise<GIAsset[]> {
  try {
    const res = await fetch(
      `${BASE_URL}?action=pack-icons&packId=${encodeURIComponent(packId)}&page=${page}&limit=${limit}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export async function getRandomIcons(count = 24, pack?: string): Promise<GIAsset[]> {
  try {
    const params = new URLSearchParams({ action: 'random-icons', count: String(count) });
    if (pack) params.set('pack', pack);
    const res = await fetch(`${BASE_URL}?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || data.icons || [];
  } catch {
    return [];
  }
}

let configuredCache: boolean | null = null;
export async function isConfiguredAsync(): Promise<boolean> {
  if (configuredCache !== null) return configuredCache;
  try {
    const res = await fetch(`${BASE_URL}?action=check-config`);
    configuredCache = res.ok;
    return configuredCache;
  } catch {
    return false;
  }
}

export function isConfigured(): boolean {
  return configuredCache !== false;
}
