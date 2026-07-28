import React, { useState } from 'react';
import { AssetsPanel } from './AssetsPanel';
import { UploadsPanel } from './UploadsPanel';

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
      <div className="flex px-4 pt-4 border-b border-white/5 gap-4 shrink-0 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-[10px] font-bold uppercase transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-brand-600 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
