import React, { useState, useRef, useEffect } from 'react';

interface ScrubbableNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  label?: string;
  snapToZeroRange?: number;
}

export const ScrubbableNumberInput: React.FC<ScrubbableNumberInputProps> = ({
  value,
  onChange,
  onChangeEnd,
  min = -Infinity,
  max = Infinity,
  step = 1,
  className = '',
  label,
  snapToZeroRange = 0,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startValue = useRef(value);
  const currentValue = useRef(value);
  currentValue.current = value;


  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
    startValue.current = value;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX.current;
    
    // Fine control with shift, faster with alt
    const modifier = e.shiftKey ? 0.1 : e.altKey ? 10 : 1;
    let newValue = startValue.current + deltaX * step * modifier;
    
    if (snapToZeroRange > 0 && Math.abs(newValue) <= snapToZeroRange) {
       newValue = 0;
    }
    
    newValue = Math.max(min, Math.min(max, newValue));
    onChange(Math.round(newValue));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      onChangeEnd?.(currentValue.current);
    }
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-[10px] text-gray-400 font-bold">{label}</span>}
      <input
        type="number"
        value={value}
        onChange={(e) => {
          let val = Number(e.target.value);
          if (snapToZeroRange > 0 && Math.abs(val) <= snapToZeroRange) val = 0;
          onChange(Math.max(min, Math.min(max, val)));
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-16 bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white text-right cursor-ew-resize focus:outline-none focus:border-brand-600 appearance-none select-none transition-colors hover:bg-black/30"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};
