import React from 'react';
import { Icons } from '../constants';
import { useStore } from '../store/useStore';

export const SyncStatus: React.FC = () => {
  const syncStatus = useStore((state) => state.syncStatus);
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: <Icons.Help className="w-3.5 h-3.5" />, // Fallback for CloudOff
        text: 'Offline Mode',
        color: 'text-orange-400',
        bg: 'bg-orange-400/10',
      };
    }

    switch (syncStatus) {
      case 'syncing':
        return {
          icon: <Icons.RefreshCw className="w-3.5 h-3.5 animate-spin" />,
          text: 'Syncing...',
          color: 'text-blue-400',
          bg: 'bg-blue-400/10',
        };
      case 'error':
        return {
          icon: <Icons.Help className="w-3.5 h-3.5" />, // Fallback for AlertCircle
          text: 'Sync Error',
          color: 'text-red-400',
          bg: 'bg-red-400/10',
        };
      case 'synced':
      default:
        return {
          icon: <Icons.Cloud className="w-3.5 h-3.5" />,
          text: 'Cloud Synced',
          color: 'text-green-400',
          bg: 'bg-green-400/10',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div 
      className={`flex items-center gap-2 px-2.5 py-1 rounded-full border border-white/5 transition-all duration-300 ${config.bg} ${config.color}`}
      title={config.text}
    >
      {config.icon}
      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
        {config.text}
      </span>
    </div>
  );
};
