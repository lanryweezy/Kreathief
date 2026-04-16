/**
 * Hybrid Storage Service
 * Uses Supabase for cloud storage with IndexedDB as offline fallback
 */

import { logger } from './logger';
import { log } from '../utils/log';
import type { Project, HistoryState } from '../types';
import { supabase } from '../lib/supabase/client';
import { authService } from './authService';
import { storage as storageConfig } from '../config';

const DB_NAME = storageConfig.indexedDB.name;
const DB_VERSION = storageConfig.indexedDB.version;

interface ProjectVersion {
  id: string;
  projectId: string;
  state: HistoryState;
  timestamp: number;
  thumbnail?: string;
}

interface ShareMapping {
  id: string;
  projectId: string;
  createdAt: number;
}

interface DesignComment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: number;
  position?: any;
  layerId?: string;
  parentId?: string;
  resolved?: boolean;
}

interface DesignSnapshot {
  id: string;
  projectId: string;
  name: string;
  timestamp: number;
  state: HistoryState;
  thumbnail?: string;
}

interface PendingSyncOperation {
  id: string;
  projectId: string;
  operation: 'create' | 'update' | 'delete';
  timestamp: number;
  retryCount: number;
}

class StorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private isOnline = navigator.onLine;
  private pendingChanges = new Map<string, PendingSyncOperation>();
  private isSyncing = false;

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      logger.info('Storage service: online');
      this.syncOfflineChanges();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.info('Storage service: offline');
    });
    
    // Load pending changes on initialization
    this.loadPendingChanges();
  }

  private async getUserId(): Promise<string | null> {
    const user = await authService.getSession();
    return user?.id || null;
  }

  /**
   * Load pending changes from IndexedDB on startup
   */
  private async loadPendingChanges(): Promise<void> {
    try {
      const store = await this.getStore('sync_queue', 'readonly');
      const allOperations = await this.getAllFromStore(store);
      
      this.pendingChanges.clear();
      for (const op of allOperations) {
        this.pendingChanges.set(op.projectId, op);
      }
      
      log.debug('[Storage] Loaded pending changes', { count: this.pendingChanges.size });
      
      // Auto-sync if online and has pending changes
      if (this.isOnline && this.pendingChanges.size > 0) {
        setTimeout(() => this.syncOfflineChanges(), 1000);
      }
    } catch (err) {
      log.debug('[Storage] No pending changes to load', { error: err instanceof Error ? err.message : String(err) });
    }
  }

  /**
   * Sync offline changes to Supabase when back online
   */
  private async syncOfflineChanges(): Promise<void> {
    if (!this.isOnline || this.isSyncing || this.pendingChanges.size === 0) {
      return;
    }

    this.isSyncing = true;
    const operationsToSync = Array.from(this.pendingChanges.values());
    
    log.info('[Storage] Starting sync', { 
      count: operationsToSync.length,
      isOnline: this.isOnline 
    });

    let successCount = 0;
    let failCount = 0;

    for (const op of operationsToSync) {
      try {
        const userId = await this.getUserId();
        if (!userId) {
          log.warn('[Storage] No user ID, skipping sync', { projectId: op.projectId });
          this.pendingChanges.delete(op.projectId);
          continue;
        }

        switch (op.operation) {
          case 'delete':
            await this.syncDeleteToSupabase(op.projectId, userId);
            break;
          case 'create':
          case 'update':
            await this.syncUpdateToSupabase(op.projectId, userId);
            break;
        }

        this.pendingChanges.delete(op.projectId);
        successCount++;
        log.debug('[Storage] Synced operation', { 
          projectId: op.projectId, 
          operation: op.operation 
        });
      } catch (err) {
        failCount++;
        const baseDelay = 2000;
        const retryDelay = baseDelay * Math.pow(2, op.retryCount);

        log.error('[Storage] Sync failed, retrying later', err, { 
          projectId: op.projectId,
          retryCount: op.retryCount,
          nextRetryIn: `${retryDelay}ms`
        });

        if (op.retryCount < 5) {
          op.retryCount++;
          this.pendingChanges.set(op.projectId, op);
          setTimeout(() => {
            if (this.isOnline && !this.isSyncing) {this.syncOfflineChanges();}
          }, retryDelay);
        } else {
          this.pendingChanges.delete(op.projectId);
        }
      }
    }

    // Persist updated queue
    await this.persistPendingChanges();

    this.isSyncing = false;
    log.info('[Storage] Sync complete', { 
      total: operationsToSync.length,
      success: successCount,
      failed: failCount,
      remaining: this.pendingChanges.size 
    });

    // Schedule retry for any remaining failed operations
    if (this.pendingChanges.size > 0 && this.isOnline) {
      const retryDelay = 5000; // 5 seconds
      setTimeout(() => {
        this.syncOfflineChanges();
      }, retryDelay);
    }
  }

  /**
   * Sync a project update to Supabase
   */
  private async syncUpdateToSupabase(projectId: string, userId: string): Promise<void> {
    const project = await this.getProjectFromIndexedDB(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const state = project.state as any;
    
    const { error } = await supabase
      .from('projects')
      .upsert({
        id: project.id,
        user_id: userId,
        name: project.name,
        state: state,
        canvas_size: state.canvasSize || null,
        background_color: state.canvasBackgroundColor || '#ffffff',
        canvas_filters: state.canvasFilters || null,
        updated_at: new Date(project.updatedAt).toISOString(),
        is_public: false,
      } as any, { onConflict: 'id' });

    if (error) {
      throw new Error(`Supabase upsert failed: ${error.message}`);
    }

    log.debug('[Storage] Project synced to Supabase', { id: project.id });
  }

  /**
   * Sync a project deletion to Supabase
   */
  private async syncDeleteToSupabase(projectId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }

    log.debug('[Storage] Project deletion synced', { id: projectId });
  }

  /**
   * Persist pending changes to IndexedDB
   */
  private async persistPendingChanges(): Promise<void> {
    try {
      const store = await this.getStore('sync_queue', 'readwrite');
      
      // Clear existing queue
      await this.clearStore(store);
      
      // Add all pending operations
      for (const op of this.pendingChanges.values()) {
        await this.addToStore(store, op);
      }
      
      log.debug('[Storage] Pending changes persisted', { 
        count: this.pendingChanges.size 
      });
    } catch (err) {
      log.error('[Storage] Failed to persist pending changes', err);
    }
  }

  /**
   * Queue a sync operation
   */
  private async queueSyncOperation(
    projectId: string,
    operation: 'create' | 'update' | 'delete'
  ): Promise<void> {
    const syncOp: PendingSyncOperation = {
      id: `${projectId}_${Date.now()}`,
      projectId,
      operation,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.pendingChanges.set(projectId, syncOp);
    await this.persistPendingChanges();

    log.debug('[Storage] Sync operation queued', { 
      projectId, 
      operation,
      totalPending: this.pendingChanges.size 
    });

    // Attempt immediate sync if online
    if (this.isOnline && !this.isSyncing) {
      setTimeout(() => this.syncOfflineChanges(), 100);
    }
  }

  async init(): Promise<void> {
    if (this.db) {return;}
    if (this.initPromise) {return this.initPromise;}

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

        if (!db.objectStoreNames.contains('projects')) {
          const projectsStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('versions')) {
          const versionsStore = db.createObjectStore('versions', { keyPath: 'id' });
          versionsStore.createIndex('projectId', 'projectId', { unique: false });
          versionsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('shares')) {
          const sharesStore = db.createObjectStore('shares', { keyPath: 'id' });
          sharesStore.createIndex('projectId', 'projectId', { unique: false });
        }

        if (!db.objectStoreNames.contains('snapshots')) {
          const snapshotsStore = db.createObjectStore('snapshots', { keyPath: 'id' });
          snapshotsStore.createIndex('projectId', 'projectId', { unique: false });
          snapshotsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('comments')) {
          const commentsStore = db.createObjectStore('comments', { keyPath: 'id' });
          commentsStore.createIndex('projectId', 'projectId', { unique: false });
        }

        // Crash Recovery Mirror
        if (!db.objectStoreNames.contains('session_mirror')) {
          db.createObjectStore('session_mirror', { keyPath: 'key' });
        }

        // Sync queue for offline changes
        if (!db.objectStoreNames.contains('sync_queue')) {
          const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          queueStore.createIndex('projectId', 'projectId', { unique: false });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('status', 'status', { unique: false });
        }

        logger.info('IndexedDB schema updated');
      };
    });

    return this.initPromise;
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    await this.init();
    const transaction = this.db!.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  /**
   * Helper to get all items from a store
   */
  private async getAllFromStore(store: IDBObjectStore): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Helper to add item to store
   */
  private async addToStore(store: IDBObjectStore, item: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Helper to clear a store
   */
  private async clearStore(store: IDBObjectStore): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get project from IndexedDB (helper for sync)
   */
  private async getProjectFromIndexedDB(projectId: string): Promise<Project | undefined> {
    const store = await this.getStore('projects', 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.get(projectId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ===== Projects =====

  async saveProject(project: Project): Promise<void> {
    const userId = await this.getUserId();

    // Enforce storage quotas (Free Tier Limit: maximum 10 projects)
    const MAX_FREE_PROJECTS = 10;
    const existingProjects = await this.getAllProjects();
    const isNewProject = !existingProjects.some(p => p.id === project.id);
    
    if (isNewProject && existingProjects.length >= MAX_FREE_PROJECTS) {
      const errorMsg = `Storage quota exceeded. You are limited to ${MAX_FREE_PROJECTS} projects on the free plan.`;
      logger.error('Quota exceeded', { error: errorMsg });
      throw new Error(errorMsg);
    }

    if (this.isOnline && userId) {
      try {
        const { error } = await supabase
          .from('projects')
          .upsert({
            id: project.id,
            user_id: userId,
            name: project.name,
            state: project.state as any,
            canvas_size: (project.state as any).canvasSize,
            background_color: (project.state as any).canvasBackgroundColor,
            canvas_filters: (project.state as any).canvasFilters,
            updated_at: new Date(project.updatedAt).toISOString(),
            is_public: false,
          } as any, { onConflict: 'id' });

        if (!error) {
          logger.debug('Project saved to Supabase', { id: project.id });
          // Remove from pending changes if synced successfully
          this.pendingChanges.delete(project.id);
          await this.persistPendingChanges();
          return;
        }
        logger.warn('Supabase save failed, falling back to IndexedDB', { error: error.message });
      } catch (err) {
        logger.warn('Supabase error, using IndexedDB', { error: err });
      }
    }

    // Offline or error - save locally and queue for sync
    await this.saveProjectIndexedDB(project);
    await this.queueSyncOperation(project.id, 'update');
  }

  private async saveProjectIndexedDB(project: Project): Promise<void> {
    const store = await this.getStore('projects', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(project);
      request.onsuccess = () => {
        logger.debug('Project saved to IndexedDB', { id: project.id });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getProject(id: string): Promise<Project | undefined> {
    const userId = await this.getUserId();

    if (this.isOnline && userId) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          return this.supabaseProjectToLocal(data);
        }
      } catch (err) {
        logger.warn('Supabase error, using IndexedDB', { error: err });
      }
    }

    const store = await this.getStore('projects');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllProjects(): Promise<Project[]> {
    const userId = await this.getUserId();

    if (this.isOnline && userId) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (!error && data) {
          return data.map(p => this.supabaseProjectToLocal(p));
        }
      } catch (err) {
        logger.warn('Supabase error, using IndexedDB', { error: err });
      }
    }

    const store = await this.getStore('projects');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const projects = request.result || [];
        resolve(projects.sort((a: Project, b: Project) => b.updatedAt - a.updatedAt));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProject(id: string): Promise<void> {
    const userId = await this.getUserId();

    if (this.isOnline && userId) {
      try {
        await supabase
          .from('projects')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        logger.debug('Project deleted from Supabase', { id });
        // Remove from pending changes
        this.pendingChanges.delete(id);
        await this.persistPendingChanges();
        return;
      } catch (err) {
        logger.warn('Supabase delete error', { error: err });
      }
    }

    // Offline or error - delete locally and queue for sync
    const store = await this.getStore('projects', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        logger.debug('Project deleted from IndexedDB', { id });
        this.queueSyncOperation(id, 'delete').then(resolve).catch(reject);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private supabaseProjectToLocal(dbProject: any): Project {
    const project: Project = {
      id: dbProject.id,
      name: dbProject.name,
      updatedAt: new Date(dbProject.updated_at).getTime(),
      state: {
        artboards: dbProject.state?.artboards || [],
        canvasBackgroundColor: dbProject.background_color || '#ffffff',
        canvasFilters: dbProject.canvas_filters || {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          sepia: 0,
          grayscale: 0,
          blur: 0,
          opacity: 1,
          vignette: 0,
          hueRotate: 0,
        },
        canvasSize: dbProject.canvas_size || { width: 1080, height: 1080, name: 'Square (IG Post)' },
        brandKits: dbProject.state?.brandKits || [],
        showGrid: dbProject.state?.showGrid || false,
        showRulers: dbProject.state?.showRulers || false,
      },
    };

    if (dbProject.thumbnail_url) {
      project.thumbnail = dbProject.thumbnail_url;
    }

    return project;
  }

  // ===== Version History =====

  async saveVersion(projectId: string, state: HistoryState, thumbnail?: string): Promise<string> {
    const userId = await this.getUserId();
    const versionId = `${projectId}_${Date.now()}`;

    if (this.isOnline && userId) {
      try {
        const { error } = await supabase
          .from('project_versions')
          .insert({
            id: versionId,
            project_id: projectId,
            user_id: userId,
            state: state as any,
            thumbnail_url: thumbnail,
            created_at: new Date().toISOString(),
          } as any);

        if (!error) {
          logger.debug('Version saved to Supabase', { projectId, versionId });
          return versionId;
        }
      } catch (err) {
        logger.warn('Supabase version save error', { error: err });
      }
    }

    const store = await this.getStore('versions', 'readwrite');
    const version: ProjectVersion = {
      id: versionId,
      projectId,
      state,
      timestamp: Date.now(),
      thumbnail,
    };

    return new Promise((resolve, reject) => {
      const request = store.put(version);
      request.onsuccess = () => {
        logger.debug('Version saved to IndexedDB', { projectId, versionId });
        resolve(versionId);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getVersions(projectId: string, limit = 20): Promise<ProjectVersion[]> {
    const userId = await this.getUserId();

    if (this.isOnline && userId) {
      try {
        const { data, error } = await supabase
          .from('project_versions')
          .select('*')
          .eq('project_id', projectId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data) {
          return data.map((v: any) => ({
            id: v.id,
            projectId: v.project_id,
            state: v.state as HistoryState,
            timestamp: new Date(v.created_at).getTime(),
            thumbnail: v.thumbnail_url || undefined,
          }));
        }
      } catch (err) {
        logger.warn('Supabase error, using IndexedDB', { error: err });
      }
    }

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
    if (this.isOnline) {
      try {
        const { data, error } = await supabase
          .from('project_versions')
          .select('*')
          .eq('id', versionId)
          .single() as any;

        if (!error && data) {
          return {
            id: (data as any).id,
            projectId: (data as any).project_id,
            state: (data as any).state as HistoryState,
            timestamp: new Date((data as any).created_at).getTime(),
            thumbnail: (data as any).thumbnail_url || undefined,
          };
        }
      } catch (err) {
        logger.warn('Supabase error, using IndexedDB', { error: err });
      }
    }

    const store = await this.getStore('versions');
    return new Promise((resolve, reject) => {
      const request = store.get(versionId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async cleanOldVersions(projectId: string, keepCount = 20): Promise<void> {
    const versions = await this.getVersions(projectId, 100);
    if (versions.length <= keepCount) {return;}

    const toDelete = versions.slice(keepCount);

    if (this.isOnline) {
      try {
        const userId = await this.getUserId();
        if (userId) {
          for (const version of toDelete) {
            await supabase
              .from('project_versions')
              .delete()
              .eq('id', version.id)
              .eq('user_id', userId);
          }
        }
      } catch (err) {
        logger.warn('Supabase clean error', { error: err });
      }
    }

    const store = await this.getStore('versions', 'readwrite');
    for (const version of toDelete) {
      store.delete(version.id);
    }

    logger.debug('Cleaned old versions', { projectId, deleted: toDelete.length });
  }

  // ===== Snapshots =====

  async saveSnapshot(snapshot: DesignSnapshot): Promise<void> {
    const userId = await this.getUserId();

    if (this.isOnline && userId) {
      try {
        const { error } = await supabase
          .from('project_snapshots')
          .insert({
            id: snapshot.id,
            project_id: snapshot.projectId,
            user_id: userId,
            name: snapshot.name,
            state: snapshot.state as any,
            thumbnail_url: snapshot.thumbnail,
            created_at: new Date(snapshot.timestamp).toISOString(),
          } as any);

        if (!error) {
          logger.debug('Snapshot saved to Supabase', { id: snapshot.id, name: snapshot.name });
          return;
        }
      } catch (err) {
        logger.warn('Supabase snapshot save error', { error: err });
      }
    }

    const store = await this.getStore('snapshots', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(snapshot);
      request.onsuccess = () => {
        logger.debug('Snapshot saved to IndexedDB', { id: snapshot.id, name: snapshot.name });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getSnapshots(projectId: string): Promise<DesignSnapshot[]> {
    const userId = await this.getUserId();

    if (this.isOnline && userId) {
      try {
        const { data, error } = await supabase
          .from('project_snapshots')
          .select('*')
          .eq('project_id', projectId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((s: any) => ({
            id: s.id,
            projectId: s.project_id,
            name: s.name,
            timestamp: new Date(s.created_at).getTime(),
            state: s.state as HistoryState,
            thumbnail: s.thumbnail_url || undefined,
          }));
        }
      } catch (err) {
        logger.warn('Supabase error, using IndexedDB', { error: err });
      }
    }

    const store = await this.getStore('snapshots');
    const index = store.index('projectId');

    return new Promise((resolve, reject) => {
      const snapshots: DesignSnapshot[] = [];
      const request = index.openCursor(IDBKeyRange.only(projectId), 'prev');

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          snapshots.push(cursor.value);
          cursor.continue();
        } else {
          resolve(snapshots);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    const userId = await this.getUserId();

    if (this.isOnline && userId) {
      try {
        await supabase
          .from('project_snapshots')
          .delete()
          .eq('id', snapshotId)
          .eq('user_id', userId);
        logger.debug('Snapshot deleted from Supabase', { id: snapshotId });
      } catch (err) {
        logger.warn('Supabase snapshot delete error', { error: err });
      }
    }

    const store = await this.getStore('snapshots', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(snapshotId);
      request.onsuccess = () => {
        logger.debug('Snapshot deleted from IndexedDB', { id: snapshotId });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ===== Comments =====

  async saveComment(comment: DesignComment): Promise<void> {
    const userId = await this.getUserId();

    if (this.isOnline && userId) {
      try {
        const { error } = await supabase
          .from('comments')
          .insert({
            id: comment.id,
            project_id: comment.projectId,
            user_id: userId,
            user_name: comment.userName,
            user_avatar_url: comment.userAvatar,
            text: comment.text,
            position: comment.position as any,
            layer_id: comment.layerId,
            created_at: new Date(comment.timestamp).toISOString(),
            updated_at: new Date(comment.timestamp).toISOString(),
            parent_id: comment.parentId,
            resolved: false,
          } as any);

        if (!error) {
          logger.debug('Comment saved to Supabase', { id: comment.id });
          return;
        }
      } catch (err) {
        logger.warn('Supabase comment save error', { error: err });
      }
    }

    const store = await this.getStore('comments', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(comment);
      request.onsuccess = () => {
        logger.debug('Comment saved to IndexedDB', { id: comment.id });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getComments(projectId: string): Promise<DesignComment[]> {
    const userId = await this.getUserId();

    if (this.isOnline && userId) {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((c: any) => ({
            id: c.id,
            projectId: c.project_id,
            userId: c.user_id,
            userName: c.user_name,
            userAvatar: c.user_avatar_url || undefined,
            text: c.text,
            position: c.position as any,
            layerId: c.layer_id,
            timestamp: new Date(c.created_at).getTime(),
            parentId: c.parent_id,
            resolved: c.resolved,
          }));
        }
      } catch (err) {
        logger.warn('Supabase error, using IndexedDB', { error: err });
      }
    }

    const store = await this.getStore('comments');
    const index = store.index('projectId');

    return new Promise((resolve, reject) => {
      const comments: DesignComment[] = [];
      const request = index.openCursor(IDBKeyRange.only(projectId));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          comments.push(cursor.value);
          cursor.continue();
        } else {
          resolve(comments);
        }
      };
      request.onerror = () => reject(request.error);
    });
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

  // ===== Session Mirror (Crash Recovery) =====

  async saveSessionMirror(projectId: string, state: HistoryState): Promise<void> {
    const store = await this.getStore('session_mirror', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({ key: 'last_active_session', projectId, state, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSessionMirror(): Promise<{ projectId: string; state: HistoryState; timestamp: number } | null> {
    try {
      const store = await this.getStore('session_mirror', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.get('last_active_session');
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  async clearSessionMirror(): Promise<void> {
    const store = await this.getStore('session_mirror', 'readwrite');
    await this.clearStore(store);
  }

  // ===== Shares =====

  async saveShare(share: ShareMapping): Promise<void> {
    const store = await this.getStore('shares', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(share);
      request.onsuccess = () => {
        logger.debug('Share saved', { id: share.id });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getShare(id: string): Promise<ShareMapping | undefined> {
    const store = await this.getStore('shares');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getShareByProjectId(projectId: string): Promise<ShareMapping | undefined> {
    const store = await this.getStore('shares');
    const index = store.index('projectId');
    return new Promise((resolve, reject) => {
      const request = index.get(projectId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ===== Migration =====

  async migrateFromLocalStorage(): Promise<void> {
    try {
      const projectsStr = localStorage.getItem('kreathief_projects');
      if (!projectsStr) {return;}

      const projects: Project[] = JSON.parse(projectsStr);
      logger.info('Migrating projects from localStorage', { count: projects.length });

      for (const project of projects) {
        await this.saveProject(project);
      }

      logger.info('Migration complete');
    } catch (error) {
      logger.error('Migration failed', { error });
    }
  }
}

export const storageService = new StorageService();

if (typeof window !== 'undefined') {
  storageService.init().then(() => {
    storageService.migrateFromLocalStorage();
  });
}
