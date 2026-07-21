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
  const origin = process.env.VITE_FRONTEND_URL;
  if (!origin) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500 });
  }

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

  try {
    await requireAuth(req);
  } catch (response) {
    return response as Response;
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

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...noStoreHeaders() },
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

  let payload: any = {};
  try {
    payload = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    });
  }

  const { action, modelName, generationConfig, systemInstruction, contents } = payload;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Gemini API key not configured on server' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    });
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const ai = new GoogleGenerativeAI(apiKey);

    if (action === 'generateContent') {
      const modelConfig: any = { model: modelName || 'gemini-2.0-flash' };
      if (generationConfig && typeof generationConfig === 'object') {
        // Only allow safe generation config fields
        const safeConfig: any = {};
        if (generationConfig.temperature !== undefined) safeConfig.temperature = Math.min(2, Math.max(0, generationConfig.temperature));
        if (generationConfig.maxOutputTokens !== undefined) safeConfig.maxOutputTokens = Math.min(8192, Math.max(1, generationConfig.maxOutputTokens));
        if (generationConfig.topP !== undefined) safeConfig.topP = Math.min(1, Math.max(0, generationConfig.topP));
        if (generationConfig.topK !== undefined) safeConfig.topK = Math.min(40, Math.max(1, generationConfig.topK));
        if (generationConfig.responseMimeType) safeConfig.responseMimeType = generationConfig.responseMimeType;
        if (generationConfig.responseSchema) safeConfig.responseSchema = generationConfig.responseSchema;
        modelConfig.generationConfig = safeConfig;
      }
      // systemInstruction is not passed through — users cannot override safety settings
      if (systemInstruction && typeof systemInstruction === 'string' && systemInstruction.length < 2000) {
        modelConfig.systemInstruction = systemInstruction;
      }

      const model = ai.getGenerativeModel(modelConfig);
      let response;
      if (Array.isArray(contents)) {
        response = await model.generateContent({ contents });
      } else {
        // Sometimes string or different format
        response = await model.generateContent(contents);
      }

      return new Response(
        JSON.stringify({
          text: response.response.text(),
          candidates: response.response.candidates,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            ...cacheHeaders(300),
          },
        }
      );
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    });
  } catch (error: any) {
    log.error('API Route Error', error, { action: payload?.action, modelName: payload?.modelName });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    });
  }
}
