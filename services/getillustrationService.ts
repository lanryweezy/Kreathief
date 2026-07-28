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

function makeIllustrationSVGUrl(title: string, bg: string, fg: string, accent: string, shapesSvg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
    <rect width="800" height="600" rx="32" fill="${bg}"/>
    <circle cx="650" cy="150" r="100" fill="${accent}" opacity="0.15"/>
    <circle cx="150" cy="450" r="120" fill="${fg}" opacity="0.1"/>
    <g transform="translate(200, 100) scale(1.6)">
      ${shapesSvg}
    </g>
    <text x="400" y="530" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="${fg}" text-anchor="middle" opacity="0.9">${title}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const COMMON_GI_ILLUSTRATIONS: { id: string; name: string; tags: string; svg: string }[] = [
  {
    id: 'gi-1',
    name: 'Web Design Layout',
    tags: 'web design website layout monitor interface technology',
    svg: makeIllustrationSVGUrl(
      'Web Design',
      '#1a1d24',
      '#6366f1',
      '#ec4899',
      `<rect x="20" y="20" width="210" height="150" rx="12" fill="#2a2e39" stroke="#6366f1" stroke-width="4"/>
       <rect x="40" y="50" width="70" height="50" rx="6" fill="#6366f1"/>
       <rect x="120" y="50" width="90" height="16" rx="4" fill="#4b5563"/>
       <rect x="120" y="76" width="60" height="12" rx="4" fill="#374151"/>
       <rect x="40" y="115" width="170" height="35" rx="6" fill="#374151"/>
       <path d="M95 170 L155 170 L145 200 L105 200 Z" fill="#4b5563"/>
       <rect x="75" y="200" width="100" height="8" rx="4" fill="#6366f1"/>`
    ),
  },
  {
    id: 'gi-2',
    name: 'Team Collaboration',
    tags: 'team work business communication people chat discussion',
    svg: makeIllustrationSVGUrl(
      'Team Collaboration',
      '#1e1b4b',
      '#818cf8',
      '#34d399',
      `<circle cx="70" cy="80" r="30" fill="#818cf8"/>
       <path d="M20 170 Q70 120 120 170 Z" fill="#818cf8"/>
       <circle cx="180" cy="80" r="30" fill="#34d399"/>
       <path d="M130 170 Q180 120 230 170 Z" fill="#34d399"/>
       <rect x="85" y="20" width="80" height="45" rx="10" fill="#ffffff" opacity="0.9"/>
       <circle cx="105" cy="42" r="5" fill="#1e1b4b"/><circle cx="125" cy="42" r="5" fill="#1e1b4b"/><circle cx="145" cy="42" r="5" fill="#1e1b4b"/>`
    ),
  },
  {
    id: 'gi-3',
    name: 'Cloud Data Storage',
    tags: 'cloud storage data backup server internet security',
    svg: makeIllustrationSVGUrl(
      'Cloud Storage',
      '#0f172a',
      '#38bdf8',
      '#a855f7',
      `<path d="M60 130 Q40 130 40 110 Q40 90 60 90 Q70 60 100 60 Q130 60 140 85 Q160 80 175 95 Q190 110 180 130 Z" fill="#38bdf8" opacity="0.8"/>
       <rect x="80" y="140" width="90" height="25" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
       <circle cx="95" cy="152" r="4" fill="#34d399"/><line x1="110" y1="152" x2="155" y2="152" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>
       <rect x="80" y="175" width="90" height="25" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
       <circle cx="95" cy="187" r="4" fill="#34d399"/><line x1="110" y1="187" x2="155" y2="187" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>`
    ),
  },
  {
    id: 'gi-4',
    name: 'Data Analytics Dashboard',
    tags: 'data analytics chart graph progress growth finance statistics',
    svg: makeIllustrationSVGUrl(
      'Data Analytics',
      '#18181b',
      '#10b981',
      '#f59e0b',
      `<rect x="30" y="30" width="190" height="150" rx="12" fill="#27272a"/>
       <rect x="50" y="110" width="22" height="50" rx="4" fill="#3f3f46"/>
       <rect x="85" y="80" width="22" height="80" rx="4" fill="#10b981"/>
       <rect x="120" y="100" width="22" height="60" rx="4" fill="#3f3f46"/>
       <rect x="155" y="55" width="22" height="105" rx="4" fill="#f59e0b"/>
       <polyline points="60,95 95,65 130,80 165,40" fill="none" stroke="#ec4899" stroke-width="4" stroke-linecap="round"/>
       <circle cx="165" cy="40" r="6" fill="#ec4899"/>`
    ),
  },
  {
    id: 'gi-5',
    name: 'Mobile App Interface',
    tags: 'mobile app smartphone phone screen interface responsive',
    svg: makeIllustrationSVGUrl(
      'Mobile App',
      '#111827',
      '#ec4899',
      '#6366f1',
      `<rect x="75" y="15" width="100" height="190" rx="16" fill="#1f2937" stroke="#6366f1" stroke-width="4"/>
       <rect x="110" y="25" width="30" height="6" rx="3" fill="#4b5563"/>
       <rect x="90" y="45" width="70" height="40" rx="8" fill="#ec4899" opacity="0.8"/>
       <rect x="90" y="95" width="70" height="16" rx="4" fill="#374151"/>
       <rect x="90" y="120" width="70" height="16" rx="4" fill="#374151"/>
       <rect x="90" y="145" width="70" height="16" rx="4" fill="#374151"/>
       <circle cx="125" cy="185" r="8" fill="#4b5563"/>`
    ),
  },
  {
    id: 'gi-6',
    name: 'Creative Idea Rocket',
    tags: 'creative idea rocket bulb start innovation growth technology',
    svg: makeIllustrationSVGUrl(
      'Innovation',
      '#1e1b4b',
      '#f59e0b',
      '#ef4444',
      `<path d="M125 30 C160 30 170 70 170 100 L80 100 C80 70 90 30 125 30 Z" fill="#f59e0b"/>
       <rect x="95" y="105" width="60" height="15" rx="4" fill="#94a3b8"/>
       <rect x="105" y="125" width="40" height="15" rx="4" fill="#64748b"/>
       <path d="M125 145 L105 180 L145 180 Z" fill="#ef4444"/>
       <circle cx="125" cy="70" r="15" fill="#1e1b4b" opacity="0.3"/>
       <path d="M70 50 L60 40 M180 50 L190 40 M125 10 L125 0" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>`
    ),
  },
  {
    id: 'gi-7',
    name: 'Cyber Security Shield',
    tags: 'security shield cyber protection lock privacy tech',
    svg: makeIllustrationSVGUrl(
      'Cyber Security',
      '#090d16',
      '#10b981',
      '#3b82f6',
      `<path d="M125 25 L195 50 V110 C195 160 125 195 125 195 C125 195 55 160 55 110 V50 Z" fill="#1e293b" stroke="#10b981" stroke-width="4"/>
       <rect x="105" y="100" width="40" height="30" rx="6" fill="#10b981"/>
       <path d="M115 100 V85 C115 75 135 75 135 85 V100" fill="none" stroke="#10b981" stroke-width="4"/>
       <circle cx="125" cy="115" r="4" fill="#090d16"/>`
    ),
  },
  {
    id: 'gi-8',
    name: 'Artificial Intelligence Brain',
    tags: 'artificial intelligence ai robot brain neural tech network',
    svg: makeIllustrationSVGUrl(
      'AI & Robotics',
      '#18181b',
      '#a855f7',
      '#06b6d4',
      `<rect x="65" y="45" width="120" height="100" rx="20" fill="#27272a" stroke="#06b6d4" stroke-width="4"/>
       <circle cx="95" cy="85" r="12" fill="#a855f7"/><circle cx="155" cy="85" r="12" fill="#a855f7"/>
       <rect x="100" y="115" width="50" height="10" rx="5" fill="#06b6d4"/>
       <line x1="125" y1="45" x2="125" y2="20" stroke="#06b6d4" stroke-width="4"/><circle cx="125" cy="15" r="6" fill="#ef4444"/>
       <path d="M45 85 H65 M185 85 H205" stroke="#64748b" stroke-width="6" stroke-linecap="round"/>`
    ),
  },
];

export async function searchAll(query: string, limit = 20): Promise<GISearchResult> {
  try {
    const res = await fetch(`${BASE_URL}?action=search&query=${encodeURIComponent(query)}&limit=${limit}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.results && (data.results.illustrations?.length > 0 || data.results.icons?.length > 0)) {
        return data.results;
      }
    }
  } catch (err) {
    log.warn('[getIllustrationService] Backend search failed, using client fallback', err, { query });
  }

  const q = query.trim().toLowerCase();
  const matched = COMMON_GI_ILLUSTRATIONS.filter(
    (item) => !q || item.name.toLowerCase().includes(q) || item.tags.includes(q)
  );
  const fallbackAssets: GIAsset[] = matched.map((item) => ({
    id: item.id,
    name: item.name,
    imageUrl: item.svg,
    thumbnailUrl: item.svg,
    tags: item.tags,
    svgAvailable: true,
    hasAccess: true,
  }));

  return {
    illustrations: fallbackAssets,
    icons: [],
    packs: [],
    iconPacks: [],
  };
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
    if (freeOnly) {
      params.set('free', 'true');
    }
    const res = await fetch(`${BASE_URL}?${params}`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export async function listPacks(page = 1, limit = 20, freeOnly = false): Promise<GIPack[]> {
  try {
    const params = new URLSearchParams({ action: 'packs', page: String(page), limit: String(limit) });
    if (freeOnly) {
      params.set('free', 'true');
    }
    const res = await fetch(`${BASE_URL}?${params}`);
    if (!res.ok) {
      return [];
    }
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
    if (!res.ok) {
      return [];
    }
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
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export async function getRandomIcons(count = 24, pack?: string): Promise<GIAsset[]> {
  try {
    const params = new URLSearchParams({ action: 'random-icons', count: String(count) });
    if (pack) {
      params.set('pack', pack);
    }
    const res = await fetch(`${BASE_URL}?${params}`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.items || data.icons || [];
  } catch {
    return [];
  }
}

export async function isConfiguredAsync(): Promise<boolean> {
  return true;
}

export function isConfigured(): boolean {
  return true;
}
