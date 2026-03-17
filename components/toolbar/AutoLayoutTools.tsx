import React, { useRef } from 'react';
import { Icons } from '../../constants';
import { IconButton, Divider } from './ToolbarShared';
import { Dropdown } from '../Dropdown';
import { Layer } from '../../types';

interface AutoLayoutToolsProps {
  selectedLayer: Layer;
  handleUpdateLayer: (changes: any) => void;
}

export const AutoLayoutTools = React.memo(({ selectedLayer, handleUpdateLayer }: AutoLayoutToolsProps) => {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isAutoLayout = !!selectedLayer.autoLayout;

  const toggleAutoLayout = () => {
    if (isAutoLayout) {
      handleUpdateLayer({ autoLayout: undefined });
    } else {
      handleUpdateLayer({
        autoLayout: {
          direction: 'row',
          padding: 20,
          spacing: 10,
          alignment: 'center',
        },
        groupId: selectedLayer.groupId || `group_${Date.now()}`
      });
    }
  };

  const updateSetting = (key: string, value: any) => {
    handleUpdateLayer({
      autoLayout: {
        ...selectedLayer.autoLayout,
        [key]: value,
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      <IconButton 
        onClick={toggleAutoLayout} 
        active={isAutoLayout}
        title="Toggle Auto-Layout"
      >
        <Icons.Layout className="w-3.5 h-3.5" />
      </IconButton>
      
      {isAutoLayout && (
        <div className="relative">
          <IconButton 
            ref={buttonRef} 
            onClick={() => setShowDropdown(!showDropdown)}
            title="Auto-Layout Settings"
          >
            <Icons.Settings className="w-3 h-3" />
          </IconButton>
          
          <Dropdown
            anchorRef={buttonRef}
            isOpen={showDropdown}
            onClose={() => setShowDropdown(false)}
            align="center"
          >
            <div className="w-64 bg-[#1e1e1e] rounded-xl shadow-2xl border border-white/10 p-4 space-y-4 backdrop-blur-xl">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Direction</span>
                <div className="flex bg-black/40 rounded-lg p-1">
                  <button 
                    onClick={() => updateSetting('direction', 'row')}
                    className={`flex-1 py-1.5 rounded-md text-[10px] flex justify-center ${selectedLayer.autoLayout?.direction === 'row' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Row
                  </button>
                  <button 
                    onClick={() => updateSetting('direction', 'col')}
                    className={`flex-1 py-1.5 rounded-md text-[10px] flex justify-center ${selectedLayer.autoLayout?.direction === 'col' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Column
                  </button>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Padding</span>
                  <input 
                    type="number" 
                    value={typeof selectedLayer.autoLayout?.padding === 'number' ? selectedLayer.autoLayout.padding : 0}
                    onChange={(e) => updateSetting('padding', parseInt(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg text-xs text-white p-2 outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Spacing</span>
                  <input 
                    type="number" 
                    value={selectedLayer.autoLayout?.spacing || 0}
                    onChange={(e) => updateSetting('spacing', parseInt(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg text-xs text-white p-2 outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Alignment</span>
                <select 
                  value={selectedLayer.autoLayout?.alignment || 'center'}
                  onChange={(e) => updateSetting('alignment', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg text-xs text-white p-2 outline-none focus:border-indigo-500/50"
                >
                  <option value="start">Start</option>
                  <option value="center">Center</option>
                  <option value="end">End</option>
                </select>
              </div>
            </div>
          </Dropdown>
        </div>
      )}
      <Divider />
    </div>
  );
});

AutoLayoutTools.displayName = 'AutoLayoutTools';
