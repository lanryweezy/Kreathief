import { log } from '../../utils/log';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Icons } from '../../constants';
import { NavTab } from '../../types';
import { getAllCommands, searchCommands, Command as RegistryCommand } from '../../commands/registry';

import * as freepikService from '../../services/freepikService';
import { iconScoutService } from '../../services/iconScoutService';
import { communityService, CommunityTemplate } from '../../services/communityService';
import { Button } from '../Button';

export const CommandPalette: React.FC = () => {
  const {
    isOpen,
    setOpen,
    setActiveTab,
    addTextLayer,
    addShapeLayer,
    addAdjustmentLayer,
    addImageLayer,
    setIsExporting,
    groupSelected,
    ungroupSelected,
    initializeProject,
    moveLayer,
    alignLayers,
    setSelectedLayerIds,
    setPenMode,
  } = useStore(
    useShallow((state) => ({
      isOpen: (state as any).isCommandPaletteOpen,
      setOpen: state.setCommandPaletteOpen,
      setActiveTab: state.setActiveTab,
      addTextLayer: state.addTextLayer,
      addShapeLayer: state.addShapeLayer,
      addAdjustmentLayer: state.addAdjustmentLayer,
      addImageLayer: state.addImageLayer,
      setIsExporting: state.setIsExporting,
      groupSelected: state.groupSelected,
      ungroupSelected: state.ungroupSelected,
      initializeProject: state.initializeProject,
      moveLayer: state.moveLayer,
      alignLayers: state.alignLayers,
      setSelectedLayerIds: state.setSelectedLayerIds,
      setPenMode: state.setPenMode,
    }))
  );

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [assetResults, setAssetResults] = useState<any[]>([]);
  const [communityResults, setCommunityResults] = useState<CommunityTemplate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Unified Intelligence: Search Assets & Community as user types
  useEffect(() => {
    if (!query || query.length < 2) {
      setAssetResults([]);
      setCommunityResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      if (!query || query.length < 2) {
        return;
      }
      setIsSearching(true);
      try {
        const [assets, templates] = await Promise.all([
          freepikService.searchIcons(query, 5).catch(() => []),
          communityService.fetchTemplates('All', query).catch(() => []),
        ]);
        setAssetResults(Array.isArray(assets) ? assets.slice(0, 5) : []);
        setCommunityResults(Array.isArray(templates) ? templates.slice(0, 3) : []);
      } catch (e) {
        log.error('[CommandPalette] Search error', e);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  type Cmd = { id: string; label: string; icon: any; action: () => void; group?: string; shortcut?: string };

  const registryToCmd = useMemo(() => {
    return getAllCommands().map(
      (rc: RegistryCommand): Cmd => ({
        id: rc.id,
        label: rc.label,
        icon: Icons.Code,
        action: rc.action,
        group: rc.category,
        shortcut: rc.shortcut,
      })
    );
  }, []);

  const commandList: Cmd[] = useMemo(
    () => [
      // --- PANELS (Navigation) ---
      {
        id: 'nav_ai',
        label: 'Open Design Agent (AI Assistant)',
        icon: Icons.Bot,
        action: () => useStore.getState().setShowAIOverlay(true, 'assistant'),
        group: 'Panels',
      },
      {
        id: 'nav_magic',
        label: 'Open AI Image Generator (AI Magic)',
        icon: Icons.Magic,
        action: () => useStore.getState().setShowAIOverlay(true, 'generate'),
        group: 'Panels',
      },
      {
        id: 'nav_templates',
        label: 'Browse Templates',
        icon: Icons.Templates,
        action: () => setActiveTab(NavTab.TEMPLATES),
        group: 'Panels',
      },
      {
        id: 'nav_layers',
        label: 'Open Layers Panel',
        icon: Icons.Layers,
        action: () => setActiveTab(NavTab.LAYERS),
        group: 'Panels',
        shortcut: 'L',
      },
      {
        id: 'nav_brand',
        label: 'Open Brand Kit',
        icon: Icons.Brand,
        action: () => setActiveTab(NavTab.BRAND),
        group: 'Panels',
        shortcut: 'B',
      },
      {
        id: 'nav_vector',
        label: 'Open Image Trace',
        icon: Icons.Union,
        action: () => setActiveTab(NavTab.VECTORIZER),
        group: 'Panels',
      },
      {
        id: 'nav_mockup',
        label: 'Open Mockup Studio',
        icon: Icons.Mockup,
        action: () => setActiveTab(NavTab.MOCKUP),
        group: 'Panels',
      },
      {
        id: 'nav_draw',
        label: 'Open Draw Tool',
        icon: Icons.Brush,
        action: () => {
          setPenMode(true);
          setActiveTab(NavTab.DRAW);
        },
        group: 'Panels',
        shortcut: 'P',
      },
      {
        id: 'nav_arrange',
        label: 'Open Arrange & Layout',
        icon: Icons.Layout,
        action: () => setActiveTab(NavTab.MEDIA),
        group: 'Panels',
      },
      {
        id: 'nav_effects',
        label: 'Open Text Effects',
        icon: Icons.Zap,
        action: () => setActiveTab(NavTab.TEXT),
        group: 'Panels',
      },
      {
        id: 'nav_textures',
        label: 'Open Texture Library',
        icon: Icons.Texture,
        action: () => setActiveTab(NavTab.TEXTURES),
        group: 'Panels',
      },

      // --- TOOLS (Creation) ---
      {
        id: 'tool_text',
        label: 'Add Text Layer',
        icon: Icons.Text,
        action: () => addTextLayer(),
        group: 'Tools',
        shortcut: 'T',
      },
      {
        id: 'tool_rect',
        label: 'Add Rectangle',
        icon: Icons.Square,
        action: () => addShapeLayer('rectangle'),
        group: 'Tools',
        shortcut: 'R',
      },
      {
        id: 'tool_circle',
        label: 'Add Circle',
        icon: Icons.Circle,
        action: () => addShapeLayer('circle'),
        group: 'Tools',
        shortcut: 'O',
      },
      {
        id: 'tool_adjust',
        label: 'Add Adjustment Layer',
        icon: Icons.Filter,
        action: () => addAdjustmentLayer(),
        group: 'Tools',
      },
      {
        id: 'tool_v',
        label: 'Switch to Select Tool',
        icon: Icons.Pointer,
        action: () => {
          setSelectedLayerIds([]);
          setPenMode(false);
        },
        group: 'Tools',
        shortcut: 'V',
      },

      // --- OPERATIONS (Arrange) ---
      {
        id: 'op_group',
        label: 'Group Selection',
        icon: Icons.Group,
        action: () => groupSelected(),
        group: 'Arrange',
        shortcut: 'Ctrl+G',
      },
      {
        id: 'op_ungroup',
        label: 'Ungroup Selection',
        icon: Icons.Ungroup,
        action: () => ungroupSelected(),
        group: 'Arrange',
        shortcut: 'Ctrl+Shift+G',
      },
      {
        id: 'op_front',
        label: 'Bring to Front',
        icon: Icons.Layers,
        action: () => {
          const s = useStore.getState();
          const id = s.selectedLayerIds[0];
          if (id) {
            moveLayer(id, 'front');
          }
        },
        group: 'Arrange',
        shortcut: ']',
      },
      {
        id: 'op_back',
        label: 'Send to Back',
        icon: Icons.Layers,
        action: () => {
          const s = useStore.getState();
          const id = s.selectedLayerIds[0];
          if (id) {
            moveLayer(id, 'back');
          }
        },
        group: 'Arrange',
        shortcut: '[',
      },

      // --- ALIGNMENT ---
      {
        id: 'align_left',
        label: 'Align Left',
        icon: Icons.AlignLeft,
        action: () => alignLayers('left'),
        group: 'Alignment',
      },
      {
        id: 'align_center',
        label: 'Align Horizontal Center',
        icon: Icons.AlignCenter,
        action: () => alignLayers('center'),
        group: 'Alignment',
      },
      {
        id: 'align_right',
        label: 'Align Right',
        icon: Icons.AlignRight,
        action: () => alignLayers('right'),
        group: 'Alignment',
      },
      {
        id: 'align_top',
        label: 'Align Top',
        icon: Icons.AlignTop,
        action: () => alignLayers('top'),
        group: 'Alignment',
      },
      {
        id: 'align_middle',
        label: 'Align Vertical Center',
        icon: Icons.AlignMiddle,
        action: () => alignLayers('middle'),
        group: 'Alignment',
      },
      {
        id: 'align_bottom',
        label: 'Align Bottom',
        icon: Icons.AlignBottom,
        action: () => alignLayers('bottom'),
        group: 'Alignment',
      },

      // --- SYSTEM ---
      {
        id: 'sys_export',
        label: 'Export Masterpiece',
        icon: Icons.Download,
        action: () => setIsExporting(true),
        group: 'System',
        shortcut: 'Ctrl+E',
      },
      {
        id: 'sys_save',
        label: 'Save Design',
        icon: Icons.CheckSquare,
        action: () => useStore.getState().saveProject?.(),
        group: 'System',
        shortcut: 'Ctrl+S',
      },
      {
        id: 'sys_undo',
        label: 'Undo Last Action',
        icon: Icons.Undo,
        action: () => useStore.getState().undo?.(),
        group: 'System',
        shortcut: 'Ctrl+Z',
      },
      {
        id: 'sys_redo',
        label: 'Redo Action',
        icon: Icons.Redo,
        action: () => useStore.getState().redo?.(),
        group: 'System',
        shortcut: 'Ctrl+Y',
      },
      {
        id: 'sys_shortcuts',
        label: 'Show Keyboard Shortcuts',
        icon: Icons.Help,
        action: () => useStore.getState().setShowShortcuts?.(true),
        group: 'System',
        shortcut: '?',
      },

      // --- REGISTRY COMMANDS ---
      ...registryToCmd,
    ],
    [
      addTextLayer,
      addShapeLayer,
      addAdjustmentLayer,
      setIsExporting,
      groupSelected,
      ungroupSelected,
      moveLayer,
      alignLayers,
      setSelectedLayerIds,
      setPenMode,
      setActiveTab,
      registryToCmd,
    ]
  );

  const filteredActions = useMemo(() => {
    if (!query) {
      return commandList;
    }
    const q = query.toLowerCase();
    const localMatches = commandList.filter(
      (c) => c.label.toLowerCase().includes(q) || c.group?.toLowerCase().includes(q)
    );
    const registryMatches: Cmd[] = searchCommands(query).map((rc) => ({
      id: rc.id,
      label: rc.label,
      icon: Icons.Code,
      action: rc.action,
      group: rc.category,
      shortcut: rc.shortcut,
    }));
    const seen = new Set(localMatches.map((c) => c.id));
    const merged = [...localMatches, ...registryMatches.filter((r) => !seen.has(r.id))];
    return merged;
  }, [query, commandList]);

  // Combine all results for unified navigation
  const allResults = useMemo(
    (): Cmd[] => [
      ...filteredActions,
      ...assetResults.map((a) => ({
        id: a.uuid,
        label: `Icon: ${a.name}`,
        icon: Icons.Image,
        action: () => addImageLayer(a.previewUrl),
        group: 'Quick Assets',
      })),
      ...communityResults.map((t) => ({
        id: t.id,
        label: `Template: ${t.name}`,
        icon: Icons.Layout,
        action: () => initializeProject(t.state),
        group: 'Community',
      })),
    ],
    [filteredActions, assetResults, communityResults, addImageLayer, initializeProject]
  );

  // Grouping for the initial state (when query is empty)
  const grouped = useMemo(
    () =>
      Array.from(
        allResults.reduce((acc, cmd) => {
          const group = cmd.group || 'Other';
          if (!acc.has(group)) {
            acc.set(group, []);
          }
          acc.get(group)!.push(cmd);
          return acc;
        }, new Map<string, Cmd[]>())
      ),
    [allResults]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) {
      return;
    }

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
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const focusable = document.querySelectorAll('[data-command-palette-focusable]');
        const list = Array.from(focusable) as HTMLElement[];
        if (list.length === 0) {
          return;
        }
        const current = document.activeElement;
        const idx = list.indexOf(current as HTMLElement);
        let next: number;
        if (e.shiftKey) {
          next = idx <= 0 ? list.length - 1 : idx - 1;
        } else {
          next = idx >= list.length - 1 ? 0 : idx + 1;
        }
        list[next].focus();
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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-modal flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-md p-4">
      <div className="absolute inset-0" onClick={() => setOpen(false)} />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl bg-surface-dark-1 border border-white/10 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in flex flex-col"
      >
        {/* Search Input */}
        <div className="flex items-center px-5 py-4 border-b border-white/5 bg-white/5">
          <Icons.Search className="w-5 h-5 text-gray-400 mr-4" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-activedescendant={`cmd-option-${selectedIndex}`}
            aria-autocomplete="list"
            aria-controls="command-palette-listbox"
            data-command-palette-focusable
            className="flex-1 bg-transparent text-white text-lg outline-none placeholder-muted-light font-medium"
            placeholder="Type a command or search assets..."
            aria-label="Search commands and assets"
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
          {isSearching && (
            <div className="mr-4 animate-spin w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full" />
          )}
          <div className="flex gap-2 text-[9px] font-black text-gray-500 uppercase tracking-widest bg-black/40 px-2 py-1 rounded-md border border-white/5">
            <span className="text-gray-400">ESC</span> to exit
          </div>
        </div>

        {/* Results */}
        <div
          id="command-palette-listbox"
          role="listbox"
          className="max-h-[60vh] overflow-y-auto no-scrollbar p-2 bg-surface-dark-2"
        >
          {allResults.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Icons.Search className="w-12 h-12 text-gray-800 mx-auto mb-3" />
              <div className="text-gray-500 text-sm font-bold">No results found for &quot;{query}&quot;</div>
            </div>
          ) : query ? (
            <div className="flex flex-col gap-0.5">
              {allResults.map((cmd, index) => {
                const Icon = cmd.icon;
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    role="option"
                    id={`cmd-option-${index}`}
                    aria-selected={isSelected}
                    data-command-palette-focusable
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => {
                      cmd.action();
                      setOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 rounded-xl text-left transition-all duration-200 ${isSelected ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20 scale-[1.02]' : 'text-gray-400 hover:bg-white/5'}`}
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg mr-4 ${isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500'}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="font-bold text-sm">{cmd.label}</span>
                      {cmd.group && (
                        <span
                          className={`text-[9px] uppercase tracking-widest font-black ${isSelected ? 'text-white/60' : 'text-muted-light'}`}
                        >
                          {cmd.group}
                        </span>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isSelected ? 'bg-black/20 text-white' : 'bg-white/5 text-muted-light'}`}
                      >
                        {cmd.shortcut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {grouped.map(([group, cmds]) => (
                <div key={group}>
                  <div className="px-4 py-1 text-[9px] font-black text-muted-light uppercase tracking-[0.2em]">
                    {group}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {cmds.map((cmd) => {
                      const index = allResults.indexOf(cmd);
                      const Icon = cmd.icon;
                      const isSelected = index === selectedIndex;
                      return (
                        <button
                          key={cmd.id}
                          role="option"
                          id={`cmd-option-${index}`}
                          aria-selected={isSelected}
                          data-command-palette-focusable
                          onMouseEnter={() => setSelectedIndex(index)}
                          onClick={() => {
                            cmd.action();
                            setOpen(false);
                          }}
                          className={`flex items-center w-full px-4 py-2.5 rounded-xl text-left transition-all duration-200 ${isSelected ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'text-gray-400 hover:bg-white/5'}`}
                        >
                          <div
                            className={`flex items-center justify-center w-7 h-7 rounded-lg mr-4 ${isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500'}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-[13px] flex-1">{cmd.label}</span>
                          {cmd.shortcut && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isSelected ? 'bg-black/20 text-white' : 'bg-white/5 text-muted-light'}`}
                            >
                              {cmd.shortcut}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-5 py-3 border-t border-white/5 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <kbd className="bg-white/10 text-gray-400 text-[10px] px-1.5 py-0.5 rounded border border-white/5">
                ↑↓
              </kbd>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="bg-white/10 text-gray-400 text-[10px] px-1.5 py-0.5 rounded border border-white/5">↵</kbd>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Execute</span>
            </div>
          </div>
          <div className="text-[10px] text-muted-light font-bold tracking-widest uppercase italic">
            Powered by Kreathief Core
          </div>
        </div>
      </div>
    </div>
  );
};
