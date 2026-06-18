import { supabase } from '../lib/supabase/client';

export type SecurityEventType = 'LOGIN_ATTEMPT' | 'DATA_EXPORT' | 'PERMISSION_DENIED';

export const logSecurityEvent = (
  event: SecurityEventType,
  userId: string,
  details: Record<string, any>
) => {
  // Log to Supabase
  supabase.from<any>('security_logs').insert({
    event_type: event,
    user_id: userId,
    details,
    timestamp: new Date().toISOString(),
  });
};
