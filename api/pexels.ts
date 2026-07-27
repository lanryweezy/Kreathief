import { log } from '../utils/log';
import { cacheHeaders } from '../utils/cacheHeaders';
import { requireAuth } from './_auth';
export const config = { runtime: 'edge' };

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 30_000): Promise<Response> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...init, signal: c.signal });
    clearTimeout(t);
    return r;
  } catch (e: any) {
    clearTimeout(t);
    if (e.name === 'AbortError') throw new Error(`Pexels timeout ${timeoutMs}ms`);
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
      if (now > v.reset) rlMap.delete(k);
    }
    for (const [k, v] of cache.entries()) {
      if (now > v.exp) cache.delete(k);
    }
    lastCleanup = now;
  }
  const rl = rlMap.get(ip);
  if (rl) {
    if (now > rl.reset) rlMap.set(ip, { count: 1, reset: now + RL_WINDOW });
    else if (rl.count >= RL_MAX) return errRes('Too many requests', origin, 429);
    else rl.count++;
  } else rlMap.set(ip, { count: 1, reset: now + RL_WINDOW });
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
  const origin = process.env.VITE_FRONTEND_URL;
  if (!origin) return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500 });
  if (req.method === 'OPTIONS')
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  try {
    await requireAuth(req);
  } catch (error) {
    if (error instanceof Response) return error;
    return new Response(JSON.stringify({ error: 'Internal server error during authentication' }), { status: 500 });
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const blocked = checkRate(ip, origin);
  if (blocked) return blocked;

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return errRes('Pexels API key not configured', origin);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const BASE = 'https://api.pexels.com/v1';
    const headers = { Authorization: apiKey };

    if (action === 'search') {
      const q = url.searchParams.get('query') || '',
        page = url.searchParams.get('page') || '1';
      const ck = `s:${q}:${page}`;
      const cached = getCached(ck);
      if (cached) return jsonRes(cached, origin);
      const r = await fetchWithTimeout(`${BASE}/search?query=${encodeURIComponent(q)}&per_page=20&page=${page}`, {
        headers,
      });
      if (!r.ok) throw new Error('Pexels search failed');
      const d = await r.json();
      setCache(ck, d);
      return jsonRes(d, origin);
    }

    if (action === 'curated') {
      const page = url.searchParams.get('page') || '1';
      const ck = `cur:${page}`;
      const cached = getCached(ck);
      if (cached) return jsonRes(cached, origin);
      const r = await fetchWithTimeout(`${BASE}/curated?per_page=20&page=${page}`, { headers });
      if (!r.ok) throw new Error('Pexels curated failed');
      const d = await r.json();
      setCache(ck, d);
      return jsonRes(d, origin);
    }

    if (action === 'collections') {
      const cid = url.searchParams.get('collectionId');
      if (!cid) return errRes('collectionId is required', origin, 400);
      const page = url.searchParams.get('page') || '1';
      const ck = `col:${cid}:${page}`;
      const cached = getCached(ck);
      if (cached) return jsonRes(cached, origin);
      const r = await fetchWithTimeout(`${BASE}/collections/${cid}/photos?per_page=20&page=${page}`, { headers });
      if (!r.ok) throw new Error('Pexels collections failed');
      const d = await r.json();
      setCache(ck, d);
      return jsonRes(d, origin);
    }

    return errRes('Unknown action', origin, 400);
  } catch (error: any) {
    log.error('Pexels API Error', error, { url: req.url });
    return errRes('Internal server error', origin);
  }
}
