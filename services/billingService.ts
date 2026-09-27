/**
 * Dual Billing Service
 * Connects frontend payment flows with Stripe Checkout (Global) and Paystack (Africa).
 */

import { db as supabase } from '../lib/supabase/client';
import { logger } from './logger';

export interface CheckoutOptions {
  provider: 'stripe' | 'paystack';
  planId?: string;
  email?: string;
  amountKoboOrCents?: number; // In smallest unit (e.g. cents for USD, kobo for NGN)
}

class BillingService {
  /**
   * Retrieves the current Supabase session JWT to pass as Bearer token to API endpoints.
   */
  private async getAuthToken(): Promise<{ token: string; userId: string; email?: string } | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.access_token) {
        return null;
      }
      return {
        token: session.access_token,
        userId: session.user.id,
        email: session.user.email,
      };
    } catch (err) {
      logger.error('[Billing] Failed to get session token', { error: err });
      return null;
    }
  }

  /**
   * Initializes a Stripe Checkout session and returns the hosted Stripe URL.
   */
  async createStripeCheckout(priceId: string = 'price_pro_monthly'): Promise<string> {
    const auth = await this.getAuthToken();
    if (!auth) {
      throw new Error('Please sign in or create an account to upgrade.');
    }

    const res = await fetch('/api/stripe-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({
        userId: auth.userId,
        priceId,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Stripe checkout error (${res.status})`);
    }

    const data = await res.json();
    if (!data.url) {
      throw new Error('No checkout URL returned from Stripe');
    }

    return data.url;
  }

  /**
   * Initializes a Paystack transaction and returns the hosted Paystack authorization URL.
   * Default amount: ₦28,500 (2,850,000 Kobo).
   */
  async createPaystackCheckout(userEmail?: string, amountKobo: number = 2850000): Promise<string> {
    const auth = await this.getAuthToken();
    if (!auth) {
      throw new Error('Please sign in or create an account to upgrade.');
    }

    const email = userEmail || auth.email;
    if (!email) {
      throw new Error('An email address is required to initialize Paystack checkout.');
    }

    const res = await fetch('/api/paystack-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({
        userId: auth.userId,
        email,
        amount: amountKobo,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Paystack checkout error (${res.status})`);
    }

    const data = await res.json();
    if (!data.url) {
      throw new Error('No authorization URL returned from Paystack');
    }

    return data.url;
  }

  /**
   * Redirects the browser to the payment gateway.
   */
  redirectToCheckout(url: string) {
    window.location.href = url;
  }
}

export const billingService = new BillingService();
