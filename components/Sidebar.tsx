
import React from 'react';
import { NavTab } from '../types';
import { Icons } from '../constants';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({ activeTab, onSelectTab }) => {
  const items = [
    { id: NavTab.ASSISTANT, icon: Icons.Bot, label: "Ask AI" },
    { id: NavTab.MAGIC, icon: Icons.Magic, label: "AI Magic" },
    { id: NavTab.TEMPLATES, icon: Icons.Templates, label: "Designs" },
    { id: NavTab.ELEMENTS, icon: Icons.Shapes, label: "Elements" },
    { id: NavTab.UPLOADS, icon: Icons.Uploads, label: "Uploads" },
    { id: NavTab.PHOTOS, icon: Icons.Image, label: "Photos" },
    { id: NavTab.TEXT, icon: Icons.Text, label: "Text" },
    { id: NavTab.DRAW, icon: Icons.Brush, label: "Draw" },
    { id: NavTab.BRAND, icon: Icons.Brand, label: "Brand" },
    { id: NavTab.TEXTURES, icon: Icons.Texture, label: "Textures" },
    { id: NavTab.MOCKUP, icon: Icons.Mockup, label: "Mockups" },
    { id: NavTab.LAYERS, icon: Icons.Layers, label: "Layers" },
    { id: NavTab.PROJECTS, icon: Icons.Projects, label: "Projects" },
  ];

  return (
    <div id="sidebar" className="w-[72px] bg-[#0e1318] flex flex-col items-center py-4 z-30 shrink-0 border-r border-[#1f1f1f] h-full overflow-y-auto custom-scrollbar scrollbar-hide">
      <div className="flex flex-col items-center w-full gap-1">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex flex-col items-center justify-center gap-1 py-2.5 transition-all relative group shrink-0 tooltip-trigger ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-200'
                }`}
              data-tooltip={item.label}
              aria-label={item.label}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-[#7d2ae8] to-[#6b23c5] rounded-r-full" />
              )}
              <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-[#7d2ae8]/20 text-[#7d2ae8] shadow-[0_0_15px_rgba(125,42,232,0.15)]' : 'group-hover:bg-[#252627]'
                }`}>
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              </div>
              <span className={`text-[9px] font-bold tracking-tight transition-all ${isActive ? 'opacity-100 scale-100' : 'opacity-60 scale-95 group-hover:opacity-100'
                }`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
