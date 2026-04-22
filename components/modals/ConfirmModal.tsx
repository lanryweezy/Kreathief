import React from 'react';
import { Icons } from '../../constants';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

import { ModalWrapper } from './ModalWrapper';

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'info',
}) => {
  const variantStyles = {
    danger: {
      icon: <Icons.Trash className="w-6 h-6 text-red-500" />,
      button: 'bg-red-500 hover:bg-red-600 shadow-red-900/20',
      bg: 'bg-red-500/10 border-red-500/20',
      accent: 'text-red-400',
    },
    warning: {
      icon: <Icons.AlertTriangle className="w-6 h-6 text-amber-500" />,
      button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-900/20',
      bg: 'bg-amber-500/10 border-amber-500/20',
      accent: 'text-amber-400',
    },
    info: {
      icon: <Icons.Help className="w-6 h-6 text-blue-500" />,
      button: 'bg-[#7d2ae8] hover:bg-[#6b23c5] shadow-purple-900/20',
      bg: 'bg-blue-500/10 border-blue-500/20',
      accent: 'text-blue-400',
    },
  };

  const { icon, button, bg } = variantStyles[variant];

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm" showCloseButton={false}>
      <div className="p-10 flex flex-col items-center text-center">
        <div
          className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-8 rotate-3 shadow-2xl overflow-hidden relative group ${bg}`}
        >
          <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors" />
          {React.cloneElement(icon as React.ReactElement, { className: 'w-12 h-12 relative z-10' })}
          <div className="absolute inset-0 animate-ping opacity-10 bg-current rounded-3xl" />
        </div>

        <h3 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase italic">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed font-medium">{message}</p>
      </div>

      <div className="px-10 pb-10 flex flex-col gap-3">
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`w-full py-5 rounded-2xl font-black text-white transition-all transform hover:-translate-y-1 active:translate-y-0.5 shadow-2xl text-base uppercase tracking-widest ${button}`}
        >
          {confirmLabel}
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl font-black text-gray-600 hover:text-white transition-all text-[10px] uppercase tracking-[0.3em]"
        >
          {cancelLabel}
        </button>
      </div>
    </ModalWrapper>
  );
};
