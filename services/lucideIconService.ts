import { log } from '../utils/log';

export interface LucideIconResult {
  name: string;
  svg: string;
  tags: string[];
}

const COMMON_LUCIDE_ICONS: { name: string; tags: string[]; path: string }[] = [
  {
    name: 'star',
    tags: ['favorite', 'rating', 'star', 'like'],
    path: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  },
  {
    name: 'heart',
    tags: ['love', 'like', 'favorite', 'heart'],
    path: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  },
  {
    name: 'user',
    tags: ['person', 'profile', 'account', 'user'],
    path: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  },
  {
    name: 'home',
    tags: ['house', 'main', 'dashboard', 'home'],
    path: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  },
  {
    name: 'search',
    tags: ['find', 'query', 'magnifying glass', 'search'],
    path: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  },
  {
    name: 'settings',
    tags: ['cog', 'gear', 'preferences', 'settings'],
    path: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  },
  { name: 'check', tags: ['done', 'success', 'tick', 'check', 'ok'], path: '<polyline points="20 6 9 17 4 12"/>' },
  {
    name: 'x',
    tags: ['close', 'remove', 'delete', 'cancel', 'x'],
    path: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  },
  {
    name: 'bell',
    tags: ['notification', 'alarm', 'alert', 'bell'],
    path: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  },
  {
    name: 'mail',
    tags: ['email', 'letter', 'envelope', 'message', 'mail'],
    path: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  },
  {
    name: 'camera',
    tags: ['photo', 'picture', 'capture', 'camera'],
    path: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  },
  {
    name: 'image',
    tags: ['photo', 'picture', 'gallery', 'image'],
    path: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  },
  {
    name: 'lock',
    tags: ['secure', 'closed', 'password', 'key', 'lock'],
    path: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  },
  {
    name: 'calendar',
    tags: ['date', 'day', 'month', 'schedule', 'calendar'],
    path: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  },
  {
    name: 'clock',
    tags: ['time', 'hour', 'timer', 'watch', 'clock'],
    path: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  },
  {
    name: 'trash',
    tags: ['delete', 'remove', 'bin', 'trash'],
    path: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  },
  {
    name: 'edit',
    tags: ['pencil', 'modify', 'write', 'edit'],
    path: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  },
  {
    name: 'share-2',
    tags: ['send', 'social', 'network', 'share'],
    path: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  },
  {
    name: 'download',
    tags: ['save', 'export', 'get', 'download'],
    path: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  },
  {
    name: 'zap',
    tags: ['lightning', 'fast', 'electricity', 'power', 'zap'],
    path: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  },
  {
    name: 'sun',
    tags: ['light', 'day', 'weather', 'bright', 'sun'],
    path: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  },
  { name: 'moon', tags: ['dark', 'night', 'theme', 'moon'], path: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>' },
  {
    name: 'globe',
    tags: ['world', 'earth', 'internet', 'web', 'globe'],
    path: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  },
  {
    name: 'shopping-cart',
    tags: ['shop', 'store', 'cart', 'buy'],
    path: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  },
  {
    name: 'award',
    tags: ['trophy', 'badge', 'prize', 'winner', 'award'],
    path: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
  },
  {
    name: 'shield',
    tags: ['security', 'protection', 'safe', 'shield'],
    path: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  },
  {
    name: 'smile',
    tags: ['happy', 'face', 'emoji', 'smile'],
    path: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  },
  {
    name: 'arrow-right',
    tags: ['arrow', 'next', 'forward', 'right'],
    path: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  },
  {
    name: 'arrow-left',
    tags: ['arrow', 'prev', 'back', 'left'],
    path: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  },
  {
    name: 'folder',
    tags: ['directory', 'files', 'storage', 'folder'],
    path: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>',
  },
];

function getFallbackLucideSVG(name: string): string {
  const found = COMMON_LUCIDE_ICONS.find((i) => i.name.toLowerCase() === name.toLowerCase());
  const pathData = found ? found.path : '<circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6Z"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${pathData}</svg>`;
}

async function fetchIcons(query: string): Promise<LucideIconResult[]> {
  try {
    const url = new URL('/api/lucideIcons', window.location.origin);
    url.searchParams.set('q', query);
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      throw new Error(`Lucide API error: ${res.status}`);
    }
    const data = await res.json();
    if (data.icons && data.icons.length > 0) {
      return data.icons;
    }
  } catch (err) {
    log.warn('[LucideIconService] Backend search failed or empty, using client-side fallback', err, { query });
  }

  const q = query.trim().toLowerCase();
  const matched = COMMON_LUCIDE_ICONS.filter((item) => {
    if (!q) {
      return true;
    }
    return item.name.includes(q) || item.tags.some((t) => t.includes(q));
  }).map((item) => ({
    name: item.name,
    svg: getFallbackLucideSVG(item.name),
    tags: item.tags,
  }));

  return matched;
}

export async function searchIcons(query: string, limit = 20): Promise<LucideIconResult[]> {
  const icons = await fetchIcons(query);
  return icons.slice(0, limit);
}

export async function downloadIconSVG(name: string): Promise<string | null> {
  try {
    const res = await fetch(`https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/${name}.svg`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.text();
    }
  } catch (err) {}
  try {
    const res = await fetch(`https://unpkg.com/lucide-static@latest/icons/${name}.svg`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.text();
    }
  } catch (err) {}
  try {
    const res = await fetch(`https://lucide.dev/icons/${name}.svg`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      return await res.text();
    }
  } catch (err) {}

  return getFallbackLucideSVG(name);
}
