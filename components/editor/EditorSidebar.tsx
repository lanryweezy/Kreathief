import React from 'react';
import { NavTab, AnimationSettings } from '../../types';
import { useStore } from '../../store/useStore';
import { Sidebar } from '../Sidebar';
import { SidePanel } from '../SidePanel';
import { ErrorBoundary } from '../ErrorBoundary';

interface EditorSidebarProps {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onGenerate: (...args: any[]) => void;
  onApplyTheme: (...args: any[]) => void;
  onApplyLayout: (type: any) => void;
  getCanvasSnapshot: () => Promise<string>;
  uploadedImage: string | null;
  onStartDesign: (prompt: string) => void;
  onPreviewMotion: (settings: AnimationSettings) => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = React.memo(
  ({
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    activeTab,
    setActiveTab,
    onGenerate,
    onApplyTheme,
    onApplyLayout,
    getCanvasSnapshot,
    uploadedImage,
    onStartDesign,
    onPreviewMotion,
  }) => {
    return (
      <div
        id="sidebar-container"
        className={`hidden md:flex flex-row h-full shrink-0 z-40 border-r border-gray-800 transition-all duration-300 ${isSidebarCollapsed || activeTab === NavTab.MOCKUP ? 'w-[72px]' : 'w-[392px]'}`}
      >
        <ErrorBoundary componentName="Sidebar" variant="widget">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            isAutoCollapsed={activeTab === NavTab.MOCKUP}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onExpand={() => {
              if (useStore.getState().activeTab === NavTab.MOCKUP) {
                setActiveTab(NavTab.TEMPLATES);
              }
              setIsSidebarCollapsed(false);
            }}
          />
          {!isSidebarCollapsed && activeTab !== NavTab.MOCKUP && (
            <SidePanel
              onGenerate={onGenerate}
              onApplyTheme={onApplyTheme}
              onApplyLayout={onApplyLayout}
              getCanvasSnapshot={getCanvasSnapshot}
              uploadedImage={uploadedImage}
              onStartDesign={onStartDesign}
              onPreviewMotion={onPreviewMotion}
            />
          )}
        </ErrorBoundary>
      </div>
    );
  }
);

EditorSidebar.displayName = 'EditorSidebar';
