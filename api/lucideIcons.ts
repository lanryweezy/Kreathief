import { cacheHeaders } from '../utils/cacheHeaders';
import { requireAuth } from './_auth';

export const config = { runtime: 'edge' };

const iconCache = new Map<string, { data: any[]; expiry: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

export default async function handler(req: Request) {
  const origin = process.env.VITE_FRONTEND_URL;
  if (!origin) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500 });
  }

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
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return new Response(JSON.stringify({ error: 'Internal server error during authentication' }), { status: 500 });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    if (!query) {
      return new Response(JSON.stringify({ icons: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, ...cacheHeaders(86400) },
      });
    }

    const cacheKey = query.toLowerCase();
    const cached = iconCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return new Response(JSON.stringify({ icons: cached.data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, ...cacheHeaders(86400) },
      });
    }

    const apiRes = await fetch(`https://lucide.dev/icons/search?q=${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
    });
    if (!apiRes.ok) {
      throw new Error(`Lucide API returned ${apiRes.status}`);
    }
    const data = await apiRes.json();
    const icons = (data.icons || []).map((icon: any) => ({
      name: icon.name,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${(icon.svgNode || '').toString()}</svg>`,
      tags: icon.tags || [],
    }));

    iconCache.set(cacheKey, { data: icons, expiry: Date.now() + CACHE_TTL });
    return new Response(JSON.stringify({ icons }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, ...cacheHeaders(86400) },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error', icons: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
    });
  }
}
