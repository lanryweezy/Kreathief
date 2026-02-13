// Freepik API Service — Full-Featured
// Docs: https://docs.freepik.com
// Base: https://api.freepik.com/v1
// Auth: x-freepik-api-key header
//
// This service provides:
//   1. Stock Content search (photos, vectors, PSDs, mockups)
//   2. Icon search
//   3. AI Image Generation (Mystic) — fallback for Gemini generateImage
//   4. AI Background Removal — fallback for Gemini removeBackground
//   5. AI Image Upscaling — new capability
//   6. AI Style Transfer — new capability

const BASE_URL = 'https://api.freepik.com/v1';
const API_KEY = import.meta.env.VITE_FREEPIK_API_KEY || '';

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

export interface FreepikResource {
    id: number;
    title: string;
    url: string;
    imageUrl: string;       // preview/thumbnail URL
    thumbnailUrl: string;
    type: 'photo' | 'vector' | 'psd' | 'ai_generated';
    orientation: string;
    author: string;
    downloads: number;
    likes: number;
    formats: string[];
}

export interface FreepikIcon {
    id: number;
    name: string;
    thumbnailUrl: string;
    author: string;
    tags: string[];
    family?: string;
}

export interface FreepikSearchResult<T> {
    items: T[];
    total: number;
    currentPage: number;
    lastPage: number;
    hasMore: boolean;
}

export interface FreepikAITask {
    taskId: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    imageUrl?: string;
}

// ──────────────────────────────────────────
// Core fetch helper
// ──────────────────────────────────────────

async function freepikFetch(
    endpoint: string,
    options: {
        method?: 'GET' | 'POST';
        params?: Record<string, string>;
        body?: any;
    } = {}
): Promise<any> {
    if (!API_KEY) {
        console.warn('[FreepikService] No API key configured (VITE_FREEPIK_API_KEY)');
        return null;
    }

    const { method = 'GET', params = {}, body } = options;

    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const headers: Record<string, string> = {
        'x-freepik-api-key': API_KEY,
        'Accept': 'application/json',
    };

    const fetchOptions: RequestInit = { method, headers };

    if (body) {
        headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(body);
    }

    try {
        const res = await fetch(url.toString(), fetchOptions);

        if (!res.ok) {
            const errorText = await res.text().catch(() => '');
            console.error(`[FreepikService] ${method} ${endpoint} → ${res.status}: ${errorText}`);
            return null;
        }

        return await res.json();
    } catch (err) {
        console.error('[FreepikService] Network error:', err);
        return null;
    }
}

// ──────────────────────────────────────────
// 1. STOCK CONTENT SEARCH
// ──────────────────────────────────────────

/**
 * Search for stock resources (photos, vectors, PSDs, mockups).
 * This supplements Unsplash with Freepik's 50M+ photo library.
 */
export async function searchResources(
    term: string,
    options: {
        page?: number;
        limit?: number;
        contentType?: 'photo' | 'vector' | 'psd' | 'all';
        orientation?: 'horizontal' | 'vertical' | 'square';
        order?: 'relevance' | 'recent';
    } = {}
): Promise<FreepikSearchResult<FreepikResource>> {
    const { page = 1, limit = 20, contentType = 'all', orientation, order = 'relevance' } = options;

    const params: Record<string, string> = {
        term,
        page: String(page),
        limit: String(limit),
        order,
    };

    if (contentType !== 'all') {
        params[`filters[content_type][${contentType}]`] = '1';
    }
    if (orientation) {
        params['filters[orientation]'] = orientation;
    }

    const data = await freepikFetch('/resources', { params });

    if (!data?.data) {
        return { items: [], total: 0, currentPage: 1, lastPage: 1, hasMore: false };
    }

    const items: FreepikResource[] = (data.data || []).map((item: any) => ({
        id: item.id,
        title: item.title || '',
        url: item.url || '',
        imageUrl: item.image?.source?.url || '',
        thumbnailUrl: item.image?.source?.url || '',
        type: item.image?.type || 'photo',
        orientation: item.image?.orientation || 'square',
        author: item.author?.name || 'Freepik',
        downloads: item.stats?.downloads || 0,
        likes: item.stats?.likes || 0,
        formats: item.meta?.available_formats ? Object.keys(item.meta.available_formats) : [],
    }));

    const meta = data.meta || {};

    return {
        items,
        total: meta.total || items.length,
        currentPage: meta.current_page || page,
        lastPage: meta.last_page || 1,
        hasMore: (meta.current_page || page) < (meta.last_page || 1),
    };
}

