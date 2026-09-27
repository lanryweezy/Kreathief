/**
 * Webhook idempotency wiring tests (handler level).
 *
 * These exercise the REAL api/stripe-webhook.ts and api/paystack-webhook.ts handlers with the
 * Supabase client / Stripe SDK / raw-body mocked, and (for Paystack) real Node crypto against a
 * correctly HMAC-signed body. They assert the behavior that matters after migration 014:
 *   - crediting goes through apply_paid_event_credits with a stable, provider-scoped idempotency key
 *   - a 'duplicate' claim returns a clean 200 (no re-credit, no error)
 *   - an RPC failure surfaces a 500 so the provider safely retries (never a silent partial credit)
 *   - events that aren't a credit-pack purchase never touch the credit RPC
 *
 * The atomic no-double-credit guarantee itself lives in the SQL RPC and is covered by
 * webhookIdempotency.integration.test.ts (replays the real RPC twice against a Supabase branch).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// Mutable holders referenced from hoisted vi.mock factories.
const h = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  stripeEvent: null as any,
  rawBody: Buffer.from('{}'),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ rpc: h.rpc, from: h.from }),
}));

vi.mock('stripe', () => ({
  default: class StripeMock {
    webhooks = { constructEvent: () => h.stripeEvent };
  },
}));

vi.mock('raw-body', () => ({
  default: () => Promise.resolve(h.rawBody),
}));

import stripeHandler from '../../api/stripe-webhook';
import paystackHandler from '../../api/paystack-webhook';

function makeRes() {
  const res: any = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  res.send = vi.fn(() => res);
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
  h.rpc.mockResolvedValue({ data: 'credited', error: null });
  // Default chainable stub for the paystack customer-id update: from().update().eq()
  h.from.mockReturnValue({ update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) });
});

describe('stripe-webhook idempotency wiring', () => {
  const creditPackEvent = {
    id: 'evt_credit_1',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        payment_status: 'paid',
        metadata: { userId: 'user-abc', type: 'credit_pack' },
      },
    },
  };

  it('credits through apply_paid_event_credits with a stable idempotency key', async () => {
    h.stripeEvent = creditPackEvent;
    const res = makeRes();
    await stripeHandler({ method: 'POST', headers: { 'stripe-signature': 'sig' } } as any, res);

    expect(h.rpc).toHaveBeenCalledWith(
      'apply_paid_event_credits',
      expect.objectContaining({
        p_idempotency_key: 'stripe:evt_credit_1',
        p_provider: 'stripe',
        p_reference_id: 'cs_test_123',
        p_user_id: 'user-abc',
        p_credits: 1000,
      })
    );
    expect(res.json).toHaveBeenCalledWith({ received: true });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('treats a duplicate claim as a clean 200 (no re-credit, no error path)', async () => {
    h.stripeEvent = creditPackEvent;
    h.rpc.mockResolvedValueOnce({ data: 'duplicate', error: null });
    const res = makeRes();
    await stripeHandler({ method: 'POST', headers: { 'stripe-signature': 'sig' } } as any, res);

    expect(h.rpc).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ received: true });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('surfaces 500 when the credit RPC fails so the provider retries', async () => {
    h.stripeEvent = creditPackEvent;
    h.rpc.mockResolvedValueOnce({ data: null, error: { message: 'db down' } });
    const res = makeRes();
    await stripeHandler({ method: 'POST', headers: { 'stripe-signature': 'sig' } } as any, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('does not credit for non-credit-pack sessions', async () => {
    h.stripeEvent = {
      id: 'evt_sub_1',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_x', payment_status: 'paid', metadata: { userId: 'user-abc' } } },
    };
    const res = makeRes();
    await stripeHandler({ method: 'POST', headers: { 'stripe-signature': 'sig' } } as any, res);

    expect(h.rpc).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });
});

describe('paystack-webhook idempotency wiring', () => {
  const SECRET = 'sk_test_paystack';

  function signed(bodyObj: unknown) {
    const body = Buffer.from(JSON.stringify(bodyObj));
    const signature = crypto.createHmac('sha512', SECRET).update(body).digest('hex');
    return { body, signature };
  }

  beforeEach(() => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
  });

  it('rejects a bad signature with 400 before any credit', async () => {
    const { body } = signed({ event: 'charge.success', data: { id: 1 } });
    h.rawBody = body;
    const res = makeRes();
    await paystackHandler(
      { method: 'POST', headers: { 'x-paystack-signature': 'deadbeef' } } as any,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it('credits through the RPC with a transaction-scoped idempotency key', async () => {
    const event = {
      event: 'charge.success',
      data: {
        id: 987654,
        status: 'success',
        customer: { customer_code: 'CUS_1' },
        metadata: { userId: 'user-xyz', type: 'credit_pack' },
      },
    };
    const { body, signature } = signed(event);
    h.rawBody = body;
    const res = makeRes();
    await paystackHandler(
      { method: 'POST', headers: { 'x-paystack-signature': signature } } as any,
      res
    );

    expect(h.rpc).toHaveBeenCalledWith(
      'apply_paid_event_credits',
      expect.objectContaining({
        p_idempotency_key: 'paystack:charge.success:987654',
        p_provider: 'paystack',
        p_user_id: 'user-xyz',
        p_credits: 1000,
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('acknowledges a duplicate (200) without re-crediting', async () => {
    const event = {
      event: 'charge.success',
      data: {
        id: 111,
        status: 'success',
        customer: { customer_code: 'CUS_2' },
        metadata: { userId: 'user-dup', type: 'credit_pack' },
      },
    };
    const { body, signature } = signed(event);
    h.rawBody = body;
    h.rpc.mockResolvedValueOnce({ data: 'duplicate', error: null });
    const res = makeRes();
    await paystackHandler(
      { method: 'POST', headers: { 'x-paystack-signature': signature } } as any,
      res
    );

    expect(h.rpc).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 500 on RPC failure so Paystack retries', async () => {
    const event = {
      event: 'charge.success',
      data: {
        id: 222,
        status: 'success',
        customer: { customer_code: 'CUS_3' },
        metadata: { userId: 'user-err', type: 'credit_pack' },
      },
    };
    const { body, signature } = signed(event);
    h.rawBody = body;
    h.rpc.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    const res = makeRes();
    await paystackHandler(
      { method: 'POST', headers: { 'x-paystack-signature': signature } } as any,
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
