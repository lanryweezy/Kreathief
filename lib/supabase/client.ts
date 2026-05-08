import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { supabase as supabaseConfig } from '../../config';
import { log } from '../../utils/log';

if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  log.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.');
}

export const supabase = createClient<Database>(
  supabaseConfig.url || 'https://placeholder.supabase.co',
  supabaseConfig.anonKey || 'placeholder-key',
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Untyped alias used by services for runtime dynamic queries
export const db = supabase as any;
