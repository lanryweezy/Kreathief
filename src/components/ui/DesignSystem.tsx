import React, { forwardRef } from 'react';
import { evaluate } from 'mathjs';

/* ═══════════════════════════════════════════════════════════════
   KREATHEIF DESIGN SYSTEM — Components
   Every visual decision belongs to a system.
   ═══════════════════════════════════════════════════════════════ */

// ── Button ─────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
}

const btnVariant: Record<ButtonVariant, string> = {
  primary: 'bg-content-primary text-content-inverse hover:bg-surface-9/90 active:bg-surface-8',
  secondary:
    'bg-surface-3 text-content-primary border border-border-default hover:bg-surface-5 hover:border-border-strong active:bg-surface-6',
  ghost: 'text-content-secondary hover:bg-surface-4 hover:text-content-primary active:bg-surface-5',
  destructive: 'bg-surface-3 text-error border border-error/30 hover:bg-error/10 active:bg-error/20',
};

const btnSize: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-label gap-1.5',
  md: 'h-8 px-3.5 text-body-sm gap-2',
  lg: 'h-10 px-5 text-body gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', icon, loading, children, className = '', disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center font-medium rounded-md transition-all duration-fast focus-visible:outline-2 focus-visible:outline-border-focus focus-visible:outline-offset-2 disabled:opacity-[0.35] disabled:cursor-not-allowed ${btnVariant[variant]} ${btnSize[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        icon
      )}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

// ── Card ───────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  selected?: boolean;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  selected = false,
  elevated = false,
}) => (
  <div
    className={`bg-surface-3 rounded-lg transition-all duration-fast ${
      selected ? 'border border-border-strong ring-1 ring-border-focus/20' : 'border border-border-default'
    } ${elevated ? 'shadow-[var(--elevation-2)]' : ''} ${hover ? 'hover:bg-surface-4 hover:border-border-strong cursor-pointer' : ''} ${className}`}
  >
    {children}
  </div>
);

// ── Input ──────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="text-label text-content-secondary">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted">{icon}</div>}
        <input
          ref={ref}
          className={`w-full h-8 px-3 text-body-sm bg-surface-2 border rounded-md text-content-primary placeholder:text-content-muted focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus/30 transition-colors ${icon ? 'pl-9' : ''} ${error ? 'border-error' : 'border-border-default'} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-micro text-error">{error}</p>}
      {hint && !error && <p className="text-micro text-content-muted">{hint}</p>}
    </div>
  )
);
Input.displayName = 'Input';

// ── Textarea ───────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="text-label text-content-secondary">{label}</label>}
      <textarea
        ref={ref}
        className={`w-full px-3 py-2 text-body-sm bg-surface-2 border rounded-md text-content-primary placeholder:text-content-muted focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus/30 transition-colors resize-none ${error ? 'border-error' : 'border-border-default'} ${className}`}
        {...props}
      />
      {error && <p className="text-micro text-error">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';

// ── Select ─────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className = '', ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="text-label text-content-secondary">{label}</label>}
      <select
        ref={ref}
        className={`w-full h-8 px-3 text-body-sm bg-surface-2 border border-border-default rounded-md text-content-primary focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus/30 transition-colors ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
);
Select.displayName = 'Select';

// ── Badge ──────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
}

const badgeVariant: Record<string, string> = {
  default: 'bg-surface-5 text-content-secondary',
  outline: 'border border-border-default text-content-secondary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'sm' }) => (
  <span
    className={`inline-flex items-center font-medium rounded-sm ${badgeVariant[variant]} ${size === 'sm' ? 'px-1.5 py-0.5 text-micro' : 'px-2 py-0.5 text-label'}`}
  >
    {children}
  </span>
);

// ── Skeleton ───────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'xs' | 'sm' | 'md' | 'lg' | 'full';
}

const skelRadius: Record<string, string> = {
  xs: 'rounded-xs',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', width, height, rounded = 'sm' }) => (
  <div
    className={`skeleton ${skelRadius[rounded]} ${className}`}
    style={{ width: width || '100%', height: height || '14px' }}
    aria-hidden="true"
  />
);

export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} height="11px" width={i === lines - 1 ? '60%' : '100%'} rounded="xs" />
    ))}
  </div>
);

export const SkeletonCard: React.FC = () => (
  <div className="p-4 space-y-3">
    <Skeleton height="100px" rounded="md" />
    <Skeleton height="13px" width="70%" />
    <Skeleton height="11px" width="50%" />
  </div>
);

// ── Empty State ────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    {icon && <div className="mb-3 text-content-muted">{icon}</div>}
    <h3 className="text-body-sm font-medium text-content-secondary mb-1">{title}</h3>
    {description && <p className="text-body-sm text-content-muted mb-4 text-center max-w-[240px]">{description}</p>}
    {action}
  </div>
);

// ── Divider ────────────────────────────────────────────────────

export const Divider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-px bg-border-default ${className}`} role="separator" />
);

// ── Progress ───────────────────────────────────────────────────

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, max = 100, className = '' }) => {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div
      className={`h-1 bg-surface-5 rounded-full overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="h-full bg-content-secondary transition-all duration-slow" style={{ width: `${pct}%` }} />
    </div>
  );
};

