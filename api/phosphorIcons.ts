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
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    await requireAuth(req);
  } catch (response) {
    return response as Response;
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    if (!query)
      {return new Response(JSON.stringify({ icons: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, ...cacheHeaders(86400) },
      });}

    const cacheKey = query.toLowerCase();
    const cached = iconCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return new Response(JSON.stringify({ icons: cached.data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, ...cacheHeaders(86400) },
      });
    }

    const apiRes = await fetch(`https://api.phosphoricons.com/v1/icons/search?q=${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
    });
    if (!apiRes.ok) {throw new Error(`Phosphor API returned ${apiRes.status}`);}
    const data = await apiRes.json();
    const icons = (data.icons || []).map((icon: any) => ({
      name: icon.name || icon.id,
      svg: icon.svg || '',
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
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin! },
    });
  }
}
