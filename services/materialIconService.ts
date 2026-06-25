import { log } from '../utils/log';

export interface MaterialIconResult {
  name: string;
  svgUrl: string;
}

async function fetchIcons(query: string): Promise<MaterialIconResult[]> {
  try {
    const url = new URL('/api/materialIcons', window.location.origin);
    url.searchParams.set('q', query);
    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Material Icons API error: ${res.status}`);
    const data = await res.json();
    return (data.icons || []).map((name: string) => ({
      name,
      svgUrl: `https://fonts.gstatic.com/s/materialicons/${encodeURIComponent(name)}.svg`,
    }));
  } catch (err) {
    log.error('[MaterialIconService] Search failed', err, { query });
    return [];
  }
}

export async function searchIcons(query: string, limit = 20): Promise<MaterialIconResult[]> {
  const icons = await fetchIcons(query);
  return icons.slice(0, limit);
}

export async function downloadIconSVG(name: string): Promise<string | null> {
  try {
    const res = await fetch(`https://fonts.gstatic.com/s/materialicons/${encodeURIComponent(name)}.svg`);
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    log.error('[MaterialIconService] Download failed', err, { name });
    return null;
  }
}
