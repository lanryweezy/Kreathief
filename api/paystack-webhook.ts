import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import getRawBody from 'raw-body';

export const config = {
  api: { bodyParser: false },
};

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['x-paystack-signature'] as string;
    const secret = process.env.PAYSTACK_SECRET_KEY || '';

    // Verify Paystack Signature (timing-safe comparison of the HMAC-SHA512 hex digest)
    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    const sigBuf = Buffer.from(signature || '', 'utf8');
    const hashBuf = Buffer.from(hash, 'utf8');

    if (sigBuf.length !== hashBuf.length || !crypto.timingSafeEqual(hashBuf, sigBuf)) {
      console.error('Invalid Paystack signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody.toString('utf8'));

    // Handle the successful charge event
    if (event.event === 'charge.success') {
      const data = event.data;
      const userId = data.metadata?.userId;
      const customerCode = data.customer?.customer_code;
      
      if (userId && data.status === 'success') {
        
        // 1. Ensure the user's Paystack Customer ID is saved
        await supabase
          .from('user_subscriptions')
          .update({ paystack_customer_id: customerCode })
          .eq('user_id', userId);

        // 2. If they bought the Credit Pack, add 1000 credits
        if (data.metadata?.type === 'credit_pack') {
          // Idempotency guard: claim this charge and credit atomically in one RPC. Paystack
          // retries deliveries, so the same transaction (data.id) can arrive more than once;
          // a duplicate claim returns 'duplicate' and credits nothing.
          const referenceId = String(data.id ?? data.reference ?? '');
          const { data: result, error } = await supabase
            .rpc('apply_paid_event_credits', {
              p_idempotency_key: `paystack:charge.success:${referenceId}`,
              p_provider: 'paystack',
              p_event_type: 'charge.success',
              p_reference_id: referenceId,
              p_user_id: userId,
              p_credits: 1000,
            });

          if (error) {
            // The claim/credit transaction failed → nothing was credited. Surface a 500 so
            // Paystack retries the delivery (the ledger keeps us from double-crediting).
            console.error('Paystack credit RPC failed:', error.message);
            throw error;
          }

          if (result === 'credited') {
            console.log(`Successfully added 1000 credits to user ${userId} via Paystack`);
          } else {
            console.log(`Skipping duplicate Paystack charge ${referenceId} for user ${userId}`);
          }
        }
      }
    }

    // Paystack expects a 200 response to acknowledge receipt
    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Paystack Webhook failed:', err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}
