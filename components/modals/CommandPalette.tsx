import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';

import { iconScoutService, IconScoutAsset } from '../../services/iconScoutService';
import { communityService, CommunityTemplate } from '../../services/communityService';

export const CommandPalette: React.FC = () => {
  const isOpen = useStore((state) => state.isCommandPaletteOpen);
  const setOpen = useStore((state) => state.setCommandPaletteOpen);
  
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [assetResults, setAssetResults] = useState<IconScoutAsset[]>([]);
  const [communityResults, setCommunityResults] = useState<CommunityTemplate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Store actions
  const { 
    addTextLayer, addShapeLayer, addAdjustmentLayer, addImageLayer, 
    magicResize, generateAutoLayouts, applyStyleFromImage, 
    setIsExporting, 
    groupSelected, ungroupSelected, deleteSelected, duplicateSelected,
    initializeProject
  } = useStore();

  // Unified Intelligence: Search Assets & Community as user types
  useEffect(() => {
    if (!query || query.length < 2) {
      setAssetResults([]);
      setCommunityResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [assets, templates] = await Promise.all([
          iconScoutService.search(query, 'icon'),
          communityService.fetchTemplates('All', query)
        ]);
        setAssetResults(assets.slice(0, 5));
        setCommunityResults(templates.slice(0, 3));
      } catch (e) { console.error(e); }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  type Cmd = { id: string; label: string; icon: any; action: () => void; group?: string; type?: 'action' | 'asset' | 'template' };
  
  const commandList: Cmd[] = [
    { id: 'text', label: 'Add Text', icon: Icons.Text, action: () => addTextLayer(), group: 'Creation' },
    { id: 'rect', label: 'Add Rectangle', icon: Icons.Square, action: () => addShapeLayer('rectangle'), group: 'Creation' },
    { id: 'adjust', label: 'Add Adjustment Layer', icon: Icons.Filter, action: () => addAdjustmentLayer(), group: 'Effects' },
    { id: 'export', label: 'Export Design', icon: Icons.Download, action: () => setIsExporting(true), group: 'General' },
    { id: 'group', label: 'Group Selected', icon: Icons.Group, action: () => groupSelected(), group: 'Arrange' },
    { id: 'ungroup', label: 'Ungroup Selected', icon: Icons.Ungroup, action: () => ungroupSelected(), group: 'Arrange' },
    { id: 'duplicate', label: 'Duplicate Selected', icon: Icons.Copy, action: () => duplicateSelected(), group: 'Arrange' },
    { id: 'delete', label: 'Delete Selected', icon: Icons.Trash, action: () => deleteSelected(), group: 'Arrange' },
    { id: 'resize', label: 'AI Magic Resize', icon: Icons.Sparkles, action: () => magicResize(1080, 1080, 'Instagram Post'), group: 'AI' },
    { id: 'autolayout', label: 'Generate Auto Layout', icon: Icons.Layout, action: () => generateAutoLayouts(), group: 'AI' },
    { id: 'style', label: 'Apply Style from Image', icon: Icons.Droplet, action: () => applyStyleFromImage(''), group: 'AI' },
  ];

  const filteredActions = query 
    ? commandList.filter((c) => c.label.toLowerCase().includes(query.toLowerCase())) 
    : commandList;

  // Combine all results for unified navigation
  const allResults: Cmd[] = [
    ...filteredActions.map(a => ({ ...a, type: 'action' as const })),
    ...assetResults.map(a => ({ 
      id: a.uuid, 
      label: `Add Icon: ${a.name}`, 
      icon: Icons.Image, 
      action: () => addImageLayer(a.previewUrl), 
      type: 'asset' as const,
      group: 'Icons'
    })),
    ...communityResults.map(t => ({ 
      id: t.id, 
      label: `Template: ${t.name}`, 
      icon: Icons.Layout, 
      action: () => initializeProject(t.state), 
      type: 'template' as const,
      group: 'Community'
    }))
  ];

  // Grouping for the initial state (when query is empty)
  const grouped = Array.from(
    allResults.reduce((acc, cmd) => {
      const group = cmd.group || 'Other';
      if (!acc.has(group)) {acc.set(group, []);}
      acc.get(group)!.push(cmd);
      return acc;
    }, new Map<string, Cmd[]>())
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) {return;}
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const res = allResults[selectedIndex];
        if (res) {
          res.action();
          setOpen(false);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allResults, selectedIndex, setOpen]);

  // Global trigger for Ctrl+K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, setOpen]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) {return null;}

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm p-4">
      <div 
        className="absolute inset-0" 
        onClick={() => setOpen(false)}
      />
      
      <div className="relative w-full max-w-xl bg-[#13161a] border border-gray-800 rounded-xl shadow-2xl overflow-hidden animate-fade-in flex flex-col">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-800">
          <Icons.Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-white text-lg outline-none placeholder-gray-500"
            placeholder="Search commands..."
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
          {isSearching && (
            <div className="mr-3 animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />
          )}
          <div className="flex gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-[#0a0a0c] px-2 py-1 rounded">
            <span>ESC</span> to close
          </div>
        </div>

        {/* Command List */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
          {allResults.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">No commands found for &quot;{query}&quot;</div>
          ) : query ? (
            <div className="flex flex-col gap-1">
              {allResults.map((cmd, index) => {
                const Icon = cmd.icon;
                const isSelected = index === selectedIndex;
                return (
                  <button 
                    key={cmd.id} 
                    onMouseEnter={() => setSelectedIndex(index)} 
                    onClick={() => { cmd.action(); setOpen(false); }}
                    className={`flex items-center w-full px-3 py-3 rounded-lg text-left transition-colors ${isSelected ? 'bg-purple-500/20 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-md mr-3 ${isSelected ? 'bg-purple-500/40 text-purple-400' : 'bg-[#1a1d21] text-gray-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm flex-1">{cmd.label}</span>
                    {cmd.group && <span className="text-[10px] text-gray-500 ml-2 bg-gray-800/50 px-1.5 py-0.5 rounded">{cmd.group}</span>}
                    {isSelected && <span className="ml-auto text-[10px] font-bold tracking-widest uppercase text-purple-500">Return</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {grouped.map(([group, cmds]) => (
                <div key={group}>
                  <div className="px-3 py-1 text-[10px] font-black text-gray-600 uppercase tracking-widest">{group}</div>
                  <div className="flex flex-col gap-1">
                    {cmds.map((cmd) => {
                      const index = allResults.indexOf(cmd);
                      const Icon = cmd.icon;
                      const isSelected = index === selectedIndex;
                      return (
                        <button 
                          key={cmd.id} 
                          onMouseEnter={() => setSelectedIndex(index)} 
                          onClick={() => { cmd.action(); setOpen(false); }}
                          className={`flex items-center w-full px-3 py-3 rounded-lg text-left transition-colors ${isSelected ? 'bg-purple-500/20 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                        >
                          <div className={`flex items-center justify-center w-8 h-8 rounded-md mr-3 ${isSelected ? 'bg-purple-500/40 text-purple-400' : 'bg-[#1a1d21] text-gray-500'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-sm flex-1">{cmd.label}</span>
                          {isSelected && <span className="ml-auto text-[10px] font-bold tracking-widest uppercase text-purple-500">Return</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
