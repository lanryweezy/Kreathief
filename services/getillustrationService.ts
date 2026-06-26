const BASE_URL = 'https://getillustrations.com/api/v1/plugin';
const API_KEY = import.meta.env.VITE_GETILLUSTRATION_KEY || '';

const headers = () => ({
  Authorization: `Bearer ${API_KEY}`,
});

export interface GIHit {
  id: string;
  name: string;
  thumbnail: string;
  tags?: string;
}

export interface GISearchResult {
  hits: GIHit[];
  total: number;
}

export interface GIPack {
  id: number;
  name: string;
  illustrationCount?: number;
  thumbnail?: string;
}

export interface GIIconPack {
  id: string;
  name: string;
  iconCount?: number;
}

export async function searchIllustrations(query: string, limit = 20): Promise<GISearchResult> {
  if (!API_KEY) return { hits: [], total: 0 };
  const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}&type=illustration&limit=${limit}`, {
    headers: headers(),
  });
  if (!res.ok) return { hits: [], total: 0 };
  return res.json();
}

export async function searchIcons(query: string, limit = 20): Promise<GISearchResult> {
  if (!API_KEY) return { hits: [], total: 0 };
  const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}&type=icon&limit=${limit}`, {
    headers: headers(),
  });
  if (!res.ok) return { hits: [], total: 0 };
  return res.json();
}

export async function getIllustrationSVG(type: 'illustration' | 'icon', id: string): Promise<string | null> {
  if (!API_KEY) return null;
  const res = await fetch(`${BASE_URL}/svg/${type}/${id}?json=true`, {
    headers: headers(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.svg_inline || null;
}

export async function downloadAsset(type: 'illustration' | 'icon', packId: string, assetId: string, format: 'svg' | 'png' = 'svg'): Promise<string | null> {
  if (!API_KEY) return null;
  const res = await fetch(`${BASE_URL}/download/${type}/${packId}/${assetId}?format=${format}`, {
    headers: headers(),
  });
  if (!res.ok) return null;
  if (format === 'svg') return res.text();
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function listPacks(page = 1, limit = 20, featured?: boolean): Promise<GIPack[]> {
  if (!API_KEY) return [];
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (featured) params.set('featured', 'true');
  const res = await fetch(`${BASE_URL}/packs?${params}`, { headers: headers() });
  if (!res.ok) return [];
  return res.json();
}

export async function listIconPacks(page = 1, limit = 20, featured?: boolean): Promise<GIIconPack[]> {
  if (!API_KEY) return [];
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (featured) params.set('featured', 'true');
  const res = await fetch(`${BASE_URL}/icon-packs?${params}`, { headers: headers() });
  if (!res.ok) return [];
  return res.json();
}

export async function getPackIllustrations(packId: number, page = 1, limit = 20): Promise<GIHit[]> {
  if (!API_KEY) return [];
  const res = await fetch(`${BASE_URL}/packs/${packId}/illustrations?page=${page}&limit=${limit}`, {
    headers: headers(),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getPackIcons(packId: string, page = 1, limit = 20): Promise<GIHit[]> {
  if (!API_KEY) return [];
  const res = await fetch(`${BASE_URL}/icon-packs/${packId}/icons?page=${page}&limit=${limit}`, {
    headers: headers(),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getRandomIcons(count = 24, pack?: string): Promise<GIHit[]> {
  if (!API_KEY) return [];
  const params = new URLSearchParams({ count: String(count) });
  if (pack) params.set('pack', pack);
  const res = await fetch(`${BASE_URL}/icons/random?${params}`, { headers: headers() });
  if (!res.ok) return [];
  return res.json();
}

export function isConfigured(): boolean {
  return !!API_KEY;
}
