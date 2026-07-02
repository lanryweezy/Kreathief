import React from 'react';
import { CanvasSize } from '../../types';
import { ShareModal } from '../modals/ShareModal';
import { ExportModal } from '../modals/ExportModal';
import { ShortcutOverlay } from '../ShortcutOverlay';
import { FeedbackModal } from '../modals/FeedbackModal';
import { ErrorBoundary } from '../ErrorBoundary';
import { ColorProfile } from '../../services/exportService';

const CommunityModal = React.lazy(() => import('../modals/CommunityModal'));
const CommandPalette = React.lazy(() =>
  import('../modals/CommandPalette').then((module) => ({ default: module.CommandPalette }))
);

interface EditorModalsProps {
  showExport: boolean;
  setShowExport: (show: boolean) => void;
  showShareModal: boolean;
  setShowShareModal: (show: boolean) => void;
  showShortcuts: boolean;
  setShowShortcuts: (show: boolean) => void;
  showCommunityModal: boolean;
  setShowCommunityModal: (show: boolean) => void;
  canvasSize: CanvasSize;
  projectTitle: string;
  projectId: string | null;
  userId: string;
  onConfirmExport: (params: {
    format: 'png' | 'jpeg' | 'webp' | 'svg' | 'pdf' | 'psd';
    quality: number;
    size?: { width: number; height: number };
    transparentBg?: boolean;
    customFilename?: string;
    overrideLayers?: any[];
    printOptions?: { colorProfile: ColorProfile; bleed: number; cropMarks: boolean };
    onComplete: () => void;
  }) => Promise<void>;
  onGetPngBlob: () => Promise<Blob | null>;
  onGetShareLink: () => Promise<string>;
  showNodeGraph: boolean;
  NodeGraphComponent: React.ReactNode;
  AIGenerateComponent: React.ReactNode;
}

export const EditorModals: React.FC<EditorModalsProps> = React.memo(
  ({
    showExport,
    setShowExport,
    showShareModal,
    setShowShareModal,
    showShortcuts,
    setShowShortcuts,
    showCommunityModal,
    setShowCommunityModal,
    canvasSize,
    projectTitle,
    projectId,
    userId,
    onConfirmExport,
    onGetPngBlob,
    onGetShareLink,
    showNodeGraph,
    NodeGraphComponent,
    AIGenerateComponent,
  }) => {
    return (
      <>
        <ErrorBoundary componentName="Modals" variant="widget">
          {showExport && (
            <ExportModal
              onClose={() => setShowExport(false)}
              currentSize={canvasSize}
              onExport={(format, quality, size, transparentBg, customFilename, overrideLayers, printOptions) =>
                onConfirmExport({
                  format,
                  quality,
                  size,
                  transparentBg,
                  customFilename,
                  overrideLayers,
                  printOptions,
                  onComplete: () => setShowExport(false),
                })
              }
              onGetPngBlob={onGetPngBlob}
            />
          )}
          {showShareModal && (
            <ShareModal
              onClose={() => setShowShareModal(false)}
              designTitle={projectTitle}
              onGetShareLink={onGetShareLink}
            />
          )}
        </ErrorBoundary>

        <ShortcutOverlay isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
        <FeedbackModal />

        <React.Suspense fallback={null}>
          {showCommunityModal && <CommunityModal onClose={() => setShowCommunityModal(false)} />}
          <CommandPalette />
        </React.Suspense>

        {NodeGraphComponent}
        {AIGenerateComponent}
      </>
    );
  }
);

EditorModals.displayName = 'EditorModals';
