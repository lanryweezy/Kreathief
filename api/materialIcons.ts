import { cacheHeaders } from '../utils/cacheHeaders';

export const config = { runtime: 'edge' };

const iconCache = new Map<string, { data: string[]; expiry: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

export default async function handler(req: Request) {
  const origin = process.env.VITE_FRONTEND_URL;
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin!,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    if (!query)
      return new Response(JSON.stringify({ icons: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin!, ...cacheHeaders(86400) },
      });

    const cached = iconCache.get(query.toLowerCase());
    if (cached && cached.expiry > Date.now()) {
      return new Response(JSON.stringify({ icons: cached.data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin!, ...cacheHeaders(86400) },
      });
    }

    const cssRes = await fetch('https://fonts.googleapis.com/css2?family=Material+Icons', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!cssRes.ok) throw new Error(`Google Fonts API returned ${cssRes.status}`);
    const css = await cssRes.text();

    const names = new Set<string>();
    const re = /\.material-icons::before\s*\{\s*content:\s*"([^"]+)"\s*\}/g;
    let m;
    while ((m = re.exec(css))) names.add(m[1]);
    const allIcons = [...names];
    const filtered = query ? allIcons.filter((n) => n.toLowerCase().includes(query.toLowerCase())) : allIcons;

    iconCache.set(query.toLowerCase(), { data: filtered, expiry: Date.now() + CACHE_TTL });
    return new Response(JSON.stringify({ icons: filtered }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin!, ...cacheHeaders(86400) },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error', icons: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin! },
    });
  }
}