/**
 * Search specifically for photos — convenience wrapper.
 */
export async function searchPhotos(
    term: string,
    page = 1,
    limit = 20
): Promise<FreepikSearchResult<FreepikResource>> {
    return searchResources(term, { page, limit, contentType: 'photo' });
}

/**
 * Search specifically for vectors.
 */
export async function searchVectors(
    term: string,
    page = 1,
    limit = 20
): Promise<FreepikSearchResult<FreepikResource>> {
    return searchResources(term, { page, limit, contentType: 'vector' });
}

/**
 * Search specifically for PSDs/mockups.
 */
export async function searchMockups(
    term: string,
    page = 1,
    limit = 20
): Promise<FreepikSearchResult<FreepikResource>> {
    return searchResources(term, { page, limit, contentType: 'psd' });
}

// ──────────────────────────────────────────
// 2. ICON SEARCH
// ──────────────────────────────────────────

/**
 * Search for vector icons.
 */
export async function searchIcons(
    term: string,
    perPage = 20,
    page = 1
): Promise<FreepikSearchResult<FreepikIcon>> {
    const data = await freepikFetch('/icons', {
        params: { term, per_page: String(perPage), page: String(page) },
    });

    if (!data?.data) {
        return { items: [], total: 0, currentPage: 1, lastPage: 1, hasMore: false };
    }

    const items: FreepikIcon[] = (data.data || []).map((item: any) => {
        let thumbnailUrl = '';
        if (item.thumbnails) {
            if (Array.isArray(item.thumbnails)) {
                thumbnailUrl = item.thumbnails[0]?.url || item.thumbnails[0] || '';
            } else if (typeof item.thumbnails === 'object') {
                thumbnailUrl = item.thumbnails.medium || item.thumbnails.small || item.thumbnails.large || item.thumbnails.url || '';
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
            tags: Array.isArray(item.tags) ? item.tags.map((t: any) => typeof t === 'string' ? t : t.name || '') : [],
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

// ──────────────────────────────────────────
// 3. AI IMAGE GENERATION (Fallback for Gemini)
// ──────────────────────────────────────────

/**
 * Generate an image from a text prompt using Freepik's Mystic AI model.
 * This is a fallback for geminiService.generateImage().
 * Returns a base64 data URL string, or null on failure.
 *
 * Pattern: POST → get task_id → poll until COMPLETED
 */
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

    // Map aspect ratio if provided
    if (options.aspectRatio) {
        body.aspect_ratio = options.aspectRatio;
    }

    const result = await freepikFetch('/ai/mystic', { method: 'POST', body });

    if (!result?.data?.task_id) {
        console.error('[FreepikService] Image generation failed — no task_id');
        return null;
    }

    // Poll for completion
    return await pollTask(result.data.task_id, '/ai/mystic');
}

/**
 * Generic async task poller.
 * Polls the task status endpoint until the task completes or fails.
 */
async function pollTask(taskId: string, basePath: string, maxAttempts = 30, intervalMs = 2000): Promise<string | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));

        const status = await freepikFetch(`${basePath}/${taskId}`);

        if (!status?.data) continue;

        if (status.data.status === 'COMPLETED') {
            // Extract the image URL from the response
            const imageUrl = status.data.generated?.[0]?.url
                || status.data.result?.url
                || status.data.output?.url
                || status.data.image_url
                || status.data.url;

            if (imageUrl) {
                // Convert to blob URL for canvas use
                try {
                    const res = await fetch(imageUrl);
                    const blob = await res.blob();
                    return URL.createObjectURL(blob);
                } catch {
                    return imageUrl;
                }
            }
            return null;
        }

        if (status.data.status === 'FAILED') {
            console.error('[FreepikService] Task failed:', status.data.error || 'Unknown error');
            return null;
        }
    }

    console.warn('[FreepikService] Task polling timed out');
    return null;
}

