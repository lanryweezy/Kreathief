import { cacheHeaders } from '../utils/cacheHeaders';

export const config = {
  runtime: 'edge',
};

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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'get_client_config') {
    const publicConfig = {
      supabase: {
        url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
        anonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
      },
      flags: {
        qaBypass: process.env.VITE_QA_BYPASS === 'true',
        useQaBypass: process.env.VITE_USE_QA_BYPASS === 'true',
      },
    };

    return new Response(JSON.stringify(publicConfig), {
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
}
