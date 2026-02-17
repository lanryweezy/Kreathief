
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

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'info'
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: <Icons.Trash className="w-6 h-6 text-red-500" />,
            button: 'bg-red-500 hover:bg-red-600 shadow-red-900/20',
            bg: 'bg-red-500/10 border-red-500/20'
        },
        warning: {
            icon: <Icons.AlertTriangle className="w-6 h-6 text-amber-500" />,
            button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-900/20',
            bg: 'bg-amber-500/10 border-amber-500/20'
        },
        info: {
            icon: <Icons.Help className="w-6 h-6 text-blue-500" />,
            button: 'bg-[#7d2ae8] hover:bg-[#6b23c5] shadow-purple-900/20',
            bg: 'bg-blue-500/10 border-blue-500/20'
        }
    };

    const { icon, button, bg } = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn" onClick={onClose}>
            <div
                className="bg-[#1e1e1e] border border-gray-700/50 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] max-w-sm w-full overflow-hidden animate-scaleIn relative border-t-white/10"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-10 flex flex-col items-center text-center">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-8 rotate-3 shadow-2xl overflow-hidden relative group ${bg}`}>
                        <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors" />
                        {React.cloneElement(icon as React.ReactElement, { className: 'w-10 h-10 relative z-10' })}
                    </div>

                    <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed font-medium">{message}</p>
                </div>

                <div className="px-8 pb-8 flex flex-col gap-3">
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`w-full py-4 rounded-2xl font-black text-white transition-all transform hover:-translate-y-1 active:translate-y-0.5 shadow-xl text-base ${button}`}
                    >
                        {confirmLabel}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-2xl font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all text-sm uppercase tracking-widest"
                    >
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
