import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requireAuth } from '../../api/_auth';
import unsplashHandler from '../../api/unsplash';
import pexelsHandler from '../../api/pexels';
import pixabayHandler from '../../api/pixabay';
import iconscoutHandler from '../../api/iconscout';
import dynamicMockupsHandler from '../../api/dynamic-mockups';
import logoSearchHandler from '../../api/logo-search';

vi.mock('../../api/_auth', () => ({
  requireAuth: vi.fn(),
}));

describe('Shared Edge upstream timeout safeguard', () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      VITE_FRONTEND_URL: 'https://kreathief.app',
      UNSPLASH_ACCESS_KEY: 'test-unsplash',
      PEXELS_API_KEY: 'test-pexels',
      PIXABAY_API_KEY: 'test-pixabay',
      ICONSCOUT_CLIENT_ID: 'test-id',
      ICONSCOUT_SECRET_KEY: 'test-secret',
      DYNAMIC_MOCKUPS_API_KEY: 'test-dm',
      LOGO_DEV_SECRET_KEY: 'test-logo',
    };
    vi.mocked(requireAuth).mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  const cases: Array<{
    name: string;
    handler: (req: Request) => Promise<Response>;
    url: string;
    expectedError: string;
  }> = [
    {
      name: 'unsplash',
      handler: unsplashHandler,
      url: 'https://kreathief.app/api/unsplash?action=search&query=nature',
      expectedError: 'Unsplash API timeout',
    },
    {
      name: 'pexels',
      handler: pexelsHandler,
      url: 'https://kreathief.app/api/pexels?action=search&query=nature',
      expectedError: 'Pexels API timeout',
    },
    {
      name: 'pixabay',
      handler: pixabayHandler,
      url: 'https://kreathief.app/api/pixabay?action=search&query=nature',
      expectedError: 'Pixabay API timeout',
    },
    {
      name: 'iconscout',
      handler: iconscoutHandler,
      url: 'https://kreathief.app/api/iconscout?action=search&query=arrow',
      expectedError: 'Iconscout API timeout',
    },
    {
      name: 'dynamic-mockups',
      handler: dynamicMockupsHandler,
      url: 'https://kreathief.app/api/dynamic-mockups?action=list',
      expectedError: 'Dynamic Mockups API timeout',
    },
    {
      name: 'logo-search',
      handler: logoSearchHandler,
      url: 'https://kreathief.app/api/logo-search?q=stripe',
      expectedError: 'Logo.dev API timeout',
    },
  ];

  it.each(cases)(
    '$name attaches AbortSignal on fetch and returns 504 on timeout',
    async ({ handler, url, expectedError }) => {
      const okFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
      globalThis.fetch = okFetch as unknown as typeof fetch;

      const okRes = await handler(new Request(url, { method: 'GET' }));
      expect(okRes.status).toBe(200);
      expect(okFetch.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);

      const abortErr = new Error('The operation was aborted');
      abortErr.name = 'AbortError';
      globalThis.fetch = vi.fn().mockRejectedValue(abortErr) as unknown as typeof fetch;

      const timeoutRes = await handler(new Request(url, { method: 'GET' }));
      expect(timeoutRes.status).toBe(504);
      expect(timeoutRes.headers.get('Access-Control-Allow-Origin')).toBe('https://kreathief.app');
      expect(await timeoutRes.json()).toEqual({ error: expectedError });
    }
  );
});
