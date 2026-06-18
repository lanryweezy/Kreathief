import { supabase } from '../lib/supabase/client';

export type SecurityEventType = 'LOGIN_ATTEMPT' | 'DATA_EXPORT' | 'PERMISSION_DENIED';

export const logSecurityEvent = (
  event: SecurityEventType,
  userId: string,
  details: Record<string, any>
) => {
  supabase.from('security_logs' as any).insert({
    event_type: event,
    user_id: userId,
    details,
    timestamp: new Date().toISOString(),
  } as any);
};
