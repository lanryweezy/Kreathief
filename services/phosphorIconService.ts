import { log } from '../utils/log';

export interface PhosphorIconResult {
  name: string;
  svg: string;
  tags: string[];
}

async function fetchIcons(query: string): Promise<PhosphorIconResult[]> {
  try {
    const url = new URL('/api/phosphorIcons', window.location.origin);
    url.searchParams.set('q', query);
    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Phosphor API error: ${res.status}`);
    const data = await res.json();
    return data.icons || [];
  } catch (err) {
    log.error('[PhosphorIconService] Search failed', err, { query });
    return [];
  }
}

export async function searchIcons(query: string, limit = 20): Promise<PhosphorIconResult[]> {
  const icons = await fetchIcons(query);
  return icons.slice(0, limit);
}

export async function downloadIconSVG(name: string, weight: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone' = 'regular'): Promise<string | null> {
  try {
    const res = await fetch(`https://api.phosphoricons.com/v1/icons/${encodeURIComponent(name)}/${weight}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.svg || null;
  } catch (err) {
    log.error('[PhosphorIconService] Download failed', err, { name });
    return null;
  }
}
