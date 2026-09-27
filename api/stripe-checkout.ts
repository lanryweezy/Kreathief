import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from './_auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // SECURITY: require a valid session and only ever create checkouts for the
    // authenticated user — a client-supplied userId alone can contaminate other
    // accounts' stripe_customer_id rows.
    let authUser: { id: string };
    try {
      authUser = await requireAuth(req);
    } catch (error) {
      if (error instanceof Response) {
        return res.status(error.status).json({ error: await error.clone().json().catch(() => 'Authentication required') });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }

    const { userId: requestedUserId, priceId } = req.body;
    const userId = authUser.id;
    if (requestedUserId && requestedUserId !== userId) {
      return res.status(403).json({ error: 'Cannot create checkout for another user' });
    }
    if (!userId || !priceId) {
      return res.status(400).json({ error: 'Missing priceId' });
    }

    // 2. Look up the user's Stripe Customer ID in Supabase
    const { data: userData, error } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let customerId = userData?.stripe_customer_id;

    // 3. If they don't have a Stripe Customer ID, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
      
      // Save it to Supabase
      await supabase
        .from('user_subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId);
    }

    // 4. Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // e.g. price_1Nxyz... (created in Stripe Dashboard)
          quantity: 1,
        },
      ],
      mode: 'payment', // use 'subscription' if it's a recurring monthly plan
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
      metadata: {
        userId: userId,
        type: 'credit_pack', // identifier for the webhook to know what to fulfill
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
