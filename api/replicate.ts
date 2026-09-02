import { requireAuth } from './_auth';
import { handleCors } from './_cors';
import { checkRateLimit } from './_rateLimit';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return handleCors(req);
  }

  const origin = process.env.VITE_FRONTEND_URL;
  if (!origin) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500 });
  }

  try {
    await requireAuth(req);
  } catch (error) {
    if (error instanceof Response) return error;
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { allowed, response } = await checkRateLimit(req, 10);
  if (!allowed && response) {
    return response;
  }

  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Service unavailable' }), { status: 503 });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (req.method === 'POST' && action === 'create') {
      const body = await req.json();
      const res = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          Authorization: \`Token \${apiKey}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        return new Response(await res.text(), { status: res.status });
      }

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
      });
    } else if (req.method === 'GET' && action === 'poll') {
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing prediction id' }), { status: 400 });
      }

      const res = await fetch(\`https://api.replicate.com/v1/predictions/\${id}\`, {
        headers: { Authorization: \`Token \${apiKey}\` },
      });

      if (!res.ok) {
        return new Response(await res.text(), { status: res.status });
      }

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
