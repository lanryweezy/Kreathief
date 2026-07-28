import { log } from '../utils/log';
import { cacheHeaders, noStoreHeaders } from '../utils/cacheHeaders';
import { requireAuth } from './_auth';
export const config = {
  runtime: 'edge',
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let lastCleanup = Date.now();

export default async function handler(req: Request) {
  const origin =
    process.env.VITE_FRONTEND_URL ||
    req.headers?.get?.('origin') ||
    req.headers?.origin ||
    req.headers?.['origin'] ||
    '*';

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

  try {
    await requireAuth(req);
  } catch (response) {
    return response as Response;
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

  const accountId = process.env.VECTEEZY_ACCOUNT_ID;
  const secretKey = process.env.VECTEEZY_SECRET_KEY;

  if (!accountId || !secretKey) {
    return new Response(JSON.stringify({ error: 'Vecteezy API key not configured on server' }), {
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

    const VECTEEZY_API_URL = 'https://api.vecteezy.com/v2';

    if (action === 'search') {
      const query = url.searchParams.get('query') || '';
      const page = url.searchParams.get('page') || '1';

      const response = await fetch(
        `${VECTEEZY_API_URL}/${accountId}/resources?search_term=${encodeURIComponent(query)}&page=${encodeURIComponent(page)}&per_page=20`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Vecteezy Search failed');
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
    } else if (action === 'download') {
      const resourceId = url.searchParams.get('resourceId');
      if (!resourceId) {
        return new Response(JSON.stringify({ error: 'resourceId is required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
          },
        });
      }

      const response = await fetch(
        `${VECTEEZY_API_URL}/${accountId}/resources/${encodeURIComponent(resourceId)}/download`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Vecteezy Download failed');
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
