import { log } from '../utils/log';

export interface LucideIconResult {
  name: string;
  svg: string;
  tags: string[];
}

const COMMON_LUCIDE_ICONS: { name: string; tags: string[]; path: string }[] = [
  { name: 'star', tags: ['favorite', 'rating', 'star', 'like', 'review'], path: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
  { name: 'heart', tags: ['love', 'like', 'favorite', 'heart', 'health'], path: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>' },
  { name: 'user', tags: ['person', 'profile', 'account', 'user', 'member', 'avatar'], path: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
  { name: 'users', tags: ['team', 'group', 'people', 'community', 'collaborate'], path: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
  { name: 'home', tags: ['house', 'main', 'dashboard', 'home', 'building'], path: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
  { name: 'search', tags: ['find', 'query', 'magnifying glass', 'search', 'explore'], path: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' },
  { name: 'settings', tags: ['cog', 'gear', 'preferences', 'settings', 'options'], path: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>' },
  { name: 'check', tags: ['done', 'success', 'tick', 'check', 'ok', 'verified'], path: '<polyline points="20 6 9 17 4 12"/>' },
  { name: 'check-circle', tags: ['done', 'success', 'complete', 'verified', 'approved'], path: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' },
  { name: 'x', tags: ['close', 'remove', 'delete', 'cancel', 'x', 'cross'], path: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' },
  { name: 'bell', tags: ['notification', 'alarm', 'alert', 'bell', 'ring'], path: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>' },
  { name: 'mail', tags: ['email', 'letter', 'envelope', 'message', 'mail', 'contact'], path: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>' },
  { name: 'camera', tags: ['photo', 'picture', 'capture', 'camera', 'lens'], path: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>' },
  { name: 'image', tags: ['photo', 'picture', 'gallery', 'image', 'graphic'], path: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>' },
  { name: 'lock', tags: ['secure', 'closed', 'password', 'key', 'lock', 'privacy'], path: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' },
  { name: 'unlock', tags: ['open', 'unlocked', 'access', 'security'], path: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>' },
  { name: 'calendar', tags: ['date', 'day', 'month', 'schedule', 'calendar', 'event'], path: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
  { name: 'clock', tags: ['time', 'hour', 'timer', 'watch', 'clock', 'duration'], path: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
  { name: 'trash', tags: ['delete', 'remove', 'bin', 'trash', 'garbage'], path: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' },
  { name: 'edit', tags: ['pencil', 'modify', 'write', 'edit', 'draft'], path: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>' },
  { name: 'share-2', tags: ['send', 'social', 'network', 'share', 'forward'], path: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>' },
  { name: 'download', tags: ['save', 'export', 'get', 'download', 'file'], path: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>' },
  { name: 'upload', tags: ['send', 'import', 'cloud', 'upload', 'file'], path: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>' },
  { name: 'zap', tags: ['lightning', 'fast', 'electricity', 'power', 'zap', 'energy', 'quick'], path: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' },
  { name: 'sparkles', tags: ['magic', 'ai', 'clean', 'glitter', 'sparkles', 'generate', 'effect'], path: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>' },
  { name: 'sun', tags: ['light', 'day', 'weather', 'bright', 'sun', 'summer'], path: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>' },
  { name: 'moon', tags: ['dark', 'night', 'theme', 'moon', 'sleep'], path: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>' },
  { name: 'flame', tags: ['fire', 'hot', 'burn', 'popular', 'trending', 'flame'], path: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>' },
  { name: 'globe', tags: ['world', 'earth', 'internet', 'web', 'globe', 'international'], path: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' },
  { name: 'shopping-cart', tags: ['shop', 'store', 'cart', 'buy', 'ecommerce', 'checkout'], path: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>' },
  { name: 'shopping-bag', tags: ['shop', 'bag', 'buy', 'store', 'retail'], path: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>' },
  { name: 'award', tags: ['trophy', 'badge', 'prize', 'winner', 'award', 'medal'], path: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>' },
  { name: 'shield', tags: ['security', 'protection', 'safe', 'shield', 'defense'], path: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' },
  { name: 'shield-check', tags: ['security', 'verified', 'safe', 'protect'], path: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>' },
  { name: 'tag', tags: ['price', 'label', 'tag', 'discount', 'sale'], path: '<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><circle cx="7" cy="7" r=".5" fill="currentColor"/>' },
  { name: 'gift', tags: ['present', 'gift', 'box', 'surprise', 'birthday'], path: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>' },
  { name: 'coffee', tags: ['drink', 'cup', 'tea', 'cafe', 'coffee', 'hot'], path: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h12Zm0 0h1a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4h-1"/><path d="M6 2v2"/>' },
  { name: 'music', tags: ['audio', 'song', 'sound', 'music', 'tune'], path: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>' },
  { name: 'headphones', tags: ['audio', 'listen', 'sound', 'headphones', 'podcast'], path: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>' },
  { name: 'code', tags: ['dev', 'developer', 'program', 'html', 'code', 'script'], path: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>' },
  { name: 'cpu', tags: ['chip', 'processor', 'hardware', 'cpu', 'tech', 'ai'], path: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>' },
  { name: 'database', tags: ['storage', 'sql', 'server', 'data', 'database'], path: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>' },
  { name: 'layers', tags: ['stack', 'design', 'layers', 'canvas', 'artboard'], path: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 12.5-8.58 3.9a2 2 0 0 1-1.66 0L2 12.5"/><path d="m22 17.5-8.58 3.9a2 2 0 0 1-1.66 0L2 17.5"/>' },
  { name: 'palette', tags: ['color', 'art', 'paint', 'palette', 'theme'], path: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2Z"/>' },
  { name: 'wifi', tags: ['network', 'wireless', 'internet', 'signal', 'wifi'], path: '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.86a10 10 0 0 1 14 0"/><path d="M8.5 16.43a5 5 0 0 1 7 0"/>' },
  { name: 'arrow-right', tags: ['arrow', 'next', 'forward', 'right'], path: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>' },
  { name: 'arrow-left', tags: ['arrow', 'prev', 'back', 'left'], path: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>' },
  { name: 'arrow-up', tags: ['arrow', 'top', 'up'], path: '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>' },
  { name: 'arrow-down', tags: ['arrow', 'bottom', 'down'], path: '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>' },
  { name: 'folder', tags: ['directory', 'files', 'storage', 'folder'], path: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>' },
  { name: 'smile', tags: ['happy', 'face', 'emoji', 'smile'], path: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>' },
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
