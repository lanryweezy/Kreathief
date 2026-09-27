import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from './_auth';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // SECURITY: only authenticated users may initialize transactions, and only
    // for themselves — never trust a client-supplied userId alone.
    let authUser: { id: string; email?: string };
    try {
      authUser = await requireAuth(req);
    } catch (error) {
      if (error instanceof Response) {
        return res.status(error.status).json({ error: await error.clone().json().catch(() => 'Authentication required') });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }

    const { userId: requestedUserId, email, amount } = req.body; // Amount should be passed in smallest currency unit (e.g., Kobo for NGN. So 1000 NGN = 100000)
    const userId = authUser.id;
    if (requestedUserId && requestedUserId !== userId) {
      return res.status(403).json({ error: 'Cannot create checkout for another user' });
    }
    if (!email || !amount) {
      return res.status(400).json({ error: 'Missing email or amount' });
    }

    // Initialize Paystack Transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount,
        callback_url: `${req.headers.origin}/success`,
        metadata: {
          userId: userId,
          type: 'credit_pack', // identifier for the webhook
          custom_fields: [
            {
              display_name: 'User ID',
              variable_name: 'user_id',
              value: userId,
            }
          ]
        }
      }),
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message);
    }

    // Return the checkout URL to the frontend
    return res.status(200).json({ url: data.data.authorization_url });
  } catch (error: any) {
    console.error('Paystack Checkout Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
