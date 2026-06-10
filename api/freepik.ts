export const config = {
  runtime: 'edge',
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let lastCleanup = Date.now();

export default async function handler(req: Request) {
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
        'Access-Control-Allow-Origin': '*',
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
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
      rateLimitState.count++;
    }
  } else {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  }

  const freepikKey = process.env.VITE_FREEPIK_API_KEY || process.env.FREEPIK_API_KEY;

  if (!freepikKey) {
    return new Response(JSON.stringify({ error: 'Freepik API key not configured on server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
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

      const response = await fetch(
        `${BASE_URL}/resources?locale=en-US&term=${encodeURIComponent(query)}&page=${page}&limit=20&filters[content_type]=${type}`,
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
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    } else if (action === 'search_icons') {
      const query = url.searchParams.get('query') || '';
      const page = url.searchParams.get('page') || '1';

      const response = await fetch(
        `${BASE_URL}/icons?locale=en-US&term=${encodeURIComponent(query)}&page=${page}&limit=50`,
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
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    } else if (action === 'download_resource') {
      const resourceId = url.searchParams.get('resourceId');
      const format = url.searchParams.get('format') || 'jpg';
      if (!resourceId) {
        return new Response(JSON.stringify({ error: 'resourceId is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const response = await fetch(`${BASE_URL}/resources/${resourceId}/download/${format}`, {
        headers: {
          'x-freepik-api-key': freepikKey,
          'Accept-Language': 'en-US',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Freepik Resource Download failed');
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (req.method === 'POST') {
      let payload;
      try {
        payload = await req.json();
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      if (action === 'generate') {
        const response = await fetch(`${BASE_URL}/ai/mystic`, {
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
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      } else if (action === 'poll') {
        const taskId = url.searchParams.get('taskId');
        const basePath = url.searchParams.get('basePath') || '/ai/mystic';

        if (!taskId) {
          return new Response(JSON.stringify({ error: 'taskId is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        }

        const response = await fetch(`${BASE_URL}${basePath}/${taskId}`, {
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
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      } else if (action === 'remove_bg') {
        const response = await fetch(`${BASE_URL}/ai/beta/remove-background`, {
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
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      } else if (action === 'upscale' || action === 'upscale_precision') {
        const endpoint = action === 'upscale_precision' ? '/ai/image-upscaler-precision' : '/ai/image-upscaler';
        const response = await fetch(`${BASE_URL}${endpoint}`, {
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
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      } else if (action === 'style_transfer') {
        const response = await fetch(`${BASE_URL}/ai/image-style-transfer`, {
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
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      } else if (action === 'expand') {
        const response = await fetch(`${BASE_URL}/ai/image-expand`, {
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
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    console.error('API Route Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
