import React from 'react';

import { Toast, ToastType } from '../types';

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const COLORS: Record<ToastType, string> = {
  success: 'bg-emerald-600 border-emerald-500',
  error: 'bg-red-600 border-red-500',
  info: 'bg-blue-600 border-blue-500',
  warning: 'bg-amber-600 border-amber-500',
};

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  return (
    <div
      className={`flex flex-col gap-2 p-4 rounded-xl border shadow-2xl text-white text-sm font-medium
        animate-slide-in-right backdrop-blur-sm min-w-[280px] max-w-[400px] ${COLORS[toast.type]}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="text-base font-bold shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 mt-0.5">
          {ICONS[toast.type]}
        </span>
        <div className="flex-1 flex flex-col gap-1">
          <span className="leading-snug font-bold">{toast.message}</span>
          {toast.details && (
            <p className="text-[11px] text-white/80 leading-tight">
              {toast.details}
            </p>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="shrink-0 text-white/60 hover:text-white transition-colors text-xl leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      {toast.action && (
        <button
          onClick={() => {
            toast.action?.onClick();
            onRemove(toast.id);
          }}
          className="mt-1 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-black uppercase tracking-widest transition-all text-center"
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
};
