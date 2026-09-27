import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import getRawBody from 'raw-body';

// IMPORTANT: Webhooks require the raw body to verify the cryptographic signature
export const config = {
  api: { bodyParser: false },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    // Verify the webhook is actually from Stripe
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Retrieve the userId we passed in the metadata during checkout
        const userId = session.metadata?.userId;
        
        if (userId && session.payment_status === 'paid') {
          // If they bought the Credit Pack, add 1000 credits
          if (session.metadata?.type === 'credit_pack') {
            // Idempotency guard: claim this event id and credit atomically in one RPC.
            // Stripe retries deliveries, so the same event.id can arrive more than once;
            // a duplicate claim returns 'duplicate' and credits nothing.
            const { data: result, error } = await supabase
              .rpc('apply_paid_event_credits', {
                p_idempotency_key: `stripe:${event.id}`,
                p_provider: 'stripe',
                p_event_type: event.type,
                p_reference_id: session.id,
                p_user_id: userId,
                p_credits: 1000,
              });

            if (error) {
              // The claim/credit transaction failed → nothing was credited. Surface a 500 so
              // Stripe retries the delivery (the ledger keeps us from double-crediting).
              console.error('Stripe credit RPC failed:', error.message);
              throw error;
            }

            if (result === 'credited') {
              console.log(`Successfully added 1000 credits to user ${userId}`);
            } else {
              console.log(`Skipping duplicate Stripe event ${event.id} for user ${userId}`);
            }
          }
        }
        break;
      }
      // Add other events here like 'customer.subscription.deleted' 
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook handler failed:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}
