import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toast, ToastType } from '../types';
import { Icons } from '../constants';

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ICONS: Record<ToastType, any> = {
  success: Icons.Check,
  error: Icons.XCircle,
  info: Icons.Info,
  warning: Icons.AlertTriangle,
};

const COLORS: Record<ToastType, string> = {
  success: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-emerald-500/10',
  error: 'bg-red-500/10 border-red-500/50 text-red-400 shadow-red-500/10',
  info: 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-blue-500/10',
  warning: 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-amber-500/10',
};

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const Icon = ICONS[toast.type];

  return (
    <motion.div
      initial={{ x: 50, opacity: 0, scale: 0.9 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 20, opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className={`flex flex-col gap-2 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl min-w-[300px] max-w-[400px] ${COLORS[toast.type]}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 flex flex-col gap-0.5">
          <span className="text-sm font-black tracking-tight leading-snug">{String(toast.message ?? '')}</span>
          {toast.details && <p className="text-[11px] opacity-70 leading-tight">{String(toast.details)}</p>}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="shrink-0 opacity-40 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <Icons.X className="w-4 h-4" />
        </button>
      </div>

      {toast.action && (
        <button
          onClick={() => {
            toast.action?.onClick();
            onRemove(toast.id);
          }}
          className="mt-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all text-center border border-white/5"
        >
          {toast.action.label}
        </button>
      )}
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-8 right-8 z-toast flex flex-col gap-3 pointer-events-none" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast: Toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={onRemove} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
