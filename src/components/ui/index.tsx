import React from 'react';

// === Badge ===
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}) => {
  const base = 'inline-flex items-center font-medium';
  const sizes = { sm: 'px-2 py-0.5 text-[10px]', md: 'px-2.5 py-1 text-xs' };
  const variants = {
    default: 'bg-neutral-800 text-neutral-300',
    outline: 'border border-neutral-700 text-neutral-400',
  };
  return (
    <span className={`${base} ${sizes[size]} ${variants[variant]} rounded-md ${className}`}>
      {children}
    </span>
  );
};

// === Tooltip ===
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
}) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative group inline-flex">
      {children}
      <div
        className={`absolute ${positionClasses[side]} px-2 py-1 text-xs text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 whitespace-nowrap pointer-events-none`}
        role="tooltip"
      >
        {content}
      </div>
    </div>
  );
};

// === Divider ===
interface DividerProps {
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({ className = '' }) => (
  <div className={`h-px bg-neutral-800 ${className}`} role="separator" />
);

// === Empty State ===
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
    {icon && <div className="mb-3 text-neutral-600">{icon}</div>}
    <h3 className="text-sm font-medium text-neutral-300 mb-1">{title}</h3>
    {description && <p className="text-xs text-neutral-500 mb-4 text-center max-w-[240px]">{description}</p>}
    {action}
  </div>
);

// === Progress ===
interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className = '',
}) => {
  const percentage = Math.min(100, (value / max) * 100);
  return (
    <div className={`h-1 bg-neutral-800 rounded-full overflow-hidden ${className}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div
        className="h-full bg-neutral-500 transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// === Switch (toggle) ===
interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const sizes = { sm: 'w-8 h-4', md: 'w-10 h-5' };
  const thumbSizes = { sm: 'w-3 h-3', md: 'w-4 h-4' };
  const translateSizes = { sm: 'translate-x-4', md: 'translate-x-5' };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        sizes[size]
      } ${checked ? 'bg-white' : 'bg-neutral-700'} ${className}`}
    >
      <span
        className={`inline-block rounded-full bg-neutral-900 shadow-sm transform transition-transform duration-200 ease-in-out ${
          thumbSizes[size]
        } ${checked ? translateSizes[size] : 'translate-x-0.5'}`}
      />
    </button>
  );
};

// === Avatar ===
interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  fallback?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  size = 'md',
  fallback,
  className = '',
}) => {
  const sizes = { sm: 'w-6 h-6 text-[10px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm' };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizes[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center font-medium ${className}`}
    >
      {fallback || alt.charAt(0).toUpperCase()}
    </div>
  );
};
