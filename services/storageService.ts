/**
 * IndexedDB Storage Service
 * Replaces localStorage with IndexedDB for better performance and larger storage
 */

import { logger } from './logger';
import type { Project, HistoryState } from '../types';

const DB_NAME = 'kreathief_db';
const DB_VERSION = 1;

interface ProjectVersion {
    id: string;
    projectId: string;
    state: HistoryState;
    timestamp: number;
    thumbnail?: string;
}

class StorageService {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    async init(): Promise<void> {
        if (this.db) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                logger.error('Failed to open IndexedDB', { error: request.error });
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                logger.info('IndexedDB initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Projects store
                if (!db.objectStoreNames.contains('projects')) {
                    const projectsStore = db.createObjectStore('projects', { keyPath: 'id' });
                    projectsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                }

                // Version history store
                if (!db.objectStoreNames.contains('versions')) {
                    const versionsStore = db.createObjectStore('versions', { keyPath: 'id' });
                    versionsStore.createIndex('projectId', 'projectId', { unique: false });
                    versionsStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                logger.info('IndexedDB schema created');
            };
        });

        return this.initPromise;
    }

    private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
        await this.init();
        const transaction = this.db!.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }

    // ===== Projects =====

    async saveProject(project: Project): Promise<void> {
        const store = await this.getStore('projects', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put(project);
            request.onsuccess = () => {
                logger.debug('Project saved', { id: project.id });
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getProject(id: string): Promise<Project | undefined> {
        const store = await this.getStore('projects');
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllProjects(): Promise<Project[]> {
        const store = await this.getStore('projects');
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteProject(id: string): Promise<void> {
        const store = await this.getStore('projects', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => {
                logger.debug('Project deleted', { id });
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ===== Version History =====

    async saveVersion(projectId: string, state: HistoryState, thumbnail?: string): Promise<string> {
        const store = await this.getStore('versions', 'readwrite');
        const version: ProjectVersion = {
            id: `${projectId}_${Date.now()}`,
            projectId,
            state,
            timestamp: Date.now(),
            thumbnail,
        };

        return new Promise((resolve, reject) => {
            const request = store.put(version);
            request.onsuccess = () => {
                logger.debug('Version saved', { projectId, versionId: version.id });
                resolve(version.id);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getVersions(projectId: string, limit = 20): Promise<ProjectVersion[]> {
        const store = await this.getStore('versions');
        const index = store.index('projectId');

        return new Promise((resolve, reject) => {
            const versions: ProjectVersion[] = [];
            const request = index.openCursor(IDBKeyRange.only(projectId), 'prev');

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor && versions.length < limit) {
                    versions.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(versions);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getVersion(versionId: string): Promise<ProjectVersion | undefined> {
        const store = await this.getStore('versions');
        return new Promise((resolve, reject) => {
            const request = store.get(versionId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async cleanOldVersions(projectId: string, keepCount = 20): Promise<void> {
        const versions = await this.getVersions(projectId, 100);
        if (versions.length <= keepCount) return;

        const store = await this.getStore('versions', 'readwrite');
        const toDelete = versions.slice(keepCount);

        for (const version of toDelete) {
            store.delete(version.id);
        }

        logger.debug('Cleaned old versions', { projectId, deleted: toDelete.length });
    }

    // ===== Settings =====

    async getSetting<T>(key: string, defaultValue: T): Promise<T> {
        const store = await this.getStore('settings');
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => {
                resolve(request.result?.value ?? defaultValue);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async setSetting<T>(key: string, value: T): Promise<void> {
        const store = await this.getStore('settings', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put({ key, value });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ===== Migration from localStorage =====

    async migrateFromLocalStorage(): Promise<void> {
        try {
            const projectsStr = localStorage.getItem('kreathief_projects');
            if (!projectsStr) return;

            const projects: Project[] = JSON.parse(projectsStr);
            logger.info('Migrating projects from localStorage', { count: projects.length });

            for (const project of projects) {
                await this.saveProject(project);
            }

            // Keep localStorage as backup for now
            // localStorage.removeItem('kreathief_projects');

            logger.info('Migration complete');
        } catch (error) {
            logger.error('Migration failed', { error });
        }
    }
}

// Singleton instance
export const storageService = new StorageService();

// Initialize on module load
if (typeof window !== 'undefined') {
    storageService.init().then(() => {
        storageService.migrateFromLocalStorage();
    });
}
