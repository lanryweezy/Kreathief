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

      <style jsx>{`
        .mobile-panel-wrapper :global(button) {
          min-height: 48px;
          padding: 12px 16px;
          font-size: 15px;
        }

        .mobile-panel-wrapper :global(input),
        .mobile-panel-wrapper :global(textarea) {
          min-height: 48px;
          padding: 12px 16px;
          font-size: 15px;
        }

        .mobile-panel-wrapper :global(.grid) {
          gap: 16px;
        }

        .mobile-panel-wrapper :global(label) {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .mobile-panel-wrapper :global(.text-xs) {
          font-size: 13px;
        }

        .mobile-panel-wrapper :global(.text-sm) {
          font-size: 14px;
        }

        /* Larger touch targets for mobile */
        .mobile-panel-wrapper :global(.icon-button) {
          min-width: 48px;
          min-height: 48px;
        }

        /* Better spacing for cards */
        .mobile-panel-wrapper :global(.card),
        .mobile-panel-wrapper :global([class*="rounded"]) {
          padding: 16px;
        }

        /* Scrollable areas with better padding */
        .mobile-panel-wrapper :global(.overflow-y-auto) {
          padding-bottom: 24px;
        }
      `}</style>
    </div>
  );
};
