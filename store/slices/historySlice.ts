import { StateCreator } from 'zustand';
import { HistoryState, DesignSnapshot, Artboard } from '../../types';
import { storageService } from '../../services/storageService';
import { v4 as uuidv4 } from 'uuid';
import { analyticsService } from '../../services/analyticsService';
import { log } from '../../utils/log';
import { CommandManager } from '../../commands/CommandManager';
import type { StoreState } from '../useStore';

// FEATURE FLAG: Set to true when you are ready to fully migrate from 
// snapshot-based history to the new CommandManager architecture.
export const USE_COMMAND_MANAGER = true;

// ── Debounce helper for saveToHistory ─────────────────────────────────────────
// Slider drags (filter, opacity, size handles) fire saveToHistory on every
// input event — potentially 60× per second. Without debouncing this creates
// dozens of nearly-identical history entries per drag and triggers an equal
// number of structuredClone(artboards) calls, spiking RAM.
//
// Strategy: on the FIRST call of a burst we capture the "before" snapshot
// immediately (this is the state BEFORE the user started dragging). We then
// debounce the "after" capture so it only runs 400 ms after the last call in
// the burst. The result is one clean undo step per continuous interaction.

let _debounceTimer: ReturnType<typeof setTimeout> | null = null;
let _pendingBeforeState: any = null;
const DEBOUNCE_MS = 400;

function debouncedSaveToHistory(get: () => StoreState) {
  if (USE_COMMAND_MANAGER) {
    // Capture the pre-action state on the leading edge of the burst
    if (!_pendingBeforeState) {
      const { artboards, activeArtboardId, canvasBackgroundColor, canvasFilters, canvasSize } = get();
      _pendingBeforeState = {
        artboards: structuredClone(artboards),
        activeArtboardId,
        canvasBackgroundColor,
        canvasFilters: { ...canvasFilters },
        canvasSize: canvasSize ? { ...canvasSize } : { width: 1080, height: 1080 },
      };
    }

    // Reset the trailing timer on every call during the burst
    if (_debounceTimer !== null) clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
      _debounceTimer = null;
      const beforeState = _pendingBeforeState;
      _pendingBeforeState = null;

      if (!beforeState) return;

      const {
        artboards: afterArtboards,
        activeArtboardId: afterActive,
        canvasBackgroundColor: afterBg,
        canvasFilters: afterFilters,
        canvasSize: afterSize,
      } = get();

      const afterState = {
        artboards: structuredClone(afterArtboards),
        activeArtboardId: afterActive,
        canvasBackgroundColor: afterBg,
        canvasFilters: { ...afterFilters },
        canvasSize: afterSize ? { ...afterSize } : { width: 1080, height: 1080 },
      };

      const collectBlobUrls = (state: any): Set<string> => {
        const urls = new Set<string>();
        for (const ab of state?.artboards || []) {
          for (const layer of ab?.layers || []) {
            for (const field of ['src', 'imageUrl', 'backgroundImage', 'textTextureUrl']) {
              const v = layer[field];
              if (typeof v === 'string' && v.startsWith('blob:')) urls.add(v);
            }
          }
        }
        return urls;
      };

      const blobUrls = new Set<string>([
        ...collectBlobUrls(beforeState),
        ...collectBlobUrls(afterState),
      ]);

      const cmd: any = {
        id: uuidv4(),
        name: 'Canvas Action',
        _blobUrls: blobUrls,
        execute: () => (get() as any).__set?.(afterState) ?? CommandManager,
        undo: () => (get() as any).__set?.(beforeState) ?? CommandManager,
      };

      // We need set() from the slice — push via the singleton we have access to
      // at module scope. The cmd closures call get().__set which is unavailable,
      // so we store set() at slice creation time (see _historySet below).
      if (_historySet) {
        cmd.execute = () => _historySet!(afterState);
        cmd.undo = () => _historySet!(beforeState);
        CommandManager.pushCommand(cmd);
      }
    }, DEBOUNCE_MS);
    return;
  }

  // LEGACY snapshot path (USE_COMMAND_MANAGER = false) — unchanged behaviour
  const { artboards, activeArtboardId, canvasBackgroundColor, canvasFilters, canvasSize } = get();
  const beforeState = {
    artboards: structuredClone(artboards),
    activeArtboardId,
    canvasBackgroundColor,
    canvasFilters: { ...canvasFilters },
    canvasSize: canvasSize ? { ...canvasSize } : { width: 1080, height: 1080 },
  };
  return beforeState; // returned for use in the immediate legacy path below
}

// Module-level reference to `set` captured at slice creation time,
// needed by the debounce closure which runs after the creator has returned.
let _historySet: ((partial: any) => void) | null = null;
// ─────────────────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  timestamp: number;
  type: 'snapshot' | 'patch';
  state?: any; 
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

