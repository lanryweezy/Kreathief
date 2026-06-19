import { useEffect, useCallback, useRef } from 'react';
import { collaborationService, PresenceState, LayerChange } from '../../services/collaborationService';
import { useStore } from '../../store/useStore';
import { User } from '../../types';

export function useCollaboration(projectId: string | null, user: User | null) {
  const setOnlineUsers = useStore((s) => s.setOnlineUsers);
  const updateCursor = useStore((s) => s.updateCursor);
  const removeCursor = useStore((s) => s.removeCursor);
  const clearCollaborationState = useStore((s) => s.clearCollaborationState);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!projectId || !user || user.isGuest) return;
    if (joinedRef.current) return;
    joinedRef.current = true;

    collaborationService.joinProject(projectId, {
      id: user.id,
      name: user.name,
      avatar: user.avatar || null,
    }, {
      onPresenceChange: (users: PresenceState[]) => {
        setOnlineUsers(users);
      },
      onCursorMove: (userId: string, cursor: { x: number; y: number }) => {
        updateCursor(userId, cursor);
      },
      onUserLeft: (userId: string) => {
        removeCursor(userId);
      },
    });

    return () => {
      collaborationService.leaveProject();
      clearCollaborationState();
      joinedRef.current = false;
    };
  }, [projectId, user?.id]);

  const broadcastCursor = useCallback((cursor: { x: number; y: number }) => {
    collaborationService.broadcastCursor(cursor);
  }, []);

  const broadcastLayerChange = useCallback((change: Omit<LayerChange, 'userId' | 'timestamp'>) => {
    collaborationService.broadcastLayerChange(change);
  }, []);

  const updatePresence = useCallback((updates: Partial<PresenceState>) => {
    collaborationService.updatePresence(updates);
  }, []);

  return {
    broadcastCursor,
    broadcastLayerChange,
    updatePresence,
  };
}
