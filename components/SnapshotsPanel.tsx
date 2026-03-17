import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

const SnapshotsPanel: React.FC = () => {
  const { snapshots, createSnapshot, restoreSnapshot, deleteSnapshot, fetchSnapshots, projectId } = useStore();
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchSnapshots();
  }, [projectId, fetchSnapshots]);

  const handleCreate = async () => {
    if (!newSnapshotName.trim()) {
      return;
    }
    setIsCreating(true);
    // In a real app, we'd generate a thumbnail here
    await createSnapshot(newSnapshotName, undefined);
    setNewSnapshotName('');
    setIsCreating(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      <div className="p-4 border-b border-slate-700">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Version History
        </h3>
        <p className="text-xs text-slate-400 mt-1">Save checkpoints of your design to restore later.</p>
      </div>

      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={newSnapshotName}
            onChange={(e) => setNewSnapshotName(e.target.value)}
            placeholder="Version name (e.g. 'Draft 1')"
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={!newSnapshotName.trim() || isCreating}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-2 rounded transition-colors"
            title="Create Snapshot"
          >
            {isCreating ? (
              <span className="animate-spin inline-block">⌛</span>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {snapshots.length === 0 ? (
          <div className="text-center text-slate-500 py-8 flex flex-col items-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-2 opacity-50"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            <p>No snapshots yet.</p>
            <p className="text-xs">Create one to save your progress.</p>
          </div>
        ) : (
          snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className="bg-slate-800 rounded-lg p-3 border border-slate-700 hover:border-slate-600 transition-colors group"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-sm text-slate-200">{snapshot.name}</h4>
                  <p className="text-xs text-slate-500">{new Date(snapshot.timestamp).toLocaleString()}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => restoreSnapshot(snapshot.id)}
                    className="p-1.5 hover:bg-slate-700 text-blue-400 rounded"
                    title="Restore this version"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="1 4 1 10 7 10"></polyline>
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteSnapshot(snapshot.id)}
                    className="p-1.5 hover:bg-slate-700 text-red-400 rounded"
                    title="Delete snapshot"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="text-xs text-slate-500 flex justify-between">
                <span>
                  {snapshot.state.artboards
                    ? snapshot.state.artboards.reduce((acc: number, a: any) => acc + (a.layers?.length || 0), 0)
                    : (snapshot.state.layers?.length || 0)
                  } layers
                </span>
                <span className="bg-slate-900 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
                  {snapshot.state.canvasSize?.name || 'Custom'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SnapshotsPanel;
