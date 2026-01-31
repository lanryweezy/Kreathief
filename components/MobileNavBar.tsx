import React from 'react';
import { NavTab } from '../types';
import { Icons } from '../constants';

interface MobileNavBarProps {
    activeTab: NavTab;
    onSelectTab: (tab: NavTab) => void;
}

/**
 * Mobile bottom navigation bar for easy thumb access on mobile devices
 * Only visible on small screens (< 768px)
 */
export const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeTab, onSelectTab }) => {
    const navItems = [
        { id: NavTab.MAGIC, icon: Icons.Magic, label: 'Magic' },
        { id: NavTab.TEMPLATES, icon: Icons.Templates, label: 'Templates' },
        { id: NavTab.TEXT, icon: Icons.Text, label: 'Text' },
        { id: NavTab.ELEMENTS, icon: Icons.Shapes, label: 'Elements' },
        { id: NavTab.LAYERS, icon: Icons.Layers, label: 'Layers' },
    ];

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1d21] border-t border-gray-800 md:hidden"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="flex justify-around items-center h-16 px-2 safe-area-bottom">
                {navItems.map(({ id, icon: Icon, label }) => {
                    const isActive = activeTab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onSelectTab(id)}
                            className={`
                flex flex-col items-center justify-center
                min-w-[56px] min-h-[48px] px-2 py-1 rounded-lg
                transition-all duration-200
                ${isActive
                                    ? 'text-indigo-400 bg-indigo-500/10'
                                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                                }
              `}
                            aria-label={label}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <Icon className="w-5 h-5 mb-1" aria-hidden="true" />
                            <span className="text-[10px] font-medium truncate">{label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileNavBar;
