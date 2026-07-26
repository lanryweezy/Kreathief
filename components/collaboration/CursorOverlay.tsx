import React from 'react';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';

const CURSOR_SIZE = 20;

/**
 * Enhanced CursorOverlay — shows remote users' cursors with
 * pulse animation, avatar, name labels, and selection awareness.
 */
export const CursorOverlay: React.FC = () => {
  // ⚡ Bolt Optimization: Use useShallow with specific selectors to prevent the component from
  // unnecessarily re-rendering on unrelated global state updates and reduce React hook overhead (3 hooks down to 1).
  const { cursors, onlineUsers, activeLayerByUser } = useStore(
    useShallow((s) => ({
      cursors: s.cursors,
      onlineUsers: s.onlineUsers,
      activeLayerByUser: s.activeLayerByUser,
    }))
  );

  const userMap = React.useMemo(() => {
    const map: Record<string, { name: string; color: string; avatar: string | null }> = {};
    for (const u of onlineUsers) {
      map[u.userId] = { name: u.userName, color: u.color, avatar: u.userAvatar };
    }
    return map;
  }, [onlineUsers]);

  const layers = useStore((s) => {
    const ab = s.artboards.find((a) => a.id === s.activeArtboardId);
    return ab?.layers || [];
  });

  const layerMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const l of layers) {
      map[l.id] = l.name || l.id.slice(0, 8);
    }
    return map;
  }, [layers]);

  return (
    <div className="absolute inset-0 pointer-events-none z-raised">
      {Object.entries(cursors).map(([userId, cursor]) => {
        const user = userMap[userId];
        if (!user || !cursor) {
          return null;
        }

        const activeLayerId = activeLayerByUser?.[userId];
        const layerName = activeLayerId ? layerMap[activeLayerId] : null;

        return (
          <div
            key={userId}
            className="absolute transition-all duration-100 ease-out"
            style={{
              left: cursor.x,
              top: cursor.y,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* Cursor arrow with pulse animation */}
            <div className="relative">
              <svg
                width={CURSOR_SIZE}
                height={CURSOR_SIZE}
                viewBox="0 0 24 24"
                fill="none"
                style={{ filter: `drop-shadow(0 1px 3px rgba(0,0,0,0.4))` }}
              >
                <path
                  d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                  fill={user.color}
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>

              {/* Pulse ring */}
              <div
                className="absolute -inset-1 rounded-full animate-ping opacity-20"
                style={{ backgroundColor: user.color }}
              />
            </div>

            {/* Name label with better contrast */}
            <div
              className="absolute left-4 top-4 px-2 py-0.5 rounded-full text-[10px] font-bold text-white whitespace-nowrap shadow-lg backdrop-blur-sm"
              style={{ backgroundColor: user.color, border: '1px solid rgba(255,255,255,0.3)' }}
            >
              {user.avatar ? (
                <div className="flex items-center gap-1">
                  <img src={user.avatar} className="w-3 h-3 rounded-full" alt="" />
                  {user.name}
                </div>
              ) : (
                user.name
              )}
            </div>

            {/* Active layer indicator */}
            {layerName && (
              <div
                className="absolute left-4 top-7 px-1.5 py-0.5 rounded text-[8px] font-medium text-white/80 whitespace-nowrap"
                style={{ backgroundColor: `${user.color}88` }}
              >
                editing: {layerName}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
