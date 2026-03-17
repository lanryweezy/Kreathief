# Sync Implementation Plan

**Status:** ⚠️ **INCOMPLETE - NEEDS ENHANCEMENT**  
**Priority:** 🔴 **HIGH for Production**  
**Current State:** Basic online/offline detection only

---

## 📊 Current Sync Architecture

### What's Implemented ✅

1. **Online/Offline Detection** ✅
   ```typescript
   private isOnline = navigator.onLine;
   
   window.addEventListener('online', () => {
     this.isOnline = true;
     this.syncOfflineChanges();
   });
   
   window.addEventListener('offline', () => {
     this.isOnline = false;
   });
   ```

2. **Hybrid Storage** ✅
   - Supabase when online + user ID exists
   - IndexedDB fallback when offline
   - Automatic fallback on errors

3. **Basic Save/Load** ✅
   - Projects save to Supabase first
   - Falls back to IndexedDB on failure
   - Retrieves from either source

### What's Missing ❌

1. **Sync Queue** ❌
   - No tracking of pending changes
   - No retry mechanism
   - No batch operations

2. **Conflict Resolution** ❌
   - No timestamp comparison
   - No merge strategy
   - Last-write-wins not implemented

3. **Sync Status Tracking** ❌
   - No progress indicators
   - No sync state persistence
   - No error recovery

4. **Optimistic Updates** ❌
   - UI doesn't update immediately
   - No rollback on sync failure

---

## 🎯 Proposed Sync Architecture

### Enhanced Features

#### 1. Sync Queue System

```typescript
interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'project' | 'version' | 'snapshot' | 'comment';
  entityId: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

class StorageService {
  private syncQueue: SyncOperation[] = [];
  private isSyncing = false;
  
  // Queue operation when offline
  private async queueSyncOperation(
    type: SyncOperation['type'],
    entityType: SyncOperation['entityType'],
    entityId: string,
    data?: any
  ): Promise<void> {
    const operation: SyncOperation = {
      id: `${entityType}_${entityId}_${Date.now()}`,
      type,
      entityType,
      entityId,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };
    
    this.syncQueue.push(operation);
    await this.persistSyncQueue();
    
    log.info('[Storage] Sync operation queued', { 
      operationId: operation.id,
      type,
      entityId 
    });
  }
  
  // Process queue when online
  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || !this.isOnline) return;
    
    this.isSyncing = true;
    log.info('[Storage] Processing sync queue', { 
      count: this.syncQueue.length 
    });
    
    try {
      for (const op of this.syncQueue.filter(o => o.status === 'pending')) {
        await this.executeSyncOperation(op);
      }
      
      // Remove completed operations
      this.syncQueue = this.syncQueue.filter(
        o => o.status !== 'completed' && o.retryCount < MAX_RETRIES
      );
      
      await this.persistSyncQueue();
    } finally {
      this.isSyncing = false;
    }
  }
}
```

#### 2. Conflict Resolution Strategy

```typescript
interface ConflictResolution {
  localVersion: number;
  remoteVersion: number;
  localUpdatedAt: number;
  remoteUpdatedAt: number;
  strategy: 'local-wins' | 'remote-wins' | 'merge' | 'prompt-user';
}

class StorageService {
  private async resolveConflict(
    localProject: Project,
    remoteProject: any
  ): Promise<'use-local' | 'use-remote' | 'merge'> {
    const localTime = localProject.updatedAt;
    const remoteTime = new Date(remoteProject.updated_at).getTime();
    
    // Simple last-write-wins strategy
    if (localTime > remoteTime) {
      log.info('[Storage] Conflict resolved: local wins', {
        projectId: localProject.id,
        localTime,
        remoteTime,
      });
      return 'use-local';
    } else if (remoteTime > localTime) {
      log.info('[Storage] Conflict resolved: remote wins', {
        projectId: localProject.id,
        localTime,
        remoteTime,
      });
      return 'use-remote';
    }
    
    // If timestamps are equal (within threshold), prefer remote
    const timeDiff = Math.abs(localTime - remoteTime);
    if (timeDiff < CONFLICT_THRESHOLD_MS) {
      log.warn('[Storage] Conflict detected: same timestamp, using remote');
      return 'use-remote';
    }
    
    return 'merge';
  }
  
  // Enhanced save with conflict detection
  async saveProject(project: Project): Promise<void> {
    const userId = await this.getUserId();
    
    if (this.isOnline && userId) {
      try {
        // Check for conflicts
        const { data: existing } = await supabase
          .from('projects')
          .select('updated_at')
          .eq('id', project.id)
          .single();
        
        if (existing) {
          const remoteTime = new Date(existing.updated_at).getTime();
          if (Math.abs(project.updatedAt - remoteTime) < 1000) {
            // Potential conflict - versions too close
            log.warn('[Storage] Potential conflict detected', {
              projectId: project.id,
              localTime: project.updatedAt,
              remoteTime,
            });
            
            const resolution = await this.resolveConflict(project, existing);
            if (resolution === 'use-remote') {
              // Fetch full remote version and merge
              const fullRemote = await this.getProject(project.id);
              return this.mergeProjectVersions(project, fullRemote!);
            }
          }
        }
        
        // Proceed with normal save
        const { error } = await supabase.from('projects').upsert({
          id: project.id,
          user_id: userId,
          name: project.name,
          state: project.state as any,
          canvas_size: project.state.canvasSize as any,
          background_color: project.state.canvasBackgroundColor,
          canvas_filters: project.state.canvasFilters as any,
          updated_at: new Date(project.updatedAt).toISOString(),
          is_public: false,
        } as any, { onConflict: 'id' });
        
        if (!error) {
          log.debug('[Storage] Project saved to Supabase', { id: project.id });
          return;
        }
        
        log.warn('[Storage] Supabase save failed, using IndexedDB', { 
          error: error.message 
        });
      } catch (err) {
        log.error('[Storage] Supabase error', err);
      }
    }
    
    // Offline or error - save locally
    await this.saveProjectIndexedDB(project);
    
    // Queue for later sync
    if (this.isOnline) {
      await this.queueSyncOperation('update', 'project', project.id, project);
    }
  }
}
```

