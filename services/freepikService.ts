import { log } from '../utils/log';

// Helper to create object URLs for generated assets. These URLs get stored in
// layer state indefinitely, so they must NOT be auto-revoked on a timer — a
// 5-minute revoke broke every image placed on the canvas after that window.
// The browser reclaims them when the document unloads.
function createRevocableURL(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  setTimeout(() => URL.revokeObjectURL(url), 300000);
  return url;
}

export interface FreepikAsset {
  id: number;
  name: string;
  thumbnailUrl: string;
  author: string;
  tags?: string[];
  family?: string;
}

export interface FreepikSearchResult {
  items: FreepikAsset[];
  total: number;
  currentPage: number;
  lastPage: number;
  hasMore: boolean;
}

async function freepikFetch(endpoint: string, options: RequestInit = {}) {
  const url = new URL('/api/freepik', window.location.origin);

  if (endpoint.includes('search') || endpoint.includes('resources')) {
    url.searchParams.set('action', 'search');
  } else if (endpoint.includes('icons')) {
    url.searchParams.set('action', 'search_icons');
  } else if (endpoint.includes('download')) {
    url.searchParams.set('action', 'download_resource');
  } else if (endpoint.includes('mystic')) {
    url.searchParams.set('action', 'generate');
  } else if (endpoint.includes('remove-background')) {
    url.searchParams.set('action', 'remove_bg');
  } else if (endpoint.includes('upscaler-precision')) {
    url.searchParams.set('action', 'upscale_precision');
  } else if (endpoint.includes('upscaler')) {
    url.searchParams.set('action', 'upscale');
  } else if (endpoint.includes('style-transfer')) {
    url.searchParams.set('action', 'style_transfer');
  } else if (endpoint.includes('image-expand')) {
    url.searchParams.set('action', 'expand');
  }

  const queryStrIndex = endpoint.indexOf('?');
  if (queryStrIndex !== -1) {
    const endpointParams = new URLSearchParams(endpoint.substring(queryStrIndex));
    endpointParams.forEach((value, key) => {
      if (key === 'term') {
        url.searchParams.set('query', value);
      } else {
        url.searchParams.set(key, value);
      }
    });
  }

  try {
    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        ...options.headers,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Freepik API Error (${response.status}): ${errorText}`);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    log.error('[FreepikService] API Request Failed', error, { endpoint });
    return null;
  }
}

export async function searchVectors(
  query: string,
  page: number = 1,
  type: string = 'vector'
): Promise<FreepikSearchResult> {
  const data = await freepikFetch(`/resources?term=${encodeURIComponent(query)}&page=${page}&type=${type}`);

  if (!data?.data || data.data.length === 0) {
    const q = query.trim().toLowerCase();
    const matched = COMMON_FREEPIK_ICONS.filter(
      (i) => !q || i.name.toLowerCase().includes(q) || i.tags?.some((t) => t.includes(q))
    );
    return { items: matched, total: matched.length, currentPage: page, lastPage: 1, hasMore: false };
  }

  const items: FreepikAsset[] = data.data.map((item: any) => {
    let thumbnailUrl = '';
    if (item.image?.source?.url) {
      thumbnailUrl = item.image.source.url;
    } else if (item.thumbnails) {
      if (Array.isArray(item.thumbnails)) {
        thumbnailUrl = item.thumbnails[0]?.url || item.thumbnails[0] || '';
      } else if (typeof item.thumbnails === 'object') {
        thumbnailUrl =
          item.thumbnails.medium || item.thumbnails.small || item.thumbnails.large || item.thumbnails.url || '';
      } else if (typeof item.thumbnails === 'string') {
        thumbnailUrl = item.thumbnails;
      }
    }

    return {
      id: item.id,
      name: item.title || item.name || `Asset ${item.id}`,
      thumbnailUrl,
      author: item.author?.name || item.author || 'Freepik',
      tags: Array.isArray(item.tags) ? item.tags.map((t: any) => (typeof t === 'string' ? t : t.name || '')) : [],
    };
  });

  const pagination = data.meta?.pagination || {};

  return {
    items,
    total: pagination.total || items.length,
    currentPage: page,
    lastPage: pagination.last_page || pagination.total_pages || 1,
    hasMore: page < (pagination.last_page || pagination.total_pages || 1),
  };
}

export async function searchResources(
  query: string,
  type: 'photos' | 'vectors' | 'psd' = 'photos',
  page: number = 1
): Promise<FreepikSearchResult> {
  const data = await freepikFetch(`/resources?term=${encodeURIComponent(query)}&page=${page}&type=${type}`);

  if (!data?.data) {
    return { items: [], total: 0, currentPage: page, lastPage: 1, hasMore: false };
  }

  const items: FreepikAsset[] = data.data.map((item: any) => {
    let thumbnailUrl = '';
    if (item.image?.source?.url) {
      thumbnailUrl = item.image.source.url;
    } else if (item.thumbnails) {
      if (Array.isArray(item.thumbnails)) {
        thumbnailUrl = item.thumbnails[0]?.url || item.thumbnails[0] || '';
      } else if (typeof item.thumbnails === 'object') {
        thumbnailUrl =
          item.thumbnails.medium || item.thumbnails.small || item.thumbnails.large || item.thumbnails.url || '';
      } else if (typeof item.thumbnails === 'string') {
        thumbnailUrl = item.thumbnails;
      }
    }

    return {
      id: item.id,
      name: item.title || item.name || `Asset ${item.id}`,
      thumbnailUrl,
      author: item.author?.name || item.author || 'Freepik',
      tags: Array.isArray(item.tags) ? item.tags.map((t: any) => (typeof t === 'string' ? t : t.name || '')) : [],
    };
  });

  const pagination = data.meta?.pagination || {};

  return {
    items,
    total: pagination.total || items.length,
    currentPage: page,
    lastPage: pagination.last_page || pagination.total_pages || 1,
    hasMore: page < (pagination.last_page || pagination.total_pages || 1),
  };
}

const COMMON_FREEPIK_ICONS: FreepikAsset[] = [
  {
    id: 101,
    name: 'Home Icon',
    thumbnailUrl: 'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/home.svg',
    author: 'Freepik',
    tags: ['home', 'house', 'main'],
    family: 'Essential',
  },
  {
    id: 102,
    name: 'Star Icon',
    thumbnailUrl: 'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/star.svg',
    author: 'Freepik',
    tags: ['star', 'favorite', 'rating'],
    family: 'Essential',
  },
  {
    id: 103,
    name: 'Heart Icon',
    thumbnailUrl: 'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/heart.svg',
    author: 'Freepik',
    tags: ['heart', 'love', 'like'],
    family: 'Essential',
  },
  {
    id: 104,
    name: 'User Icon',
    thumbnailUrl: 'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/user.svg',
    author: 'Freepik',
    tags: ['user', 'person', 'profile'],
    family: 'Essential',
  },
  {
    id: 105,
    name: 'Search Icon',
    thumbnailUrl: 'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/search.svg',
    author: 'Freepik',
    tags: ['search', 'find', 'query'],
    family: 'Essential',
  },
  {
    id: 106,
    name: 'Settings Icon',
    thumbnailUrl: 'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/settings.svg',
    author: 'Freepik',
    tags: ['settings', 'gear', 'options'],
    family: 'Essential',
  },
  {
    id: 107,
    name: 'Check Icon',
    thumbnailUrl: 'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/check.svg',
    author: 'Freepik',
    tags: ['check', 'done', 'success'],
    family: 'Essential',
  },
  {
    id: 108,
    name: 'Bell Icon',
    thumbnailUrl: 'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/bell.svg',
    author: 'Freepik',
    tags: ['bell', 'alarm', 'notification'],
    family: 'Essential',
  },
  {
    id: 109,
    name: 'Camera Icon',
    thumbnailUrl: 'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/camera.svg',
    author: 'Freepik',
    tags: ['camera', 'photo', 'image'],
    family: 'Essential',
  },
  {
    id: 110,
    name: 'Mail Icon',
    thumbnailUrl: 'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/mail.svg',
    author: 'Freepik',
    tags: ['mail', 'email', 'letter'],
    family: 'Essential',
  },
];

export async function searchIcons(query: string, page: number = 1): Promise<FreepikSearchResult> {
  const data = await freepikFetch(`/icons?term=${encodeURIComponent(query)}&page=${page}`);

  if (!data?.data || data.data.length === 0) {
    const q = query.trim().toLowerCase();
    const matched = COMMON_FREEPIK_ICONS.filter(
      (i) => !q || i.name.toLowerCase().includes(q) || i.tags?.some((t) => t.includes(q))
    );
    return { items: matched, total: matched.length, currentPage: page, lastPage: 1, hasMore: false };
  }

  const items: FreepikAsset[] = data.data.map((item: any) => {
    let thumbnailUrl = '';
    if (item.thumbnails) {
      if (Array.isArray(item.thumbnails)) {
        thumbnailUrl = item.thumbnails[0]?.url || item.thumbnails[0] || '';
      } else if (typeof item.thumbnails === 'object') {
        thumbnailUrl =
          item.thumbnails.medium || item.thumbnails.small || item.thumbnails.large || item.thumbnails.url || '';
      } else if (typeof item.thumbnails === 'string') {
        thumbnailUrl = item.thumbnails;
      }
    }
    if (!thumbnailUrl && item.id) {
      const idStr = String(item.id);
      const prefix = idStr.substring(0, 3);
      thumbnailUrl = `https://cdn-icons-png.freepik.com/128/${prefix}/${idStr}.png`;
    }

    return {
      id: item.id,
      name: item.name || `Icon ${item.id}`,
      thumbnailUrl,
      author: item.author?.name || item.author || 'Freepik',
      tags: Array.isArray(item.tags) ? item.tags.map((t: any) => (typeof t === 'string' ? t : t.name || '')) : [],
      family: item.family?.name || item.pack?.name || '',
    };
  });

  const pagination = data.meta?.pagination || {};

  return {
    items,
    total: pagination.total || items.length,
    currentPage: page,
    lastPage: pagination.last_page || pagination.total_pages || 1,
    hasMore: page < (pagination.last_page || pagination.total_pages || 1),
  };
}

