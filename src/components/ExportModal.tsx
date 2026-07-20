import React, { useState, useMemo } from 'react';
import { Download, Image, FileCode, Share2, Copy, Check, Clock, Trash2, X } from 'lucide-react';
import { useKreathiefStore } from '../store/useStore';
import { exportToSvg, exportToCanvas, downloadBlob, ExportOptions } from '../services/exportService';
import { Button, Modal, Tabs, Badge, Divider, Skeleton } from './ui/DesignSystem';
import { surface } from '../lib/tokens';

type Tab = 'export' | 'code' | 'share' | 'history';

const EXPORT_PRESETS = [
  { name: 'Icon', width: 64, height: 64 },
  { name: 'Social', width: 1080, height: 1080 },
  { name: 'Story', width: 1080, height: 1920 },
  { name: 'Thumbnail', width: 1280, height: 720 },
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Mobile', width: 390, height: 844 },
  { name: 'Square', width: 512, height: 512 },
  { name: 'Banner', width: 728, height: 90 },
];

interface ExportHistoryItem { id: string; format: string; scale: number; timestamp: number; elementCount: number; }

const exportTabs = [
  { id: 'export', label: 'Export', icon: <Image size={14} /> },
  { id: 'code', label: 'Code', icon: <FileCode size={14} /> },
  { id: 'share', label: 'Share', icon: <Share2 size={14} /> },
  { id: 'history', label: 'History', icon: <Clock size={14} /> },
];

