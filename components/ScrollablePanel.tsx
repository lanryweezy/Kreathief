import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { Icons } from '../constants';
import { useStore } from '../store/useStore';
import { ErrorBoundary } from './ErrorBoundary';

const Panels = {
  Magic: React.lazy(() => import('./panels/MagicPanel')),
  Text: React.lazy(() => import('./panels/TextPanel')),
  Assistant: React.lazy(() => import('./panels/AssistantPanel')),
  Layers: React.lazy(() => import('./panels/LayersPanel')),
  Draw: React.lazy(() => import('./panels/DrawPanel')),
  Uploads: React.lazy(() => import('./panels/UploadsPanel')),
  Textures: React.lazy(() => import('./panels/TexturesPanel')),
  Mockup: React.lazy(() => import('./panels/MockupPanel')),
  Motion: React.lazy(() => import('./panels/MotionPanel').then((m) => ({ default: m.MotionPanel }))),
  Accessibility: React.lazy(() => import('./panels/AccessibilityPanel').then((m) => ({ default: m.AccessibilityPanel }))),
  Templates: React.lazy(() => import('./panels/TemplatesPanel')),
  Brand: React.lazy(() => import('./panels/BrandPanel')),
};

type FeatureKey = 'magic' | 'assistant' | 'text' | 'draw' | 'uploads' | 'layers' | 'mockup' | 'textures' | 'brand' | 'templates' | 'motion' | 'accessibility';

const ICON_MAP: Record<FeatureKey, React.ComponentType<any>> = {
  magic: Icons.Zap, assistant: Icons.Magic, text: Icons.Text, draw: Icons.Brush,
  uploads: Icons.Uploads, layers: Icons.Layers, mockup: Icons.Image, textures: Icons.Texture,
  brand: Icons.Brand, templates: Icons.Templates, motion: Icons.Play, accessibility: Icons.Eye,
};

const SECTIONS = [
  { title: 'AI Tools', defaultOpen: true, items: [
    { key: 'magic' as FeatureKey, label: 'AI Generate', kw: ['ai','generate','magic'] },
    { key: 'assistant' as FeatureKey, label: 'AI Assistant', kw: ['ai','assistant'] },
    { key: 'text' as FeatureKey, label: 'AI Text', kw: ['ai','text'] },
  ]},
  { title: 'Create', defaultOpen: true, items: [
    { key: 'text' as FeatureKey, label: 'Text', kw: ['text','type','font'] },
    { key: 'draw' as FeatureKey, label: 'Drawing', kw: ['draw','brush','pen'] },
    { key: 'uploads' as FeatureKey, label: 'Uploads', kw: ['upload','image'] },
  ]},
  { title: 'Edit', defaultOpen: false, items: [
    { key: 'layers' as FeatureKey, label: 'Layers', kw: ['layers','order'] },
    { key: 'mockup' as FeatureKey, label: 'Mockups', kw: ['mockup','preview'] },
    { key: 'textures' as FeatureKey, label: 'Textures', kw: ['texture','pattern'] },
  ]},
  { title: 'Refine', defaultOpen: false, items: [
    { key: 'brand' as FeatureKey, label: 'Brand', kw: ['brand','logo'] },
    { key: 'templates' as FeatureKey, label: 'Templates', kw: ['template','preset'] },
    { key: 'motion' as FeatureKey, label: 'Motion', kw: ['motion','animation'] },
    { key: 'accessibility' as FeatureKey, label: 'Accessibility', kw: ['a11y','contrast'] },
  ]},
];

const SectionHeader = React.memo(({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) => (
  <button onClick={onToggle} className="flex items-center justify-between w-full py-1.5 px-1 group">
    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold group-hover:text-gray-400 transition-colors">{title}</span>
    <motion.span animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.15 }}>
      <Icons.ChevronDown className="w-3 h-3 text-gray-500" />
    </motion.span>
  </button>
));
SectionHeader.displayName = 'SectionHeader';

const FeatureRow = React.memo(({ label, icon: Icon, onClick }: { label: string; icon: React.ComponentType<any>; onClick: () => void }) => (
  <button onClick={onClick} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left">
    <Icon className="w-4 h-4 text-gray-500 shrink-0" />
    <span>{label}</span>
  </button>
));
FeatureRow.displayName = 'FeatureRow';

const Spinner = () => (
  <div className="flex items-center justify-center py-4">
    <div className="w-5 h-5 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
  </div>
);