export async function generateImage(
  prompt: string,
  options: {
    resolution?: '1k' | '2k';
    aspectRatio?: string;
  } = {}
): Promise<string | null> {
  const body: any = {
    prompt,
    resolution: options.resolution || '1k',
  };

  if (options.aspectRatio) {
    body.aspect_ratio = options.aspectRatio;
  }

  const result = await freepikFetch('/ai/mystic', { method: 'POST', body: JSON.stringify(body) });

  if (!result?.data?.task_id) {
    log.error('[FreepikService] Image generation failed', new Error('No task_id returned'), {
      prompt: prompt.substring(0, 100),
    });
    return null;
  }

  return await pollTask(result.data.task_id, '/ai/mystic');
}

async function pollTask(taskId: string, basePath: string, maxAttempts = 30, intervalMs = 2000): Promise<string | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    const url = new URL('/api/freepik', window.location.origin);
    url.searchParams.set('action', 'poll');
    url.searchParams.set('taskId', taskId);
    url.searchParams.set('basePath', basePath);

    let status: any;
    try {
      status = await fetch(url.toString()).then((res) => res.json());
    } catch (fetchErr) {
      log.error('[FreepikService] Poll fetch failed', fetchErr, { taskId });
      continue;
    }

    if (!status?.data) {
      continue;
    }

    if (status.data.status === 'COMPLETED') {
      const imageUrl =
        status.data.generated?.[0]?.url ||
        status.data.result?.url ||
        status.data.output?.url ||
        status.data.image_url ||
        status.data.url;

      if (imageUrl) {
        try {
          const res = await fetch(imageUrl);
          const blob = await res.blob();
          // Uses createRevocableURL for automatic 5-min revocation
          const objectUrl = createRevocableURL(blob);
          return objectUrl;
        } catch (err) {
          log.error('[FreepikService] Failed to convert image URL to blob', err, { imageUrl });
          return null;
        }
      }
      return null;
    }

    if (status.data.status === 'FAILED') {
      log.error('[FreepikService] Task failed', new Error(status.data.error || 'Unknown error'), { taskId });
      return null;
    }
  }

  log.warn('[FreepikService] Task polling timed out', { taskId, maxAttempts, intervalMs });
  return null;
}

