import React, { useState, useCallback, useMemo } from 'react';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';
import { TextLayer } from '../../types';

interface FindReplaceResult {
  layerId: string;
  layerName: string;
  originalText: string;
  matches: number;
}

export const FindReplaceText: React.FC = () => {
  const artboards = useStore((state) => state.artboards) || [];
  const updateLayer = useStore((state) => state.updateLayer);
  const addToast = useStore((state) => state.addToast);

  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [results, setResults] = useState<FindReplaceResult[]>([]);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);

  // Get all text layers
  const allTextLayers = useMemo(() => {
    return artboards.flatMap((artboard) =>
      artboard.layers.filter((layer): layer is TextLayer => layer.type === 'text' && layer.visible)
    );
  }, [artboards]);

  // Find all matches
  const handleFind = useCallback(() => {
    if (!findText.trim()) {
      setResults([]);
      return;
    }

    const found: FindReplaceResult[] = [];
    const flags = isCaseSensitive ? 'g' : 'gi';
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);

    allTextLayers.forEach((layer) => {
      const matches = (layer.text.match(regex) || []).length;
      if (matches > 0) {
        found.push({
          layerId: layer.id,
          layerName: layer.name || 'Text Layer',
          originalText: layer.text,
          matches,
        });
      }
    });

    setResults(found);
    addToast(`Found ${found.reduce((sum, r) => sum + r.matches, 0)} matches in ${found.length} layers`, 'info');
  }, [findText, isCaseSensitive, allTextLayers, addToast]);

  // Replace in specific layer
  const handleReplaceInLayer = useCallback(
    (layerId: string) => {
      const layer = allTextLayers.find((l) => l.id === layerId);
      if (!layer) {
        return;
      }

      const flags = isCaseSensitive ? 'g' : 'gi';
      const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      const newText = layer.text.replace(regex, replaceText);

      updateLayer(layerId, { text: newText });
      addToast('Text replaced in layer', 'success');

      // Update results
      setResults((prev) => prev.filter((r) => r.layerId !== layerId));
    },
    [findText, replaceText, isCaseSensitive, allTextLayers, updateLayer, addToast]
  );

  // Replace all
  const handleReplaceAll = useCallback(() => {
    if (!findText.trim()) {
      return;
    }

    const flags = isCaseSensitive ? 'g' : 'gi';
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);

    let replaceCount = 0;
    allTextLayers.forEach((layer) => {
      const matches = (layer.text.match(regex) || []).length;
      if (matches > 0) {
        const newText = layer.text.replace(regex, replaceText);
        updateLayer(layer.id, { text: newText });
        replaceCount += matches;
      }
    });

    setResults([]);
    addToast(`Replaced ${replaceCount} occurrences`, 'success');
  }, [findText, replaceText, isCaseSensitive, allTextLayers, updateLayer, addToast]);

  // Select layer
  const handleSelectLayer = useCallback(
    (layerId: string) => {
      useStore.getState().selectLayer(layerId);
      addToast('Layer selected', 'info');
    },
    [addToast]
  );

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Icons.Search className="w-4 h-4 text-gray-400" />
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Find & Replace</h3>
      </div>

      {/* Find Input */}
      <div>
        <label className="text-[10px] text-gray-500 block mb-2">Find</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFind()}
            placeholder="Text to find..."
            className="flex-1 bg-[#252627] border border-gray-600 rounded px-3 py-2 text-sm text-white"
            autoFocus
          />
          <button
            onClick={handleFind}
            disabled={!findText.trim()}
            className="px-4 py-2 bg-[#7d2ae8] hover:bg-[#9d4edd] rounded-lg text-sm font-bold text-white disabled:opacity-50 transition-colors"
          >
            Find
          </button>
        </div>
      </div>

      {/* Replace Input */}
      <div>
        <label className="text-[10px] text-gray-500 block mb-2">Replace</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replacement text..."
            className="flex-1 bg-[#252627] border border-gray-600 rounded px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      {/* Options */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isCaseSensitive}
            onChange={(e) => setIsCaseSensitive(e.target.checked)}
            className="accent-[#7d2ae8]"
          />
          <span className="text-[10px] text-gray-400">Case Sensitive</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={true} disabled className="accent-[#7d2ae8]" />
          <span className="text-[10px] text-gray-400">All Layers</span>
        </label>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-500">
              Found {results.reduce((sum, r) => sum + r.matches, 0)} matches in {results.length} layers
            </p>
            <button onClick={handleReplaceAll} className="text-[10px] text-[#7d2ae8] hover:text-[#9d4edd] font-bold">
              Replace All
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar">
            {results.map((result) => (
              <div key={result.layerId} className="bg-[#252627] border border-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icons.Text className="w-3 h-3 text-gray-500" />
                    <span className="text-xs font-bold text-white">{result.layerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                      {result.matches} matches
                    </span>
                    <button
                      onClick={() => handleSelectLayer(result.layerId)}
                      className="text-[9px] text-[#7d2ae8] hover:text-[#9d4edd]"
                    >
                      Select
                    </button>
                    <button
                      onClick={() => handleReplaceInLayer(result.layerId)}
                      className="text-[9px] text-green-400 hover:text-green-300"
                    >
                      Replace
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 bg-black/30 rounded p-2 break-words">
                  {result.originalText.length > 100
                    ? result.originalText.substring(0, 100) + '...'
                    : result.originalText}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {findText && results.length === 0 && (
        <div className="text-center py-8 opacity-50">
          <Icons.Search className="w-8 h-8 mx-auto mb-2 text-gray-600" />
          <p className="text-xs text-gray-500">No matches found</p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span>Total text layers: {allTextLayers.length}</span>
          <span>Visible layers: {allTextLayers.filter((l) => l.visible).length}</span>
        </div>
      </div>
    </div>
  );
};
