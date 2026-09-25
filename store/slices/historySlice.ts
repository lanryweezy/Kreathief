import { StateCreator } from 'zustand';
import { compare, applyPatch, Operation } from 'fast-json-patch';
import { HistoryState, DesignSnapshot, Artboard } from '../../types';
import { storageService } from '../../services/storageService';
import { v4 as uuidv4 } from 'uuid';
import { analyticsService } from '../../services/analyticsService';
import { log } from '../../utils/log';
import type { StoreState } from '../useStore';

export interface HistoryEntry {
  timestamp: number;
  type: 'snapshot' | 'patch';
  state?: HistoryState; // Full state for snapshots
  patch?: Operation[]; // Diffs for patches
}

export interface HistorySlice {
  past: HistoryEntry[];
  future: HistoryEntry[];
  __batchDepth: number;
  __hasPendingBatchChange: boolean;
  __lastStateSnapshot: HistoryState | null;

  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  beginBatch: () => void;
  endBatch: () => void;
  fetchSnapshots: () => Promise<void>;
  createSnapshot: (name: string, thumbnail?: string) => Promise<void>;
  restoreSnapshot: (snapshotId: string) => Promise<void>;
  deleteSnapshot: (snapshotId: string) => Promise<void>;
}

export const createHistorySlice: StateCreator<StoreState, [], [], HistorySlice> = (set, get) => ({
  past: [],
  future: [],
  __batchDepth: 0,
  __hasPendingBatchChange: false,
  __lastStateSnapshot: null,

  saveToHistory: (() => {
    let lastSavedTimestamp = 0;
    const DEBOUNCE_MS = process.env.NODE_ENV === 'test' ? 0 : 250;
    const MAX_HISTORY = 50;
    const SNAPSHOT_INTERVAL = 10;

    return () => {
      // If batching, mark pending change and exit
      if (get().__batchDepth > 0) {
        set({ __hasPendingBatchChange: true });
        return;
      }
      const now = Date.now();
      if (now - lastSavedTimestamp < DEBOUNCE_MS) {
        return;
      }
      lastSavedTimestamp = now;

      const stateNow = get();
      const currentState: HistoryState = {
        artboards: structuredClone(stateNow.artboards),
        activeArtboardId: stateNow.activeArtboardId,
        canvasBackgroundColor: stateNow.canvasBackgroundColor,
        canvasFilters: stateNow.canvasFilters ? structuredClone(stateNow.canvasFilters) : (undefined as any),
        canvasSize: stateNow.canvasSize ? structuredClone(stateNow.canvasSize) : undefined,
        selectedLayerIds: [...(stateNow.selectedLayerIds || [])],
      };

      set((state: any) => {
        let entry: HistoryEntry;
        const lastSnapshot = state.__lastStateSnapshot;
        const shouldMakeSnapshot = !lastSnapshot || state.past.length % SNAPSHOT_INTERVAL === 0;

        let nextSnapshot = lastSnapshot;

        if (shouldMakeSnapshot) {
          entry = { timestamp: now, type: 'snapshot', state: currentState };
          nextSnapshot = currentState;
        } else {
          const patch = compare(lastSnapshot, currentState);
          entry = { timestamp: now, type: 'patch', patch };
        }

        const newPast = state.past.length >= MAX_HISTORY ? [...state.past.slice(1), entry] : [...state.past, entry];

        return { past: newPast, future: [], __lastStateSnapshot: nextSnapshot, hasUnsavedChanges: true };
      });

      // Mirror to IndexedDB outside the set() updater (updaters must stay pure),
      // including the updated undo/redo stacks so they survive reloads.
      const { projectId, past, future } = get();
      const currentName = (get() as any).projectTitle || (get() as any).currentProjectName || (get() as any).projectName;
      if (projectId) {
        storageService
          .saveSessionMirror(projectId, currentState, past, future, currentName)
          .catch((err) => log.error('[Resilience] Session mirror failed', err, { projectId }));
      }
    };
  })(),

  beginBatch: () => {
    const depth = (get().__batchDepth || 0) + 1;
    set({ __batchDepth: depth });
  },

  endBatch: () => {
    const depth = Math.max(0, (get().__batchDepth || 0) - 1);
    const hadPending = get().__hasPendingBatchChange;
    set({ __batchDepth: depth });
    if (depth === 0 && hadPending) {
      const now = Date.now();
      set((state: any) => {
        const currentState: HistoryState = {
          artboards: structuredClone(state.artboards),
          activeArtboardId: state.activeArtboardId,
          canvasBackgroundColor: state.canvasBackgroundColor,
          canvasFilters: state.canvasFilters ? structuredClone(state.canvasFilters) : (undefined as any),
          canvasSize: state.canvasSize ? structuredClone(state.canvasSize) : undefined,
          selectedLayerIds: [...(state.selectedLayerIds || [])],
        };
        const entry: HistoryEntry = { timestamp: now, type: 'snapshot', state: currentState };
        const MAX_HISTORY = 50;
        const newPast = state.past.length >= MAX_HISTORY ? [...state.past.slice(1), entry] : [...state.past, entry];
        return { past: newPast, future: [], __hasPendingBatchChange: false, __lastStateSnapshot: currentState };
      });
    }
  },

  undo: () => {
    const { past, artboards, activeArtboardId, canvasBackgroundColor, canvasFilters, canvasSize, selectedLayerIds } =
      get();
    if (past.length === 0) {
      return;
    }

    const currentFullState: HistoryState = {
      artboards: structuredClone(artboards),
      activeArtboardId,
      canvasBackgroundColor,
      canvasFilters: (canvasFilters ? structuredClone(canvasFilters) : undefined) as any,
      canvasSize: canvasSize ? structuredClone(canvasSize) : undefined,
      selectedLayerIds: [...(selectedLayerIds || [])],
    };

    const lastEntry = past[past.length - 1];
    const newPast = past.slice(0, -1);

    let targetState: HistoryState;
    let nextLastSnapshot = get().__lastStateSnapshot;

    if (newPast.length === 0) {
      // Reverting the first history entry -> return to the initial snapshot state
      targetState = lastEntry.type === 'snapshot' && lastEntry.state ? lastEntry.state : currentFullState;
      nextLastSnapshot = null;
    } else {
      const topEntry = newPast[newPast.length - 1];
      if (topEntry.type === 'snapshot') {
        targetState = structuredClone(topEntry.state!);
        nextLastSnapshot = topEntry.state!;
      } else {
        // Find the base snapshot in newPast that topEntry.patch was computed against
        let lastSnapshotIdx = -1;
        for (let i = newPast.length - 1; i >= 0; i--) {
          if (newPast[i].type === 'snapshot' && newPast[i].state) {
            lastSnapshotIdx = i;
            break;
          }
        }

        if (lastSnapshotIdx !== -1) {
          try {
            targetState = structuredClone(newPast[lastSnapshotIdx].state!);
            applyPatch(targetState, topEntry.patch!);
            nextLastSnapshot = newPast[lastSnapshotIdx].state!;
          } catch (error) {
            log.error('History patch application failed during undo', error, {
              action: 'undo',
              snapshotIdx: lastSnapshotIdx,
              pastLength: newPast.length,
            });
            get().addToast?.('Undo failed — state corrupted', 'error');
            return;
          }
        } else {
          targetState = topEntry.state || currentFullState;
        }
      }
    }

    set({
      ...targetState,
      past: newPast,
      future: [{ timestamp: Date.now(), type: 'snapshot', state: currentFullState }, ...get().future],
      __lastStateSnapshot: nextLastSnapshot,
    });
    get().addToast?.('Action Undone', 'info');
  },

  redo: () => {
    const { future, artboards, activeArtboardId, canvasBackgroundColor, canvasFilters, canvasSize, selectedLayerIds } =
      get();
    if (future.length === 0) {
      return;
    }

    const currentFullState: HistoryState = {
      artboards: structuredClone(artboards),
      activeArtboardId,
      canvasBackgroundColor,
      canvasFilters: structuredClone(canvasFilters),
      canvasSize: structuredClone(canvasSize),
      selectedLayerIds: [...(selectedLayerIds || [])],
    };

    const nextEntry = future[0];
    const newFuture = future.slice(1);

    let targetState: HistoryState;
    try {
      if (nextEntry.type === 'snapshot') {
        targetState = nextEntry.state!;
      } else {
        targetState = structuredClone(currentFullState);
        applyPatch(targetState, nextEntry.patch!);
      }
    } catch (error) {
      log.error('History patch application failed during redo', error, {
        action: 'redo',
        futureLength: future.length,
      });
      get().addToast?.('Redo failed — state corrupted', 'error');
      return;
    }

    set({
      ...targetState,
      past: [...get().past, { timestamp: Date.now(), type: 'snapshot', state: currentFullState }],
      future: newFuture,
      __lastStateSnapshot: currentFullState,
    });
    get().addToast?.('Action Redone', 'info');
  },

  fetchSnapshots: async () => {
    const { projectId } = get();
    if (!projectId) {
      return;
    }
    const snapshots = await storageService.getSnapshots(projectId);
    set({ snapshots });
  },

  createSnapshot: async (name, thumbnail) => {
    const { projectId, artboards, activeArtboardId, canvasBackgroundColor, canvasFilters, canvasSize } = get();
    if (!projectId) {
      return;
    }

    const snapshot: DesignSnapshot = {
      id: uuidv4(),
      projectId,
      name,
      timestamp: Date.now(),
      state: {
        artboards: structuredClone(artboards),
        activeArtboardId,
        canvasBackgroundColor,
        canvasFilters: { ...canvasFilters },
        canvasSize: canvasSize ? { ...canvasSize } : undefined,
      },
      thumbnail,
    };

    await storageService.saveSnapshot(snapshot);
    set((state: any) => ({ snapshots: [snapshot, ...state.snapshots] }));
    analyticsService.track('export_design', { method: 'snapshot', name });
  },

  restoreSnapshot: async (snapshotId) => {
    const { snapshots } = get();
    const snapshot = snapshots.find((s: DesignSnapshot) => s.id === snapshotId);
    if (!snapshot) {
      return;
    }

    get().saveToHistory();

    set({
      artboards: structuredClone(snapshot.state.artboards),
      activeArtboardId: snapshot.state.activeArtboardId,
      canvasBackgroundColor: snapshot.state.canvasBackgroundColor,
      canvasFilters: snapshot.state.canvasFilters || {
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
      canvasSize: snapshot.state.canvasSize || { width: 1080, height: 1080 },
      selectedLayerIds: [],
    });
    analyticsService.track('apply_template', { method: 'snapshot', id: snapshotId });
  },

  deleteSnapshot: async (snapshotId) => {
    await storageService.deleteSnapshot(snapshotId);
    set((state: any) => ({ snapshots: state.snapshots.filter((s: DesignSnapshot) => s.id !== snapshotId) }));
  },
});
