import { StateCreator } from 'zustand';
import { PresenceState, LayerChange } from '../../services/collaborationService';
import type { StoreState } from '../useStore';

export interface CollaborationSlice {
  // Presence
  onlineUsers: PresenceState[];
  cursors: Record<string, { x: number; y: number }>;
  activeLayerByUser: Record<string, string | null>;

  // Actions
  setOnlineUsers: (users: PresenceState[]) => void;
  updateCursor: (userId: string, cursor: { x: number; y: number }) => void;
  removeCursor: (userId: string) => void;
  setActiveLayerByUser: (userId: string, layerId: string | null) => void;
  clearCollaborationState: () => void;
}

export const createCollaborationSlice: StateCreator<StoreState, [], [], CollaborationSlice> = (set) => ({
  onlineUsers: [],
  cursors: {},
  activeLayerByUser: {},

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
      const { [userId]: _, ...rest } = state.cursors;
      return { cursors: rest };
    });
  },

  setActiveLayerByUser: (userId, layerId) => {
    set((state: any) => ({
      activeLayerByUser: { ...state.activeLayerByUser, [userId]: layerId },
    }));
  },

  clearCollaborationState: () => {
    set({ onlineUsers: [], cursors: {}, activeLayerByUser: {} });
  },
});
