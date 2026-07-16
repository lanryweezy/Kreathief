import { log } from '../utils/log';
import { cacheHeaders } from '../utils/cacheHeaders';
export const config = {
  runtime: 'edge',
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let lastCleanup = Date.now();

export default async function handler(req: Request) {
  const origin = process.env.VITE_FRONTEND_URL || '*'; // Fallback if missing

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

  const apiKey = process.env.GETILLUSTRATION_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GetIllustration API key not configured on server' }), {
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

    const BASE_URL = 'https://getillustrations.com/api/v1/plugin';

    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    if (action === 'search') {
      const query = url.searchParams.get('query') || '';
      const limit = url.searchParams.get('limit') || '20';
      const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}&limit=${encodeURIComponent(limit)}`, { headers });
      if (!res.ok) throw new Error('GetIllustration search failed');
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, ...cacheHeaders() },
      });
    } else if (action === 'icon-packs') {
      const page = url.searchParams.get('page') || '1';
      const limit = url.searchParams.get('limit') || '20';
      const free = url.searchParams.get('free') === 'true' ? '&free=true' : '';
      const res = await fetch(`${BASE_URL}/icon-packs?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}${free}`, { headers });
      if (!res.ok) throw new Error('GetIllustration icon-packs failed');
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, ...cacheHeaders() },
      });
    } else if (action === 'packs') {
      const page = url.searchParams.get('page') || '1';
      const limit = url.searchParams.get('limit') || '20';
      const free = url.searchParams.get('free') === 'true' ? '&free=true' : '';
      const res = await fetch(`${BASE_URL}/packs?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}${free}`, { headers });
      if (!res.ok) throw new Error('GetIllustration packs failed');
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, ...cacheHeaders() },
      });
    } else if (action === 'pack-illustrations') {
      const packId = url.searchParams.get('packId');
      if (!packId) return new Response(JSON.stringify({ error: 'packId required' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin } });
      const page = url.searchParams.get('page') || '1';
      const limit = url.searchParams.get('limit') || '20';
      const res = await fetch(`${BASE_URL}/packs/${encodeURIComponent(packId)}/illustrations?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`, { headers });
      if (!res.ok) throw new Error('GetIllustration pack illustrations failed');
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, ...cacheHeaders() },
      });
    } else if (action === 'pack-icons') {
      const packId = url.searchParams.get('packId');
      if (!packId) return new Response(JSON.stringify({ error: 'packId required' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin } });
      const page = url.searchParams.get('page') || '1';
      const limit = url.searchParams.get('limit') || '20';
      const res = await fetch(`${BASE_URL}/icon-packs/${encodeURIComponent(packId)}/icons?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`, { headers });
      if (!res.ok) throw new Error('GetIllustration pack icons failed');
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, ...cacheHeaders() },
      });
    } else if (action === 'random-icons') {
      const count = url.searchParams.get('count') || '24';
      let reqUrl = `${BASE_URL}/icons/random?count=${encodeURIComponent(count)}`;
      const pack = url.searchParams.get('pack');
      if (pack) {
        reqUrl += `&pack=${encodeURIComponent(pack)}`;
      }
      const res = await fetch(reqUrl, { headers });
      if (!res.ok) throw new Error('GetIllustration random icons failed');
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, ...cacheHeaders() },
      });
    } else if (action === 'check-config') {
      return new Response(JSON.stringify({ configured: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
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
