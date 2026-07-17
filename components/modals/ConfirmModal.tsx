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
      icon: <Icons.Trash className="w-6 h-6 text-error" />,
      button: 'bg-error hover:bg-error-dark shadow-error/20',
      bg: 'bg-error-subtle',
      accent: 'text-error',
    },
    warning: {
      icon: <Icons.AlertTriangle className="w-6 h-6 text-warning" />,
      button: 'bg-warning hover:bg-warning-dark shadow-warning/20',
      bg: 'bg-warning-subtle',
      accent: 'text-warning',
    },
    info: {
      icon: <Icons.Help className="w-6 h-6 text-info" />,
      button: 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/20',
      bg: 'bg-info-subtle',
      accent: 'text-info',
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
