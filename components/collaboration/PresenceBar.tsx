import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';

export const PresenceBar: React.FC = () => {
  const onlineUsers = useStore((s) => s.onlineUsers);
  const [showList, setShowList] = useState(false);

  if (onlineUsers.length <= 1) return null;

  return (
    <div className="relative">
      {/* Stacked avatars */}
      <button
        onClick={() => setShowList(!showList)}
        className="flex items-center -space-x-2 hover:space-x-1 transition-all"
      >
        {onlineUsers.slice(0, 5).map((user, i) => (
          <div
            key={user.userId}
            className="w-7 h-7 rounded-full border-2 border-[#0e1318] flex items-center justify-center text-[10px] font-bold text-white relative"
            style={{
              backgroundColor: user.color,
              zIndex: onlineUsers.length - i,
            }}
            title={user.userName}
          >
            {user.userAvatar ? (
              <img src={user.userAvatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              user.userName.charAt(0).toUpperCase()
            )}
            {/* Online dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0e1318]" />
          </div>
        ))}
        {onlineUsers.length > 5 && (
          <div className="w-7 h-7 rounded-full bg-white/10 border-2 border-[#0e1318] flex items-center justify-center text-[10px] font-bold text-white z-0">
            +{onlineUsers.length - 5}
          </div>
        )}
      </button>

      {/* Dropdown list */}
      <AnimatePresence>
        {showList && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-64 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-3 border-b border-white/5">
              <p className="text-xs font-bold text-white">
                {onlineUsers.length} {onlineUsers.length === 1 ? 'person' : 'people'} online
              </p>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {onlineUsers.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white relative"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.userAvatar ? (
                      <img src={user.userAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      user.userName.charAt(0).toUpperCase()
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-[#1a1a2e]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.userName}</p>
                    <p className="text-[10px] text-gray-500">
                      {user.activeLayerId ? 'Editing a layer' : 'Viewing'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {showList && (
        <div className="fixed inset-0 z-40" onClick={() => setShowList(false)} />
      )}
    </div>
  );
};
