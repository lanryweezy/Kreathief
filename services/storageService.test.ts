import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService } from './storageService';
import { Project } from '../types';

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
                grayscale: 0
            }
        }
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
