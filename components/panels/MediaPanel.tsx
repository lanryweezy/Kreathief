import React, { useState } from 'react';
import { AssetsPanel } from './AssetsPanel';
import { UploadsPanel } from './UploadsPanel';
import { PanelHeader } from './PanelHeader';
import { PanelErrorBoundary } from './PanelErrorBoundary';

type Tab = 'all' | 'unsplash' | 'pexels' | 'freepik' | 'iconscout' | 'uploads';

export const MediaPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unsplash', label: 'Unsplash' },
    { id: 'pexels', label: 'Pexels' },
    { id: 'freepik', label: 'Freepik' },
    { id: 'iconscout', label: 'Icons' },
    { id: 'uploads', label: 'Uploads' },
  ];

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      <PanelHeader tabs={tabs} activeTabId={activeTab} onTabChange={(id) => setActiveTab(id as Tab)} />

      {/*
       * Render only the active tab. Previously all 6 panels were mounted
       * simultaneously (just hidden via CSS), which caused:
       * 1. Five concurrent mount-time API calls firing at once, hitting
       *    rate limits and producing fetch errors that crashed the whole
       *    SidePanel via its ErrorBoundary.
       * 2. Unnecessary React tree size and wasted network bandwidth.
       *
       * PanelErrorBoundary scopes any render/async errors to this panel
       * so a network failure shows a local "Try Again" instead of
       * replacing the entire side panel with the error UI.
       */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <PanelErrorBoundary panelName="Media">
          {activeTab === 'all' && <AssetsPanel provider="all" />}
          {activeTab === 'unsplash' && <AssetsPanel provider="unsplash" />}
          {activeTab === 'pexels' && <AssetsPanel provider="pexels" />}
          {activeTab === 'freepik' && <AssetsPanel provider="freepik" />}
          {activeTab === 'iconscout' && <AssetsPanel provider="iconscout" />}
          {activeTab === 'uploads' && <UploadsPanel />}
        </PanelErrorBoundary>
      </div>
    </div>
  );
};

export default MediaPanel;