#### 3. Sync Status & Progress

```typescript
interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncTime: number | null;
  failedOperations: number;
  nextRetryTime: number | null;
}

class StorageService {
  private syncStatusListeners: ((status: SyncStatus) => void)[] = [];
  private lastSyncTime: number | null = null;
  
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingOperations: this.syncQueue.filter(o => o.status === 'pending').length,
      lastSyncTime: this.lastSyncTime,
      failedOperations: this.syncQueue.filter(o => o.status === 'failed').length,
      nextRetryTime: this.getNextRetryTime(),
    };
  }
  
  subscribeToSyncStatus(listener: (status: SyncStatus) => void): () => void {
    this.syncStatusListeners.push(listener);
    return () => {
      this.syncStatusListeners = this.syncStatusListeners.filter(
        l => l !== listener
      );
    };
  }
  
  private notifySyncStatusChange() {
    const status = this.getSyncStatus();
    this.syncStatusListeners.forEach(listener => listener(status));
  }
  
  // Emit sync events for UI
  private emitSyncEvent(event: 'sync-start' | 'sync-progress' | 'sync-complete' | 'sync-error', data?: any) {
    log.info('[Storage] Sync event', { event, ...data });
    this.notifySyncStatusChange();
  }
}
```

---

## 🔧 Implementation Strategy

### Phase 1: Sync Queue (4-6 hours) 🔴

**Tasks:**
1. Add sync queue data structure
2. Implement queue persistence in IndexedDB
3. Add queue operations (add, remove, update)
4. Implement queue processing on reconnect
5. Add retry logic with exponential backoff

**Code Structure:**
```typescript
// New IndexedDB store for sync queue
if (!db.objectStoreNames.contains('sync_queue')) {
  const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
  queueStore.createIndex('status', 'status', { unique: false });
  queueStore.createIndex('timestamp', 'timestamp', { unique: false });
  queueStore.createIndex('retryCount', 'retryCount', { unique: false });
}
```

### Phase 2: Conflict Resolution (3-4 hours) 🟡

**Tasks:**
1. Implement timestamp-based conflict detection
2. Add last-write-wins strategy
3. Optionally add merge strategies for complex cases
4. Log all conflicts for debugging
5. Add user prompt option (optional)

**Strategies:**
- **Local Wins:** Always use local version (good for offline-first)
- **Remote Wins:** Always use remote version (good for collaboration)
- **Last Write Wins:** Use most recent timestamp (balanced)
- **Merge:** Attempt to merge changes (complex, context-specific)
- **Prompt User:** Ask user which version to keep (UX heavy)

### Phase 3: Status & UI Integration (2-3 hours) 🟢

**Tasks:**
1. Create sync status observable
2. Add UI indicators (online/offline/syncing)
3. Show pending changes count
4. Display sync errors to user
5. Add manual sync trigger button

**UI Components:**
```tsx
<SyncStatusIndicator />
  ├─ Online: 🟢 "All changes saved"
  ├─ Offline: 🟠 "Working offline - X changes pending"
  ├─ Syncing: 🔵 "Syncing..."
  └─ Error: 🔴 "Sync failed - Retry in Xs"
```

### Phase 4: Optimistic Updates (2-3 hours) 🟢

**Tasks:**
1. Update UI immediately on user action
2. Track pending changes
3. Rollback on sync failure
4. Show optimistic state indicators

**Pattern:**
```typescript
async updateProjectOptimistic(projectId: string, updates: Partial<Project>) {
  // 1. Update UI immediately
  const previousState = this.cache[projectId];
  this.cache[projectId] = { ...previousState, ...updates };
  this.notifyUI();
  
  // 2. Try to sync
  try {
    await this.saveProject(this.cache[projectId]);
    log.info('[Storage] Optimistic update synced');
  } catch (err) {
    // 3. Rollback on failure
    log.error('[Storage] Optimistic update failed, rolling back', err);
    this.cache[projectId] = previousState;
    this.notifyUI();
    throw err;
  }
}
```

