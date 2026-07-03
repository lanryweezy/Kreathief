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
    const MAX_HISTORY = 200;
    const SNAPSHOT_INTERVAL = 10;

    return () => {
      // If batching, mark pending change and exit
      if ((get() as any).__batchDepth > 0) {
        set({ __hasPendingBatchChange: true } as any);
        return;
      }
      const now = Date.now();
      if (now - lastSavedTimestamp < DEBOUNCE_MS) {
        return;
      }
      lastSavedTimestamp = now;

      set((state: any) => {
        const currentState: HistoryState = {
          artboards: state.artboards.map((a: Artboard) => ({ ...a, layers: a.layers.map((l: any) => ({ ...l })) })),
          activeArtboardId: state.activeArtboardId,
          canvasBackgroundColor: state.canvasBackgroundColor,
          canvasFilters: state.canvasFilters ? { ...state.canvasFilters } : undefined,
          canvasSize: state.canvasSize ? { ...state.canvasSize } : undefined,
          selectedLayerIds: [...(state.selectedLayerIds || [])],
        };

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

        if (state.projectId) {
          storageService
            .saveSessionMirror(state.projectId, currentState)
            .catch((err) => log.error('[Resilience] Session mirror failed', err, { projectId: state.projectId }));
        }

        return { past: newPast, future: [], __lastStateSnapshot: nextSnapshot, hasUnsavedChanges: true };
      });
    };
  })(),

  beginBatch: () => {
    const depth = ((get() as any).__batchDepth || 0) + 1;
    set({ __batchDepth: depth } as any);
  },

  endBatch: () => {
    const depth = Math.max(0, ((get() as any).__batchDepth || 0) - 1);
    const hadPending = (get() as any).__hasPendingBatchChange;
    set({ __batchDepth: depth } as any);
    if (depth === 0 && hadPending) {
      const now = Date.now();
      set((state: any) => {
        const currentState: HistoryState = {
          artboards: state.artboards.map((a: Artboard) => ({ ...a, layers: a.layers.map((l: any) => ({ ...l })) })),
          activeArtboardId: state.activeArtboardId,
          canvasBackgroundColor: state.canvasBackgroundColor,
          canvasFilters: state.canvasFilters ? { ...state.canvasFilters } : undefined,
          canvasSize: state.canvasSize ? { ...state.canvasSize } : undefined,
          selectedLayerIds: [...(state.selectedLayerIds || [])],
        };
        const entry: HistoryEntry = { timestamp: now, type: 'snapshot', state: currentState };
        const MAX_HISTORY = 200;
        const newPast = state.past.length >= MAX_HISTORY ? [...state.past.slice(1), entry] : [...state.past, entry];
        return { past: newPast, future: [], __hasPendingBatchChange: false, __lastStateSnapshot: currentState };
      });
    }
  },

  undo: () => {
    const { past, artboards, activeArtboardId, canvasBackgroundColor, canvasFilters, canvasSize, selectedLayerIds } = get();
    if (past.length === 0) {
      return;
    }

    const currentFullState: HistoryState = {
      artboards: artboards.map((a: Artboard) => ({ ...a, layers: a.layers.map((l: any) => ({ ...l })) })),
      activeArtboardId,
      canvasBackgroundColor,
      canvasFilters: canvasFilters ? { ...canvasFilters } : undefined,
      canvasSize: canvasSize ? { ...canvasSize } : undefined,
      selectedLayerIds: [...(selectedLayerIds || [])],
    };

    const lastEntry = past[past.length - 1];
    const newPast = past.slice(0, -1);

    let targetState: HistoryState;
    let nextLastSnapshot = get().__lastStateSnapshot;

    if (lastEntry.type === 'snapshot') {
      targetState = lastEntry.state!;
      // Need to find the previous snapshot to update __lastStateSnapshot
      let prevSnapshotIdx = -1;
      for (let i = newPast.length - 1; i >= 0; i--) {
        if (newPast[i].type === 'snapshot') {
          prevSnapshotIdx = i;
          break;
        }
      }
      if (prevSnapshotIdx !== -1) {
        nextLastSnapshot = newPast[prevSnapshotIdx].state!;
      } else {
        nextLastSnapshot = null;
      }
    } else {
      let lastSnapshotIdx = -1;
      for (let i = newPast.length - 1; i >= 0; i--) {
        if (newPast[i].type === 'snapshot') {
          lastSnapshotIdx = i;
          break;
        }
      }

      if (lastSnapshotIdx === -1) {
        // No snapshot found to reconstruct from — try full-state snapshot as last resort
        if (newPast.length > 0 && newPast[0].type === 'snapshot') {
          targetState = newPast[0].state!;
        } else {
          get().addToast?.('Nothing to undo', 'info');
          return;
        }
      } else {
        try {
          targetState = structuredClone(newPast[lastSnapshotIdx].state!);
          for (let i = lastSnapshotIdx + 1; i < newPast.length; i++) {
            if (newPast[i].type === 'patch') {
              applyPatch(targetState, newPast[i].patch!);
            }
          }
        } catch (error) {
          log.error('History patch application failed during undo', error, {
            action: 'undo',
            snapshotIdx: lastSnapshotIdx,
            pastLength: newPast.length,
          });
          get().addToast?.('Undo failed — state corrupted', 'error');
          return;
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
    const { future, artboards, activeArtboardId, canvasBackgroundColor, canvasFilters, canvasSize, selectedLayerIds } = get();
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
