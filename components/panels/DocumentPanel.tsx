import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { Artboard, Layer, ShapeType } from '../../types';
import { PanelErrorBoundary } from './PanelErrorBoundary';
import { PanelHeader } from './PanelHeader';
const generateDocumentDesign = null as unknown as any;
import { jsPDF } from 'jspdf';
import { log } from '../../utils/log';
import { getAIErrorMessage } from '../../utils/errorMessages';

const PAGE_FORMATS = {
  a4: { name: 'A4', width: 794, height: 1123 },
  letter: { name: 'US Letter', width: 816, height: 1056 },
};

const DocumentThumbnail: React.FC<{ artboard: Artboard; isActive: boolean }> = ({ artboard, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const W = canvas.width;
    const H = canvas.height;
    const scaleX = W / artboard.width;
    const scaleY = H / artboard.height;

    // Background
    ctx.fillStyle = artboard.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Render layers
    artboard.layers.forEach((layer: any) => {
      if (layer.visible === false) {
        return;
      }
      ctx.globalAlpha = layer.opacity ?? 1;

      const lx = (layer.x || 0) * scaleX;
      const ly = (layer.y || 0) * scaleY;
      const lw = (layer.width || 0) * scaleX;
      const lh = (layer.height || 0) * scaleY;

      if (layer.type === 'text') {
        ctx.fillStyle = layer.color || '#333333';
        const fontSize = Math.max(2, (layer.fontSize || 16) * Math.min(scaleX, scaleY));
        ctx.font = `${layer.fontWeight || '400'} ${fontSize}px ${layer.fontFamily || 'sans-serif'}`;
        ctx.textAlign = (layer.textAlign as CanvasTextAlign) || 'left';
        ctx.fillText(layer.text || '', lx, ly + fontSize, lw);
      } else if (['rectangle', 'circle', 'hexagon', 'diamond'].includes(layer.type)) {
        ctx.fillStyle = layer.color || '#e2e8f0';
        ctx.beginPath();
        ctx.roundRect(lx, ly, lw, lh, (layer.cornerRadius || 0) * Math.min(scaleX, scaleY));
        ctx.fill();
      } else if ((layer as any).type === 'table') {
        const tl = layer as any;
        ctx.strokeStyle = tl.borderColor || '#cbd5e1';
        ctx.strokeRect(lx, ly, lw, lh);
        ctx.fillStyle = tl.headerColor || '#f8fafc';
        ctx.fillRect(lx, ly, lw, 20 * scaleY);
      }
      ctx.globalAlpha = 1;
    });
  }, [artboard, artboard.layers.length]);

  return (
    <canvas
      ref={canvasRef}
      width={180}
      height={254}
      className={`w-full rounded border bg-white transition-all duration-200 ${
        isActive ? 'border-brand-500/80 shadow-lg shadow-brand-500/20' : 'border-surface-dark-0'
      }`}
    />
  );
};

