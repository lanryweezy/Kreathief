/**
 * billingService.ts
 *
 * Handles payment provider routing (Paystack vs Stripe) based on the user's
 * detected location, and manages credit balance reads/writes against Supabase.
 *
 * Routing logic (based on official supported-country lists as of 2025):
 *
 *   Paystack operates in 5 African countries:
 *     Nigeria (NG), Ghana (GH), Kenya (KE), South Africa (ZA), Côte d'Ivoire (CI)
 *
 *   All other African countries (Egypt, Morocco, Tanzania, Ethiopia, Rwanda,
 *   Uganda, Senegal, etc.) and the rest of the world → Stripe.
 *
 *   Note: Stripe does technically accept payments from Nigerian/Ghanaian/Kenyan
 *   customers, but Paystack offers a far better local UX for those markets
 *   (local cards, mobile money, bank transfers, Naira/Cedi/Shilling pricing).
 */

import { db as supabase } from '../lib/supabase/client';
import { authService } from './authService';
import { log } from '../utils/log';

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Countries where Paystack is the preferred payment processor.
 * Source: https://paystack.com/countries (official Paystack supported markets)
 */
export const PAYSTACK_COUNTRIES = new Set(['NG', 'GH', 'KE', 'ZA', 'CI']);

/** Prices for Paystack in the local smallest currency unit.
 *  NG: Kobo (NGN×100), GH: Pesewas (GHS×100), KE: Cents (KES×100),
 *  ZA: Cents (ZAR×100), CI: Francs (XOF — Paystack uses whole units for CFA)
 *  We use a fixed USD-equivalent amount per country.
 */
const PAYSTACK_AMOUNTS: Record<string, { pro: number; creditPack: number; currency: string }> = {
  NG: { pro: 22500_00,    creditPack: 15000_00,   currency: 'NGN' }, // ~$15 / ~$10 at approx ₦1500/$
  GH: { pro: 220_00,      creditPack: 145_00,     currency: 'GHS' }, // ~$15 / ~$10 at approx GH₵14.5/$
  KE: { pro: 1950_00,     creditPack: 1300_00,    currency: 'KES' }, // ~$15 / ~$10 at approx KES130/$
  ZA: { pro: 275_00,      creditPack: 185_00,     currency: 'ZAR' }, // ~$15 / ~$10 at approx ZAR18.5/$
  CI: { pro: 9000,         creditPack: 6000,       currency: 'XOF' }, // ~$15 / ~$10 at approx XOF600/$
};

// Stripe price IDs — set these in your Stripe Dashboard and .env file.
// VITE_STRIPE_PRICE_PRO and VITE_STRIPE_PRICE_CREDIT_PACK are injected at
// build time. They can also be passed directly when calling initiateCheckout.
const STRIPE_PRICE_PRO         = import.meta.env.VITE_STRIPE_PRICE_PRO         || 'price_pro_monthly';
const STRIPE_PRICE_CREDIT_PACK = import.meta.env.VITE_STRIPE_PRICE_CREDIT_PACK || 'price_credit_pack';

// How many credits each plan grants on fulfillment (mirrors webhook logic)
export const CREDIT_GRANTS = {
  pro: 500,
  creditPack: 1000,
} as const;

export type PlanType = 'pro' | 'creditPack';
export type PaymentProvider = 'stripe' | 'paystack';

// ── Geo detection ─────────────────────────────────────────────────────────────

export interface GeoResult {
  countryCode: string;       // ISO 3166-1 alpha-2, e.g. "NG"
  provider: PaymentProvider;
  isPaystackCountry: boolean;
}

let _geoCache: GeoResult | null = null;

/**
 * Detect the user's country and decide which payment provider to use.
 * Result is cached for the session so we don't hit the API on every modal open.
 */
export async function detectGeoAndProvider(): Promise<GeoResult> {
  if (_geoCache) return _geoCache;

  try {
    // ipapi.co — free tier, no key required, returns JSON with country_code
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`ipapi.co ${res.status}`);
    const data = await res.json();
    const countryCode: string = (data.country_code || '').toUpperCase();
    const isPaystackCountry = PAYSTACK_COUNTRIES.has(countryCode);
    _geoCache = {
      countryCode,
      provider: isPaystackCountry ? 'paystack' : 'stripe',
      isPaystackCountry,
    };
  } catch (err) {
    log.warn('[BillingService] Geo detection failed, defaulting to Stripe', err);
    // Safe default: Stripe works globally
    _geoCache = { countryCode: 'UNKNOWN', provider: 'stripe', isPaystackCountry: false };
  }

  return _geoCache;
}

