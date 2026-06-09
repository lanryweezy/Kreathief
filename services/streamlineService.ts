import { log } from '../utils/log';

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
  const url = new URL('/api/streamline', window.location.origin);
  if (endpoint.includes('search')) {
    url.searchParams.set('action', 'search');
  } else if (endpoint.includes('download/svg')) {
    url.searchParams.set('action', 'download_svg');
  }
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      log.error(`[StreamlineService] Request failed`, new Error(res.statusText), {
        status: res.status,
        endpoint,
      });
      return null;
    }

    return await res.json();
  } catch (err) {
    log.error('[StreamlineService] Network error', err, { endpoint, params });
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
export async function downloadIconSVG(
  hash: string,
  options?: { size?: number; color?: string }
): Promise<string | null> {
  const params: Record<string, string> = { hash };
  if (options?.size) {
    params.size = String(options.size);
  }
  if (options?.color) {
    params.color = options.color.replace('#', '');
  }

  const data = await streamlineFetch('/icons/download/svg', params);
  if (!data) {
    return null;
  }
  return typeof data === 'string' ? data : data.svg || data.content || null;
}

/**
 * Download an icon as PNG data URL
 */
export async function downloadIconPNG(hash: string, size = 128, color?: string): Promise<string | null> {
  // Use SVG and convert to canvas instead since we don't want to expose API key in frontend
  const svgContent = await downloadIconSVG(hash, { size, color });
  if (!svgContent) {
    return null;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const DOMURL = window.URL || window.webkitURL || window;
    const url = DOMURL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, size, size);
        DOMURL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      } else {
        DOMURL.revokeObjectURL(url);
        resolve(null);
      }
    };
    img.onerror = () => {
      DOMURL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Get thumbnail URL for an icon (for preview in grid)
 */
export function getIconThumbnailUrl(_hash: string, _size = 64): string {
  // Temporary workaround: since we can't expose the API key for direct image urls
  // A proper implementation would either have the backend proxy the image or use the SVG
  return '';
}
