import React from 'react';
import { NavTab } from '../types';
import { Icons } from '../constants';
import { haptics } from '../utils/haptics';

interface MobileNavBarProps {
    activeTab: NavTab;
    onSelectTab: (tab: NavTab) => void;
}

/**
 * Mobile bottom navigation bar - Beautiful, simple, clean design
 * Optimized for thumb access with larger touch targets and smooth animations
 * Only visible on small screens (< 768px)
 */
export const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeTab, onSelectTab }) => {
    const navItems = [
        { id: NavTab.MAGIC, icon: Icons.Magic, label: 'Magic', gradient: 'from-purple-500 to-pink-500' },
        { id: NavTab.TEXT, icon: Icons.Text, label: 'Text', gradient: 'from-blue-500 to-cyan-500' },
        { id: NavTab.ELEMENTS, icon: Icons.Shapes, label: 'Elements', gradient: 'from-orange-500 to-red-500' },
        { id: NavTab.LAYERS, icon: Icons.Layers, label: 'Layers', gradient: 'from-green-500 to-emerald-500' },
    ];

    const handleTabSelect = (tab: NavTab) => {
        haptics.selection();
        onSelectTab(tab);
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-[#0a0a0c] via-[#0e1318] to-transparent md:hidden"
            role="navigation"
            aria-label="Main navigation"
        >
            {/* Backdrop blur effect */}
            <div className="absolute inset-0 backdrop-blur-xl bg-[#0e1318]/95 border-t border-white/5" />
            
            <div className="relative flex justify-around items-center h-16 px-4 pb-safe">
                {navItems.map(({ id, icon: Icon, label, gradient }) => {
                    const isActive = activeTab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => handleTabSelect(id)}
                            className={`
                                flex flex-col items-center justify-center gap-1
                                min-w-[64px] min-h-[48px] px-2 py-1 rounded-xl
                                transition-all duration-300 ease-out
                                active:scale-95
                                ${isActive
                                    ? 'bg-gradient-to-br ' + gradient + ' shadow-lg shadow-purple-500/20 scale-105'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                }
                            `}
                            aria-label={label}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <div className={`
                                transition-all duration-300
                                ${isActive ? 'scale-110' : 'scale-100'}
                            `}>
                                <Icon 
                                    className={`w-5 h-5 ${isActive ? 'text-white drop-shadow-lg' : ''}`} 
                                    aria-hidden="true" 
                                />
                            </div>
                            <span className={`
                                text-[10px] font-bold tracking-tight
                                ${isActive ? 'text-white' : 'text-gray-400'}
                            `}>
                                {label}
                            </span>
                            
                            {/* Active indicator dot */}
                            {isActive && (
                                <div className="absolute -top-1 w-1 h-1 bg-white rounded-full animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileNavBar;
