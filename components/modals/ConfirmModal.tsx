
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="bg-[#1e1e1e] border border-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-zoom-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-8 flex flex-col items-center text-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 ${bg}`}>
                        {icon}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
                </div>

                <div className="p-6 bg-[#13161a] border-t border-gray-800 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg text-sm ${button}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
