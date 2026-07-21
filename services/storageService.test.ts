import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService } from './storageService';
import { Project } from '../types';

vi.mock('../lib/supabase/client', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnValue({
      upsert: vi.fn(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }),
  };
  return {
    supabase: mockSupabase,
    db: mockSupabase,
  };
});

vi.mock('./authService', () => ({
  authService: {
    getSession: vi.fn(),
  },
}));

describe('StorageService', () => {
  const mockProject: Project = {
    id: 'test-project',
    name: 'Test Project',
    updatedAt: Date.now(),
    state: {
      layers: [],
      canvasBackgroundColor: '#ffffff',
      canvasFilters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        opacity: 1,
        vignette: 0,
        sepia: 0,
        grayscale: 0,
        hueRotate: 0,
      },
    },
  };

  beforeEach(async () => {
    // Clear IndexedDB before each test if possible
    // storageService handles its own init, so we just reset settings or relevant stores
  });

  it('should initialize IndexedDB', async () => {
    await expect(storageService.init()).resolves.toBeUndefined();
  });

  it('should save and retrieve a project', async () => {
    await storageService.saveProject(mockProject);
    const retrieved = await storageService.getProject(mockProject.id);
    expect(retrieved).toEqual(mockProject);
  });

  it('should delete a project', async () => {
    await storageService.saveProject(mockProject);
    await storageService.deleteProject(mockProject.id);
    // getProject will fallback to IndexedDB if it doesn't find it in supabase when online
    // and wait for sync queue
    const retrieved = await storageService.getProject(mockProject.id);
    expect(retrieved).toBeUndefined();
  });

  it('should manage settings', async () => {
    const key = 'test-setting';
    const value = { some: 'data' };
    await storageService.setSetting(key, value);
    const retrieved = await storageService.getSetting(key, null);
    expect(retrieved).toEqual(value);
  });

  it('should return default value for missing settings', async () => {
    const retrieved = await storageService.getSetting('non-existent', 'default');
    expect(retrieved).toBe('default');
  });
});
