import { StateCreator } from 'zustand';
import { HistoryState, DesignSnapshot } from '../../types';
import { storageService } from '../../services/storageService';
import { v4 as uuidv4 } from 'uuid';
import { analyticsService } from '../../services/analyticsService';

export interface HistorySlice {
  past: HistoryState[];
  future: HistoryState[];

  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  fetchSnapshots: () => Promise<void>;
  createSnapshot: (name: string, thumbnail?: string) => Promise<void>;
  restoreSnapshot: (snapshotId: string) => Promise<void>;
  deleteSnapshot: (snapshotId: string) => Promise<void>;
}

export const createHistorySlice: StateCreator<any, [], [], HistorySlice> = (set, get) => ({
  past: [],
  future: [],

  saveToHistory: (() => {
    let lastSavedTimestamp = 0;
    const DEBOUNCE_MS = 200;
    const MAX_HISTORY = 50;

    return () => {
      // Debounce: Skip if called too recently (e.g. rapid slider drags)
      const now = Date.now();
      if (now - lastSavedTimestamp < DEBOUNCE_MS) {
        return;
      }
      lastSavedTimestamp = now;

      set((state: any) => {
        const currentState: HistoryState = {
          // Only clone artboards — skip ephemeral UI state
          artboards: structuredClone(state.artboards),
          activeArtboardId: state.activeArtboardId,
          canvasBackgroundColor: state.canvasBackgroundColor,
          canvasFilters: state.canvasFilters ? { ...state.canvasFilters } : undefined,
          canvasSize: state.canvasSize ? { ...state.canvasSize } : undefined,
        };

        // Circular buffer: keep only the last MAX_HISTORY entries
        const newPast = state.past.length >= MAX_HISTORY
          ? [...state.past.slice(-MAX_HISTORY + 1), currentState]
          : [...state.past, currentState];

        return {
          past: newPast,
          future: [], // Any new action clears redo
        };
      });
    };
  })(),

  undo: () =>
    set((state: any) => {
      if (state.past.length === 0) {
        return {};
      }
      const previous = state.past[state.past.length - 1]!;
      const newPast = state.past.slice(0, -1);
      const current: HistoryState = {
        artboards: state.artboards,
        activeArtboardId: state.activeArtboardId,
        canvasBackgroundColor: state.canvasBackgroundColor,
        canvasFilters: state.canvasFilters,
        canvasSize: state.canvasSize,
      };
      return {
        past: newPast,
        future: [current],
        artboards: previous.artboards,
        activeArtboardId: previous.activeArtboardId,
        canvasBackgroundColor: previous.canvasBackgroundColor,
        canvasFilters: previous.canvasFilters,
        canvasSize: previous.canvasSize || state.canvasSize,
      };
    }),

  redo: () =>
    set((state: any) => {
      if (state.future.length === 0) {
        return {};
      }
      const next = state.future[0]!;
      const newFuture = state.future.slice(1);
      const current: HistoryState = {
        artboards: state.artboards,
        activeArtboardId: state.activeArtboardId,
        canvasBackgroundColor: state.canvasBackgroundColor,
        canvasFilters: state.canvasFilters,
        canvasSize: state.canvasSize,
      };
      return {
        past: [...state.past, current],
        future: newFuture,
        artboards: next.artboards,
        activeArtboardId: next.activeArtboardId,
        canvasBackgroundColor: next.canvasBackgroundColor,
        canvasFilters: next.canvasFilters,
        canvasSize: next.canvasSize || state.canvasSize,
      };
    }),

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
    set((state: any) => ({ snapshots: state.snapshots.filter((s: DesignSnapshot) => s.id !== snapshotId) }));
  },
});
