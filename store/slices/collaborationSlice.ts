import { StateCreator } from 'zustand';
import { PresenceState } from '../../services/collaborationService';
import type { StoreState } from '../useStore';

export interface RemoteSelection {
  x: number;
  y: number;
  width: number;
  height: number;
  layerId: string | null;
}

export interface CollaborationSlice {
  // Presence
  onlineUsers: PresenceState[];
  cursors: Record<string, { x: number; y: number }>;
  activeLayerByUser: Record<string, string | null>;
  remoteSelections: Record<string, RemoteSelection | null>;

  // Actions
  setOnlineUsers: (users: PresenceState[]) => void;
  updateCursor: (userId: string, cursor: { x: number; y: number }) => void;
  removeCursor: (userId: string) => void;
  setActiveLayerByUser: (userId: string, layerId: string | null) => void;
  setRemoteSelection: (userId: string, selection: RemoteSelection | null) => void;
  clearCollaborationState: () => void;
}

export const createCollaborationSlice: StateCreator<StoreState, [], [], CollaborationSlice> = (set) => ({
  onlineUsers: [],
  cursors: {},
  activeLayerByUser: {},
  remoteSelections: {},

  setOnlineUsers: (users) => {
    set({ onlineUsers: users });
  },

  updateCursor: (userId, cursor) => {
    set((state: any) => ({
      cursors: { ...state.cursors, [userId]: cursor },
    }));
  },

  removeCursor: (userId) => {
    set((state: any) => {
      const { [userId]: _, ...restCursors } = state.cursors;
      const { [userId]: __, ...restSelections } = state.remoteSelections;
      return { cursors: restCursors, remoteSelections: restSelections };
    });
  },

  setActiveLayerByUser: (userId, layerId) => {
    set((state: any) => ({
      activeLayerByUser: { ...state.activeLayerByUser, [userId]: layerId },
    }));
  },

  setRemoteSelection: (userId, selection) => {
    set((state: any) => ({
      remoteSelections: { ...state.remoteSelections, [userId]: selection },
    }));
  },

  clearCollaborationState: () => {
    set({ onlineUsers: [], cursors: {}, activeLayerByUser: {}, remoteSelections: {} });
  },
});
