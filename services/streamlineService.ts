// Streamline API Service
// Docs: https://streamline-api.readme.io/reference/introduction
// Base: https://public-api.streamlinehq.com
// Auth: STREAMLINE_SECRET header

const BASE_URL = 'https://public-api.streamlinehq.com/v2';
const API_KEY = import.meta.env.VITE_STREAMLINE_API_KEY || '';

export interface StreamlineIcon {
    id: string;
    name: string;
    slug: string;
    hash: string;
    family: string;
    familySlug: string;
    style?: string;
    tags?: string[];
    thumbnailUrl?: string;
    svgUrl?: string;
}

export interface StreamlineSearchResult {
    icons: StreamlineIcon[];
    total: number;
    hasMore: boolean;
}

async function streamlineFetch(endpoint: string, params: Record<string, string> = {}) {
    if (!API_KEY) {
        console.warn('[StreamlineService] No API key configured (VITE_STREAMLINE_API_KEY)');
        return null;
    }

    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    try {
        const res = await fetch(url.toString(), {
            headers: {
                'STREAMLINE_SECRET': API_KEY,
                'Accept': 'application/json',
            },
        });

        if (!res.ok) {
            console.error(`[StreamlineService] ${res.status}: ${res.statusText}`);
            return null;
        }

        return await res.json();
    } catch (err) {
        console.error('[StreamlineService] Network error:', err);
        return null;
    }
}

/**
 * Global search across all Streamline families (icons, illustrations, emojis, etc.)
 */
export async function searchIcons(query: string, limit = 20, offset = 0): Promise<StreamlineSearchResult> {
    const data = await streamlineFetch('/search/global', {
        query,
        limit: String(limit),
        offset: String(offset),
    });

    if (!data || !data.data) {
        return { icons: [], total: 0, hasMore: false };
    }

    const icons: StreamlineIcon[] = (data.data || []).map((item: any) => ({
        id: item.id || item.hash || '',
        name: item.name || item.slug || '',
        slug: item.slug || '',
        hash: item.hash || item.id || '',
        family: item.family?.name || item.familyName || '',
        familySlug: item.family?.slug || item.familySlug || '',
        style: item.style || '',
        tags: item.tags || [],
        thumbnailUrl: item.thumbnailUrl || item.thumbnail || '',
        svgUrl: item.svgUrl || '',
    }));

    return {
        icons,
        total: data.meta?.pagination?.total || icons.length,
        hasMore: icons.length >= limit,
    };
}

/**
 * Download an icon as SVG string
 */
export async function downloadIconSVG(hash: string, options?: { size?: number; color?: string }): Promise<string | null> {
    const params: Record<string, string> = { hash };
    if (options?.size) params.size = String(options.size);
    if (options?.color) params.color = options.color.replace('#', '');

    const data = await streamlineFetch('/icons/download/svg', params);
    if (!data) return null;
    return typeof data === 'string' ? data : data.svg || data.content || null;
}

/**
 * Download an icon as PNG data URL
 */
export async function downloadIconPNG(hash: string, size = 128, color?: string): Promise<string | null> {
    if (!API_KEY) return null;

    const url = new URL(`${BASE_URL}/icons/download/png`);
    url.searchParams.set('hash', hash);
    url.searchParams.set('size', String(size));
    if (color) url.searchParams.set('color', color.replace('#', ''));

    try {
        const res = await fetch(url.toString(), {
            headers: { 'STREAMLINE_SECRET': API_KEY },
        });

        if (!res.ok) return null;

        const blob = await res.blob();
        return URL.createObjectURL(blob);
    } catch (err) {
        console.error('[StreamlineService] PNG download error:', err);
        return null;
    }
}

/**
 * Get thumbnail URL for an icon (for preview in grid)
 */
export function getIconThumbnailUrl(hash: string, size = 64): string {
    return `https://public-api.streamlinehq.com/v2/icons/download/png?hash=${hash}&size=${size}&STREAMLINE_SECRET=${API_KEY}`;
}
