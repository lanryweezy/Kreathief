import { useEffect, useCallback, useRef } from 'react';
import { collaborationService, PresenceState, LayerChange } from '../services/collaborationService';
import { useStore } from '../store/useStore';
import { User } from '../types';

export function useCollaboration(projectId: string | null, user: User | null) {
  const setOnlineUsers = useStore((s) => s.setOnlineUsers);
  const updateCursor = useStore((s) => s.updateCursor);
  const removeCursor = useStore((s) => s.removeCursor);
  const setRemoteSelection = useStore((s) => s.setRemoteSelection);
  const updateLayer = useStore((s) => s.updateLayer);
  const addLayer = useStore((s) => s.addLayer);
  const deleteLayer = useStore((s) => s.deleteLayer);
  const clearCollaborationState = useStore((s) => s.clearCollaborationState);
  const addToast = useStore((s) => s.addToast);
  const onlineUsers = useStore((s) => s.onlineUsers);
  const joinedRef = useRef(false);
  const prevUserCountRef = useRef(0);

  useEffect(() => {
    if (!projectId || !user) return;
    if (joinedRef.current) return;
    joinedRef.current = true;

    collaborationService.joinProject(
      projectId,
      {
        id: user.id,
        name: user.name || 'Guest Designer',
        avatar: user.avatar || null,
      },
      {
        onPresenceChange: (users: PresenceState[]) => {
          setOnlineUsers(users);
        },
        onCursorMove: (userId: string, cursor: { x: number; y: number }) => {
          updateCursor(userId, cursor);
        },
        onSelectionChange: (userId: string, selection) => {
          setRemoteSelection(userId, selection);
        },
        onLayerChange: (change: LayerChange) => {
          if (change.type === 'update' && change.layerId && change.data) {
            updateLayer(change.layerId, change.data);
          } else if (change.type === 'create' && change.data) {
            addLayer(change.data);
          } else if (change.type === 'delete' && change.layerId) {
            deleteLayer(change.layerId);
          }
        },
        onUserLeft: (userId: string) => {
          removeCursor(userId);
          setRemoteSelection(userId, null);
        },
      }
    );

    return () => {
      collaborationService.leaveProject();
      clearCollaborationState();
      joinedRef.current = false;
    };
  }, [projectId, user?.id]);

  // Toast notifications for user join/leave
  useEffect(() => {
    if (onlineUsers.length === 0) return;

    const otherUsers = onlineUsers.filter((u) => u.userId !== user?.id);
    const prevOtherCount = Math.max(0, prevUserCountRef.current - (user ? 1 : 0));

    if (otherUsers.length > prevOtherCount && prevUserCountRef.current > 0) {
      const newUser = otherUsers.find(
        (u) => !onlineUsers.slice(0, prevOtherCount + 1).some((p) => p.userId === u.userId)
      );
      if (newUser) {
        addToast(`${newUser.userName} joined the design`, 'info');
      }
    } else if (otherUsers.length < prevOtherCount && otherUsers.length >= 0) {
      addToast('Someone left the design', 'info');
    }

    prevUserCountRef.current = onlineUsers.length;
  }, [onlineUsers, user?.id]);

  const broadcastCursor = useCallback((cursor: { x: number; y: number }) => {
    collaborationService.broadcastCursor(cursor);
  }, []);

  const broadcastSelection = useCallback(
    (selection: { x: number; y: number; width: number; height: number; layerId: string | null } | null) => {
      collaborationService.broadcastSelection(selection);
    },
    []
  );

  const broadcastLayerChange = useCallback((change: Omit<LayerChange, 'userId' | 'timestamp'>) => {
    collaborationService.broadcastLayerChange(change);
  }, []);

  const updatePresence = useCallback((updates: Partial<PresenceState>) => {
    collaborationService.updatePresence(updates);
  }, []);

  return {
    broadcastCursor,
    broadcastSelection,
    broadcastLayerChange,
    updatePresence,
  };
}
