import { log } from '../utils/log';

export interface MaterialIconResult {
  name: string;
  svgUrl: string;
}

const COMMON_MATERIAL_ICONS: string[] = [
  'home',
  'favorite',
  'search',
  'settings',
  'person',
  'done',
  'close',
  'add',
  'delete',
  'edit',
  'star',
  'info',
  'check_circle',
  'warning',
  'error',
  'mail',
  'phone',
  'lock',
  'visibility',
  'visibility_off',
  'date_range',
  'schedule',
  'file_download',
  'file_upload',
  'share',
  'bookmark',
  'flag',
  'thumb_up',
  'send',
  'language',
  'location_on',
  'wb_sunny',
  'nightlight_round',
  'flash_on',
  'trending_up',
  'attach_money',
  'credit_card',
  'shopping_cart',
  'card_giftcard',
  'local_shipping',
  'emoji_events',
  'security',
  'sentiment_satisfied',
  'wifi',
  'battery_full',
  'computer',
  'smartphone',
  'camera_alt',
  'image',
  'videocam',
  'music_note',
  'folder',
  'description',
  'help',
  'menu',
  'arrow_forward',
  'arrow_back',
];

async function fetchIcons(query: string): Promise<MaterialIconResult[]> {
  try {
    const url = new URL('/api/materialIcons', window.location.origin);
    url.searchParams.set('q', query);
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      throw new Error(`Material Icons API error: ${res.status}`);
    }
    const data = await res.json();
    if (data.icons && data.icons.length > 0) {
      return data.icons.map((name: string) => ({
        name,
        svgUrl: `https://fonts.gstatic.com/s/materialicons/${encodeURIComponent(name)}.svg`,
      }));
    }
  } catch (err) {
    log.warn('[MaterialIconService] Backend search failed or empty, using client-side fallback', err, { query });
  }

  const q = query.trim().toLowerCase();
  const matched = COMMON_MATERIAL_ICONS.filter((name) => !q || name.includes(q));
  return matched.map((name) => ({
    name,
    svgUrl: `https://fonts.gstatic.com/s/materialicons/${encodeURIComponent(name)}.svg`,
  }));
}

export async function searchIcons(query: string, limit = 20): Promise<MaterialIconResult[]> {
  const icons = await fetchIcons(query);
  return icons.slice(0, limit);
}

export async function downloadIconSVG(name: string): Promise<string | null> {
  try {
    const res = await fetch(`https://fonts.gstatic.com/s/materialicons/${encodeURIComponent(name)}.svg`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      return null;
    }
    return await res.text();
  } catch (err) {
    log.warn('[MaterialIconService] Download failed, returning fallback SVG', err, { name });
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>`;
  }
}
