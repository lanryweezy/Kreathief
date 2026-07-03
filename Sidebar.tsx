import React, { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavTab } from '../types';
import { Icons } from '../constants';
import { useStore } from '../store/useStore';
import { ErrorBoundary } from './ErrorBoundary';
import { useContextualPanels } from '../hooks/useContextualPanels';
import { Button } from './Button';

interface SidebarProps {
  isCollapsed: boolean;
  isAutoCollapsed?: boolean;
  onToggleCollapse: () => void;
  onExpand: () => void;
}

const ALL_TABS = [
  { id: NavTab.ASSISTANT, icon: Icons.Bot, label: 'AI Assistants', group: 'Create' },
  { id: NavTab.MAGIC, icon: Icons.Magic, label: 'AI Magic', group: 'Create' },
  { id: NavTab.VECTORIZER, icon: Icons.Union, label: 'Image Trace', group: 'Create' },
  { id: NavTab.DRAW, icon: Icons.Brush, label: 'Draw', group: 'Create' },
  { id: NavTab.TEMPLATES, icon: Icons.Templates, label: 'Templates', group: 'Library' },
  { id: NavTab.MEDIA, icon: Icons.Image, label: 'Media', group: 'Library' },
  { id: NavTab.TEXT, icon: Icons.Text, label: 'Text', group: 'Library' },
  { id: NavTab.COMPONENTS, icon: Icons.LayoutGrid, label: 'Components', group: 'Library' },
  { id: NavTab.BRAND, icon: Icons.Brand, label: 'Brand', group: 'Refine' },
  { id: NavTab.TEXTURES, icon: Icons.Texture, label: 'Textures', group: 'Refine' },
  { id: NavTab.MOCKUP, icon: Icons.Mockup, label: 'Mockups', group: 'Refine' },
  { id: NavTab.LAYERS, icon: Icons.Layers, label: 'Layers', group: 'Organise' },
  { id: NavTab.MOTION, icon: Icons.Play, label: 'Motion', group: 'Organise' },
  { id: NavTab.ACCESSIBILITY, icon: Icons.Help, label: 'Accessibility', group: 'Organise' },
  { id: NavTab.COMMENTS, icon: Icons.MessageSquare, label: 'Comments', group: 'Organise' },
];

