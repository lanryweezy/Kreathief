import React from 'react';

interface MobilePanelWrapperProps {
  children: React.ReactNode;
  title?: string;
}

/**
 * Mobile-optimized wrapper for panels displayed in BottomSheet
 * Provides better spacing, larger touch targets, and cleaner layout
 */
export const MobilePanelWrapper: React.FC<MobilePanelWrapperProps> = ({ children, title }) => {
  return (
    <div className="mobile-panel-wrapper">
      {title && (
        <h2 className="text-lg font-bold text-white mb-6">{title}</h2>
      )}
      
      <div className="space-y-6">
        {children}
      </div>

    </div>
  );
};
