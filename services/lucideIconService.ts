import { log } from '../utils/log';

export interface LucideIconResult {
  name: string;
  svg: string;
  tags: string[];
}

async function fetchIcons(query: string): Promise<LucideIconResult[]> {
  try {
    const url = new URL('/api/lucideIcons', window.location.origin);
    url.searchParams.set('q', query);
    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Lucide API error: ${res.status}`);
    const data = await res.json();
    return data.icons || [];
  } catch (err) {
    log.error('[LucideIconService] Search failed', err, { query });
    return [];
  }
}

export async function searchIcons(query: string, limit = 20): Promise<LucideIconResult[]> {
  const icons = await fetchIcons(query);
  return icons.slice(0, limit);
}

export async function downloadIconSVG(name: string): Promise<string | null> {
  try {
    const res = await fetch(`https://lucide.dev/icons/${name}.svg`);
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    log.error('[LucideIconService] Download failed', err, { name });
    return null;
  }
}
