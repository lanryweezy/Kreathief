import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../api/replicate';
import { requireAuth } from '../../api/_auth';

vi.mock('../../api/_auth', () => ({
  requireAuth: vi.fn(),
}));

describe('api/replicate timeout safeguard', () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      VITE_FRONTEND_URL: 'https://kreathief.app',
      REPLICATE_API_KEY: 'rep-test-key',
    };
    vi.mocked(requireAuth).mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('attaches an AbortSignal to start prediction requests and returns 200', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'pred-1', status: 'starting' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const req = new Request('https://kreathief.app/api/replicate?action=start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: 'https://example.com/a.png', scale: 2, face_enhance: false }),
    });

    const res = await handler(req);

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('returns 504 with CORS header when upstream poll aborts on timeout', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    globalThis.fetch = vi.fn().mockRejectedValue(abortError) as unknown as typeof fetch;

    const req = new Request('https://kreathief.app/api/replicate?action=poll&id=pred-1', {
      method: 'GET',
    });

    const res = await handler(req);

    expect(res.status).toBe(504);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://kreathief.app');
    expect(await res.json()).toEqual({ error: 'Replicate API timeout' });
  });
});
