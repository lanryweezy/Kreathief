import { StateCreator } from 'zustand';
import { HistoryState, DesignSnapshot } from '../../types';
import { storageService } from '../../services/storageService';
import { v4 as uuidv4 } from 'uuid';

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

  saveToHistory: () => {
    set((state: any) => {
      const currentState: HistoryState = {
        layers: structuredClone(state.layers),
        canvasBackgroundColor: state.canvasBackgroundColor,
        canvasFilters: { ...state.canvasFilters },
        canvasSize: { ...state.canvasSize },
      };
      const newPast = [...state.past, currentState];
      if (newPast.length > 50) {
        newPast.shift();
      }
      return {
        past: newPast,
        future: [],
      };
    });
  },

  undo: () =>
    set((state: any) => {
      if (state.past.length === 0) {
        return {};
      }
      const previous = state.past[state.past.length - 1]!;
      const newPast = state.past.slice(0, -1);
      const current: HistoryState = {
        layers: state.layers,
        canvasBackgroundColor: state.canvasBackgroundColor,
        canvasFilters: state.canvasFilters,
        canvasSize: state.canvasSize,
      };
      return {
        past: newPast,
        future: [current, ...state.future],
        layers: previous.layers,
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
        layers: state.layers,
        canvasBackgroundColor: state.canvasBackgroundColor,
        canvasFilters: state.canvasFilters,
        canvasSize: state.canvasSize,
      };
      return {
        past: [...state.past, current],
        future: newFuture,
        layers: next.layers,
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
    const { projectId, layers, canvasBackgroundColor, canvasFilters, canvasSize } = get();
    if (!projectId) {
      return;
    }

    const snapshot: DesignSnapshot = {
      id: uuidv4(),
      projectId,
      name,
      timestamp: Date.now(),
      state: {
        layers: structuredClone(layers),
        canvasBackgroundColor,
        canvasFilters: { ...canvasFilters },
        canvasSize: canvasSize ? { ...canvasSize } : undefined,
      },
      thumbnail,
    };

    await storageService.saveSnapshot(snapshot);
    set((state: any) => ({ snapshots: [snapshot, ...state.snapshots] }));
  },

  restoreSnapshot: async (snapshotId) => {
    const { snapshots } = get();
    const snapshot = snapshots.find((s: DesignSnapshot) => s.id === snapshotId);
    if (!snapshot) {
      return;
    }

    get().saveToHistory();

    set({
      layers: structuredClone(snapshot.state.layers),
      canvasBackgroundColor: snapshot.state.canvasBackgroundColor,
      canvasFilters: { ...snapshot.state.canvasFilters },
      canvasSize: snapshot.state.canvasSize ? { ...snapshot.state.canvasSize } : get().canvasSize,
      selectedLayerIds: [],
    });
  },

  deleteSnapshot: async (snapshotId) => {
    set((state: any) => ({ snapshots: state.snapshots.filter((s: DesignSnapshot) => s.id !== snapshotId) }));
  },
});
