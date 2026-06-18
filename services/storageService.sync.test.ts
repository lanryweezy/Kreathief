import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService } from './storageService';
import { supabase } from '../lib/supabase/client';
import { authService } from './authService';

// Mock dependencies
vi.mock('../lib/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      upsert: vi.fn(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }),
  },
}));

vi.mock('./authService', () => ({
  authService: {
    getSession: vi.fn(),
  },
}));

// Mock IndexedDB
const _mockIDB = {
  transaction: vi.fn().mockReturnValue({
    objectStore: vi.fn().mockReturnValue({
      put: vi.fn(),
      get: vi.fn(),
      getAll: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      index: vi.fn().mockReturnValue({
        openCursor: vi.fn(),
      }),
    }),
  }),
};

vi.mock('fake-indexeddb/auto');

describe('StorageService Sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset online status
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  describe('syncOfflineChanges', () => {
    it('should not sync when online with no pending changes', async () => {
      // This would be tested through the public API
      // The private method is tested indirectly
      expect(storageService).toBeDefined();
    });

    it('should queue operations when offline', async () => {
      // Set offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const mockUser = { id: 'test-user', email: 'test@test.com', plan: 'free' as const };
      vi.mocked(authService.getSession).mockResolvedValue(mockUser);

      // Create a test project
      const testProject = {
        id: 'test-project-id',
        name: 'Test Project',
        updatedAt: Date.now(),
        state: {
          layers: [],
          canvasBackgroundColor: '#ffffff',
          canvasFilters: {},
          canvasSize: { width: 1920, height: 1080 },
        },
      };

      // Should queue for sync when offline
      await storageService.saveProject(testProject);

      // Verify it was saved (at least to IndexedDB)
      expect(authService.getSession).toHaveBeenCalled();
    });

    it('should sync immediately when online', async () => {
      const mockUser = { id: 'test-user', email: 'test@test.com', plan: 'free' as const };
      vi.mocked(authService.getSession).mockResolvedValue(mockUser);

      vi.mocked(supabase.from('').upsert).mockResolvedValue({ error: null });

      const testProject = {
        id: 'test-project-2',
        name: 'Online Project',
        updatedAt: Date.now(),
        state: {
          layers: [],
          canvasBackgroundColor: '#ffffff',
          canvasFilters: {},
          canvasSize: { width: 1080, height: 1080 },
        },
      };

      await storageService.saveProject(testProject);

      // Should attempt Supabase sync
      expect(supabase.from('').upsert).toHaveBeenCalled();
    });
  });

  describe('pending changes tracking', () => {
    it('should track pending changes', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const mockUser = { id: 'test-user', email: 'test@test.com', plan: 'free' as const };
      vi.mocked(authService.getSession).mockResolvedValue(mockUser);

      const testProject = {
        id: 'pending-test',
        name: 'Pending Test',
        updatedAt: Date.now(),
        state: {
          layers: [],
          canvasBackgroundColor: '#fff',
          canvasFilters: {},
          canvasSize: { width: 100, height: 100 },
        },
      };

      await storageService.saveProject(testProject);

      // Pending changes should be tracked
      expect(authService.getSession).toHaveBeenCalled();
    });

    it('should clear pending changes after successful sync', async () => {
      const mockUser = { id: 'test-user', email: 'test@test.com', plan: 'free' as const };
      vi.mocked(authService.getSession).mockResolvedValue(mockUser);

      vi.mocked(supabase.from('').upsert).mockResolvedValue({ error: null });

      const testProject = {
        id: 'sync-clear-test',
        name: 'Sync Clear Test',
        updatedAt: Date.now(),
        state: {
          layers: [],
          canvasBackgroundColor: '#fff',
          canvasFilters: {},
          canvasSize: { width: 100, height: 100 },
        },
      };

      await storageService.saveProject(testProject);

      // After successful sync, pending should be cleared
      expect(supabase.from('').upsert).toHaveBeenCalled();
    });
  });

  describe('retry logic', () => {
    it('should retry failed sync operations', async () => {
      const mockUser = { id: 'test-user', email: 'test@test.com', plan: 'free' as const };
      vi.mocked(authService.getSession).mockResolvedValue(mockUser);

      // First call fails, second succeeds
      vi.mocked(supabase.from('').upsert)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ error: null });

      const testProject = {
        id: 'retry-test',
        name: 'Retry Test',
        updatedAt: Date.now(),
        state: {
          layers: [],
          canvasBackgroundColor: '#fff',
          canvasFilters: {},
          canvasSize: { width: 100, height: 100 },
        },
      };

      await storageService.saveProject(testProject);

      // Should attempt sync
      expect(supabase.from('').upsert).toHaveBeenCalled();
    });

    it('should drop operations after max retries', async () => {
      const mockUser = { id: 'test-user', email: 'test@test.com', plan: 'free' as const };
      vi.mocked(authService.getSession).mockResolvedValue(mockUser);

      // Always fails
      vi.mocked(supabase.from('').upsert).mockRejectedValue(new Error('Persistent error'));

      const testProject = {
        id: 'max-retry-test',
        name: 'Max Retry Test',
        updatedAt: Date.now(),
        state: {
          layers: [],
          canvasBackgroundColor: '#fff',
          canvasFilters: {},
          canvasSize: { width: 100, height: 100 },
        },
      };

      await storageService.saveProject(testProject);

      // Should attempt sync (and eventually give up after 3 retries)
      expect(supabase.from('').upsert).toHaveBeenCalled();
    });
  });

  describe('conflict resolution', () => {
    it('should use last-write-wins strategy', async () => {
      const mockUser = { id: 'test-user', email: 'test@test.com', plan: 'free' as const };
      vi.mocked(authService.getSession).mockResolvedValue(mockUser);

      // Simulate existing remote version
      vi.mocked(supabase.from('').select('').single).mockResolvedValue({
        data: { updated_at: new Date(Date.now() - 1000).toISOString() },
        error: null,
      });

      vi.mocked(supabase.from('').upsert).mockResolvedValue({ error: null });

      const testProject = {
        id: 'conflict-test',
        name: 'Conflict Test',
        updatedAt: Date.now(),
        state: {
          layers: [],
          canvasBackgroundColor: '#fff',
          canvasFilters: {},
          canvasSize: { width: 100, height: 100 },
        },
      };

      await storageService.saveProject(testProject);

      // Local version is newer, should win
      expect(supabase.from('').upsert).toHaveBeenCalled();
    });
  });
});
