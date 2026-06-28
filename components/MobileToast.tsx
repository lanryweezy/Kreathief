import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../constants';
import { haptics } from '../utils/haptics';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface MobileToastProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

/**
 * Mobile Toast Notifications
 * Beautiful, non-intrusive notifications optimized for mobile
 */
export const MobileToast: React.FC<MobileToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-24 left-4 right-4 z-[500] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = toast.duration || 3000;
    const interval = 50;
    const decrement = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - decrement;
        if (next <= 0) {
          clearInterval(timer);
          onRemove(toast.id);
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getToastConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: Icons.Check,
          gradient: 'from-green-500 to-emerald-500',
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
        };
      case 'error':
        return {
          icon: Icons.X,
          gradient: 'from-red-500 to-red-600',
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
        };
      case 'warning':
        return {
          icon: Icons.AlertTriangle,
          gradient: 'from-orange-500 to-yellow-500',
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
        };
      case 'info':
      default:
        return {
          icon: Icons.Info,
          gradient: 'from-blue-500 to-cyan-500',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
        };
    }
  };

  const config = getToastConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="mb-3 pointer-events-auto"
    >
      <div
        className={`
        relative overflow-hidden
        bg-[#1a1d21]/95 backdrop-blur-xl
        border ${config.border}
        rounded-2xl shadow-2xl
      `}
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
          <motion.div
            className={`h-full bg-gradient-to-r ${config.gradient}`}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05, ease: 'linear' }}
          />
        </div>

        {/* Content */}
        <div className="flex items-center gap-4 px-5 py-4 pt-5">
          {/* Icon */}
          <div
            className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            bg-gradient-to-br ${config.gradient}
          `}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>

          {/* Message */}
          <p className="flex-1 text-base font-medium text-white">{typeof toast.message === 'string' ? toast.message : String(toast.message ?? '')}</p>

          {/* Close Button */}
          <button
            onClick={() => {
              haptics.light();
              onRemove(toast.id);
            }}
            className="p-2 rounded-lg hover:bg-white/10 active:scale-95 transition-all"
          >
            <Icons.X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Toast Manager Hook
let toastId = 0;
const toastListeners: Set<(toasts: Toast[]) => void> = new Set();
let currentToasts: Toast[] = [];

export const showToast = (message: string, type: ToastType = 'info', duration?: number) => {
  const toast: Toast = {
    id: `toast-${toastId++}`,
    message,
    type,
    duration,
  };

  currentToasts = [...currentToasts, toast];
  toastListeners.forEach((listener) => listener(currentToasts));

  // Trigger haptic feedback
  switch (type) {
    case 'success':
      haptics.success();
      break;
    case 'error':
      haptics.error();
      break;
    default:
      haptics.light();
  }
};

export const removeToast = (id: string) => {
  currentToasts = currentToasts.filter((t) => t.id !== id);
  toastListeners.forEach((listener) => listener(currentToasts));
};

export const useToasts = () => {
  const [toasts, setToasts] = useState<Toast[]>(currentToasts);

  useEffect(() => {
    toastListeners.add(setToasts);
    return () => {
      toastListeners.delete(setToasts);
    };
  }, []);

  return { toasts, removeToast };
};

// Global Toast Container Component
export const MobileToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToasts();
  return <MobileToast toasts={toasts} onRemove={removeToast} />;
};
