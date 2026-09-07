import { log } from '../utils/log';
import { cacheHeaders, noStoreHeaders } from '../utils/cacheHeaders';
import { requireAuth } from './_auth';

export const config = {
  runtime: 'edge',
};

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 30_000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error(`Freepik API timeout after ${timeoutMs}ms`);
    }
    throw err;
  }
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let lastCleanup = Date.now();

export default async function handler(req: Request) {
  const origin = process.env.VITE_FRONTEND_URL;
  if (!origin) {
    return new Response(JSON.stringify({ error: 'Server misconfigured: VITE_FRONTEND_URL missing' }), { status: 500 });
  }

  try {
    await requireAuth(req);
  } catch (error) {
    if (error instanceof Response) return error;
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }

  const now = Date.now();

  // Periodic cleanup of expired rate limit entries to prevent memory leaks
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    for (const [ip, state] of rateLimitMap.entries()) {
      if (now > state.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
    lastCleanup = now;
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitState = rateLimitMap.get(clientIp);

  if (rateLimitState) {
    if (now > rateLimitState.resetTime) {
      rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    } else {
      if (rateLimitState.count >= MAX_REQUESTS_PER_WINDOW) {
        return new Response(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
          },
        });
      }
      rateLimitState.count++;
    }
  } else {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  }

  // Sentinel: Prevent accidental client-side injection by enforcing non-prefixed secret variables
  const freepikKey = process.env.FREEPIK_API_KEY;

  if (!freepikKey) {
    return new Response(JSON.stringify({ error: 'Freepik API key not configured on server' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    const BASE_URL = 'https://api.freepik.com/v1';

    if (action === 'search') {
      const query = url.searchParams.get('query') || '';
      const type = url.searchParams.get('type') || 'photos';
      const page = url.searchParams.get('page') || '1';

      const response = await fetchWithTimeout(
        `${BASE_URL}/resources?locale=en-US&term=${encodeURIComponent(query)}&page=${encodeURIComponent(page)}&limit=20&filters[content_type]=${encodeURIComponent(type)}`,
        {
          headers: {
            'x-freepik-api-key': freepikKey,
            'Accept-Language': 'en-US',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Freepik Search failed');
      }

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          ...cacheHeaders(),
        },
      });
    } else if (action === 'search_icons') {
      const query = url.searchParams.get('query') || '';
      const page = url.searchParams.get('page') || '1';

      const response = await fetchWithTimeout(
        `${BASE_URL}/icons?locale=en-US&term=${encodeURIComponent(query)}&page=${encodeURIComponent(page)}&limit=50`,
        {
          headers: {
            'x-freepik-api-key': freepikKey,
            'Accept-Language': 'en-US',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Freepik Icon Search failed');
      }

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          ...cacheHeaders(),
        },
      });
    } else if (action === 'download_resource') {
      const resourceId = url.searchParams.get('resourceId');
      const format = url.searchParams.get('format') || 'jpg';
      if (!resourceId) {
        return new Response(JSON.stringify({ error: 'resourceId is required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
          },
        });
      }

      const response = await fetchWithTimeout(
        `${BASE_URL}/resources/${encodeURIComponent(resourceId)}/download/${encodeURIComponent(format)}`,
        {
          headers: {
            'x-freepik-api-key': freepikKey,
            'Accept-Language': 'en-US',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Freepik Resource Download failed');
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          ...cacheHeaders(),
        },
      });
    }

    if (req.method === 'POST') {
      let payload;
      try {
        payload = await req.json();
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
          },
        });
      }

      if (action === 'generate') {
        const response = await fetchWithTimeout(`${BASE_URL}/ai/mystic`, {
          method: 'POST',
          headers: {
            'x-freepik-api-key': freepikKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error('Freepik Generation failed');
        }
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            ...noStoreHeaders(),
          },
        });
      } else if (action === 'poll') {
        const taskId = url.searchParams.get('taskId');

        let basePath = url.searchParams.get('basePath') || '/ai/mystic';
        const allowedPaths = [
          '/ai/mystic',
          '/ai/beta/remove-background',
          '/ai/image-upscaler',
          '/ai/image-upscaler-precision',
          '/ai/image-style-transfer',
          '/ai/image-expand',
        ];

        if (!allowedPaths.includes(basePath)) {
          basePath = '/ai/mystic';
        }

        if (!taskId) {
          return new Response(JSON.stringify({ error: 'taskId is required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': origin,
            },
          });
        }

        // SSRF / Path Traversal Protection: Validate basePath
        const allowedBasePaths = [
          '/ai/mystic',
          '/ai/beta/remove-background',
          '/ai/image-upscaler',
          '/ai/image-upscaler-precision',
          '/ai/image-style-transfer',
          '/ai/image-expand',
        ];

        if (!allowedBasePaths.includes(basePath)) {
          return new Response(JSON.stringify({ error: 'Invalid basePath' }), {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': origin,
            },
          });
        }

        const response = await fetchWithTimeout(`${BASE_URL}${basePath}/${encodeURIComponent(taskId)}`, {
          headers: {
            'x-freepik-api-key': freepikKey,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Freepik Poll failed');
        }
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            ...noStoreHeaders(),
          },
        });
      } else if (action === 'remove_bg') {
        const response = await fetchWithTimeout(`${BASE_URL}/ai/beta/remove-background`, {
          method: 'POST',
          headers: {
            'x-freepik-api-key': freepikKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error('Freepik BG Removal failed');
        }
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            ...noStoreHeaders(),
          },
        });
      } else if (action === 'upscale' || action === 'upscale_precision') {
        const endpoint = action === 'upscale_precision' ? '/ai/image-upscaler-precision' : '/ai/image-upscaler';
        const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'x-freepik-api-key': freepikKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error('Freepik Upscale failed');
        }
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            ...noStoreHeaders(),
          },
        });
      } else if (action === 'style_transfer') {
        const response = await fetchWithTimeout(`${BASE_URL}/ai/image-style-transfer`, {
          method: 'POST',
          headers: {
            'x-freepik-api-key': freepikKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error('Freepik Style Transfer failed');
        }
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            ...noStoreHeaders(),
          },
        });
      } else if (action === 'expand') {
        const response = await fetchWithTimeout(`${BASE_URL}/ai/image-expand`, {
          method: 'POST',
          headers: {
            'x-freepik-api-key': freepikKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error('Freepik Expand failed');
        }
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            ...noStoreHeaders(),
          },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    });
  } catch (error: any) {
    log.error('API Route Error', error, { url: req.url });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    });
  }
}
