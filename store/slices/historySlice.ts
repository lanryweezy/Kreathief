import { StateCreator } from 'zustand';
import { compare, applyPatch, Operation } from 'fast-json-patch';
import { HistoryState, DesignSnapshot, Artboard } from '../../types';
import { storageService } from '../../services/storageService';
import { v4 as uuidv4 } from 'uuid';
import { analyticsService } from '../../services/analyticsService';
import { log } from '../../utils/log';
import { CommandManager } from '../../commands/CommandManager';
import type { StoreState } from '../useStore';

export interface HistoryEntry {
  timestamp: number;
  type: 'snapshot' | 'patch';
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

  saveToHistory: () => {
    // Legacy generic save. We will now prefer direct CommandManager.executeCommand
    // This is kept as a no-op to prevent existing calls from crashing until fully migrated.
  },

  beginBatch: () => {
    CommandManager.beginBatch();
  },

  endBatch: () => {
    CommandManager.endBatch('Batch Operation');
  },

  undo: () => {
    CommandManager.undo();
    get().addToast?.('Action Undone', 'info');
  },

  redo: () => {
    CommandManager.redo();
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
    set((state) => ({ snapshots: [snapshot, ...state.snapshots] }));
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
    set((state) => ({ snapshots: state.snapshots.filter((s: DesignSnapshot) => s.id !== snapshotId) }));
  },
});
