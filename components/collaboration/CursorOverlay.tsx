import React from 'react';
import { useStore } from '../store/useStore';

const CURSOR_SIZE = 20;

export const CursorOverlay: React.FC = () => {
  const cursors = useStore((s) => s.cursors);
  const onlineUsers = useStore((s) => s.onlineUsers);

  const userMap = React.useMemo(() => {
    const map: Record<string, { name: string; color: string; avatar: string | null }> = {};
    for (const u of onlineUsers) {
      map[u.userId] = { name: u.userName, color: u.color, avatar: u.userAvatar };
    }
    return map;
  }, [onlineUsers]);

  return (
    <div className="absolute inset-0 pointer-events-none z-[200]">
      {Object.entries(cursors).map(([userId, cursor]) => {
        const user = userMap[userId];
        if (!user || !cursor) return null;

        return (
          <div
            key={userId}
            className="absolute transition-all duration-75 ease-out"
            style={{
              left: cursor.x,
              top: cursor.y,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* Cursor arrow */}
            <svg
              width={CURSOR_SIZE}
              height={CURSOR_SIZE}
              viewBox="0 0 24 24"
              fill="none"
              style={{ filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.3))` }}
            >
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                fill={user.color}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>

            {/* Name label */}
            <div
              className="absolute left-4 top-4 px-2 py-0.5 rounded-full text-[10px] font-bold text-white whitespace-nowrap shadow-lg"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        );
      })}
    </div>
  );
};