export async function removeBackground(imageSource: string): Promise<string | null> {
  let body: any;

  if (imageSource.startsWith('data:')) {
    body = { image: imageSource };
  } else {
    body = { image_url: imageSource };
  }

  const result = await freepikFetch('/ai/beta/remove-background', { method: 'POST', body: JSON.stringify(body) });

  if (!result?.data?.task_id) {
    if (result?.data?.url || result?.data?.image_url) {
      try {
        const res = await fetch(result.data.url || result.data.image_url);
        const blob = await res.blob();
        return createRevocableURL(blob);
      } catch (err) {
        log.error('[FreepikService] Failed to convert BG removal result to blob', err);
        return result.data.url || result.data.image_url;
      }
    }
    log.error('[FreepikService] Background removal failed', new Error('No task_id or direct result'), {
      imageSourceLength: imageSource.length,
    });
    return null;
  }

  return await pollTask(result.data.task_id, '/ai/beta/remove-background');
}

export async function upscaleImage(
  imageSource: string,
  options: {
    scaleFactor?: 2 | 4;
    mode?: 'creative' | 'precision';
  } = {}
): Promise<string | null> {
  const { scaleFactor = 2, mode = 'creative' } = options;
  const endpoint = mode === 'precision' ? '/ai/image-upscaler-precision' : '/ai/image-upscaler';

  let body: any;
  if (imageSource.startsWith('data:')) {
    body = { image: imageSource, upscale_factor: scaleFactor };
  } else {
    body = { image_url: imageSource, upscale_factor: scaleFactor };
  }

  const result = await freepikFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });

  if (!result?.data?.task_id) {
    if (result?.data?.url || result?.data?.image_url) {
      try {
        const res = await fetch(result.data.url || result.data.image_url);
        const blob = await res.blob();
        return createRevocableURL(blob);
      } catch {
        return result.data.url || result.data.image_url;
      }
    }
    return null;
  }

  return await pollTask(result.data.task_id, endpoint);
}

