import { db as supabase } from '../lib/supabase/client';
import type { User } from '../types';
import type { Profile } from '../lib/supabase/types';
import { logger } from './logger';
import { log } from '../utils/log';
import { logSecurityEvent } from '../utils/securityLogger';
import { analyticsService } from './analyticsService';
import { getErrorDetails } from '../utils/errorMessages';

export interface AuthResult {
  user: User | null;
  error: string | null;
}

export class AuthService {
  private authListener: (() => void) | null = null;

  /**
   * Initialize auth state listener
   * Call this once in your main app (App.tsx)
   */
  initAuthListener(onAuthChange: (user: User | null) => void): () => void {
    if (this.authListener) {
      return this.authListener;
    }

    // Listen to Supabase auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      log.info('[AuthService] Auth state changed', { event, hasSession: !!session });

      if (session?.user) {
        // Fetch profile from Supabase
        this.fetchProfile(session.user.id)
          .then((profile) => {
            const user: User = {
              id: session.user.id,
              email: session.user.email || '',
              name:
                profile?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              plan: profile?.plan || 'free',
              avatar:
                profile?.avatar ||
                session.user.user_metadata?.avatar_url ||
                session.user.user_metadata?.picture ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${session.user.id}`,
            };
            onAuthChange(user);
          })
          .catch((err) => {
            log.error('[AuthService] Failed to fetch profile', err);
            onAuthChange(null);
          });
      } else if (event === 'SIGNED_OUT') {
        onAuthChange(null);
      }
    });

    this.authListener = () => subscription.unsubscribe();
    return this.authListener;
  }

  /**
   * Helper to fetch user profile from Supabase
   */
  private async fetchProfile(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

      if (error) {
        log.debug('[AuthService] Profile not found, will be created on first save', { userId });
        return null;
      }

      return data;
    } catch (err) {
      log.error('[AuthService] Error fetching profile', err);
      return null;
    }
  }
  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, name: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        logger.error('Sign up failed', { error: error.message });
        analyticsService.track('auth_signup', { success: false, method: 'email', error: error.message });
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'No user returned' };
      }

      // Create profile
      const profileInsert: any = {
        id: data.user.id,
        email,
        name,
        plan: 'free',
      };

      const { error: profileError } = await supabase.from('profiles').insert(profileInsert);

      if (profileError) {
        logger.error('Failed to create profile', { error: profileError.message });
      }

      const user: User = {
        id: data.user.id,
        email,
        name,
        plan: 'free',
      };

      analyticsService.track('auth_signup', { success: true, method: 'email' });
      return { user, error: null };
    } catch (err) {
      logger.error('Sign up error', { error: err });
      analyticsService.track('auth_signup', {
        success: false,
        method: 'email',
        error: err instanceof Error ? err.message : String(err),
      });
      return { user: null, error: getErrorDetails(err).message };
    }
  }

  /**
   * Sign in with email and password
   *
   * DEVELOPMENT MODE: Uses QA bypass for testing
   * PRODUCTION MODE: Uses real Supabase authentication
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      // Check if we should use QA bypass (development only)
      const useQABypass = import.meta.env.DEV && import.meta.env.VITE_QA_BYPASS === 'true';

      if (useQABypass) {
        log.info('[AuthService] Using QA bypass for development', { email });
        const mockUser: User = {
          id: 'qa-user-id',
          email: email,
          name: email.split('@')[0],
          plan: 'pro',
        };
        localStorage.setItem('kreathief_qa_session', JSON.stringify(mockUser));
        return { user: mockUser, error: null };
      }

      // Use real Supabase authentication
      log.info('[AuthService] Attempting Supabase sign in', { email });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        log.error('[AuthService] Sign in failed', error, { email });
        logSecurityEvent('LOGIN_ATTEMPT', 'anonymous', { email, success: false, error: error.message });
        analyticsService.track('auth_signin', { success: false, method: 'email', error: error.message });
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'No user returned' };
      }

      // Fetch profile
      const profile = await this.fetchProfile(data.user.id);

      const user: User = {
        id: data.user.id,
        email: data.user.email || email,
        name: profile?.name || email.split('@')[0],
        plan: profile?.plan || 'free',
      };

      log.info('[AuthService] Sign in successful', { userId: user.id });
      logSecurityEvent('LOGIN_ATTEMPT', user.id, { email, success: true });
      analyticsService.track('auth_signin', { success: true, method: 'email' });
      return { user, error: null };
    } catch (err) {
      log.error('[AuthService] Sign in error', err);
      analyticsService.track('auth_signin', {
        success: false,
        method: 'email',
        error: err instanceof Error ? err.message : String(err),
      });
      return { user: null, error: getErrorDetails(err).message };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        logger.error('Google sign in failed', { error: error.message });
        analyticsService.track('auth_signin', { success: false, method: 'google', error: error.message });
        return { user: null, error: error.message };
      }

      // User will be redirected to Google
      analyticsService.track('auth_signin', { success: true, method: 'google' });
      return { user: null, error: null };
    } catch (err) {
      logger.error('Google sign in error', { error: err });
      analyticsService.track('auth_signin', {
        success: false,
        method: 'google',
        error: err instanceof Error ? err.message : String(err),
      });
      return { user: null, error: getErrorDetails(err).message };
    }
  }

  /**
   * Sign out and clear session
   */
  async signOut(): Promise<void> {
    try {
      // Clear QA bypass if exists
      localStorage.removeItem('kreathief_qa_session');
      localStorage.removeItem('kreathief_guest_session');

      // Sign out from Supabase
      await supabase.auth.signOut();

      log.info('[AuthService] User signed out');
      analyticsService.track('auth_signout', { success: true });
    } catch (err) {
      log.error('[AuthService] Sign out error', err);
      analyticsService.track('auth_signout', {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Get current user session
   * Checks both localStorage (QA bypass) and Supabase session
   */
  async getSession(): Promise<User | null> {
    try {
      // First check for QA bypass session — only honored in dev mode or while
      // the bypass flag is enabled, so a stale session never leaks into production.
      const useQABypass = import.meta.env.DEV || import.meta.env.VITE_QA_BYPASS === 'true';
      const savedUser = localStorage.getItem('kreathief_qa_session');
      if (savedUser) {
        if (useQABypass) {
          log.debug('[AuthService] Found QA bypass session');
          return JSON.parse(savedUser);
        }
        // Bypass disabled in production: purge the stale session
        localStorage.removeItem('kreathief_qa_session');
      }

      // Check for Guest session
      const guestSession = localStorage.getItem('kreathief_guest_session');
      if (guestSession) {
        log.debug('[AuthService] Found Guest session');
        return JSON.parse(guestSession);
      }

      // Check Supabase session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return null;
      }

      // Fetch profile
      const profile = await this.fetchProfile(session.user.id);

      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
        name: profile?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
        plan: profile?.plan || 'free',
        avatar:
          profile?.avatar ||
          session.user.user_metadata?.avatar_url ||
          session.user.user_metadata?.picture ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${session.user.id}`,
      };

      log.debug('[AuthService] Retrieved Supabase session', { userId: user.id });
      return user;
    } catch (err) {
      log.error('[AuthService] Error getting session', err);
      return null;
    }
  }

  /**
   * Listen for auth changes
   *
   * DEVELOPMENT: Returns empty function if using QA bypass
   * PRODUCTION: Listens to Supabase auth state changes
   */
  onAuthChange(callback: (user: User | null) => void): () => void {
    // Check if using QA bypass
    const useQABypass = import.meta.env.DEV && import.meta.env.VITE_QA_BYPASS === 'true';

    if (useQABypass) {
      log.debug('[AuthService] QA bypass active - syncing QA session');
      this.getSession().then((user) => {
        if (user) {
          callback(user);
        }
      });
      return () => {}; // Return empty unsubscribe function
    }

    // Use real Supabase auth listener
    return this.initAuthListener(callback);
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<Profile>): Promise<{ error: string | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { error: 'Not authenticated' };
      }

      const { error } = await (supabase as any).from('profiles').update(updates).eq('id', user.id);

      if (error) {
        logger.error('Profile update failed', { error: error.message });
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      logger.error('Profile update error', { error: err });
      return { error: getErrorDetails(err).message };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        logger.error('Password reset failed', { error: error.message });
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      logger.error('Password reset error', { error: err });
      return { error: getErrorDetails(err).message };
    }
  }
}

export const authService = new AuthService();
