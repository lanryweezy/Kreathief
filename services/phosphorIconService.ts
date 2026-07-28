import { log } from '../utils/log';

export interface PhosphorIconResult {
  name: string;
  svg: string;
  tags: string[];
}

const COMMON_PHOSPHOR_ICONS: { name: string; tags: string[]; path: string }[] = [
  {
    name: 'heart',
    tags: ['love', 'favorite', 'like'],
    path: '<path d="M128,216S28,160,28,92A52,52,0,0,1,128,72a52,52,0,0,1,100,20C228,160,128,216,128,216Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>',
  },
  {
    name: 'star',
    tags: ['favorite', 'rating', 'star'],
    path: '<polygon points="128 16 163 87 241 98 185 153 198 231 128 194 58 231 71 153 15 98 93 87 128 16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>',
  },
  {
    name: 'user',
    tags: ['person', 'account', 'profile'],
    path: '<circle cx="128" cy="96" r="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M31,216a112,112,0,0,1,194,0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>',
  },
  {
    name: 'house',
    tags: ['home', 'main', 'dashboard'],
    path: '<path d="M104,216V152h48v64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M24,104,128,24l104,80v96a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>',
  },
  {
    name: 'magnifying-glass',
    tags: ['search', 'find', 'query'],
    path: '<circle cx="116" cy="116" r="84" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="175.4" y1="175.4" x2="224" y2="224" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>',
  },
  {
    name: 'gear',
    tags: ['settings', 'cog', 'preferences'],
    path: '<circle cx="128" cy="128" r="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M197.4,80.6a8.1,8.1,0,0,1,3.4,6.4l2.6,32a8.1,8.1,0,0,1-4.7,8.2l-29.3,12.1a7.9,7.9,0,0,0-4.6,7.2v.1a7.9,7.9,0,0,0,4.6,7.2l29.3,12.1a8.1,8.1,0,0,1,4.7,8.2l-2.6,32a8.1,8.1,0,0,1-3.4,6.4l-27,19a8.1,8.1,0,0,1-7.2,1.3l-29.6-11.4a8,8,0,0,0-8.2,2.6l-.1.1a8,8,0,0,0-2.6,8.2l11.4,29.6a8.1,8.1,0,0,1-1.3,7.2l-19,27a8.1,8.1,0,0,1-6.4,3.4l-32-2.6a8.1,8.1,0,0,1-8.2-4.7l-12.1-29.3a7.9,7.9,0,0,0-7.2-4.6h-.1a7.9,7.9,0,0,0-7.2,4.6L35,236.7a8.1,8.1,0,0,1-8.2,4.7l-32,2.6a8.1,8.1,0,0,1-6.4-3.4l-19-27a8.1,8.1,0,0,1,1.3-7.2l11.4-29.6a8,8,0,0,0-2.6-8.2l-.1-.1a8,8,0,0,0-8.2-2.6L41.6,180a8.1,8.1,0,0,1-7.2-1.3l-27-19a8.1,8.1,0,0,1-3.4-6.4l-2.6-32A8.1,8.1,0,0,1,6.1,113.1L35.4,101a7.9,7.9,0,0,0,4.6-7.2v-.1a7.9,7.9,0,0,0-4.6-7.2L6.1,74.4A8.1,8.1,0,0,1,1.4,66.2l2.6-32a8.1,8.1,0,0,1,3.4-6.4l27-19a8.1,8.1,0,0,1,7.2-1.3l29.6,11.4a8,8,0,0,0,8.2-2.6l.1-.1a8,8,0,0,0,2.6-8.2L70.7,3.3A8.1,8.1,0,0,1,72,2l19-27A8.1,8.1,0,0,1,97.4,1.4l32,2.6a8.1,8.1,0,0,1,8.2,4.7l12.1,29.3a7.9,7.9,0,0,0,7.2,4.6h.1a7.9,7.9,0,0,0,7.2-4.6l12.1-29.3a8.1,8.1,0,0,1,8.2-4.7l32-2.6a8.1,8.1,0,0,1,6.4,3.4l19,27Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>',
  },
  {
    name: 'bell',
    tags: ['notification', 'alarm', 'alert'],
    path: '<path d="M200,168V112a72,72,0,0,0-144,0v56L40,184V192H216v-8Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M96,192a32,32,0,0,0,64,0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>',
  },
  {
    name: 'envelope',
    tags: ['mail', 'message', 'letter'],
    path: '<rect x="32" y="48" width="192" height="160" rx="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="224 56 128 144 32 56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>',
  },
  {
    name: 'camera',
    tags: ['photo', 'picture', 'image'],
    path: '<path d="M208,56H180.3l-16-24H91.7l-16,24H48A16,16,0,0,0,32,72V192a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V72A16,16,0,0,0,208,56Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="128" cy="132" r="36" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>',
  },
  {
    name: 'check',
    tags: ['done', 'success', 'ok'],
    path: '<polyline points="216 72 104 184 40 120" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>',
  },
  {
    name: 'x',
    tags: ['close', 'remove', 'delete', 'cancel'],
    path: '<line x1="200" y1="56" x2="56" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="200" y1="200" x2="56" y2="56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>',
  },
  {
    name: 'trash',
    tags: ['delete', 'remove', 'bin'],
    path: '<line x1="216" y1="56" x2="40" y2="56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M200,56V208a8,8,0,0,1-8,8H64a8,8,0,0,1-8-8V56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M168,56V40a16,16,0,0,0-16-16H104A16,16,0,0,0,88,40V56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>',
  },
  {
    name: 'folder',
    tags: ['directory', 'files', 'storage'],
    path: '<path d="M32,80V200a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V104a8,8,0,0,0-8-8H131.3a8,8,0,0,1-5.7-2.3L104,72.7A8,8,0,0,0,98.3,70H40A8,8,0,0,0,32,80Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>',
  },
  {
    name: 'globe',
    tags: ['world', 'earth', 'internet'],
    path: '<circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><ellipse cx="128" cy="128" rx="40" ry="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="37.5" y1="96" x2="218.5" y2="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="37.5" y1="160" x2="218.5" y2="160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>',
  },
  {
    name: 'lightning',
    tags: ['zap', 'fast', 'power', 'electricity'],
    path: '<polygon points="160 16 72 136 128 136 96 240 184 120 128 120 160 16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>',
  },
  {
    name: 'shield',
    tags: ['security', 'protection', 'safe'],
    path: '<path d="M208,72c0,72-80,152-80,152S48,144,48,72A16,16,0,0,1,64,56h128A16,16,0,0,1,208,72Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>',
  },
];