export const ExportModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { nodes, selectedIds, addToast } = useKreathiefStore();
  const [tab, setTab] = useState<Tab>('export');
  const [format, setFormat] = useState<'png' | 'jpg' | 'svg'>('png');
  const [scale, setScale] = useState(2);
  const [quality, setQuality] = useState(90);
  const [background, setBackground] = useState(true);
  const [selectionOnly, setSelectionOnly] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [history, setHistory] = useState<ExportHistoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('kreathief_export_history') || '[]'); } catch { return []; }
  });

  const exportNodes = useMemo(() => {
    if (selectionOnly && selectedIds.size > 0) return Array.from(selectedIds).map(id => nodes.get(id)).filter(Boolean) as any[];
    return Array.from(nodes.values());
  }, [nodes, selectedIds, selectionOnly]);

  const handleExport = async () => {
    setExporting(true);
    try {
      let historyItem: ExportHistoryItem | null = null;
      if (format === 'svg') {
        const svg = exportToSvg(exportNodes, background);
        downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'kreathief-export.svg');
        addToast('success', 'Exported as SVG');
        historyItem = { id: `exp_${Date.now()}`, format: 'svg', scale: 1, timestamp: Date.now(), elementCount: exportNodes.length };
      } else {
        const canvas = document.createElement('canvas');
        const blob = await exportToCanvas(canvas, exportNodes, { format, scale, quality, background, selectionOnly });
        if (blob) {
          downloadBlob(blob, `kreathief-export@${scale}x.${format === 'jpg' ? 'jpg' : 'png'}`);
          addToast('success', `Exported as ${format.toUpperCase()} @${scale}x`);
          historyItem = { id: `exp_${Date.now()}`, format: format.toUpperCase(), scale, timestamp: Date.now(), elementCount: exportNodes.length };
        }
      }
      if (historyItem) {
        const updated = [historyItem, ...history].slice(0, 20);
        setHistory(updated);
        localStorage.setItem('kreathief_export_history', JSON.stringify(updated));
      }
    } catch { addToast('error', 'Export failed'); }
    setExporting(false);
  };

  const handleCopyCSS = async () => {
    const node = exportNodes[0];
    if (!node) return;
    const fill = typeof node.fill === 'string' ? node.fill : surface[3];
    const css = `.element {\n  position: absolute;\n  left: ${node.x}px;\n  top: ${node.y}px;\n  width: ${node.width}px;\n  height: ${node.height}px;\n  background: ${fill};\n  border-radius: ${node.cornerRadius}px;\n  opacity: ${node.opacity};\n}`;
    await navigator.clipboard.writeText(css);
    setCopied(true);
    addToast('success', 'Copied CSS');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyReact = async () => {
    const node = exportNodes[0];
    if (!node) return;
    const fill = typeof node.fill === 'string' ? node.fill : surface[3];
    const jsx = `<div style={{\n  position: 'absolute',\n  left: ${node.x}, top: ${node.y},\n  width: ${node.width}, height: ${node.height},\n  background: '${fill}',\n  borderRadius: ${node.cornerRadius},\n  opacity: ${node.opacity},\n}} />`;
    await navigator.clipboard.writeText(jsx);
    setCopied(true);
    addToast('success', 'Copied React component');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = async () => {
    const state = { nodes: Array.from(nodes.entries()).map(([id, n]) => ({ ...n, id })) };
    const url = `${window.location.origin}${window.location.pathname}?share=${btoa(JSON.stringify(state)).slice(0, 100)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    addToast('success', 'Share link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal open={open} onClose={onClose} title="Export & Share" size="md">
      <Tabs tabs={exportTabs} activeTab={tab} onTabChange={setTab as any} />

      <div className="mt-4">
        {tab === 'export' && (
          <div className="space-y-4">
            <div>
              <label className="text-micro text-content-muted uppercase tracking-wider block mb-2">Format</label>
              <div className="flex gap-2">
                {(['png', 'jpg', 'svg'] as const).map(f => (
                  <Button key={f} variant={format === f ? 'primary' : 'secondary'} size="sm" onClick={() => setFormat(f)} className="flex-1">
                    {f.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {format !== 'svg' && (
              <div>
                <label className="text-micro text-content-muted uppercase tracking-wider block mb-2">Scale</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(s => (
                    <Button key={s} variant={scale === s && activePreset === null ? 'primary' : 'secondary'} size="sm"
                      onClick={() => { setScale(s); setActivePreset(null); }} className="flex-1">
                      {s}x
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {format !== 'svg' && (
              <div>
                <label className="text-micro text-content-muted uppercase tracking-wider block mb-2">Preset Size</label>
                <div className="grid grid-cols-4 gap-1">
                  {EXPORT_PRESETS.map((preset, i) => (
                    <Button key={preset.name} variant={activePreset === i ? 'primary' : 'secondary'} size="sm"
                      onClick={() => setActivePreset(i)} className="text-micro">
                      {preset.name}
                    </Button>
                  ))}
                </div>
                {activePreset !== null && (
                  <p className="text-micro text-content-muted mt-1 text-center">
                    {EXPORT_PRESETS[activePreset].width} × {EXPORT_PRESETS[activePreset].height}px
                  </p>
                )}
              </div>
            )}

            {format === 'jpg' && (
              <div>
                <label className="text-micro text-content-muted uppercase tracking-wider block mb-2">Quality: {quality}%</label>
                <input type="range" min="10" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full h-1" />
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={background} onChange={e => setBackground(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-border-default bg-surface-2 text-content-primary accent-content-primary" />
                <span className="text-body-sm text-content-secondary group-hover:text-content-primary">White background</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={selectionOnly} onChange={e => setSelectionOnly(e.target.checked)} disabled={selectedIds.size === 0}
                  className="w-4 h-4 rounded-sm border-border-default bg-surface-2 text-content-primary accent-content-primary disabled:opacity-35" />
                <span className="text-body-sm text-content-secondary group-hover:text-content-primary">
                  Selection only {selectedIds.size > 0 ? `(${selectedIds.size} items)` : '(no selection)'}
                </span>
              </label>
            </div>

            <div className="bg-surface-4 rounded-lg p-3 text-micro text-content-muted">
              {exportNodes.length} element{exportNodes.length !== 1 ? 's' : ''} · {format.toUpperCase()} {format !== 'svg' ? `@ ${scale}x` : ''}
            </div>

            <Button variant="primary" size="lg" onClick={handleExport} loading={exporting} disabled={exportNodes.length === 0} className="w-full">
              <Download size={16} /> Export {format.toUpperCase()}
            </Button>
          </div>
        )}

        {tab === 'code' && (
          <div className="space-y-4">
            <p className="text-body-sm text-content-muted">Copy the selected element as reusable code.</p>
            <Button variant="secondary" onClick={handleCopyCSS} disabled={exportNodes.length === 0} className="w-full">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy as CSS'}
            </Button>
            <Button variant="secondary" onClick={handleCopyReact} disabled={exportNodes.length === 0} className="w-full">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy as React Component'}
            </Button>
          </div>
        )}

        {tab === 'share' && (
          <div className="space-y-4">
            <p className="text-body-sm text-content-muted">Generate a link to share your canvas state.</p>
            <Button variant="primary" onClick={handleShareLink} className="w-full">
              {copied ? <Check size={14} /> : <Share2 size={14} />} {copied ? 'Link Copied!' : 'Generate Share Link'}
            </Button>
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-body-sm text-content-muted">Recent exports</p>
              {history.length > 0 && (
                <button onClick={() => { setHistory([]); localStorage.removeItem('kreathief_export_history'); }}
                  className="text-micro text-content-muted hover:text-error transition-colors">Clear all</button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="text-center py-8 text-content-muted text-body-sm">
                <Clock size={20} className="mx-auto mb-2 opacity-40" /><p>No exports yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {history.map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-3 py-2 bg-surface-4 rounded-lg text-body-sm">
                    <span className="text-content-secondary">{item.format}</span>
                    <span className="text-content-muted">{item.scale}x</span>
                    <span className="text-content-muted">{item.elementCount} elements</span>
                    <span className="flex-1 text-right text-content-muted text-micro">
                      {Math.floor((Date.now() - item.timestamp) / 60000)}m ago
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
