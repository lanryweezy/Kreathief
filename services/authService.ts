import { supabase } from '../lib/supabase/client';
import type { User } from '../types';
import type { Profile } from '../lib/supabase/types';
import { logger } from './logger';

export interface AuthResult {
  user: User | null;
  error: string | null;
}

export class AuthService {
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

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileInsert);

      if (profileError) {
        logger.error('Failed to create profile', { error: profileError.message });
      }

      const user: User = {
        id: data.user.id,
        email,
        name,
        plan: 'free',
      };

      return { user, error: null };
    } catch (err) {
      logger.error('Sign up error', { error: err });
      return { user: null, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error('Sign in failed', { error: error.message });
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'No user returned' };
      }

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single() as any;

      const user: User = {
        id: data.user.id,
        email: data.user.email || email,
        name: (profile as Profile)?.name || data.user.email?.split('@')[0] || 'User',
        plan: ((profile as Profile)?.plan || 'free') as User['plan'],
      };

      return { user, error: null };
    } catch (err) {
      logger.error('Sign in error', { error: err });
      return { user: null, error: 'An unexpected error occurred' };
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
        return { user: null, error: error.message };
      }

      // User will be redirected to Google
      return { user: null, error: null };
    } catch (err) {
      logger.error('Google sign in error', { error: err });
      return { user: null, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      logger.info('User signed out');
    } catch (err) {
      logger.error('Sign out error', { error: err });
    }
  }

  /**
   * Get current user session
   */
  async getSession(): Promise<User | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        return null;
      }

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single() as any;

      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
        name: (profile as Profile)?.name || session.user.email?.split('@')[0] || 'User',
        plan: ((profile as Profile)?.plan || 'free') as User['plan'],
      };

      return user;
    } catch (err) {
      logger.error('Get session error', { error: err });
      return null;
    }
  }

  /**
   * Listen for auth changes
   */
  onAuthChange(callback: (user: User | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single() as any;

        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: (profile as Profile)?.name || session.user.email?.split('@')[0] || 'User',
          plan: ((profile as Profile)?.plan || 'free') as User['plan'],
        };
        callback(user);
      } else {
        callback(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<Profile>): Promise<{ error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { error: 'Not authenticated' };
      }

      const { error } = await (supabase as any)
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        logger.error('Profile update failed', { error: error.message });
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      logger.error('Profile update error', { error: err });
      return { error: 'An unexpected error occurred' };
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
      return { error: 'An unexpected error occurred' };
    }
  }
}

export const authService = new AuthService();
