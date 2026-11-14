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

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <PanelErrorBoundary panelName="Media">
          {activeTab === 'uploads' ? (
            <UploadsPanel />
          ) : (
            <AssetsPanel key={activeTab} provider={activeTab} />
          )}
        </PanelErrorBoundary>
      </div>
    </div>
  );
};

export default MediaPanel;
