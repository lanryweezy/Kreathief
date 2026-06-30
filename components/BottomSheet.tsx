import React, { useEffect, useState, useRef } from 'react';
import { Icons } from '../constants';
import { haptics } from '../utils/haptics';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  const [mounted, setMounted] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
      haptics.light();
      return;
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = '';
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) {
      return;
    }
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    // Only allow dragging down
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    // Close if dragged down more than 150px
    if (dragY > 150) {
      haptics.medium();
      onClose();
    }

    setDragY(0);
  };

  const handleClose = () => {
    haptics.light();
    onClose();
  };

  if (!mounted && !isOpen) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-b from-[#1a1d21] to-[#0e1318] border-t border-white/10 rounded-t-[2rem] shadow-2xl transition-all duration-300 ease-out flex flex-col max-h-[85vh] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{
          transform: `translateY(${isOpen ? dragY : '100%'}px)`,
          transition: isDragging ? 'none' : 'transform 300ms ease-out',
        }}
      >
        {/* Drag Handle Area */}
        <div
          className="w-full flex flex-col items-center pt-3 pb-4 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Handle bar */}
          <div className="w-12 h-1 bg-white/20 rounded-full mb-4 transition-all duration-200 active:w-16 active:bg-white/30" />

          {/* Header */}
          <div className="flex items-center justify-between w-full px-6">
            <h3 className="text-base font-bold text-white tracking-wide">{typeof title === 'string' ? title : String(title)}</h3>
            <button
              onClick={handleClose}
              className="p-2.5 hover:bg-white/10 active:bg-white/20 rounded-xl transition-all active:scale-95"
            >
              <Icons.X className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Content with better spacing */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 mobile-optimized">{children}</div>

        {/* Bottom fade gradient for scroll indication */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0e1318] to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
