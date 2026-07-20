import React from 'react';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  suffix?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  suffix = '',
  disabled = false,
  ariaLabel,
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`flex flex-col gap-1 ${disabled ? 'opacity-50' : ''}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-[11px] font-medium text-gray-400">{label}</span>}
          {showValue && (
            <span className="text-[11px] font-medium text-gray-300 tabular-nums">
              {value}
              {suffix}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          aria-label={ariaLabel || label || 'Slider'}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-dark-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
          style={{
            background: `linear-gradient(to right, #7d2ae8 0%, #7d2ae8 ${percentage}%, #252627 ${percentage}%, #252627 100%)`,
          }}
        />
      </div>
    </div>
  );
};