// ──────────────────────────────────────────
// 4. AI BACKGROUND REMOVAL (Fallback for Gemini)
// ──────────────────────────────────────────

/**
 * Remove background from an image.
 * Fallback for geminiService.removeBackground().
 * Accepts a base64 data URL or a regular URL.
 * Returns a blob URL of the result, or null on failure.
 */
export async function removeBackground(imageSource: string): Promise<string | null> {
    let body: any;

    if (imageSource.startsWith('data:')) {
        // It's a base64 data URL — Freepik may need a URL, so we'll try with image field
        body = { image: imageSource };
    } else {
        body = { image_url: imageSource };
    }

    const result = await freepikFetch('/ai/beta/remove-background', { method: 'POST', body });

    if (!result?.data?.task_id) {
        // Some endpoints return results directly
        if (result?.data?.url || result?.data?.image_url) {
            try {
                const res = await fetch(result.data.url || result.data.image_url);
                const blob = await res.blob();
                return URL.createObjectURL(blob);
            } catch {
                return result.data.url || result.data.image_url;
            }
        }
        console.error('[FreepikService] BG removal failed — no task_id or direct result');
        return null;
    }

    return await pollTask(result.data.task_id, '/ai/beta/remove-background');
}

// ──────────────────────────────────────────
// 5. AI IMAGE UPSCALING (New capability)
// ──────────────────────────────────────────

/**
 * Upscale an image using Freepik's Magnific-powered upscaler.
 * Returns a blob URL of the upscaled image, or null on failure.
 */
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

    const result = await freepikFetch(endpoint, { method: 'POST', body });

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

// ──────────────────────────────────────────
// 6. AI STYLE TRANSFER (New capability)
// ──────────────────────────────────────────

/**
 * Apply an artistic style to an image.
 * Returns a blob URL of the styled image, or null on failure.
 */
export async function styleTransfer(
    imageSource: string,
    stylePrompt: string
): Promise<string | null> {
    let body: any;
    if (imageSource.startsWith('data:')) {
        body = { image: imageSource, style: stylePrompt };
    } else {
        body = { image_url: imageSource, style: stylePrompt };
    }

    const result = await freepikFetch('/ai/image-style-transfer', { method: 'POST', body });

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

    return await pollTask(result.data.task_id, '/ai/image-style-transfer');
}

// ──────────────────────────────────────────
// 7. AI IMAGE EXPAND / OUTPAINTING (Fallback for Gemini expandImage)
// ──────────────────────────────────────────

/**
 * Expand an image beyond its boundaries (outpainting).
 * Fallback for geminiService.expandImage().
 */
export async function expandImage(imageSource: string): Promise<string | null> {
    let body: any;
    if (imageSource.startsWith('data:')) {
        body = { image: imageSource };
    } else {
        body = { image_url: imageSource };
    }

    const result = await freepikFetch('/ai/image-expand', { method: 'POST', body });

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

    return await pollTask(result.data.task_id, '/ai/image-expand');
}

// ──────────────────────────────────────────
// 8. DOWNLOAD HELPERS
// ──────────────────────────────────────────

/**
 * Download a stock resource by ID in a specific format.
 */
export async function downloadResource(
    resourceId: number,
    format: 'jpg' | 'svg' | 'eps' | 'png' | 'psd' = 'jpg'
): Promise<string | null> {
    const data = await freepikFetch(`/resources/${resourceId}/download/${format}`);

    if (!data?.data?.url) return null;

    try {
        const res = await fetch(data.data.url);
        const blob = await res.blob();
        return URL.createObjectURL(blob);
    } catch {
        return data.data.url;
    }
}

/**
 * Download an icon as PNG.
 */
export async function downloadIconPNG(iconId: number): Promise<string | null> {
    const idStr = String(iconId);
    const prefix = idStr.substring(0, 3);
    const url = `https://cdn-icons-png.freepik.com/256/${prefix}/${idStr}.png`;

    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        return URL.createObjectURL(blob);
    } catch {
        return null;
    }
}

// ──────────────────────────────────────────
// 9. API STATUS CHECK
// ──────────────────────────────────────────

/**
 * Check if the Freepik API key is configured and valid.
 */
export function isConfigured(): boolean {
    return !!API_KEY && API_KEY.startsWith('FPSX');
}
