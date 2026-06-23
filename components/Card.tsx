import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  selected = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl border transition-all duration-200
        ${selected
          ? 'bg-surface-dark-3 border-brand-600/50 shadow-glow-brand'
          : 'bg-surface-dark-2 border-white/5'
        }
        ${hover && 'hover:bg-surface-dark-3 hover:border-white/10 hover:shadow-lg cursor-pointer'}
        ${onClick && 'active:scale-[0.98]'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