// ── Switch ─────────────────────────────────────────────────────

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange, disabled = false, size = 'md' }) => {
  const s = size === 'sm' ? 'w-8 h-4' : 'w-10 h-5';
  const t = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex items-center rounded-full transition-all duration-fast focus-visible:outline-2 focus-visible:outline-border-focus focus-visible:outline-offset-2 disabled:opacity-35 ${s} ${checked ? 'bg-content-primary' : 'bg-surface-6'}`}
    >
      <span
        className={`inline-block rounded-full bg-content-inverse shadow-sm transition-transform duration-fast ${t} ${checked ? (size === 'sm' ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0.5'}`}
      />
    </button>
  );
};

// ── Avatar ─────────────────────────────────────────────────────

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fallback?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt = '', size = 'md', fallback }) => {
  const s = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-body-sm',
    lg: 'w-10 h-10 text-body',
  }[size];
  if (src) return <img src={src} alt={alt} className={`${s} rounded-full object-cover`} />;
  return (
    <div
      className={`${s} rounded-full bg-surface-5 text-content-secondary flex items-center justify-center font-medium`}
    >
      {fallback || (typeof alt === 'string' ? alt.charAt(0).toUpperCase() : '')}
    </div>
  );
};

// ── Tooltip ────────────────────────────────────────────────────

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, side = 'top' }) => {
  const pos = { top: 'bottom-full mb-2', bottom: 'top-full mt-2', left: 'right-full mr-2', right: 'left-full ml-2' }[
    side
  ];
  return (
    <div className="relative group inline-flex">
      {children}
      <div
        className={`absolute ${pos} left-1/2 -translate-x-1/2 px-2 py-1 text-micro text-content-secondary bg-surface-4 border border-border-default rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-fast z-[var(--z-popover)] whitespace-nowrap pointer-events-none`}
        role="tooltip"
      >
        {content}
      </div>
    </div>
  );
};

// ── Tabs ───────────────────────────────────────────────────────

interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onTabChange: (id: any) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => (
  <div className="flex border-b border-border-default" role="tablist">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        role="tab"
        aria-selected={activeTab === tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-label font-medium transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-border-focus focus-visible:outline-offset-[-2px] ${
          activeTab === tab.id
            ? 'text-content-primary border-b-2 border-content-primary'
            : 'text-content-muted hover:text-content-secondary'
        }`}
      >
        {tab.icon}
        {tab.label}
      </button>
    ))}
  </div>
);

// ── Modal ──────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;
  const w = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }[size];
  return (
    <div
      className="fixed inset-0 z-[var(--z-dialog)] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full ${w} bg-surface-3 border border-border-default rounded-xl shadow-[var(--elevation-4)] animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
            <h2 className="text-body font-semibold text-content-primary">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 text-content-muted hover:text-content-primary rounded-md hover:bg-surface-5 transition-colors"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// ── ContextMenu ────────────────────────────────────────────────

interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (e.button === 2) return;
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => {
      document.removeEventListener('mousedown', h);
      document.removeEventListener('keydown', k);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-[var(--z-popover)] bg-surface-3 border border-border-default rounded-lg shadow-[var(--elevation-3)] py-1 min-w-[180px] animate-fade-in"
      style={{ left: x, top: y }}
      role="menu"
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {item.divider && <div className="my-1 border-t border-border-default" />}
          <button
            onClick={() => {
              item.action();
              onClose();
            }}
            disabled={item.disabled}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-body-sm transition-colors duration-fast focus-visible:outline-none ${
              item.danger
                ? 'text-error hover:bg-error/10'
                : item.disabled
                  ? 'text-content-disabled cursor-not-allowed'
                  : 'text-content-secondary hover:bg-surface-5 hover:text-content-primary'
            }`}
            role="menuitem"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

// ── Toast ──────────────────────────────────────────────────────

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

const toastStyle: Record<string, string> = {
  success: 'bg-surface-4 border-success/30',
  error: 'bg-surface-4 border-error/30',
  warning: 'bg-surface-4 border-warning/30',
  info: 'bg-surface-4 border-border-default',
};

export const ToastContainer: React.FC<{ toasts: ToastItem[]; onDismiss: (id: string) => void }> = ({
  toasts,
  onDismiss,
}) => (
  <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[var(--z-notification)] flex flex-col gap-2 pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-body-sm text-content-primary shadow-[var(--elevation-2)] backdrop-blur-sm pointer-events-auto animate-fade-in ${toastStyle[t.type]}`}
      >
        <span className="flex-1">{t.message}</span>
        <button
          onClick={() => onDismiss(t.id)}
          className="text-content-muted hover:text-content-primary"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    ))}
  </div>
);

// ── NumberInput ────────────────────────────────────────────────

interface NumberInputProps {
  value: number;
  onChange: (v: number) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  label,
  min = -Infinity,
  max = Infinity,
  step = 1,
}) => {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(String(value));
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!editing) setDraft(String(Math.round(value * 100) / 100));
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    // Bloom: Added math evaluation so users can type expressions like "100/2"
    let p = NaN;
    try {
      const res = evaluate(draft);
      if (typeof res === 'number') p = res;
    } catch (e) {
      p = parseFloat(draft);
    }
    if (!isNaN(p)) onChange(Math.min(max, Math.max(min, p)));
  };

  if (editing) {
    return (
      <input
        ref={ref}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="w-full h-7 px-1.5 text-body-sm bg-surface-2 border border-border-focus rounded-sm text-content-primary outline-none font-mono"
        autoFocus
        step={step}
        min={min}
        max={max}
      />
    );
  }

  return (
    <div className="space-y-0.5">
      {label && <label className="text-micro text-content-muted">{label}</label>}
      <div
        onDoubleClick={() => {
          setEditing(true);
          setDraft(String(Math.round(value * 100) / 100));
          setTimeout(() => ref.current?.select(), 0);
        }}
        className="flex items-center h-7 px-1.5 text-body-sm bg-surface-2 border border-border-default rounded-sm text-content-primary font-mono cursor-ew-resize hover:border-border-strong select-none"
      >
        <span className="flex-1 truncate">{Math.round(value * 100) / 100}</span>
      </div>
    </div>
  );
};