export const Sidebar: React.FC<SidebarProps> = React.memo(
  ({ isCollapsed, isAutoCollapsed, onToggleCollapse, onExpand }) => {
    const activeTab = useStore((state) => state.activeTab);
    const setActiveTab = useStore((state) => state.setActiveTab);
    const contextualTabs = useContextualPanels();
    const [showAllTools, setShowAllTools] = useState(false);

    const primaryTools = useMemo(() => {
      // Persistent core tools
      const persistent = [NavTab.LAYERS, NavTab.BRAND];
      const combined = Array.from(new Set([...contextualTabs, ...persistent]));
      return ALL_TABS.filter((t) => combined.includes(t.id));
    }, [contextualTabs]);

    const secondaryTools = useMemo(() => {
      const primaryIds = primaryTools.map((t) => t.id);
      return ALL_TABS.filter((t) => !primaryIds.includes(t.id));
    }, [primaryTools]);

    const allVisibleTabs = useMemo(() => [...primaryTools, ...(showAllTools ? secondaryTools : [])], [primaryTools, secondaryTools, showAllTools]);

    const handleTabKeyDown = useCallback(
      (e: React.KeyboardEvent, item: any) => {
        const currentIndex = allVisibleTabs.findIndex((t) => t.id === item.id);
        let nextIndex = -1;

        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          nextIndex = (currentIndex + 1) % allVisibleTabs.length;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          nextIndex = (currentIndex - 1 + allVisibleTabs.length) % allVisibleTabs.length;
        } else if (e.key === 'Home') {
          e.preventDefault();
          nextIndex = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          nextIndex = allVisibleTabs.length - 1;
        }

        if (nextIndex >= 0) {
          const nextTab = allVisibleTabs[nextIndex];
          setActiveTab(nextTab.id);
          if (isCollapsed || isAutoCollapsed) {
            onExpand();
          }
          const nextButton = document.querySelector(`[data-tab-id="${nextTab.id}"]`) as HTMLElement;
          nextButton?.focus();
        }
      },
      [allVisibleTabs, setActiveTab, isCollapsed, isAutoCollapsed, onExpand]
    );

    const renderTool = useCallback(
      (item: any) => {
        const isActive = activeTab === item.id && !isCollapsed;
        return (
          <button
            key={item.id}
            data-tab-id={item.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
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
            onKeyDown={(e) => handleTabKeyDown(e, item)}
            className={`w-full flex flex-col items-center justify-center gap-1 py-1.5 transition-all relative group shrink-0 tooltip-trigger ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-200'}`}
            data-tooltip={item.label}
            aria-label={item.label}
          >
            <div
              className={`p-2 rounded-[14px] transition-all duration-500 ${isActive ? 'bg-gradient-to-br from-brand-600/30 to-pink-500/20 text-white shadow-glow-brand border border-white/10' : 'group-hover:bg-white/5 group-hover:scale-110'}`}
            >
              <item.icon
                className={`w-5 h-5 transition-all duration-500 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'group-hover:text-gray-100'}`}
              />
            </div>
            {!isCollapsed && (
              <span
                className={`text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${isActive ? 'opacity-100 scale-100 text-white' : 'opacity-40 scale-90 group-hover:opacity-100 group-hover:scale-100'}`}
              >
                {item.label}
              </span>
            )}
          </button>
        );
      },
      [activeTab, isCollapsed, isAutoCollapsed, onToggleCollapse, setActiveTab, onExpand, handleTabKeyDown]
    );

    return (
      <div
        id="sidebar" role="navigation" aria-label="Design tools"
        className="w-[78px] bg-surface-dark-1/90 backdrop-blur-3xl flex flex-col items-center z-30 shrink-0 border-r border-white/5 h-full overflow-y-auto no-scrollbar relative shadow-[20px_0_50px_rgba(0,0,0,0.5)]"
      >
        {/* Visual Accent */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-brand-600/5 to-transparent pointer-events-none" />

        <ErrorBoundary fallback={<div className="text-xs text-red-400 p-2">Sidebar error</div>}>
          <div className="sticky top-0 z-20 w-full flex flex-col items-center gap-2 px-2 pt-6 pb-2 bg-surface-dark-1/95 backdrop-blur-3xl shadow-md border-b border-white/5" role="tablist" aria-label="Design tools tabs">
            <AnimatePresence mode="popLayout">
              {primaryTools.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                  className="w-full"
                >
                  {renderTool(item)}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ErrorBoundary>

        <div className="flex flex-col items-center w-full gap-2 px-2 mt-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAllTools(!showAllTools)}
            className={`transition-all duration-500 ${showAllTools && !secondaryTools.some((t) => t.id === activeTab) ? 'text-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/10' : ''}`}
            title="All Tools"
            aria-label="Toggle All Tools"
            aria-expanded={showAllTools}
          >
            <Icons.LayoutGrid
              className={`w-5 h-5 transition-transform duration-700 ${showAllTools ? 'rotate-90' : 'group-hover:rotate-12'}`}
            />
          </Button>

          <AnimatePresence>
            {showAllTools && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full flex flex-col gap-1 mt-1"
              >
                {secondaryTools.map(renderTool)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-auto pt-6 pb-6 border-t border-white/5 w-full flex flex-col items-center gap-4 px-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className={`transition-all duration-300 tooltip-trigger ${isCollapsed ? 'text-accent bg-accent/10 shadow-glow-accent border border-accent/20' : ''}`}
            data-tooltip={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
            aria-label={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
          >
            {isCollapsed ? <Icons.ArrowRight className="w-5 h-5" /> : <Icons.ArrowLeft className="w-5 h-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => useStore.getState().setShowFeedbackModal(true)}
            className="relative group hover:text-pink-500 hover:bg-pink-500/10 hover:shadow-[0_0_25px_rgba(236,72,153,0.15)] border border-transparent hover:border-pink-500/20 tooltip-trigger"
            data-tooltip="Send Feedback"
            aria-label="Send Feedback"
          >
            <Icons.MessageSquare className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-pink-500 rounded-full border border-surface-dark-1 animate-pulse"></span>
          </Button>
        </div>
      </div>
    );
  }
);

Sidebar.displayName = 'Sidebar';
