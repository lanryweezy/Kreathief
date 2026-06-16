import React from 'react';
import { evaluate } from 'mathjs';
import { Icons } from '../../constants';

const safeEvaluate = (expr: string): number => {
  const sanitized = expr.replace(/[^-()\d/*+.]/g, '');
  if (!sanitized) {
    return NaN;
  }
  try {
    const result = evaluate(sanitized);
    return typeof result === 'number' ? result : Number(result);
  } catch {
    return NaN;
  }
};

export const Divider = React.memo(() => (
  <div className="h-6 w-px bg-gray-700/50 mx-1 sm:mx-2 shrink-0 hidden sm:block"></div>
));

/**
 * Shared hook to handle math evaluation and nudging logic for input fields
 */
function useMathInputHandlers({ value, onChange, step = 1 }: { value: any; onChange: any; step?: number }) {
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        try {
          const result = safeEvaluate(e.currentTarget.value);
          if (!isNaN(result)) {
            onChange({ target: { value: result } } as any);
          }
        } catch {
          // Fallback to original if safeEvaluate fails
        }
        e.currentTarget.blur();
      }
      // Shift+Arrow power nudging for #11
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const delta = e.shiftKey ? 10 : 1;
        const direction = e.key === 'ArrowUp' ? 1 : -1;
        onChange({ target: { value: Number(value) + delta * direction * step } } as any);
        e.preventDefault();
      }
    },
    [value, onChange, step]
  );

  const handleBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      try {
        const result = safeEvaluate(e.target.value);
        if (!isNaN(result)) {
          onChange({ target: { value: result } } as any);
        }
      } catch {
        e.target.value = String(Math.round(value));
      }
    },
    [value, onChange]
  );

  return { onKeyDown: handleKeyDown, onBlur: handleBlur };
}

export const IconButton = React.memo(
  ({ onClick, active, title, children, disabled, loading, shortcut, className = '', 'aria-label': ariaLabel }: any) => {
    const [showTooltip, setShowTooltip] = React.useState(false);
    const timeoutRef = React.useRef<any>(null);

    const handleMouseEnter = () => {
      timeoutRef.current = setTimeout(() => setShowTooltip(true), 250);
    };

    const handleMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setShowTooltip(false);
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-testid={
          ariaLabel
            ? `icon-button-${ariaLabel.toLowerCase().replace(/\s+/g, '-')}`
            : title
              ? `icon-button-${title.toLowerCase().replace(/\s+/g, '-')}`
              : undefined
        }
        aria-label={ariaLabel || title}
        aria-pressed={active}
        className={`p-2 rounded-lg transition-all flex items-center justify-center relative group/btn ${
          active
            ? 'bg-[#7d2ae8] text-white shadow-[0_0_15px_rgba(125,42,232,0.4)]'
            : 'text-gray-400 hover:bg-white/10 hover:text-white'
        } ${disabled || loading ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      >
        {loading ? <Icons.RotateCw className="w-3.5 h-3.5 animate-spin text-purple-400" /> : children}

        {title && showTooltip && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-[10px] rounded-md border border-gray-800 shadow-2xl z-[100] animate-scale-in flex flex-col items-center gap-1 min-w-max"
            aria-hidden="true"
          >
            <span className="font-bold tracking-wide">{loading ? 'Processing...' : title}</span>
            {shortcut && !loading && (
              <span className="text-[8px] text-gray-500 font-mono tracking-widest px-1.5 py-0.5 bg-black/40 rounded border border-white/5 lowercase">
                {shortcut}
              </span>
            )}
          </div>
        )}
      </button>
    );
  }
);

export const NumberInput = React.memo(({ value, onChange, title, icon: Icon, unit = '', onFocus, step = 1 }: any) => {
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const scrubRef = React.useRef<{ startX: number; startVal: number } | null>(null);

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      setIsScrubbing(true);
      scrubRef.current = { startX: e.clientX, startVal: value };
      document.body.style.cursor = 'ew-resize';

      const handleMouseMove = (me: MouseEvent) => {
        if (!scrubRef.current) {
          return;
        }
        const dx = me.clientX - scrubRef.current.startX;
        const newVal = scrubRef.current.startVal + dx * step;
        onChange({ target: { value: newVal } } as any);
      };

      const handleMouseUp = () => {
        setIsScrubbing(false);
        scrubRef.current = null;
        document.body.style.cursor = 'default';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [value, onChange, step]
  );

  const { onKeyDown, onBlur } = useMathInputHandlers({ value, onChange, step });

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors group/input ${isScrubbing ? 'ring-1 ring-purple-500/50' : ''}`}
      title={title}
    >
      {Icon && (
        <div
          onMouseDown={handleMouseDown}
          className="cursor-ew-resize flex items-center justify-center p-0.5 rounded hover:bg-white/10"
        >
          <Icon
            className="w-3 h-3 text-gray-500 group-hover/input:text-gray-300 transition-colors"
            aria-hidden="true"
          />
        </div>
      )}
      <input
        type="text" // Change to text to allow math expressions
        inputMode="decimal"
        aria-label={title}
        className="w-12 bg-transparent text-xs text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
        defaultValue={Math.round(value)}
        key={value} // Force re-render when external value changes
        onFocus={(e) => {
          e.currentTarget.select(); // Auto-select on focus for #13
          onFocus?.(e);
        }}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      {unit && (
        <span className="text-[9px] text-gray-500 uppercase font-bold" aria-hidden="true">
          {unit}
        </span>
      )}
    </div>
  );
});

export const CompactInput = React.memo(
  ({ value, onChange, min, max, label, width = 'w-12', step = 1, onFocus }: any) => {
    const id = React.useMemo(() => `compact-input-${crypto.randomUUID().substring(0, 9)}`, []);

    const { onKeyDown, onBlur } = useMathInputHandlers({ value, onChange, step });

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
          type="text"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          data-testid={`compact-input-${label ? label.toLowerCase() : 'field'}`}
          aria-label={label}
          className={`bg-transparent text-[11px] text-white outline-none font-mono text-center no-spinner ${width}`}
          defaultValue={Math.round(value)}
          key={value}
          onFocus={(e) => {
            e.currentTarget.select();
            onFocus?.(e);
          }}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
      </div>
    );
  }
);

Divider.displayName = 'Divider';
IconButton.displayName = 'IconButton';
NumberInput.displayName = 'NumberInput';
CompactInput.displayName = 'CompactInput';
