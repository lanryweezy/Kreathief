import { log } from '../utils/log';
import { cacheHeaders } from '../utils/cacheHeaders';
import { requireAuth } from './_auth';
export const config = { runtime: 'edge' };

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 25_000): Promise<Response> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...init, signal: c.signal });
    clearTimeout(t);
    return r;
  } catch (e: any) {
    clearTimeout(t);
    if (e.name === 'AbortError') {
      throw new Error(`Tenor timeout ${timeoutMs}ms`);
    }
    throw e;
  }
}

const rlMap = new Map<string, { count: number; reset: number }>();
const RL_WINDOW = 60 * 60 * 1000,
  RL_MAX = 200,
  CLEANUP = 5 * 60 * 1000;
let lastCleanup = Date.now();
const cache = new Map<string, { data: any; exp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function jsonRes(data: any, o: string, ttl = 300) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': o, ...cacheHeaders(ttl) },
  });
}

function errRes(msg: string, o: string, s = 500) {
  return new Response(JSON.stringify({ error: msg }), {
    status: s,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': o },
  });
}

function checkRate(ip: string, origin: string): Response | null {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP) {
    for (const [k, v] of rlMap.entries()) {
      if (now > v.reset) {
        rlMap.delete(k);
      }
    }
    for (const [k, v] of cache.entries()) {
      if (now > v.exp) {
        cache.delete(k);
      }
    }
    lastCleanup = now;
  }
  const rl = rlMap.get(ip);
  if (rl) {
    if (now > rl.reset) {
      rlMap.set(ip, { count: 1, reset: now + RL_WINDOW });
    } else if (rl.count >= RL_MAX) {
      return errRes('Too many requests', origin, 429);
    } else {
      rl.count++;
    }
  } else {
    rlMap.set(ip, { count: 1, reset: now + RL_WINDOW });
  }
  return null;
}

function getCached(key: string) {
  const e = cache.get(key);
  return e && Date.now() < e.exp ? e.data : null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, exp: Date.now() + CACHE_TTL });
}

export default async function handler(req: Request) {
  const origin =
    process.env.VITE_FRONTEND_URL ||
    req.headers?.get?.('origin') ||
    req.headers?.origin ||
    req.headers?.['origin'] ||
    '*';
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    await requireAuth(req);
  } catch (response) {
    return response as Response;
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const blocked = checkRate(ip, origin);
  if (blocked) {
    return blocked;
  }

  const apiKey = process.env.TENOR_API_KEY || process.env.VITE_TENOR_API_KEY;
  if (!apiKey) {
    return errRes('Tenor API key not configured', origin, 503);
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const BASE = 'https://tenor.googleapis.com/v2';

    if (action === 'search') {
      const q = url.searchParams.get('query') || '',
        pos = url.searchParams.get('pos') || '';
      const ck = `tenor:s:${q}:${pos}`;
      const cached = getCached(ck);
      if (cached) {
        return jsonRes(cached, origin);
      }
      const targetUrl = `${BASE}/search?q=${encodeURIComponent(q)}&key=${apiKey}&client_key=kreathief&searchfilter=sticker&media_filter=png,webp,gif,tinywebp,tinygif&limit=24${pos ? `&pos=${pos}` : ''}`;
      const r = await fetchWithTimeout(targetUrl);
      if (!r.ok) {
        throw new Error(`Tenor search failed with status ${r.status}`);
      }
      const d = await r.json();
      setCache(ck, d);
      return jsonRes(d, origin);
    }

    if (action === 'trending') {
      const pos = url.searchParams.get('pos') || '';
      const ck = `tenor:t:${pos}`;
      const cached = getCached(ck);
      if (cached) {
        return jsonRes(cached, origin);
      }
      const targetUrl = `${BASE}/featured?key=${apiKey}&client_key=kreathief&searchfilter=sticker&media_filter=png,webp,gif,tinywebp,tinygif&limit=24${pos ? `&pos=${pos}` : ''}`;
      const r = await fetchWithTimeout(targetUrl);
      if (!r.ok) {
        throw new Error(`Tenor trending failed with status ${r.status}`);
      }
      const d = await r.json();
      setCache(ck, d);
      return jsonRes(d, origin);
    }

    return errRes('Invalid action parameter', origin, 400);
  } catch (error: any) {
    log.error('[Tenor API] Handler error:', error);
    return errRes(error?.message || 'Failed to fetch stickers', origin, 500);
  }
}
