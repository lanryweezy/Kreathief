import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  badge?: React.ReactNode;
}

export interface PanelHeaderProps {
  title?: string;
  icon?: React.ReactNode;
  tabs?: TabItem[];
  activeTabId?: string;
  onTabChange?: (id: any) => void;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Standardized Panel Header Component
 * Enforces uniform 56px height, padding, and typography across all sidebar tools
 * to eliminate visual shifting when switching tabs.
 */
export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  icon,
  tabs,
  activeTabId,
  onTabChange,
  action,
  children,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-between min-h-[56px] h-[56px] max-h-[56px] px-4 border-b border-white/10 bg-surface-dark-2 shrink-0 select-none overflow-x-auto gap-4 custom-scrollbar ${className}`}
    >
      <div className="flex items-center gap-4 h-full">
        {title && (
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 whitespace-nowrap m-0">
            {icon && <span className="text-brand-500 shrink-0 flex items-center">{icon}</span>}
            {title}
          </h3>
        )}

        {tabs && tabs.length > 0 && (
          <div className="flex items-center gap-4 h-full" role="tablist">
            {tabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onTabChange?.(tab.id)}
                  className={`h-full flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-[-2px] ${
                    isActive ? 'border-brand-600 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.icon && <span className="shrink-0 flex items-center">{tab.icon}</span>}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        isActive ? 'bg-brand-600/20 text-brand-400' : 'bg-white/5 text-gray-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                  {tab.badge}
                </button>
              );
            })}
          </div>
        )}

        {children}
      </div>

      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
};

export default PanelHeader;
