import React from 'react';
import { Icons } from '../constants';

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  iconClassName?: string;
  containerClassName?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  className = '',
  containerClassName = 'relative w-full',
  placeholder = 'Search...',
  iconClassName = 'w-4 h-4 text-gray-500',
  ...props
}) => {
  return (
    <div className={containerClassName}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-surface-dark-3 border border-gray-700 rounded-xl py-2 pl-10 pr-8 text-xs text-white focus:border-brand-600 focus:outline-none transition-all ${className}`}
        {...props}
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
        <Icons.Search className={iconClassName} />
      </div>
      {value && value.length > 0 && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            onClear?.();
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-700/60 hover:bg-gray-600 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
          title="Clear search"
          aria-label="Clear search"
        >
          <span className="text-[11px] leading-none font-bold">×</span>
        </button>
      )}
    </div>
  );
};