/** Clear the geo cache (useful for testing or if user changes VPN) */
export function clearGeoCache() {
  _geoCache = null;
}

// ── Checkout initiation ───────────────────────────────────────────────────────

export interface CheckoutResult {
  url: string;
  provider: PaymentProvider;
}

/**
 * Initiate a checkout session for the given plan.
 * Automatically detects provider from user location.
 * Uses the real authenticated user — never a mock ID.
 */
export async function initiateCheckout(plan: PlanType): Promise<CheckoutResult> {
  const user = await authService.getSession();
  if (!user) throw new Error('You must be signed in to upgrade.');

  const geo = await detectGeoAndProvider();

  if (geo.provider === 'paystack') {
    return initiatePaystackCheckout(plan, user.id, user.email, geo.countryCode);
  } else {
    return initiateStripeCheckout(plan, user.id);
  }
}

async function initiateStripeCheckout(plan: PlanType, userId: string): Promise<CheckoutResult> {
  const priceId = plan === 'pro' ? STRIPE_PRICE_PRO : STRIPE_PRICE_CREDIT_PACK;

  const res = await fetch('/api/stripe-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, priceId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Stripe checkout failed');
  }

  const data = await res.json();
  if (!data.url) throw new Error('No checkout URL returned from Stripe');
  return { url: data.url, provider: 'stripe' };
}

async function initiatePaystackCheckout(
  plan: PlanType,
  userId: string,
  email: string,
  countryCode: string
): Promise<CheckoutResult> {
  const amounts = PAYSTACK_AMOUNTS[countryCode] || PAYSTACK_AMOUNTS['NG'];
  const amount = plan === 'pro' ? amounts.pro : amounts.creditPack;

  const res = await fetch('/api/paystack-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      email,
      amount,
      currency: amounts.currency,
      // Pass plan type so the webhook knows how many credits to grant
      plan,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Paystack checkout failed');
  }

  const data = await res.json();
  if (!data.url) throw new Error('No authorization URL returned from Paystack');
  return { url: data.url, provider: 'paystack' };
}

// ── Credit management ─────────────────────────────────────────────────────────

/**
 * Fetch the current credit balance for a user from Supabase.
 * Returns the balance, or null if the user has no subscription record yet.
 */
export async function fetchCreditsFromSupabase(userId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('ai_credits_balance')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Row not found — new user, no subscription record yet
        return null;
      }
      throw error;
    }

    return data?.ai_credits_balance ?? null;
  } catch (err) {
    log.error('[BillingService] Failed to fetch credits from Supabase', err);
    return null;
  }
}

/**
 * Write a new credit balance to Supabase.
 * Uses upsert so it works for both first-time users and existing ones.
 */
export async function writeCreditsToSupabase(userId: string, newBalance: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert(
        { user_id: userId, ai_credits_balance: newBalance },
        { onConflict: 'user_id', ignoreDuplicates: false }
      );

    if (error) throw error;
  } catch (err) {
    log.error('[BillingService] Failed to write credits to Supabase', err);
    // Non-fatal — local state already updated, will re-sync on next load
  }
}

/**
 * Atomically deduct credits in Supabase using a Postgres RPC (no race conditions).
 * Returns the new balance, or null if the deduction failed (insufficient credits).
 *
 * Requires this function in Supabase:
 *   create or replace function deduct_credits(p_user_id uuid, p_amount int)
 *   returns int language plpgsql as $$
 *   declare new_balance int;
 *   begin
 *     update user_subscriptions
 *       set ai_credits_balance = ai_credits_balance - p_amount
 *       where user_id = p_user_id and ai_credits_balance >= p_amount
 *       returning ai_credits_balance into new_balance;
 *     return new_balance; -- null if row not found or insufficient credits
 *   end; $$;
 */
export async function deductCreditsInSupabase(userId: string, amount: number): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc('deduct_credits', {
      p_user_id: userId,
      p_amount: amount,
    });

    if (error) throw error;
    return data as number | null;
  } catch (err) {
    log.error('[BillingService] RPC deduct_credits failed', err);
    return null;
  }
}

/** Default free credits for new users who have no Supabase record yet */
export const DEFAULT_FREE_CREDITS = 10;
