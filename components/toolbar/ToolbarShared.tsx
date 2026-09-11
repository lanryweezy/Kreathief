import React from 'react';
import { evaluate } from 'mathjs';
import { Icons } from '../../constants';
import { log } from '../../utils/log';

const safeEvaluate = (expr: string): number => {
  const sanitized = expr.replace(/[^-()\d/*+.]/g, '');
  if (!sanitized) {
    return NaN;
  }
  try {
    const result = evaluate(sanitized);
    return typeof result === 'number' ? result : Number(result);
  } catch (error) {
    log.error('[ToolbarShared] safeEvaluate failed', error, { expr, sanitized });
    return NaN;
  }
};

export const Divider = React.memo(() => (
  <div className="h-6 w-px bg-gray-700/50 mx-1 sm:mx-2 shrink-0 hidden sm:block"></div>
));

/**
 * Shared hook to handle math evaluation and nudging logic for input fields
 */
function useMathInputHandlers({ value, onChange, step = 1, min, max }: { value: any; onChange: any; step?: number; min?: number; max?: number }) {
  const sanitize = (val: number): number => {
    if (isNaN(val)) return 16;
    let v = val;
    if (typeof min === 'number') v = Math.max(min, v);
    if (typeof max === 'number') v = Math.min(max, v);
    return v;
  };

  const notify = React.useCallback(
    (val: number) => {
      const sanitized = sanitize(val);
      if (typeof onChange === 'function') {
        try {
          onChange(sanitized);
        } catch {}
        try {
          onChange({ target: { value: sanitized } } as any);
        } catch {}
      }
    },
    [onChange, min, max]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        try {
          const result = safeEvaluate(e.currentTarget.value);
          if (!isNaN(result)) {
            notify(result);
          }
        } catch (error) {
          log.error('[ToolbarShared] Enter key evaluation failed', error, { value: e.currentTarget.value });
        }
        e.currentTarget.blur();
      }
      // Shift+Arrow power nudging
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const delta = e.shiftKey ? 10 : 1;
        const direction = e.key === 'ArrowUp' ? 1 : -1;
        const cur = typeof value === 'number' && !isNaN(value) ? value : parseFloat(String(value)) || 0;
        notify(cur + delta * direction * step);
        e.preventDefault();
      }
    },
    [value, notify, step]
  );

  const handleBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      try {
        const result = safeEvaluate(e.target.value);
        if (!isNaN(result)) {
          notify(result);
        }
      } catch (error) {
        log.error('[ToolbarShared] Blur evaluation failed', error, { value: e.target.value });
        const cur = typeof value === 'number' && !isNaN(value) ? value : 16;
        e.target.value = String(Math.round(cur));
      }
    },
    [value, notify]
  );

  return { onKeyDown: handleKeyDown, onBlur: handleBlur };
}

export const IconButton = React.memo(
  React.forwardRef(
    (
      { onClick, active, title, children, disabled, loading, shortcut, className = '', 'aria-label': ariaLabel }: any,
      ref: React.ForwardedRef<HTMLButtonElement>
    ) => {
      const [showTooltip, setShowTooltip] = React.useState(false);
      const timeoutRef = React.useRef<any>(null);

      const handleMouseEnter = () => {
        timeoutRef.current = setTimeout(() => setShowTooltip(true), 300);
      };

      const handleMouseLeave = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setShowTooltip(false);
      };

      return (
        <button
          ref={ref}
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
          aria-busy={loading}
          className={`p-2 rounded-lg transition-all flex items-center justify-center relative group/btn ${
            active ? 'bg-brand-600 text-white shadow-glow-brand scale-[0.98]' : 'text-gray-400 hover:bg-white/15 hover:text-white hover:shadow-md'
          } ${disabled || loading ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-[0.96]'} ${className}`}
        >
          {loading ? <Icons.RotateCw className="w-3.5 h-3.5 animate-spin text-purple-400" /> : children}

          {title && (
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#12121c] text-white rounded-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-[200] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-150 flex flex-col items-center gap-0.5 min-w-[130px] max-w-[200px] text-center pointer-events-none"
              aria-hidden="true"
            >
              {(() => {
                const parts = title.split('—');
                const mainName = parts[0]?.trim() || title;
                const desc = parts[1]?.trim();
                return (
                  <>
                    <span className="font-bold text-[11px] text-white leading-tight">
                      {loading ? 'Processing...' : mainName}
                    </span>
                    {desc && <span className="text-[9.5px] text-gray-400 font-medium leading-normal">{desc}</span>}
                    {shortcut && !loading && (
                      <span className="mt-0.5 text-[8px] text-brand-400 font-mono tracking-widest px-1.5 py-0.5 bg-brand-500/10 rounded border border-brand-500/20 lowercase">
                        {shortcut}
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </button>
      );
    }
  )
);

export const NumberInput = React.memo(({ value, onChange, title, icon: Icon, unit = '', onFocus, step = 1 }: any) => {
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const scrubRef = React.useRef<{ startX: number; startVal: number } | null>(null);
  const iconRef = React.useRef<HTMLDivElement>(null);

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
      className={`flex items-center gap-1.5 px-2 py-1 bg-black/20 border border-white/10 rounded-lg hover:border-brand-500/50 hover:bg-black/30 transition-all focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/50 group/input relative ${isScrubbing ? 'ring-1 ring-brand-500/50 bg-black/40' : ''}`}
      title={title}
    >
      {isScrubbing && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-900 text-white text-[10px] font-mono rounded-md border border-gray-700 shadow-lg z-50 whitespace-nowrap pointer-events-none">
          {Math.round(value)}
        </div>
      )}
      {Icon && (
        <div
          ref={iconRef}
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
      <div className="flex items-center gap-1.5 bg-black/20 border border-white/10 rounded-lg px-2 py-1 hover:border-brand-500/50 hover:bg-black/30 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/50 focus-within:bg-black/40 transition-all group">
        {label && (
          <label
            htmlFor={id}
            className="text-[9px] font-bold text-gray-500 group-focus-within:text-brand-600 select-none cursor-pointer"
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
