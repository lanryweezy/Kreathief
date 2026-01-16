
import React from 'react';
import { NavTab } from '../types';
import { Icons } from '../constants';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const navItems = [
    { id: NavTab.ASSISTANT, icon: Icons.Bot, label: "AI Assist" },
    { id: NavTab.TEMPLATES, icon: Icons.Templates, label: "Design" },
    { id: NavTab.ELEMENTS, icon: Icons.Shapes, label: "Elements" },
    { id: NavTab.TEXT, icon: Icons.Text, label: "Text" },
    { id: NavTab.BRAND, icon: Icons.Brand, label: "Brand" },
    { id: NavTab.TEXTURES, icon: Icons.Texture, label: "Textures" },
    { id: NavTab.DRAW, icon: Icons.Brush, label: "Draw" },
    { id: NavTab.STICKERS, icon: Icons.Sticker, label: "Stickers" },
    { id: NavTab.UPLOADS, icon: Icons.Uploads, label: "Uploads" },
    { id: NavTab.PHOTOS, icon: Icons.Image, label: "Photos" },
    { id: NavTab.MAGIC, icon: Icons.Magic, label: "Magic" },
    { id: NavTab.MOCKUP, icon: Icons.Mockup, label: "Mockups" },
    { id: NavTab.LAYERS, icon: Icons.Layers, label: "Layers" },
  ];

  return (
    <div id="sidebar" className="w-[72px] bg-[#0e1318] flex flex-col items-center py-4 gap-1 z-30 shrink-0 border-r border-[#1f1f1f] h-full overflow-y-auto custom-scrollbar">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`w-full flex flex-col items-center justify-center gap-1.5 py-3 transition-all relative group shrink-0 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-100'
              }`}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#00c4cc] to-[#7d2ae8] rounded-r-md" />
            )}
            <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-[#252627]' : 'group-hover:bg-[#252627]'}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
