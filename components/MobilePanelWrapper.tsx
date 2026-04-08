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

      <style dangerouslySetInnerHTML={{ __html: `
        .mobile-panel-wrapper button {
          min-height: 48px;
          padding: 12px 16px;
          font-size: 15px;
        }

        .mobile-panel-wrapper input,
        .mobile-panel-wrapper textarea {
          min-height: 48px;
          padding: 12px 16px;
          font-size: 15px;
        }

        .mobile-panel-wrapper .grid {
          gap: 16px;
        }

        .mobile-panel-wrapper label {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .mobile-panel-wrapper .text-xs {
          font-size: 13px;
        }

        .mobile-panel-wrapper .text-sm {
          font-size: 14px;
        }

        /* Larger touch targets for mobile */
        .mobile-panel-wrapper .icon-button {
          min-width: 48px;
          min-height: 48px;
        }

        /* Better spacing for cards */
        .mobile-panel-wrapper .card,
        .mobile-panel-wrapper [class*="rounded"] {
          padding: 16px;
        }

        /* Scrollable areas with better padding */
        .mobile-panel-wrapper .overflow-y-auto {
          padding-bottom: 24px;
        }
      `}} />
    </div>
  );
};
