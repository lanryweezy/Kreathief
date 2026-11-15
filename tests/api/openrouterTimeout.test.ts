import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../api/openrouter';
import { requireAuth } from '../../api/_auth';
import { checkAndDeductCredits } from '../../api/_credits';

vi.mock('../../api/_auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('../../api/_credits', () => ({
  checkAndDeductCredits: vi.fn(),
}));

describe('api/openrouter timeout safeguard', () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      VITE_FRONTEND_URL: 'https://kreathief.app',
      OPENROUTER_API_KEY: 'or-test-key',
    };
    vi.mocked(requireAuth).mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
    vi.mocked(checkAndDeductCredits).mockResolvedValue({ allowed: true, remaining: 9 });
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  const makeRequest = () =>
    new Request('https://kreathief.app/api/openrouter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });

  it('attaches an AbortSignal to the upstream OpenRouter fetch and returns 200 on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'gen-1', choices: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const res = await handler(makeRequest());

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('returns 504 with CORS header when upstream OpenRouter request aborts on timeout', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    globalThis.fetch = vi.fn().mockRejectedValue(abortError) as unknown as typeof fetch;

    const res = await handler(makeRequest());

    expect(res.status).toBe(504);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://kreathief.app');
    const body = await res.json();
    expect(body).toEqual({ error: 'OpenRouter API timeout' });
  });
});
