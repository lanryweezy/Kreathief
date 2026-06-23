import React, { useState } from 'react';
import { ElementsPanel } from './ElementsPanel';
import { AssetsPanel } from './AssetsPanel';
import { UploadsPanel } from './UploadsPanel';

export const MediaPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'elements' | 'photos' | 'uploads'>('elements');

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Tabs */}
      <div className="flex px-4 pt-4 border-b border-white/5 gap-4 shrink-0">
        <button
          onClick={() => setActiveTab('elements')}
          className={`pb-3 text-[10px] font-bold uppercase transition-all border-b-2 ${
            activeTab === 'elements'
              ? 'border-brand-600 text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Elements
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`pb-3 text-[10px] font-bold uppercase transition-all border-b-2 ${
            activeTab === 'photos'
              ? 'border-brand-600 text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Photos
        </button>
        <button
          onClick={() => setActiveTab('uploads')}
          className={`pb-3 text-[10px] font-bold uppercase transition-all border-b-2 ${
            activeTab === 'uploads'
              ? 'border-brand-600 text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Uploads
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className={activeTab === 'elements' ? 'block h-full' : 'hidden'}>
          <ElementsPanel />
        </div>
        <div className={activeTab === 'photos' ? 'block h-full' : 'hidden'}>
          <AssetsPanel />
        </div>
        <div className={activeTab === 'uploads' ? 'block h-full' : 'hidden'}>
          <UploadsPanel />
        </div>
      </div>
    </div>
  );
};

export default MediaPanel;
