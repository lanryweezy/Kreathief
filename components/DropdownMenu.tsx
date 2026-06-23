import React, { useState, useRef, useEffect } from 'react';

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownMenuProps {
  label: string;
  items: MenuItem[];
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ label, items, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${isOpen ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/90'}`}
      >
        {label}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute top-full left-0 mt-1 w-56 bg-surface-dark-3 border border-gray-700 rounded-lg shadow-2xl py-1 z-[100] animate-fadeIn"
        >
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {item.divider && <div className="h-px bg-gray-700 my-1 mx-2" role="separator" />}
              {!item.divider && (
                <button
                  onClick={() => {
                    if (!item.disabled && item.onClick) {
                      item.onClick();
                      setIsOpen(false);
                    }
                  }}
                  disabled={item.disabled}
                  role="menuitem"
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors text-left
                  ${
                    item.disabled
                      ? 'opacity-30 cursor-not-allowed text-gray-500'
                      : item.danger
                        ? 'text-red-400 hover:bg-red-500/10'
                        : 'text-gray-300 hover:bg-brand-600 hover:text-white'
                  }
                `}
                >
                  <div className="flex items-center gap-3 pointer-events-none">
                    {item.icon && <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>}
                    <span>{item.label}</span>
                  </div>
                  {item.shortcut && (
                    <span className="text-[10px] opacity-50 font-mono pointer-events-none">{item.shortcut}</span>
                  )}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
