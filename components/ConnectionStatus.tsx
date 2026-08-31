import React from 'react';
import { storageService, ConnectionStatus as ConnectionStatusType } from '../services/storageService';

const STATUS_CONFIG: Record<ConnectionStatusType, { dot: string; text: string; detailText: string }> = {
  connected: {
    dot: 'bg-emerald-500 shadow-emerald-500/50',
    text: 'Cloud sync active',
    detailText: 'Connected to Cloud Storage',
  },
  offline: {
    dot: 'bg-amber-400 shadow-amber-400/50',
    text: 'Saved locally (Offline)',
    detailText: 'No internet — changes saved locally to browser storage',
  },
  error: {
    dot: 'bg-amber-500 shadow-amber-500/50',
    text: 'Saved locally (Cloud pending)',
    detailText: 'Cloud sync pending — changes saved safely to local storage',
  },
};

export const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = React.useState<ConnectionStatusType>(storageService.getConnectionStatus());
  const [lastSync, setLastSync] = React.useState<number | null>(storageService.getLastSyncTime());
  const [pendingCount, setPendingCount] = React.useState(storageService.getPendingChangesCount());
  const [showDetails, setShowDetails] = React.useState(false);
  const detailsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const unsubscribe = storageService.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setLastSync(storageService.getLastSyncTime());
      setPendingCount(storageService.getPendingChangesCount());
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (!showDetails) {
      return;
    }
    const interval = setInterval(() => {
      setLastSync(storageService.getLastSyncTime());
      setPendingCount(storageService.getPendingChangesCount());
    }, 2000);
    return () => clearInterval(interval);
  }, [showDetails]);

  React.useEffect(() => {
    if (!showDetails) {
      return;
    }
    const handleClick = (e: MouseEvent) => {
      if (detailsRef.current && !detailsRef.current.contains(e.target as Node)) {
        setShowDetails(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDetails]);

  let displayStatus = status;
  if (!navigator.onLine) {
    displayStatus = 'offline';
  } else if (status === 'error' && pendingCount === 0) {
    // If it's an error but nothing is pending, it means we fallback to IndexedDB and it's safe.
    displayStatus = 'connected';
  }

  const config = STATUS_CONFIG[displayStatus];

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) {
      return 'Never';
    }
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) {
      return `${seconds}s ago`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className="relative" ref={detailsRef}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/50 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-full hover:bg-black/70 transition-all cursor-pointer shadow-lg"
        title={config.detailText}
        aria-label={`Connection status: ${config.text}`}
      >
        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${config.dot}`} />
        <span className="text-[10px] font-bold tracking-wide text-gray-400 hidden lg:inline opacity-60 hover:opacity-100 transition-opacity">{config.text}</span>
      </button>

      {showDetails && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface-dark-2 border border-white/10 rounded-xl shadow-2xl p-3 z-50">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${config.dot}`} />
            <span className="text-xs font-bold text-white">{config.detailText}</span>
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-400">Last sync</span>
              <span className="text-gray-200 font-medium">{formatTime(lastSync)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pending changes</span>
              <span className={`font-medium ${pendingCount > 0 ? 'text-amber-400' : 'text-gray-200'}`}>
                {pendingCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Network</span>
              <span className="text-gray-200 font-medium">{navigator.onLine ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
