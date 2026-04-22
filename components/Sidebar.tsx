
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavTab } from '../types';
import { Icons } from '../constants';
import { useStore } from '../store/useStore';
import { useContextualPanels } from '../hooks/useContextualPanels';

interface SidebarProps {
  isCollapsed: boolean;
  isAutoCollapsed?: boolean;
  onToggleCollapse: () => void;
  onExpand: () => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({ isCollapsed, isAutoCollapsed, onToggleCollapse, onExpand }) => {
  const activeTab = useStore(state => state.activeTab);
  const setActiveTab = useStore(state => state.setActiveTab);
  const contextualTabs = useContextualPanels();
  const [showAllTools, setShowAllTools] = useState(false);

  const allTabs = [
    { id: NavTab.ASSISTANT, icon: Icons.Bot, label: "Design Agents", group: 'Create' },
    { id: NavTab.MAGIC, icon: Icons.Magic, label: "AI Magic", group: 'Create' },
    { id: NavTab.VECTORIZER, icon: Icons.Union, label: "AI Vectorizer", group: 'Create' },
    { id: NavTab.DRAW, icon: Icons.Brush, label: "Draw", group: 'Create' },
    { id: NavTab.TEMPLATES, icon: Icons.Templates, label: "Templates", group: 'Library' },
    { id: NavTab.ELEMENTS, icon: Icons.Shapes, label: "Elements", group: 'Library' },
    { id: NavTab.UPLOADS, icon: Icons.Uploads, label: "Uploads", group: 'Library' },
    { id: NavTab.PHOTOS, icon: Icons.Image, label: "Photos", group: 'Library' },
    { id: NavTab.TEXT, icon: Icons.Text, label: "Text", group: 'Library' },
    { id: NavTab.COMPONENTS, icon: Icons.LayoutGrid, label: "Components", group: 'Library' },
    { id: NavTab.TEXT_EFFECTS, icon: Icons.Zap, label: "Effects", group: 'Refine' },
    { id: NavTab.BRAND, icon: Icons.Brand, label: "Brand", group: 'Refine' },
    { id: NavTab.TEXTURES, icon: Icons.Texture, label: "Textures", group: 'Refine' },
    { id: NavTab.MOCKUP, icon: Icons.Mockup, label: "Mockups", group: 'Refine' },
    { id: NavTab.LAYERS, icon: Icons.Layers, label: "Layers", group: 'Organise' },
    { id: NavTab.ARRANGE, icon: Icons.Layout, label: "Arrange", group: 'Organise' },
    { id: NavTab.MOTION, icon: Icons.Play, label: "Motion", group: 'Organise' },
    { id: NavTab.ACCESSIBILITY, icon: Icons.Help, label: "Accessibility", group: 'Organise' },
    { id: NavTab.COMMENTS, icon: Icons.MessageSquare, label: "Comments", group: 'Organise' },
  ];

  const primaryTools = useMemo(() => {
    // Persistent core tools
    const persistent = [NavTab.LAYERS, NavTab.BRAND];
    const combined = Array.from(new Set([...contextualTabs, ...persistent]));
    return allTabs.filter(t => combined.includes(t.id));
  }, [contextualTabs]);

  const secondaryTools = useMemo(() => {
    const primaryIds = primaryTools.map(t => t.id);
    return allTabs.filter(t => !primaryIds.includes(t.id));
  }, [primaryTools]);

  const renderTool = (item: any) => {
    const isActive = activeTab === item.id && !isCollapsed;
    return (
      <button
        key={item.id}
        onClick={() => {
          if (activeTab === item.id) {
            onToggleCollapse();
          } else {
            setActiveTab(item.id);
            if (isCollapsed || isAutoCollapsed) {
              onExpand();
            }
          }
        }}
        className={`w-full flex flex-col items-center justify-center gap-1 py-2.5 transition-all relative group shrink-0 tooltip-trigger ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-200'}`}
        data-tooltip={item.label}
        aria-label={item.label}
      >
        {isActive && (
          <motion.div 
            layoutId="sidebar-active-indicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-[#7d2ae8] to-[#6b23c5] rounded-r-full" 
          />
        )}
        <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-[#7d2ae8]/20 text-[#7d2ae8] shadow-[0_0_15px_rgba(125,42,232,0.15)]' : 'group-hover:bg-[#252627]'}`}>
          <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
        </div>
        {!isCollapsed && (
          <span className={`text-[9px] font-bold tracking-tight transition-all ${isActive ? 'opacity-100 scale-100' : 'opacity-60 scale-95 group-hover:opacity-100'}`}>
            {item.label}
          </span>
        )}
      </button>
    );
  };

  return (
    <div id="sidebar" className="w-[72px] bg-[#0e1318] flex flex-col items-center py-4 z-30 shrink-0 border-r border-[#1f1f1f] h-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col items-center w-full gap-2">
        <AnimatePresence mode="popLayout">
          {primaryTools.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="w-full"
            >
              {renderTool(item)}
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="w-8 h-px bg-white/5 my-2" />
        
        <button
          onClick={() => setShowAllTools(!showAllTools)}
          className={`p-2 rounded-xl transition-all ${showAllTools ? 'text-[#7d2ae8] bg-[#7d2ae8]/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          title="All Tools"
        >
          <Icons.LayoutGrid className="w-5 h-5" />
        </button>

        <AnimatePresence>
          {showAllTools && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full overflow-hidden flex flex-col gap-1"
            >
              {secondaryTools.map(renderTool)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="mt-auto pt-4 border-t border-[#1f1f1f] w-full flex flex-col items-center gap-2">
        <button
          onClick={onToggleCollapse}
          className={`p-2.5 rounded-xl transition-all relative group tooltip-trigger ${isCollapsed ? 'text-[#7d2ae8] bg-[#7d2ae8]/10' : 'text-gray-500 hover:text-white hover:bg-[#252627]'}`}
          data-tooltip={isCollapsed ? "Expand Panel" : "Collapse Panel"}
        >
          {isCollapsed ? <Icons.ArrowRight className="w-5 h-5" /> : <Icons.ArrowLeft className="w-5 h-5" />}
        </button>

        <button
          onClick={() => useStore.getState().setShowFeedbackModal(true)}
          className="p-2.5 rounded-xl transition-all relative group text-gray-500 hover:text-[#00c4cc] hover:bg-[#00c4cc]/10 tooltip-trigger"
          data-tooltip="Send Feedback"
        >
          <Icons.MessageSquare className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';

