import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { supabase as supabaseConfig } from '../../config';
import { log } from '../../utils/log';

if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  log.warn(
    'Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

// Validate URL is a valid HTTP/HTTPS URL
const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const supabaseUrl = isValidUrl(supabaseConfig.url)
  ? supabaseConfig.url
  : 'https://placeholder.supabase.co';

// True when real credentials are present — consumers can gate cloud features
// instead of silently talking to the placeholder endpoint.
export const isSupabaseConfigured = isValidUrl(supabaseConfig.url) && !!supabaseConfig.anonKey;

export const supabase = createClient<Database>(
  supabaseUrl,
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

// Typed alias used by services for runtime dynamic queries
export { supabase as db };
