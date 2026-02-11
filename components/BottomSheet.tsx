
import React, { useEffect, useState } from 'react';
import { Icons } from '../constants';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setMounted(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted && !isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Sheet */}
            <div
                className={`absolute bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-gray-700 rounded-t-[2.5rem] shadow-2xl transition-transform duration-300 ease-out flex flex-col max-h-[85vh] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
            >
                {/* Handle */}
                <div className="w-full flex flex-col items-center py-4 cursor-pointer" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-gray-700 rounded-full mb-2" />
                    <div className="flex items-center justify-between w-full px-8">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">{title}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <Icons.X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 pb-20 custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};