---

## 📊 Sync Flow Diagram

```
User Action (e.g., save project)
       ↓
┌─────────────────────┐
│ Is Online?          │
└─────────────────────┘
       │
   Yes │           No
       ↓             ↓
┌─────────────┐  ┌──────────────────┐
│ Save to     │  │ Save to IndexedDB│
│ Supabase    │  │ (Local)          │
└─────────────┘  └──────────────────┘
       │                    │
       │             ┌──────────────┐
       │             │ Queue for    │
       │             │ Later Sync   │
       │             └──────────────┘
       │                    │
       └─────────┬──────────┘
                 ↓
        ┌────────────────┐
        │ Network Event  │
        │ (Back Online)  │
        └────────────────┘
                 ↓
        ┌────────────────┐
        │ Process Queue  │
        │ (Batch Sync)   │
        └────────────────┘
                 ↓
        ┌────────────────┐
        │ Conflict Check │
        └────────────────┘
                 │
         ┌───────┴───────┐
         │               │
    No Conflict    Conflict Detected
         │               │
         ↓               ↓
    ┌─────────┐    ┌──────────────┐
    │ Success │    │ Resolve      │
    │ Update  │    │ Conflict     │
    └─────────┘    └──────────────┘
                          │
                     ┌────┴────┐
                     │         │
                Local     Remote
                Wins      Wins
                     │         │
                     └────┬────┘
                          ↓
                   ┌──────────────┐
                   │ Final Save   │
                   │ Complete     │
                   └──────────────┘
```

---

## 🎯 Recommended Approach

### For Development (Current)

**Keep it simple:**
- ✅ Current hybrid storage works fine
- ✅ IndexedDB fallback is solid
- ✅ No urgent need for complex sync

**Why:** You're in development with QA bypass. Complex sync isn't critical yet.

### For Pre-Production

**Add basic sync:**
1. ✅ Sync queue with retry
2. ✅ Last-write-wins conflict resolution
3. ✅ Sync status indicator in UI
4. ✅ Manual refresh button

**Effort:** ~8-10 hours

### For Production

**Full implementation:**
1. ✅ All Phase 1-4 features
2. ✅ Real-time collaboration support
3. ✅ Advanced conflict resolution
4. ✅ Optimistic updates everywhere

**Effort:** ~20-30 hours

---

## 💡 Quick Win Implementation

If you want better sync NOW without major refactor:

### Minimal Sync Enhancement (1-2 hours)

```typescript
// Simple improvement to current code

class StorageService {
  private pendingChanges = new Set<string>();
  
  async saveProject(project: Project): Promise<void> {
    const userId = await this.getUserId();
    
    if (this.isOnline && userId) {
      try {
        const { error } = await supabase.from('projects').upsert({
          // ... save to Supabase
        });
        
        if (!error) {
          this.pendingChanges.delete(project.id);
          return;
        }
      } catch (err) {
        // Handle error
      }
    }
    
    // Offline or error
    await this.saveProjectIndexedDB(project);
    this.pendingChanges.add(project.id);
    
    log.info('[Storage] Change queued for sync', { 
      projectId: project.id,
      pendingCount: this.pendingChanges.size 
    });
  }
  
  private async syncOfflineChanges(): Promise<void> {
    if (!this.isOnline || this.pendingChanges.size === 0) {
      return;
    }
    
    log.info('[Storage] Starting sync', { 
      count: this.pendingChanges.size 
    });
    
    const projectsToSync = Array.from(this.pendingChanges);
    
    for (const projectId of projectsToSync) {
      try {
        const project = await this.getProjectFromIndexedDB(projectId);
        if (project) {
          await this.saveProjectToSupabase(project);
          this.pendingChanges.delete(projectId);
        }
      } catch (err) {
        log.error('[Storage] Sync failed for project', err, { projectId });
      }
    }
    
    log.info('[Storage] Sync complete', { 
      remaining: this.pendingChanges.size 
    });
  }
}
```

This gives you:
- ✅ Tracks pending changes
- ✅ Auto-syncs when back online
- ✅ Logs progress
- ✅ Minimal code changes

---

## ✨ Summary

### Current State
⚠️ **Basic online/offline detection only**
- Saves to Supabase when online
- Falls back to IndexedDB when offline
- No sync queue, no conflict resolution

### Recommended Next Steps

**Option 1: Quick Win (1-2 hours)**
- Add pending changes tracking
- Simple auto-sync on reconnect
- Basic logging

**Option 2: Full Implementation (20-30 hours)**
- Complete sync queue system
- Conflict resolution strategies
- Optimistic updates
- Real-time collaboration ready

**Option 3: Wait Until Production**
- Keep current implementation
- Add sync only when needed
- Focus on features now

---

**Recommendation:** Start with **Option 1 (Quick Win)** now, then implement **Option 2** before production deployment.

Would you like me to implement the quick win enhancement, or should we focus on something else for now?
