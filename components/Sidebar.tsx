import React, { useCallback } from 'react';
import { NavTab } from '../types';
import { Icons } from '../constants';
import { useStore } from '../store/useStore';
import { ErrorBoundary } from './ErrorBoundary';

interface SidebarProps {
  isCollapsed: boolean;
  isAutoCollapsed?: boolean;
  onToggleCollapse: () => void;
  onExpand: () => void;
}

const PRIMARY_TABS = [
  { id: NavTab.TEMPLATES, icon: Icons.Templates, label: 'Templates' },
  { id: NavTab.TEXT, icon: Icons.Text, label: 'Text' },
  { id: NavTab.ELEMENTS, icon: Icons.Shapes, label: 'Elements' },
  { id: NavTab.MEDIA, icon: Icons.Image, label: 'Media' },
  { id: NavTab.DRAW, icon: Icons.Brush, label: 'Draw' },
  { id: NavTab.BRAND, icon: Icons.Brand, label: 'Brand' },
  { id: NavTab.LAYERS, icon: Icons.Layers, label: 'Layers' },
  { id: NavTab.MOCKUP, icon: Icons.Mockup, label: 'Mockups' },
  { id: NavTab.MOTION, icon: Icons.Play, label: 'Motion' },
  { id: NavTab.ACCESSIBILITY, icon: Icons.Help, label: 'Accessibility' },
];

export const Sidebar: React.FC<SidebarProps> = React.memo(
  ({ isCollapsed, isAutoCollapsed, onToggleCollapse, onExpand }) => {
    const activeTab = useStore((state) => state.activeTab);
    const setActiveTab = useStore((state) => state.setActiveTab);

    const renderTool = useCallback(
      (item: { id: NavTab; icon: any; label: string }) => {
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
            title={item.label}
            aria-label={item.label}
            aria-pressed={isActive}
            className={`
              w-full flex flex-col items-center justify-center gap-0.5 py-1.5 px-1
              transition-all duration-150 relative group rounded-lg
              ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-200'}
            `}
          >
            <div
              className={`
                flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-150
                ${
                  isActive
                    ? 'bg-brand-600/25 text-white border border-brand-600/30 shadow-[0_0_8px_rgba(139,92,246,0.3)]'
                    : 'group-hover:bg-white/5'
                }
              `}
            >
              <item.icon
                className={`w-[15px] h-[15px] transition-all duration-150 ${
                  isActive ? 'text-white' : 'group-hover:text-gray-200'
                }`}
              />
            </div>
            <span
              className={`text-[8.5px] font-semibold leading-none tracking-wide transition-all duration-150 truncate w-full text-center ${
                isActive ? 'text-white/90' : 'text-gray-600 group-hover:text-gray-400'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      },
      [activeTab, isCollapsed, isAutoCollapsed, onToggleCollapse, setActiveTab, onExpand]
    );

    return (
      <div
        id="sidebar"
        role="navigation"
        aria-label="Design tools"
        className="w-[64px] bg-surface-dark-1/90 backdrop-blur-3xl flex flex-col items-center z-[100] shrink-0 border-r border-white/5 h-full relative shadow-[20px_0_50px_rgba(0,0,0,0.5)]"
      >
        {/* Top accent gradient */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-600/5 to-transparent pointer-events-none" />

        <ErrorBoundary fallback={<div className="text-xs text-red-400 p-2">Sidebar error</div>}>
          {/* Primary tools */}
          <div className="flex flex-col items-center w-full gap-0.5 px-1.5 pt-4 pb-2 flex-1 overflow-y-auto no-scrollbar">
            {PRIMARY_TABS.map(renderTool)}
          </div>
        </ErrorBoundary>

        {/* Bottom utilities */}
        <div className="pb-4 border-t border-white/5 w-full flex flex-col items-center gap-1 px-1.5 pt-2">
          <button
            onClick={() => useStore.getState().setShowFeedbackModal(true)}
            aria-label="Send Feedback"
            title="Send Feedback"
            className="relative w-full flex items-center justify-center h-7 rounded-lg text-gray-500 hover:text-pink-400 hover:bg-pink-500/10 transition-all duration-150"
          >
            <Icons.MessageSquare className="w-3.5 h-3.5" />
            <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-pink-500 rounded-full" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }
);

Sidebar.displayName = 'Sidebar';