function getFallbackPhosphorSVG(name: string): string {
  const found = COMMON_PHOSPHOR_ICONS.find((i) => i.name.toLowerCase() === name.toLowerCase());
  const pathData = found
    ? found.path
    : '<circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" fill="none">${pathData}</svg>`;
}

async function fetchIcons(query: string): Promise<PhosphorIconResult[]> {
  try {
    const url = new URL('/api/phosphorIcons', window.location.origin);
    url.searchParams.set('q', query);
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      throw new Error(`Phosphor API error: ${res.status}`);
    }
    const data = await res.json();
    if (data.icons && data.icons.length > 0) {
      return data.icons;
    }
  } catch (err) {
    log.warn('[PhosphorIconService] Backend search failed or empty, using client-side fallback', err, { query });
  }

  const q = query.trim().toLowerCase();
  return COMMON_PHOSPHOR_ICONS.filter((item) => {
    if (!q) {
      return true;
    }
    return item.name.includes(q) || item.tags.some((t) => t.includes(q));
  }).map((item) => ({
    name: item.name,
    svg: getFallbackPhosphorSVG(item.name),
    tags: item.tags,
  }));
}

export async function searchIcons(query: string, limit = 20): Promise<PhosphorIconResult[]> {
  const icons = await fetchIcons(query);
  return icons.slice(0, limit);
}

export async function downloadIconSVG(
  name: string,
  weight: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone' = 'regular'
): Promise<string | null> {
  try {
    const res = await fetch(`https://api.phosphoricons.com/v1/icons/${encodeURIComponent(name)}/${weight}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.svg) {
        return data.svg;
      }
    }
  } catch (err) {
    log.warn('[PhosphorIconService] Download failed, returning fallback SVG', err, { name });
  }
  return getFallbackPhosphorSVG(name);
}
