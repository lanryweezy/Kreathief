import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Icons } from '../constants';
import { WebsiteBreakpoint, WEBSITE_BREAKPOINTS, Artboard, SiteSettings } from '../types';
import { exportWebsite } from '../services/websiteExportService';
import { ErrorBoundary } from './ErrorBoundary';
import { log } from '../utils/log';

const BREAKPOINT_CONFIG: Array<{
  key: WebsiteBreakpoint;
  label: string;
  icon: React.FC<any>;
  hint: string;
}> = [
  { key: 'mobile', label: 'Mobile', icon: Icons.Smartphone, hint: '375px' },
  { key: 'tablet', label: 'Tablet', icon: Icons.Monitor, hint: '768px' },
  { key: 'desktop', label: 'Desktop', icon: Icons.Monitor, hint: '1440px' },
];

interface WebsitePreviewModalProps {
  onClose: () => void;
}

export const WebsitePreviewModal: React.FC<WebsitePreviewModalProps> = ({ onClose }) => {
  const artboards = useStore((state) => state.artboards);
  const activeArtboardId = useStore((state) => state.activeArtboardId);
  const setActiveArtboardId = useStore((state) => state.setActiveArtboardId);
  const siteSettings = useStore((state: any) => state.siteSettings) as SiteSettings;

  const [breakpoint, setBreakpoint] = useState<WebsiteBreakpoint>('desktop');
  const [activePage, setActivePage] = useState<string>(activeArtboardId);
  const [previewHTML, setPreviewHTML] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const websitePages = artboards.filter((a: Artboard) => (a as any).websitePage);
  const allPages = websitePages.length > 0 ? websitePages : artboards;

  useEffect(() => {
    generatePreview();
  }, [activePage, artboards, siteSettings]);

  const generatePreview = async () => {
    setIsGenerating(true);
    try {
      const currentArtboard = artboards.find((a: Artboard) => a.id === activePage);
      if (!currentArtboard) {
        setIsGenerating(false);
        return;
      }
      const result = await exportWebsite(artboards, siteSettings);
      const pageResult =
        result.pages.find((p) =>
          (currentArtboard as any).websitePage?.isHomePage
            ? p.filename === 'index.html'
            : p.html.includes(currentArtboard.name)
        ) || result.pages[0];

      if (pageResult) {
        const fullHTML = pageResult.html.replace('</head>', `<style>${result.css}</style></head>`);
        setPreviewHTML(fullHTML);
      }
    } catch (err) {
      log.error('Preview generation failed', err);
    }
    setIsGenerating(false);
  };

  useEffect(() => {
    if (iframeRef.current && previewHTML) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(previewHTML);
        doc.close();
      }
    }
  }, [previewHTML]);

  const bpWidth = WEBSITE_BREAKPOINTS[breakpoint];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="flex flex-col h-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top toolbar */}
          <div className="flex items-center gap-4 px-6 py-3 bg-surface-dark-1/95 backdrop-blur-xl border-b border-white/10 shrink-0">
            {/* Site name */}
            <div className="flex items-center gap-2">
              <Icons.Globe className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-bold text-white">{siteSettings?.name || 'Website Preview'}</span>
            </div>

            {/* Page selector */}
            <div className="flex items-center gap-1.5 flex-1 max-w-md overflow-x-auto no-scrollbar">
              {allPages.map((page: Artboard) => {
                const meta = (page as any).websitePage;
                return (
                  <button
                    key={page.id}
                    onClick={() => setActivePage(page.id)}
                    className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activePage === page.id
                        ? 'bg-brand-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {meta?.navLabel || page.name}
                  </button>
                );
              })}
            </div>

            {/* Breakpoint switcher */}
            <div className="flex items-center gap-1 bg-surface-dark-0 rounded-xl p-1">
              {BREAKPOINT_CONFIG.map(({ key, label, icon: Icon, hint }) => (
                <button
                  key={key}
                  onClick={() => setBreakpoint(key)}
                  title={`${label} — ${hint}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    breakpoint === key ? 'bg-surface-dark-2 text-white shadow' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  <span className="text-[9px] opacity-50">{hint}</span>
                </button>
              ))}
            </div>

            {/* Width indicator */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="font-mono">{bpWidth}px</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={generatePreview}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-lg transition-colors"
              >
                <Icons.RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-lg transition-colors"
              >
                <Icons.X className="w-3.5 h-3.5" />
                Close
              </button>
            </div>
          </div>

          {/* Preview area */}
          <div className="flex-1 overflow-auto bg-[#0a0a0f] flex items-start justify-center p-8">
            {/* Device frame */}
            <div
              className="relative bg-surface-dark-2 rounded-2xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-500"
              style={{
                width: bpWidth,
                minHeight: '100%',
              }}
            >
              {/* Mobile notch */}
              {breakpoint === 'mobile' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-surface-dark-1 rounded-b-2xl z-10 flex items-center justify-center">
                  <div className="w-10 h-1 bg-surface-dark-0 rounded-full" />
                </div>
              )}

              {/* Loading overlay */}
              {isGenerating && (
                <div className="absolute inset-0 bg-surface-dark-2/80 flex items-center justify-center z-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
                    <span className="text-xs text-gray-400">Generating preview...</span>
                  </div>
                </div>
              )}

              {/* iframe preview */}
              <iframe
                ref={iframeRef}
                title="Website Preview"
                className="w-full border-0"
                style={{ minHeight: '600px', height: '100%' }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          {/* Bottom info bar */}
          <div className="flex items-center gap-4 px-6 py-2 bg-surface-dark-1/95 backdrop-blur-xl border-t border-white/5 text-[10px] text-gray-500 shrink-0">
            <span>
              Previewing:{' '}
              <strong className="text-gray-300">
                {allPages.find((p: Artboard) => p.id === activePage)?.name || 'Page'}
              </strong>
            </span>
            <span>
              Viewport: <strong className="text-gray-300 font-mono">{bpWidth}px</strong>
            </span>
            <span className="ml-auto">This is an approximate preview. Final output may vary with custom CSS.</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WebsitePreviewModal;
