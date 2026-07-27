import React from 'react';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';

const CURSOR_SIZE = 20;

/**
 * Enhanced CursorOverlay — shows remote users' cursors, selection bounds,
 * pulse animations, avatars, name labels, and active editing state.
 */
export const CursorOverlay: React.FC = () => {
  const { cursors, onlineUsers, activeLayerByUser, remoteSelections } = useStore(
    useShallow((s) => ({
      cursors: s.cursors,
      onlineUsers: s.onlineUsers,
      activeLayerByUser: s.activeLayerByUser,
      remoteSelections: s.remoteSelections,
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
      {/* Remote Selection Bounds */}
      {Object.entries(remoteSelections || {}).map(([userId, selection]) => {
        const user = userMap[userId];
        if (!user || !selection || selection.width <= 0 || selection.height <= 0) return null;

        return (
          <div
            key={`selection-${userId}`}
            className="absolute transition-all duration-75 ease-out rounded border-2 pointer-events-none"
            style={{
              left: selection.x,
              top: selection.y,
              width: selection.width,
              height: selection.height,
              borderColor: user.color,
              backgroundColor: `${user.color}15`,
            }}
          >
            <div
              className="absolute -top-5 left-0 px-1.5 py-0.5 rounded-t text-[9px] font-bold text-white whitespace-nowrap shadow-sm"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        );
      })}

      {/* Remote Cursors */}
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

            {/* Name label */}
            <div
              className="absolute left-4 top-4 px-2 py-0.5 rounded-full text-[10px] font-bold text-white whitespace-nowrap shadow-lg backdrop-blur-sm flex items-center gap-1"
              style={{ backgroundColor: user.color, border: '1px solid rgba(255,255,255,0.3)' }}
            >
              {user.avatar && (
                <img src={user.avatar} className="w-3 h-3 rounded-full object-cover" alt="" />
              )}
              {user.name}
            </div>

            {/* Active layer indicator */}
            {layerName && (
              <div
                className="absolute left-4 top-8 px-1.5 py-0.5 rounded text-[8px] font-medium text-white/80 whitespace-nowrap"
                style={{ backgroundColor: `${user.color}aa` }}
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