interface ScrollablePanelProps {
  onGenerate?: () => void;
  onStartDesign?: (prompt: string) => void;
  getCanvasSnapshot?: () => Promise<string>;
}

export const ScrollablePanel = React.memo(({ onGenerate, onStartDesign, getCanvasSnapshot }: ScrollablePanelProps) => {
  const [search, setSearch] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    SECTIONS.forEach((s) => { init[s.title] = s.defaultOpen; });
    return init;
  });
  const [expanded, setExpanded] = useState<FeatureKey | null>(null);

  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const zoom = useStore((s) => s.zoom);
  const setZoom = useStore((s) => s.setZoom);

  const q = search.toLowerCase();
  const sections = useMemo(() => {
    if (!q) return SECTIONS;
    return SECTIONS.map((s) => ({
      ...s,
      items: s.items.filter((it) => it.label.toLowerCase().includes(q) || it.kw.some((k) => k.includes(q))),
    })).filter((s) => s.items.length > 0);
  }, [q]);

  const panelArgs = { onGenerate, onStartDesign, getCanvasSnapshot };

  return (
    <ErrorBoundary componentName="ScrollablePanel" variant="widget">
      <div className="w-full md:w-[320px] bg-surface-dark-2/95 md:backdrop-blur-xl border-r border-white/5 flex flex-col z-20 shrink-0 shadow-2xl h-full">
        <div className="sticky top-0 z-30 bg-surface-dark-2/95 backdrop-blur-sm p-3 border-b border-white/5">
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Search tools..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-surface-dark-3 text-white border border-white/10 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-600 transition-all" />
          </div>
        </div>
        <div className="sticky top-[57px] z-20 bg-surface-dark-2/95 backdrop-blur-sm px-3 py-2 border-b border-white/5">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={undo} aria-label="Undo"><Icons.Undo className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={redo} aria-label="Redo"><Icons.Redo className="w-4 h-4" /></Button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))} aria-label="Zoom out"><Icons.ZoomOut className="w-4 h-4" /></Button>
            <span className="text-[10px] text-gray-500 w-8 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.min(5, z + 0.1))} aria-label="Zoom in"><Icons.ZoomIn className="w-4 h-4" /></Button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <Button variant="ghost" size="icon" aria-label="Export"><Icons.Download className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {sections.map((sec) => (
            <div key={sec.title} className="border-b border-white/5">
              <div className="px-3">
                <SectionHeader title={sec.title} open={!!openSections[sec.title]} onToggle={() => setOpenSections((p) => ({ ...p, [sec.title]: !p[sec.title] }))} />
              </div>
              <AnimatePresence initial={false}>
                {openSections[sec.title] && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }} className="overflow-hidden">
                    <div className="px-2 pb-2 space-y-0.5">
                      {sec.items.map((it) => (
                        <div key={it.key}>
                          <FeatureRow label={it.label} icon={ICON_MAP[it.key]} onClick={() => setExpanded(expanded === it.key ? null : it.key)} />
                          <AnimatePresence>
                            {expanded === it.key && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                <div className="px-2 pb-2">
                                  <React.Suspense fallback={<Spinner />}>
                                    {expanded === 'magic' && <Panels.Magic {...panelArgs as any} />}
                                    {expanded === 'assistant' && <Panels.Assistant {...panelArgs as any} />}
                                    {expanded === 'text' && <Panels.Text />}
                                    {expanded === 'draw' && <Panels.Draw brushColor="#000000" setBrushColor={()=>{}} brushSize={5} setBrushSize={()=>{}} isDrawing={false} setIsDrawing={()=>{}} brushOpacity={1} setBrushOpacity={()=>{}} brushType={'basic' as any} setBrushType={()=>{}} brushSmoothing={0.5} brushJitter={0} onFinishDrawing={()=>{}} />}
                                    {expanded === 'uploads' && <Panels.Uploads />}
                                    {expanded === 'layers' && <Panels.Layers />}
                                    {expanded === 'mockup' && <Panels.Mockup onExportForMockup={getCanvasSnapshot || (async () => '')} />}
                                    {expanded === 'textures' && <Panels.Textures onRemoveTexture={()=>{}} currentTexture={undefined} />}
                                    {expanded === 'brand' && <Panels.Brand />}
                                    {expanded === 'templates' && <Panels.Templates {...panelArgs as any} />}
                                    {expanded === 'motion' && <Panels.Motion {...panelArgs as any} />}
                                    {expanded === 'accessibility' && <Panels.Accessibility />}
                                  </React.Suspense>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
});

ScrollablePanel.displayName = 'ScrollablePanel';
