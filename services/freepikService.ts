import { log } from '../utils/log';

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

  if (endpoint.includes('search')) {
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

export async function searchIcons(query: string, page: number = 1): Promise<FreepikSearchResult> {
  const data = await freepikFetch(`/icons?term=${encodeURIComponent(query)}&page=${page}`);

  if (!data?.data) {
    return { items: [], total: 0, currentPage: page, lastPage: 1, hasMore: false };
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

    const status = await fetch(url.toString()).then((res) => res.json());

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
          const objectUrl = URL.createObjectURL(blob);
          return objectUrl;
        } catch (err) {
          log.error('[FreepikService] Failed to convert image URL to blob', err, { imageUrl });
          return imageUrl;
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
        return URL.createObjectURL(blob);
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
        return URL.createObjectURL(blob);
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
        return URL.createObjectURL(blob);
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
        return URL.createObjectURL(blob);
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
    return URL.createObjectURL(blob);
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
    return URL.createObjectURL(blob);
  } catch (err) {
    log.warn('[FreepikService] Failed to download icon PNG', { error: err });
    return null;
  }
}

export function isConfigured(): boolean {
  // Can't check purely synchronously on client side without exposing the key, but we'll return true assuming backend is set
  return true;
}
