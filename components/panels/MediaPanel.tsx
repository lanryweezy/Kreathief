import React, { useState } from 'react';
import { AssetsPanel } from './AssetsPanel';
import { UploadsPanel } from './UploadsPanel';
import { PanelHeader } from './PanelHeader';

type Tab = 'unsplash' | 'pixabay' | 'pexels' | 'uploads';

export const MediaPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('unsplash');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'unsplash', label: 'Unsplash' },
    { id: 'pixabay', label: 'Pixabay' },
    { id: 'pexels', label: 'Pexels' },
    { id: 'uploads', label: 'Uploads' },
  ];

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      <PanelHeader tabs={tabs} activeTabId={activeTab} onTabChange={(id) => setActiveTab(id)} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className={activeTab === 'unsplash' ? 'block h-full' : 'hidden'}>
          <AssetsPanel provider="unsplash" />
        </div>
        <div className={activeTab === 'pixabay' ? 'block h-full' : 'hidden'}>
          <AssetsPanel provider="pixabay" />
        </div>
        <div className={activeTab === 'pexels' ? 'block h-full' : 'hidden'}>
          <AssetsPanel provider="pexels" />
        </div>
        <div className={activeTab === 'uploads' ? 'block h-full' : 'hidden'}>
          <UploadsPanel />
        </div>
      </div>
    </div>
  );
};

export default MediaPanel;
