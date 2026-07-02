import { useState, useCallback } from 'react';
import { WorkflowPreset } from '../../types/nodes';
import { WORKFLOW_PRESETS, getPresetsByCategory } from '../../data/workflowPresets';
import { useNodeGraph } from '../../hooks/useNodeGraph';

interface WorkflowPresetsProps {
  onSelect: (presetId: string) => void;
}

const PRESET_TABS: { id: WorkflowPreset['category']; label: string; icon: string }[] = [
  { id: 'kittl', label: 'Kittl', icon: '👕' },
  { id: 'glorify', label: 'Glorify', icon: '📦' },
  { id: 'weave', label: 'Weave', icon: '🔗' },
  { id: 'kreathief', label: 'KreaThief', icon: '⭐' },
];

function WorkflowPresets({ onSelect }: WorkflowPresetsProps) {
  const [activeTab, setActiveTab] = useState<WorkflowPreset['category']>('kittl');
  const loadPreset = useNodeGraph((s) => s.loadPreset);

  const presets = getPresetsByCategory(activeTab);

  const handleSelect = useCallback(
    (presetId: string) => {
      loadPreset(presetId);
      onSelect(presetId);
    },
    [loadPreset, onSelect]
  );

  return (
    <div className="bg-surface-dark-2 border border-white/10 rounded-lg overflow-hidden">
      <div className="flex border-b border-white/10">
        {PRESET_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-brand-600 text-white'
                : 'text-white/60 hover:text-white hover:bg-surface-dark-3'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelect(preset.id)}
            className="w-full text-left p-3 rounded-md bg-surface-dark-3 border border-white/5 hover:border-brand-600/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{preset.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">{preset.name}</div>
                <div className="text-[10px] text-white/40 truncate">{preset.description}</div>
              </div>
            </div>
          </button>
        ))}
        {presets.length === 0 && (
          <div className="text-center text-white/30 text-xs py-4">No presets available</div>
        )}
      </div>
    </div>
  );
}

export default WorkflowPresets;
