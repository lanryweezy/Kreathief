import React from 'react';

export const Divider = React.memo(() => (
  <div className="h-6 w-px bg-gray-700/50 mx-1 sm:mx-2 shrink-0 hidden sm:block"></div>
));

export const IconButton = React.memo(
  ({ onClick, active, title, children, disabled, className = '', 'aria-label': ariaLabel }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
      aria-pressed={active}
      className={`p-2 rounded-lg transition-all flex items-center justify-center relative group/btn ${
        active
          ? 'bg-[#7d2ae8] text-white shadow-[0_0_15px_rgba(125,42,232,0.4)]'
          : 'text-gray-400 hover:bg-white/10 hover:text-white'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {children}
      {title && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] border border-gray-800 shadow-xl"
          aria-hidden="true"
        >
          {title}
        </div>
      )}
    </button>
  )
);

export const NumberInput = React.memo(({ value, onChange, title, icon: Icon, unit = '', onFocus }: any) => (
  <div
    className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors group/input"
    title={title}
  >
    {Icon && <Icon className="w-3 h-3 text-gray-500 group-hover/input:text-gray-300" aria-hidden="true" />}
    <input
      type="number"
      aria-label={title}
      className="w-12 bg-transparent text-xs text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      value={Math.round(value)}
      onFocus={onFocus}
      onChange={onChange}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
    {unit && (
      <span className="text-[9px] text-gray-500 uppercase" aria-hidden="true">
        {unit}
      </span>
    )}
  </div>
));

export const CompactInput = React.memo(
  ({ value, onChange, min, max, label, width = 'w-12', step = 1, onFocus }: any) => {
    const id = React.useMemo(() => `compact-input-${Math.random().toString(36).substr(2, 9)}`, []);
    return (
      <div className="flex items-center gap-1.5 bg-black/20 border border-white/10 rounded-lg px-2 py-1 focus-within:border-[#7d2ae8]/50 focus-within:bg-black/40 transition-all group">
        {label && (
          <label
            htmlFor={id}
            className="text-[9px] font-bold text-gray-500 group-focus-within:text-[#7d2ae8] select-none cursor-pointer"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          aria-label={label}
          className={`bg-transparent text-[11px] text-white outline-none font-mono text-center no-spinner ${width}`}
          value={Math.round(value)}
          onFocus={onFocus}
          onChange={onChange}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
      </div>
    );
  }
);

Divider.displayName = 'Divider';
IconButton.displayName = 'IconButton';
NumberInput.displayName = 'NumberInput';
CompactInput.displayName = 'CompactInput';
