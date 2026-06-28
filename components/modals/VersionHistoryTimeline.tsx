import React, { useState, useCallback, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { Button } from '../Button';
import { DesignSnapshot } from '../../types';

/**
 * Feature 6: Version History Timeline — visual timeline with thumbnails.
 * Shows design history as a scrubable timeline like a video editor.
 */
export const VersionHistoryTimeline: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { snapshots, fetchSnapshots, restoreSnapshot, createSnapshot, deleteSnapshot } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  const handleCreate = useCallback(async () => {
    if (!snapshotName.trim()) {
      return;
    }
    setIsCreating(true);
    try {
      await createSnapshot(snapshotName.trim());
      setSnapshotName('');
      fetchSnapshots();
    } finally {
      setIsCreating(false);
    }
  }, [snapshotName, createSnapshot, fetchSnapshots]);

  const handleRestore = useCallback(
    async (id: string) => {
      await restoreSnapshot(id);
      onClose();
    },
    [restoreSnapshot, onClose]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteSnapshot(id);
      fetchSnapshots();
    },
    [deleteSnapshot, fetchSnapshots]
  );

  const sortedSnapshots = [...snapshots].sort((a: DesignSnapshot, b: DesignSnapshot) => b.timestamp - a.timestamp);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) {
      return 'Just now';
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) {
      return `${diffHrs}h ago`;
    }
    return d.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-overlay flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-surface-dark-3 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Icons.Clock className="w-5 h-5 text-brand-600" />
            <h2 className="text-sm font-bold text-white">Version History</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icons.X className="w-4 h-4" />
          </Button>
        </div>

        {/* Create Snapshot */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              placeholder="Snapshot name..."
              className="flex-1 bg-surface-dark-4 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-brand-600 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button variant="primary" size="sm" onClick={handleCreate} disabled={isCreating || !snapshotName.trim()}>
              {isCreating ? 'Saving...' : 'Save Snapshot'}
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-4">
          {sortedSnapshots.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icons.Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-xs">No snapshots yet. Save your first snapshot above.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700" />

              <div className="space-y-3">
                {sortedSnapshots.map((snap: DesignSnapshot, idx: number) => (
                  <div
                    key={snap.id}
                    className={`relative flex items-start gap-4 pl-10 cursor-pointer group transition-all ${
                      selectedId === snap.id ? 'opacity-100' : 'hover:opacity-100 opacity-80'
                    }`}
                    onClick={() => setSelectedId(snap.id)}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 transition-all ${
                        idx === 0
                          ? 'bg-brand-600 border-brand-600'
                          : 'bg-surface-dark-3 border-gray-600 group-hover:border-brand-600'
                      }`}
                    />

                    {/* Snapshot card */}
                    <div
                      className={`flex-1 p-3 rounded-xl border transition-all ${
                        selectedId === snap.id
                          ? 'bg-brand-600/10 border-brand-600'
                          : 'bg-surface-dark-4 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{snap.name}</span>
                        <span className="text-[10px] text-gray-500">{formatTime(snap.timestamp)}</span>
                      </div>

                      {/* Thumbnail preview */}
                      {snap.thumbnail && (
                        <div className="w-full h-20 rounded-lg overflow-hidden mb-2 bg-surface-dark-0">
                          <img src={snap.thumbnail} alt={snap.name} className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Actions */}
                      {selectedId === snap.id && (
                        <div className="flex gap-2 mt-2 animate-fade-in">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(snap.id);
                            }}
                            className="flex-1"
                          >
                            Restore
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(snap.id);
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Icons.Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

VersionHistoryTimeline.displayName = 'VersionHistoryTimeline';
