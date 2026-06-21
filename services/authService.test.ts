import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from './authService';
import { supabase } from '../lib/supabase/client';

// Mock Supabase client
vi.mock('../lib/supabase/client', () => {
  const mockClient = {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn().mockReturnThis(),
    }),
  };
  return {
    supabase: mockClient,
    db: mockClient,
  };
});

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('signIn', () => {
    it('should return user with valid credentials in QA bypass mode', async () => {
      // Set QA bypass mode
      const originalEnv = import.meta.env.MODE;
      // @ts-ignore -- testing env mutation
      import.meta.env.MODE = 'test';
      import.meta.env.VITE_QA_BYPASS = 'true';

      const result = await authService.signIn('test@example.com', 'password');

      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
      expect(result.user?.id).toBe('qa-user-id');
      expect(result.error).toBeNull();

      // Restore
      // @ts-ignore -- testing env mutation
      import.meta.env.MODE = originalEnv;
      import.meta.env.VITE_QA_BYPASS = undefined;
    });

    it('should authenticate with real Supabase when QA bypass disabled', async () => {
      // Disable QA bypass
      import.meta.env.VITE_QA_BYPASS = 'false';

      const mockUser = { id: 'real-user-id', email: 'user@example.com' };
      const mockProfile = { name: 'Test User', plan: 'free' as const };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from('').select('').eq('').single).mockResolvedValue({
        data: mockProfile,
        error: null,
      } as any);

      const result = await authService.signIn('user@example.com', 'Password123');

      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe('real-user-id');
      expect(result.error).toBeNull();
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Password123',
      });
    });

    it('should handle authentication errors gracefully', async () => {
      import.meta.env.VITE_QA_BYPASS = 'false';

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid credentials'),
      } as any);

      const result = await authService.signIn('wrong@email.com', 'wrongpass');

      expect(result.user).toBeNull();
      expect(result.error).toContain('Invalid credentials');
    });

    it('should handle network errors', async () => {
      import.meta.env.VITE_QA_BYPASS = 'false';

      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(new Error('Network error'));

      const result = await authService.signIn('test@example.com', 'password');

      expect(result.user).toBeNull();
      expect(result.error).toBe('An unexpected error occurred');
    });
  });

  describe('signUp', () => {
    it('should create new user with valid credentials', async () => {
      const mockUser = { id: 'new-user-id', email: 'newuser@example.com' };

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const result = await authService.signUp('newuser@example.com', 'SecurePass123', 'New User');

      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe('new-user-id');
      expect(result.error).toBeNull();
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'SecurePass123',
        options: { data: { name: 'New User' } },
      });
    });

    it('should handle signup errors', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null },
        error: new Error('Email already registered'),
      } as any);

      const result = await authService.signUp('existing@example.com', 'Password123', 'Test User');

      expect(result.user).toBeNull();
      expect(result.error).toContain('Email already registered');
    });
  });

  describe('getSession', () => {
    it('should return QA session when bypass active', async () => {
      import.meta.env.VITE_QA_BYPASS = 'true';
      localStorage.setItem(
        'kreathief_qa_session',
        JSON.stringify({
          id: 'qa-user-id',
          email: 'qa@test.com',
          name: 'QA User',
          plan: 'pro',
        })
      );

      const session = await authService.getSession();

      expect(session).toBeDefined();
      expect(session?.id).toBe('qa-user-id');
    });

    it('should return Supabase session when QA bypass disabled', async () => {
      import.meta.env.VITE_QA_BYPASS = 'false';

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'real-user-id', email: 'user@example.com' },
          },
        },
        error: null,
      } as any);

      const session = await authService.getSession();

      expect(session).toBeDefined();
      expect(session?.id).toBe('real-user-id');
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    it('should return null when no session exists', async () => {
      import.meta.env.VITE_QA_BYPASS = 'false';

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const session = await authService.getSession();

      expect(session).toBeNull();
    });
  });

  describe('signOut', () => {
    it('should clear both QA and Supabase sessions', async () => {
      localStorage.setItem('kreathief_qa_session', 'mock-data');

      await authService.signOut();

      expect(localStorage.getItem('kreathief_qa_session')).toBeNull();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('onAuthChange', () => {
    it('should return empty unsubscribe function in QA bypass mode', () => {
      // @ts-ignore -- testing env mutation
      import.meta.env.MODE = 'test';
      import.meta.env.VITE_QA_BYPASS = 'true';

      const unsubscribe = authService.onAuthChange(vi.fn());

      expect(unsubscribe).toBeInstanceOf(Function);
      expect(unsubscribe()).toBeUndefined();
    });

    it('should setup Supabase listener when QA bypass disabled', () => {
      import.meta.env.VITE_QA_BYPASS = 'false';

      const mockUnsubscribe = vi.fn();
      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe,
          },
        },
      } as any);

      const callback = vi.fn();
      const unsubscribe = authService.onAuthChange(callback);

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
      expect(unsubscribe).toBeInstanceOf(Function);

      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
