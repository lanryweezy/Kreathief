import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Icons } from '../constants';

const SnapshotsPanel: React.FC = () => {
  const {
    snapshots,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    fetchSnapshots,
    projectId,
    addToast,
  } = useStore();
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);

  useEffect(() => {
    fetchSnapshots();
  }, [projectId, fetchSnapshots]);

  const handleCreate = async () => {
    const name = newSnapshotName.trim() || `Version ${new Date().toLocaleTimeString()}`;
    setIsCreating(true);
    await createSnapshot(name, undefined);
    setNewSnapshotName('');
    setIsCreating(false);
    addToast?.(`Saved "${name}"`, 'success');
  };

  const handleRestore = async (id: string) => {
    if (confirmRestoreId === id) {
      await restoreSnapshot(id);
      setConfirmRestoreId(null);
      addToast?.('Version restored', 'success');
    } else {
      setConfirmRestoreId(id);
      setTimeout(() => setConfirmRestoreId(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteSnapshot(id);
    addToast?.('Version deleted', 'info');
  };

  return (
    <div className="h-full flex flex-col bg-[#13161a] text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <Icons.History className="w-4 h-4 text-[#7d2ae8]" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Version History</h3>
        </div>
        <p className="text-[10px] text-gray-500">Save checkpoints to restore your design anytime.</p>
      </div>

      {/* Create Snapshot */}
      <div className="p-4 border-b border-gray-800 bg-[#1e1e1e]/60">
        <div className="flex gap-2">
          <input
            type="text"
            value={newSnapshotName}
            onChange={(e) => setNewSnapshotName(e.target.value)}
            placeholder="e.g. Draft 1, Before client review..."
            className="flex-1 bg-[#252627] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7d2ae8] transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="px-3 py-2 bg-[#7d2ae8] hover:bg-[#6b23c5] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="Save current state"
          >
            {isCreating ? (
              <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Icons.Plus className="w-3.5 h-3.5" />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Snapshot List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {snapshots.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center opacity-60">
            <Icons.History className="w-10 h-10 mb-3 text-gray-700" />
            <p className="text-sm font-bold text-gray-500">No saved versions yet</p>
            <p className="text-[10px] text-gray-600 mt-1 max-w-[160px] leading-relaxed">
              Save a version to create a restore point you can jump back to.
            </p>
          </div>
        ) : (
          snapshots.map((snapshot: any) => {
            const layerCount = snapshot.state.artboards
              ? snapshot.state.artboards.reduce((acc: number, a: any) => acc + (a.layers?.length || 0), 0)
              : (snapshot.state.layers?.length || 0);
            const artboardCount = snapshot.state.artboards?.length || 1;
            const date = new Date(snapshot.timestamp);
            const isConfirming = confirmRestoreId === snapshot.id;

            return (
              <div
                key={snapshot.id}
                className={`bg-[#1e1e1e] rounded-xl p-3 border transition-all ${isConfirming ? 'border-amber-500/60 shadow-lg shadow-amber-500/10' : 'border-gray-800 hover:border-gray-700'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-white truncate pr-2">{snapshot.name}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleRestore(snapshot.id)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                        isConfirming
                          ? 'bg-amber-500 text-black hover:bg-amber-400 animate-pulse'
                          : 'bg-[#252627] text-blue-400 hover:bg-blue-600 hover:text-white'
                      }`}
                      title={isConfirming ? 'Click again to confirm restore' : 'Restore this version'}
                    >
                      <Icons.RotateCw className="w-3 h-3" />
                      {isConfirming ? 'Confirm?' : 'Restore'}
                    </button>
                    <button
                      onClick={() => handleDelete(snapshot.id)}
                      className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete snapshot"
                    >
                      <Icons.Trash className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-600">
                  <span className="flex items-center gap-1">
                    <Icons.Layers className="w-2.5 h-2.5" />
                    {layerCount} layers
                  </span>
                  <span className="flex items-center gap-1">
                    <Icons.LayoutGrid className="w-2.5 h-2.5" />
                    {artboardCount} artboard{artboardCount !== 1 ? 's' : ''}
                  </span>
                  <span className="ml-auto bg-[#252627] px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">
                    {snapshot.state.canvasSize?.name || 'Custom'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SnapshotsPanel;
