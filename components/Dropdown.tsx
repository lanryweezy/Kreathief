import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface DropdownProps {
  anchorRef: React.RefObject<HTMLElement>;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  offset?: number;
  className?: string;
}

/**
 * Dropdown component that renders via Portal to escape all container constraints.
 * Automatically positions itself to stay within viewport bounds.
 */
export const Dropdown: React.FC<DropdownProps> = ({
  anchorRef,
  isOpen,
  onClose,
  children,
  align = 'left',
  offset = 8,
  className = '',
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'bottom' as 'bottom' | 'top' });
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen || !anchorRef.current || !dropdownRef.current || !mounted) {return;}

    const updatePosition = () => {
      const anchor = anchorRef.current!.getBoundingClientRect();
      const dropdown = dropdownRef.current!.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Calculate space above and below
      const spaceBelow = viewportHeight - anchor.bottom;
      const spaceAbove = anchor.top;

      // Determine if should go up or down
      const shouldGoUp = spaceBelow < dropdown.height && spaceAbove > spaceBelow;

      // Calculate top position
      const top = shouldGoUp
        ? anchor.top - dropdown.height - offset
        : anchor.bottom + offset;

      // Calculate left position based on alignment
      let left: number;
      switch (align) {
        case 'right':
          left = Math.min(anchor.right - dropdown.width, viewportWidth - dropdown.width - 8);
          break;
        case 'center':
          left = Math.max(8, Math.min(anchor.left + anchor.width / 2 - dropdown.width / 2, viewportWidth - dropdown.width - 8));
          break;
        default: // left
          left = Math.max(8, Math.min(anchor.left, viewportWidth - dropdown.width - 8));
      }

      setPosition({ top, left, placement: shouldGoUp ? 'top' : 'bottom' });
    };

    // Update position on mount and resize
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, align, offset, mounted]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) {return;}

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {onClose();}
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) {return null;}

  return createPortal(
    <div
      ref={dropdownRef}
      className={`fixed z-[9999] ${className}`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      role="menu"
    >
      {children}
    </div>,
    document.body
  );
};
