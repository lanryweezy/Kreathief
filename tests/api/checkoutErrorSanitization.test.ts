import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import paystackCheckout from '../../api/paystack-checkout';
import stripeCheckout from '../../api/stripe-checkout';
import { requireAuth } from '../../api/_auth';

vi.mock('../../api/_auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockRejectedValue(new Error('INTERNAL_DB_HOST=10.0.0.5 connection refused')),
        }),
      }),
    }),
  }),
}));

vi.mock('stripe', () => ({
  default: class MockStripe {
    customers = { create: vi.fn() };
    checkout = { sessions: { create: vi.fn() } };
  },
}));

function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as VercelResponse & { statusCode: number; body: any };
}

describe('Checkout error response sanitization', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.mocked(requireAuth).mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('does not leak raw error.message on paystack-checkout 500', async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new Error('SECRET_PAYSTACK_KEY=sk_live_secret failed')) as unknown as typeof fetch;

    const req = {
      method: 'POST',
      headers: { origin: 'https://kreathief.app' },
      body: { email: 'test@example.com', amount: 100000 },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await paystackCheckout(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Checkout session creation failed' });
    expect(JSON.stringify(res.body)).not.toContain('sk_live_secret');
  });

  it('does not leak raw error.message on stripe-checkout 500', async () => {
    const req = {
      method: 'POST',
      headers: { origin: 'https://kreathief.app' },
      body: { priceId: 'price_123' },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await stripeCheckout(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Checkout session creation failed' });
    expect(JSON.stringify(res.body)).not.toContain('INTERNAL_DB_HOST');
  });
});
