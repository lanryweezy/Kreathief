import React, { useState } from 'react';
import { AssetsPanel } from './AssetsPanel';
import { UploadsPanel } from './UploadsPanel';
import { PanelHeader } from './PanelHeader';

type Tab = 'all' | 'unsplash' | 'freepik' | 'iconscout' | 'uploads';

export const MediaPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unsplash', label: 'Unsplash' },
    { id: 'freepik', label: 'Freepik' },
    { id: 'iconscout', label: 'Icons' },
    { id: 'uploads', label: 'Uploads' },
  ];

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      <PanelHeader tabs={tabs} activeTabId={activeTab} onTabChange={(id) => setActiveTab(id as Tab)} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className={activeTab === 'all' ? 'block h-full' : 'hidden'}>
          <AssetsPanel provider="all" />
        </div>
        <div className={activeTab === 'unsplash' ? 'block h-full' : 'hidden'}>
          <AssetsPanel provider="unsplash" />
        </div>
        <div className={activeTab === 'freepik' ? 'block h-full' : 'hidden'}>
          <AssetsPanel provider="freepik" />
        </div>
        <div className={activeTab === 'iconscout' ? 'block h-full' : 'hidden'}>
          <AssetsPanel provider="iconscout" />
        </div>
        <div className={activeTab === 'uploads' ? 'block h-full' : 'hidden'}>
          <UploadsPanel />
        </div>
      </div>
    </div>
  );
};

export default MediaPanel;