export const DocumentPanel: React.FC = () => {
  const artboards = useStore((state) => state.artboards) || [];
  const activeArtboardId = useStore((state) => state.activeArtboardId);
  const setActiveArtboardId = useStore((state) => state.setActiveArtboardId);
  const addArtboard = useStore((state) => state.addArtboard);
  const deleteArtboard = useStore((state) => state.deleteArtboard);

  const documentFormat = useStore((s) => (s as any).documentFormat) || 'a4';
  const setDocumentFormat = useStore((s) => (s as any).setDocumentFormat);
  const docType = useStore((s) => (s as any).documentType) || 'Resume';
  const setDocType = useStore((s) => (s as any).setDocumentType);

  const documentPages = artboards;

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPromptText, setAIPromptText] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleGenerateDocument = async () => {
    if (!aiPromptText.trim()) {
      return;
    }
    setIsGeneratingAI(true);
    try {
      const generated = await generateDocumentDesign(aiPromptText, docType);

      const W = PAGE_FORMATS[documentFormat as keyof typeof PAGE_FORMATS].width;
      const H = PAGE_FORMATS[documentFormat as keyof typeof PAGE_FORMATS].height;

      useStore.setState({ artboards: [] });

      const boardId = `board_${Date.now()}_doc`;
      const newBoard: Artboard = {
        id: boardId,
        name: `${docType} - Page 1`,
        x: 0,
        y: 0,
        width: W,
        height: H,
        backgroundColor: '#ffffff',
        layers: [],
      };

      useStore.setState({ artboards: [newBoard] });
      setActiveArtboardId(newBoard.id);

      setTimeout(() => {
        const state = useStore.getState() as any;
        let currentY = 50;

        // Iterate through generated sections
        generated.sections.forEach((section: any, idx: number) => {
          if (currentY > H - 100) {
            return;
          } // Basic overflow prevention

          if (section.title) {
            state.addTextLayer({
              name: section.title,
              text: section.title.toUpperCase(),
              x: 50,
              y: currentY,
              width: W - 100,
              height: 30,
              fontSize: 14,
              fontWeight: '800',
              fontFamily: generated.theme.fontFamily,
              color: generated.theme.primaryColor,
              letterSpacing: 2,
            });
            currentY += 40;

            // Separator line
            state.addShapeLayer('rectangle', {
              name: 'Separator',
              x: 50,
              y: currentY - 10,
              width: W - 100,
              height: 2,
              color: '#e2e8f0',
            });
          }

          if (section.type === 'header') {
            const name = section.items[0]?.value || '';
            state.addTextLayer({
              name: 'Doc Header Name',
              text: name,
              x: 50,
              y: currentY,
              width: W - 100,
              height: 50,
              fontSize: 32,
              fontWeight: '700',
              fontFamily: generated.theme.fontFamily,
              color: '#1e293b',
            });
            currentY += 50;

            if (section.items[1]) {
              state.addTextLayer({
                name: 'Doc Header Contact',
                text: section.items[1].value,
                x: 50,
                y: currentY,
                width: W - 100,
                height: 20,
                fontSize: 12,
                fontWeight: '400',
                fontFamily: generated.theme.fontFamily,
                color: generated.theme.secondaryColor,
              });
              currentY += 40;
            }
          } else if (section.type === 'table') {
            const columns = ['Description', 'Qty', 'Price', 'Total'];
            const rows = section.items.map((item: any) => [
              item.label || 'Item',
              '1',
              item.value || '$0.00',
              item.value || '$0.00',
            ]);
            state.addTableLayer({
              name: section.title || 'Table',
              x: 50,
              y: currentY,
              width: W - 100,
              height: 40 + rows.length * 30,
              columns,
              rows,
              fontFamily: generated.theme.fontFamily,
            });
            currentY += 60 + rows.length * 30;
          } else {
            section.items.forEach((item: any) => {
              if (currentY > H - 50) {
                return;
              }

              if (item.label) {
                state.addTextLayer({
                  name: 'Label',
                  text: item.label,
                  x: 50,
                  y: currentY,
                  width: 200,
                  height: 20,
                  fontSize: 12,
                  fontWeight: '700',
                  fontFamily: generated.theme.fontFamily,
                  color: '#1e293b',
                });
              }

              state.addTextLayer({
                name: 'Value',
                text: item.value,
                x: item.label ? 250 : 50,
                y: currentY,
                width: item.label ? W - 300 : W - 100,
                height: 40,
                fontSize: 12,
                fontWeight: '400',
                fontFamily: generated.theme.fontFamily,
                color: generated.theme.secondaryColor,
              });

              if (item.subValue) {
                state.addTextLayer({
                  name: 'SubValue',
                  text: item.subValue,
                  x: W - 150,
                  y: currentY,
                  width: 100,
                  height: 20,
                  fontSize: 10,
                  fontWeight: '400',
                  fontFamily: generated.theme.fontFamily,
                  color: '#94a3b8',
                  textAlign: 'right',
                });
              }
              currentY += 30;
            });
            currentY += 20; // Space between sections
          }
        });
      }, 100);
    } catch (error) {
      log.error('Failed to generate document.', error);
      // 🌸 Bloom: Closed quality gap where document generation errors showed generic, blocking alerts
      // Improvement: Replaced native alert with non-blocking toast UI using specific AI error formatters
      useStore.getState().addToast(getAIErrorMessage(error), 'error');
    } finally {
      setIsGeneratingAI(false);
      setShowAIModal(false);
    }
  };

  const handleExportPDF = () => {
    if (documentPages.length === 0) {
      return;
    }

    // Scale from internal pixels (e.g. 794x1123 for A4) to mm
    // A4 is 210x297mm.
    const W_MM = documentFormat === 'a4' ? 210 : 215.9; // Letter width 8.5inch ~ 215.9mm
    const H_MM = documentFormat === 'a4' ? 297 : 279.4; // Letter height 11inch ~ 279.4mm

    const scale = W_MM / PAGE_FORMATS[documentFormat as keyof typeof PAGE_FORMATS].width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: documentFormat === 'a4' ? 'a4' : 'letter',
    });

    documentPages.forEach((page: Artboard, index: number) => {
      if (index > 0) {
        pdf.addPage();
      }

      // bg
      pdf.setFillColor(page.backgroundColor || '#ffffff');
      pdf.rect(0, 0, W_MM, H_MM, 'F');

      const visibleLayers = [...page.layers].filter((l) => l.visible !== false);

      visibleLayers.forEach((layer) => {
        const lx = (layer.x || 0) * scale;
        const ly = (layer.y || 0) * scale;
        const lw = (layer.width || 0) * scale;
        const lh = (layer.height || 0) * scale;

        if (layer.type === 'text') {
          const tl = layer as any;
          pdf.setTextColor(tl.color || '#333');
          // Approximating fontSize conversion px to pt
          pdf.setFontSize((tl.fontSize || 16) * 0.75);
          // @ts-ignore - jspdf text() signature varies by version
          pdf.text(tl.text || '', lx, ly + (tl.fontSize || 16) * 0.75 * scale, { baseline: 'bottom' });
        } else if (['rectangle', 'circle'].includes(layer.type)) {
          const sl = layer as any;
          pdf.setFillColor(sl.color || '#e2e8f0');
          if (layer.type === 'circle') {
            pdf.circle(lx + lw / 2, ly + lh / 2, lw / 2, 'F');
          } else {
            pdf.rect(lx, ly, lw, lh, 'F');
          }
        } else if ((layer as any).type === 'table') {
          const tl = layer as any;

          pdf.setDrawColor(tl.borderColor || '#cbd5e1');
          pdf.setFillColor(tl.headerColor || '#f8fafc');
          pdf.rect(lx, ly, lw, 10, 'FD'); // Header row approx 10mm high

          pdf.setTextColor(tl.textColor || '#1e293b');
          pdf.setFontSize((tl.fontSize || 12) * 0.75);

          // Draw Headers
          const colWidth = lw / Math.max(1, tl.columns.length);
          tl.columns.forEach((col: any, cIdx: number) => {
            // @ts-ignore - jspdf text() signature varies by version
            pdf.text(col, lx + cIdx * colWidth + 2, ly + 7);
          });

          // Draw Rows
          tl.rows.forEach((row: any, rIdx: number) => {
            const rowY = ly + 10 + rIdx * 10;
            pdf.rect(lx, rowY, lw, 10, 'D'); // Cell borders
            row.forEach((cell: any, cIdx: number) => {
              // @ts-ignore - jspdf text() signature varies by version
              pdf.text(cell, lx + cIdx * colWidth + 2, rowY + 7);
            });
          });
        }
      });
    });

    pdf.save(`Document-${documentFormat}.pdf`);
  };

  return (
    <PanelErrorBoundary>
      <div className="flex flex-col h-full bg-surface-dark-2 overflow-hidden">
        <PanelHeader
          title="Document Builder"
          icon={<Icons.FileText className="w-5 h-5 text-brand-400" />}
          action={
            <button
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-glow-brand"
            >
              <Icons.Sparkles className="w-3.5 h-3.5" />
              Auto-Build
            </button>
          }
        />
        <div className="flex-none p-4 border-b border-surface-dark-1">
          <div className="flex items-center gap-2 bg-surface-dark-1 p-1 rounded-lg">
            <button
              onClick={() => setDocumentFormat('a4')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                documentFormat === 'a4' ? 'bg-surface-dark-0 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icons.FileText className="w-3.5 h-3.5" />
              A4
            </button>
            <button
              onClick={() => setDocumentFormat('letter')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                documentFormat === 'letter'
                  ? 'bg-surface-dark-0 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icons.FileText className="w-3.5 h-3.5" />
              US Letter
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {documentPages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 bg-surface-dark-1 rounded-full flex items-center justify-center mb-4">
                <Icons.FileText className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">No Pages Yet</h3>
              <p className="text-xs text-gray-400 mb-6">
                Start by adding an A4 page or use AI to generate a Resume or Invoice.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 pb-20">
              {documentPages.map((page: Artboard, idx: number) => (
                <div
                  key={page.id}
                  className={`relative group cursor-pointer transition-all duration-200`}
                  onClick={() => setActiveArtboardId(page.id)}
                >
                  <DocumentThumbnail artboard={page} isActive={activeArtboardId === page.id} />
                  <div className="mt-2 flex items-center justify-between px-1">
                    <span className="text-xs font-medium text-white truncate pr-2">{page.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteArtboard(page.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all rounded hover:bg-surface-dark-1"
                    >
                      <Icons.Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <div
                onClick={() =>
                  addArtboard(
                    `Page ${documentPages.length + 1}`,
                    PAGE_FORMATS[documentFormat as keyof typeof PAGE_FORMATS]?.width || PAGE_FORMATS.a4.width,
                    PAGE_FORMATS[documentFormat as keyof typeof PAGE_FORMATS]?.height || PAGE_FORMATS.a4.height
                  )
                }
                className="aspect-[1/1.414] rounded border-2 border-dashed border-surface-dark-0 hover:border-brand-500 hover:bg-brand-500/5 flex flex-col items-center justify-center cursor-pointer transition-all text-gray-500 hover:text-brand-400"
              >
                <Icons.Plus className="w-8 h-8 mb-2" />
                <span className="text-xs font-medium">Add Page</span>
              </div>
            </div>
          )}
        </div>

        {documentPages.length > 0 && (
          <div className="flex-none p-4 border-t border-surface-dark-1 bg-surface-dark-2">
            <button
              onClick={handleExportPDF}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-glow-brand"
            >
              <Icons.Download className="w-3.5 h-3.5" />
              Export High-Res PDF
            </button>
          </div>
        )}
      </div>

      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-dark-2 border border-surface-dark-1 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-surface-dark-1 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Icons.Sparkles className="w-4 h-4 text-brand-400" />
                AI Document Generator
              </h3>
              <button
                onClick={() => !isGeneratingAI && setShowAIModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-surface-dark-1 border border-surface-dark-0 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="Resume">Resume / CV</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Letter">Formal Letter</option>
                  <option value="Flyer">Flyer</option>
                </select>
              </div>

              <textarea
                value={aiPromptText}
                onChange={(e) => setAIPromptText(e.target.value)}
                placeholder={`E.g., A modern ${docType.toLowerCase()} for a freelance UI/UX designer...`}
                className="w-full h-32 bg-surface-dark-1 border border-surface-dark-0 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 mb-6"
                disabled={isGeneratingAI}
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAIModal(false)}
                  disabled={isGeneratingAI}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateDocument}
                  disabled={isGeneratingAI || !aiPromptText.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl"
                >
                  {isGeneratingAI ? 'Generating...' : 'Generate Document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PanelErrorBoundary>
  );
};