export const createHistorySlice: StateCreator<StoreState, [], [], HistorySlice> = (set, get) => {
  // Capture set() at slice creation time so the debounce closure can call it
  // after the creator has returned (the closure has no other reference to set).
  _historySet = set as any;

  return {
  past: [],
  future: [],
  __batchDepth: 0,
  __hasPendingBatchChange: false,
  __lastStateSnapshot: null,

  saveToHistory: () => {
    if (USE_COMMAND_MANAGER) {
      // Delegate entirely to the debounced helper so rapid slider drags collapse
      // into a single undo step instead of filling the stack with clones.
      debouncedSaveToHistory(get);
      return;
    }

    // LEGACY snapshot path
    const { artboards, activeArtboardId, canvasBackgroundColor, canvasFilters, canvasSize } = get();
    const beforeState = {
      artboards: structuredClone(artboards),
      activeArtboardId,
      canvasBackgroundColor,
      canvasFilters: { ...canvasFilters },
      canvasSize: canvasSize ? { ...canvasSize } : { width: 1080, height: 1080 },
    };
    const past = [...get().past, { type: 'snapshot' as const, state: beforeState, timestamp: Date.now() }];
    if (past.length > 50) past.shift();
    set({ past, future: [] });
  },

  beginBatch: () => {
    CommandManager.beginBatch();
  },

  endBatch: () => {
    CommandManager.endBatch('Batch Operation');
  },

  undo: () => {
    if (USE_COMMAND_MANAGER) {
      const undone = CommandManager.undo();
      if (undone) get().addToast?.('Action Undone', 'info');
      return;
    }

    // SNAPSHOT UNDO
    const { past, future, artboards, activeArtboardId, canvasBackgroundColor, canvasFilters, canvasSize } = get();
    if (past.length === 0) return;

    const previousEntry = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    const currentSnapshot = {
       artboards: structuredClone(artboards),
       activeArtboardId,
       canvasBackgroundColor,
       canvasFilters: { ...canvasFilters },
       canvasSize: canvasSize ? { ...canvasSize } : { width: 1080, height: 1080 }
    };
    const newFuture = [{ type: 'snapshot' as const, state: currentSnapshot, timestamp: Date.now() }, ...future];

    set({
      past: newPast,
      future: newFuture,
      artboards: structuredClone(previousEntry.state.artboards),
      activeArtboardId: previousEntry.state.activeArtboardId,
      canvasBackgroundColor: previousEntry.state.canvasBackgroundColor,
      canvasFilters: previousEntry.state.canvasFilters,
      canvasSize: previousEntry.state.canvasSize,
      selectedLayerIds: [], 
    });
    
    get().addToast?.('Undo', 'info');
  },

  redo: () => {
    if (USE_COMMAND_MANAGER) {
      const redone = CommandManager.redo();
      if (redone) get().addToast?.('Action Redone', 'info');
      return;
    }

    // SNAPSHOT REDO
    const { past, future, artboards, activeArtboardId, canvasBackgroundColor, canvasFilters, canvasSize } = get();
    if (future.length === 0) return;

    const nextEntry = future[0];
    const newFuture = future.slice(1);

    const currentSnapshot = {
       artboards: structuredClone(artboards),
       activeArtboardId,
       canvasBackgroundColor,
       canvasFilters: { ...canvasFilters },
       canvasSize: canvasSize ? { ...canvasSize } : { width: 1080, height: 1080 }
    };
    const newPast = [...past, { type: 'snapshot' as const, state: currentSnapshot, timestamp: Date.now() }];

    set({
      past: newPast,
      future: newFuture,
      artboards: structuredClone(nextEntry.state.artboards),
      activeArtboardId: nextEntry.state.activeArtboardId,
      canvasBackgroundColor: nextEntry.state.canvasBackgroundColor,
      canvasFilters: nextEntry.state.canvasFilters,
      canvasSize: nextEntry.state.canvasSize,
      selectedLayerIds: [],
    });

    get().addToast?.('Redo', 'info');
  },

  fetchSnapshots: async () => {
    const { projectId } = get();
    if (!projectId) return;
    const snapshots = await storageService.getSnapshots(projectId);
    set({ snapshots });
  },

  createSnapshot: async (name, thumbnail) => {
    const { projectId, artboards, activeArtboardId, canvasBackgroundColor, canvasFilters, canvasSize } = get();
    if (!projectId) return;

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
    set((state) => ({ snapshots: [snapshot, ...state.snapshots] }));
    analyticsService.track('export_design', { method: 'snapshot', name });
  },

  restoreSnapshot: async (snapshotId) => {
    const { snapshots } = get();
    const snapshot = snapshots.find((s: DesignSnapshot) => s.id === snapshotId);
    if (!snapshot) return;

    get().saveToHistory();

    set({
      artboards: structuredClone(snapshot.state.artboards),
      activeArtboardId: snapshot.state.activeArtboardId,
      canvasBackgroundColor: snapshot.state.canvasBackgroundColor,
      canvasFilters: snapshot.state.canvasFilters || {
        brightness: 100, contrast: 100, saturation: 100, sepia: 0,
        grayscale: 0, blur: 0, opacity: 1, vignette: 0, hueRotate: 0,
      },
      canvasSize: snapshot.state.canvasSize || { width: 1080, height: 1080 },
      selectedLayerIds: [],
    });
    analyticsService.track('apply_template', { method: 'snapshot', id: snapshotId });
  },

  deleteSnapshot: async (snapshotId) => {
    await storageService.deleteSnapshot(snapshotId);
    set((state) => ({ snapshots: state.snapshots.filter((s: DesignSnapshot) => s.id !== snapshotId) }));
  },
  };
};
