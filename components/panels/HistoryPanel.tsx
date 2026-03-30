import React from 'react';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';

export const HistoryPanel: React.FC = () => {
  const past = useStore((state) => state.past) || [];
  const future = useStore((state) => state.future) || [];
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const addToast = useStore((state) => state.addToast);

  const handleUndo = () => {
    if (past.length === 0) {
      addToast('Nothing to undo', 'warning');
      return;
    }
    undo();
    addToast('Undone', 'info');
  };

  const handleRedo = () => {
    if (future.length === 0) {
      addToast('Nothing to redo', 'warning');
      return;
    }
    redo();
    addToast('Redone', 'info');
  };

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Icons.History className="w-4 h-4 text-gray-400" />
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">History</h3>
      </div>

      {/* Undo/Redo Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleUndo}
          disabled={past.length === 0}
          className="flex-1 py-2 bg-[#252627] hover:bg-gray-700 rounded text-xs text-gray-400 hover:text-white disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Icons.Undo className="w-3 h-3" />
          Undo ({past.length})
        </button>
        <button
          onClick={handleRedo}
          disabled={future.length === 0}
          className="flex-1 py-2 bg-[#252627] hover:bg-gray-700 rounded text-xs text-gray-400 hover:text-white disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Icons.Redo className="w-3 h-3" />
          Redo ({future.length})
        </button>
      </div>

      {/* History Stack */}
      <div>
        <label className="text-[10px] text-gray-500 block mb-2">Recent Actions</label>
        <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar">
          {past.length === 0 ? (
            <div className="text-center py-4 opacity-50">
              <Icons.History className="w-6 h-6 mx-auto mb-2 text-gray-600" />
              <p className="text-[10px] text-gray-500">No history yet</p>
            </div>
          ) : (
            [...past].reverse().map((entry, index) => {
              const state = entry.type === 'snapshot' ? entry.state : null;
              const numLayers =
                state?.artboards?.reduce((sum: number, a: any) => sum + (a.layers?.length || 0), 0) || 0;
              const actionType = entry.type === 'snapshot' ? 'Checkpoint' : 'Change';
              return (
                <div
                  key={`hist-${past.length - index}`}
                  className="text-[10px] text-gray-400 bg-[#252627] rounded px-2 py-1.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${entry.type === 'snapshot' ? 'bg-[#7d2ae8]' : 'bg-gray-600'}`}
                    />
                    <span className="font-bold text-gray-300">
                      {actionType} {past.length - index}
                    </span>
                  </div>
                  {state && (
                    <span className="text-[9px] text-gray-500 bg-black/20 px-1.5 py-0.5 rounded font-mono">
                      {numLayers} {numLayers === 1 ? 'layer' : 'layers'}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="pt-3 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
          <div>
            <span className="text-gray-600">Past:</span> {past.length}
          </div>
          <div>
            <span className="text-gray-600">Future:</span> {future.length}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="pt-3 border-t border-gray-700">
        <p className="text-[9px] text-gray-600">
          <strong className="text-gray-500">Shortcuts:</strong> Ctrl+Z (Undo), Ctrl+Y (Redo)
        </p>
      </div>
    </div>
  );
};