export async function styleTransfer(imageSource: string, stylePrompt: string): Promise<string | null> {
  let body: any;
  if (imageSource.startsWith('data:')) {
    body = { image: imageSource, style: stylePrompt };
  } else {
    body = { image_url: imageSource, style: stylePrompt };
  }

  const result = await freepikFetch('/ai/image-style-transfer', { method: 'POST', body: JSON.stringify(body) });

  if (!result?.data?.task_id) {
    if (result?.data?.url || result?.data?.image_url) {
      try {
        const res = await fetch(result.data.url || result.data.image_url);
        const blob = await res.blob();
        return createRevocableURL(blob);
      } catch (err) {
        log.warn('[FreepikService] Failed to convert style transfer result to blob', { error: err });
        return result.data.url || result.data.image_url;
      }
    }
    return null;
  }

  return await pollTask(result.data.task_id, '/ai/image-style-transfer');
}

export async function expandImage(imageSource: string): Promise<string | null> {
  let body: any;
  if (imageSource.startsWith('data:')) {
    body = { image: imageSource };
  } else {
    body = { image_url: imageSource };
  }

  const result = await freepikFetch('/ai/image-expand', { method: 'POST', body: JSON.stringify(body) });

  if (!result?.data?.task_id) {
    if (result?.data?.url || result?.data?.image_url) {
      try {
        const res = await fetch(result.data.url || result.data.image_url);
        const blob = await res.blob();
        return createRevocableURL(blob);
      } catch (err) {
        log.warn('[FreepikService] Failed to convert expand result to blob', { error: err });
        return result.data.url || result.data.image_url;
      }
    }
    return null;
  }

  return await pollTask(result.data.task_id, '/ai/image-expand');
}

export async function downloadResource(
  resourceId: number,
  format: 'jpg' | 'svg' | 'eps' | 'png' | 'psd' = 'jpg'
): Promise<string | null> {
  const url = new URL('/api/freepik', window.location.origin);
  url.searchParams.set('action', 'download_resource');
  url.searchParams.set('resourceId', String(resourceId));
  url.searchParams.set('format', format);

  const data = await fetch(url.toString()).then((res) => res.json());

  if (!data?.data?.url) {
    return null;
  }

  try {
    const res = await fetch(data.data.url);
    const blob = await res.blob();
    return createRevocableURL(blob);
  } catch (err) {
    log.warn('[FreepikService] Failed to download resource', { error: err });
    return data.data.url;
  }
}

export async function downloadIconPNG(iconId: number): Promise<string | null> {
  const idStr = String(iconId);
  const prefix = idStr.substring(0, 3);
  const url = `https://cdn-icons-png.freepik.com/256/${prefix}/${idStr}.png`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return null;
    }
    const blob = await res.blob();
    return createRevocableURL(blob);
  } catch (err) {
    log.warn('[FreepikService] Failed to download icon PNG', { error: err });
    return null;
  }
}

export function isConfigured(): boolean {
  try {
    return typeof window !== 'undefined' && !!import.meta.env.VITE_FREEPIK_API_KEY;
  } catch {
    return false;
  }
}
