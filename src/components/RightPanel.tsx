import React, { Suspense, useState, useMemo, useRef, useEffect, lazy } from 'react';
import {
  X,
  Layers,
  Settings,
  Wand2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Palette,
  Type,
  Sliders,
  Sparkles,
  Copy,
  RotateCcw,
  Link,
  Unlink,
  Search,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Component,
  Square,
  Circle,
  FileText,
  Image,
  Frame,
  Folder,
  PenTool,
  Puzzle,
  Link2,
  Triangle,
  Minus,
  Box,
} from 'lucide-react';
import { useKreathiefStore } from '../store/useStore';
import { DesignNode, Effect } from '../types/design';
import { NumberInput, Skeleton, Divider, Badge, Button, Input, Select, Tabs } from './ui/DesignSystem';
import { useIsMobile } from '../hooks/useMediaQuery';
import { surface, content } from '../lib/tokens';

// Lazy-loaded panels
const CreativeDirectorPanel = lazy(() =>
  import('./CreativeDirectorPanel').then((m) => ({ default: m.CreativeDirectorPanel }))
);
const ComponentPanel = lazy(() => import('./ComponentPanel').then((m) => ({ default: m.ComponentPanel })));
const AIPanel = lazy(() => import('./AIPanel').then((m) => ({ default: m.AIPanel })));

const NODE_TYPE_ICONS: Record<string, React.ReactNode> = {
  rect: <Square size={14} />,
  ellipse: <Circle size={14} />,
  text: <FileText size={14} />,
  image: <Image size={14} />,
  frame: <Frame size={14} />,
  group: <Folder size={14} />,
  path: <PenTool size={14} />,
  component: <Puzzle size={14} />,
  instance: <Link2 size={14} />,
  polygon: <Triangle size={14} />,
  line: <Minus size={14} />,
  boolean: <Box size={14} />,
};

const PROPERTIES_SECTIONS = [
  { id: 'transform', label: 'Transform', icon: <Sliders size={14} />, defaultOpen: true },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={14} />, defaultOpen: true },
  { id: 'text', label: 'Text', icon: <Type size={14} />, defaultOpen: false },
  { id: 'effects', label: 'Effects', icon: <Sparkles size={14} />, defaultOpen: false },
];

const panelTabs: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: 'properties', label: 'Properties', icon: <Settings size={14} /> },
  { id: 'layers', label: 'Layers', icon: <Layers size={14} /> },
  { id: 'components', label: 'Components', icon: <Component size={14} /> },
  { id: 'ai', label: 'AI', icon: <Wand2 size={14} /> },
  { id: 'creative', label: 'Director', icon: <Eye size={14} /> },
];

export const RightPanel: React.FC = () => {
  const { rightPanelTab, setRightPanelTab, selectedIds, nodes, updateNode, expertMode } = useKreathiefStore();
  const [panelWidth, setPanelWidth] = useState(288);
  const [isResizing, setIsResizing] = useState(false);
  const isMobile = useIsMobile();
  const selectedNode = selectedIds.size === 1 ? (nodes.get(Array.from(selectedIds)[0]) ?? null) : null;

  const handleResizeStart = (e: React.MouseEvent) => {
    if (isMobile) return;
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = panelWidth;
    const handleMouseMove = (ev: MouseEvent) =>
      setPanelWidth(Math.max(200, Math.min(500, startWidth - (ev.clientX - startX))));
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (isMobile) {
    return (
      <div
        className="fixed inset-x-0 bottom-0 z-40 h-[60vh] bg-surface-2 border-t border-border-default rounded-t-xl shadow-[var(--elevation-4)] animate-slide-in-right flex flex-col"
        role="complementary"
        aria-label="Properties panel"
      >
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 rounded-full bg-surface-6" />
        </div>
        <Tabs tabs={panelTabs} activeTab={rightPanelTab} onTabChange={setRightPanelTab} />
        <div className="flex-1 overflow-y-auto p-3">
          {rightPanelTab === 'properties' && <PropertiesPanel node={selectedNode} />}
          {rightPanelTab === 'layers' && <LayersPanel />}
          {rightPanelTab === 'components' && (
            <Suspense fallback={<Skeleton height="120px" />}>
              <ComponentPanel />
            </Suspense>
          )}
          {rightPanelTab === 'ai' && (
            <Suspense fallback={<Skeleton height="120px" />}>
              <AIPanel />
            </Suspense>
          )}
          {rightPanelTab === 'creative' && (
            <Suspense fallback={<Skeleton height="120px" />}>
              <CreativeDirectorPanel />
            </Suspense>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full flex flex-col border-l border-border-default bg-surface-2 relative`}
      style={{ width: panelWidth }}
      role="complementary"
      aria-label="Properties panel"
    >
      <div
        onMouseDown={handleResizeStart}
        className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-content-primary transition-colors z-10 ${isResizing ? 'bg-content-primary' : ''}`}
        aria-label="Resize panel"
      />
      <Tabs tabs={panelTabs} activeTab={rightPanelTab} onTabChange={setRightPanelTab} />
      <div className="flex-1 overflow-y-auto p-3" id={`panel-${rightPanelTab}`} role="tabpanel">
        {rightPanelTab === 'properties' && <PropertiesPanel node={selectedNode} />}
        {rightPanelTab === 'layers' && <LayersPanel />}
        {rightPanelTab === 'components' && (
          <Suspense fallback={<Skeleton height="120px" />}>
            <ComponentPanel />
          </Suspense>
        )}
        {rightPanelTab === 'ai' && (
          <Suspense fallback={<Skeleton height="120px" />}>
            <AIPanel />
          </Suspense>
        )}
        {rightPanelTab === 'creative' && (
          <Suspense fallback={<Skeleton height="120px" />}>
            <CreativeDirectorPanel />
          </Suspense>
        )}
      </div>
    </div>
  );
};

// ── Properties Panel ───────────────────────────────────────────

const PropertiesPanel: React.FC<{ node: DesignNode | null }> = ({ node }) => {
  const { updateNode, expertMode } = useKreathiefStore();
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(PROPERTIES_SECTIONS.filter((s) => s.defaultOpen).map((s) => s.id))
  );
  const toggleSection = (id: string) =>
    setOpenSections((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  if (!node)
    return (
      <div className="text-center py-12 text-content-muted">
        <Layers size={32} className="mx-auto mb-3 opacity-40" />
        <p className="text-body-sm">Select an element to edit its properties</p>
      </div>
    );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-content-tertiary">{NODE_TYPE_ICONS[node.type] || <Layers size={14} />}</span>
        <input
          type="text"
          value={node.name}
          onChange={(e) => updateNode(node.id, { name: e.target.value })}
          className="flex-1 text-body font-semibold bg-transparent border-none outline-none text-content-primary focus:ring-1 focus:ring-border-focus rounded px-1"
          aria-label="Element name"
        />
      </div>
      {PROPERTIES_SECTIONS.map((section) => {
        const isOpen = openSections.has(section.id);
        return (
          <div key={section.id} className="border border-border-default rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-4 transition-colors text-left"
            >
              <ChevronDown
                size={12}
                className={`text-content-muted transition-transform duration-fast ${isOpen ? '' : '-rotate-90'}`}
              />
              <span className="text-content-tertiary">{section.icon}</span>
              <span className="text-label font-medium text-content-secondary">{section.label}</span>
            </button>
            <div
              className="overflow-hidden transition-all duration-standard"
              style={{ maxHeight: isOpen ? '500px' : '0px', opacity: isOpen ? 1 : 0 }}
            >
              <div className="px-3 pb-3 space-y-2">
                {section.id === 'transform' && <TransformFields node={node} />}
                {section.id === 'appearance' && <AppearanceFields node={node} />}
                {section.id === 'text' && node.type === 'text' && <TextFields node={node} />}
                {section.id === 'effects' && <EffectsFields node={node} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Transform Fields ───────────────────────────────────────────

const TransformFields: React.FC<{ node: DesignNode }> = ({ node }) => {
  const { updateNode } = useKreathiefStore();
  const [linked, setLinked] = useState(false);

  const updateWithLink = (key: 'width' | 'height', val: number) => {
    if (linked) {
      const ratio = key === 'width' ? node.height / (node.width || 1) : node.width / (node.height || 1);
      updateNode(node.id, { [key]: val, [key === 'width' ? 'height' : 'width']: Math.round(val * ratio) });
    } else {
      updateNode(node.id, { [key]: val });
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <NumberInput value={node.x} onChange={(v) => updateNode(node.id, { x: v })} label="X" />
        <NumberInput value={node.y} onChange={(v) => updateNode(node.id, { y: v })} label="Y" />
      </div>
      <div className="grid grid-cols-2 gap-2 items-end">
        <NumberInput value={node.width} onChange={(v) => updateWithLink('width', v)} label="W" />
        <NumberInput value={node.height} onChange={(v) => updateWithLink('height', v)} label="H" />
      </div>
      <div className="flex items-center justify-center">
        <button
          onClick={() => setLinked(!linked)}
          className={`p-1 rounded transition-colors ${linked ? 'text-content-primary bg-surface-5' : 'text-content-muted hover:text-content-secondary'}`}
          aria-label={linked ? 'Unlink dimensions' : 'Link dimensions'}
          aria-pressed={linked}
        >
          {linked ? <Link size={12} /> : <Unlink size={12} />}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput value={node.rotation} onChange={(v) => updateNode(node.id, { rotation: v })} label="°" step={15} />
        <NumberInput
          value={node.opacity}
          onChange={(v) => updateNode(node.id, { opacity: Math.min(1, Math.max(0, v)) })}
          label="α"
          step={0.1}
          min={0}
          max={1}
        />
      </div>
    </div>
  );
};

// ── Appearance Fields ──────────────────────────────────────────

const AppearanceFields: React.FC<{ node: DesignNode }> = ({ node }) => {
  const { updateNode, recentColors, addRecentColor } = useKreathiefStore();
  const fillColor = typeof node.fill === 'string' ? node.fill : surface[3];
  const isGradient = !!(node.fill && typeof node.fill === 'object' && 'type' in node.fill);
  const [showGradient, setShowGradient] = useState(false);

  const setFill = (color: string) => {
    updateNode(node.id, { fill: color });
    addRecentColor(color);
  };

  const toggleGradient = () => {
    if (isGradient) {
      updateNode(node.id, { fill: fillColor });
      setShowGradient(false);
    } else {
      updateNode(node.id, {
        fill: {
          type: 'linear',
          angle: 0,
          stops: [
            { offset: 0, color: fillColor },
            { offset: 1, color: content.primary },
          ],
        },
      });
      setShowGradient(true);
    }
  };

  const gradientFill = isGradient ? (node.fill as any) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-micro text-content-muted w-12">Fill</label>
        <div className="flex-1 flex items-center gap-1">
          <input
            type="color"
            value={fillColor}
            onChange={(e) => setFill(e.target.value)}
            className="w-6 h-6 rounded-sm border border-border-default cursor-pointer"
            aria-label="Fill color"
          />
          <input
            type="text"
            value={isGradient ? 'Gradient' : fillColor}
            readOnly={isGradient}
            onChange={(e) => setFill(e.target.value)}
            className="flex-1 h-7 px-2 text-body-sm bg-surface-2 border border-border-default rounded-sm text-content-primary font-mono outline-none focus:border-border-focus"
            aria-label="Fill value"
          />
          <button
            onClick={toggleGradient}
            className={`px-1.5 py-1 rounded-sm text-micro font-medium transition-colors ${isGradient ? 'bg-content-primary text-content-inverse' : 'bg-surface-5 text-content-muted hover:bg-surface-6'}`}
            aria-label="Toggle gradient"
            aria-pressed={isGradient}
          >
            GR
          </button>
        </div>
      </div>

      {isGradient && gradientFill && (
        <div className="space-y-2 ml-12">
          <div
            className="h-2 rounded-sm border border-border-default"
            style={{
              background: `linear-gradient(${gradientFill.angle || 0}deg, ${gradientFill.stops.map((s: any) => `${s.color} ${s.offset * 100}%`).join(', ')})`,
            }}
          />
          <div className="flex items-center gap-2">
            <label className="text-micro text-content-muted w-8">Angle</label>
            <input
              type="range"
              min="0"
              max="360"
              value={gradientFill.angle || 0}
              onChange={(e) => updateNode(node.id, { fill: { ...gradientFill, angle: parseInt(e.target.value) } })}
              className="flex-1 h-1"
              aria-label="Gradient angle"
            />
            <span className="text-micro text-content-muted w-6 text-right">{gradientFill.angle || 0}°</span>
          </div>
          <div className="space-y-1">
            {gradientFill.stops.map((stop: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => {
                    const stops = [...gradientFill.stops];
                    stops[i] = { ...stops[i], color: e.target.value };
                    updateNode(node.id, { fill: { ...gradientFill, stops } });
                  }}
                  className="w-5 h-5 rounded-sm border border-border-default cursor-pointer"
                  aria-label="Gradient color stop"
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={stop.offset}
                  onChange={(e) => {
                    const stops = [...gradientFill.stops];
                    stops[i] = { ...stops[i], offset: parseFloat(e.target.value) };
                    updateNode(node.id, { fill: { ...gradientFill, stops } });
                  }}
                  className="flex-1 h-1"
                  aria-label="Gradient color stop offset"
                />
                <span className="text-micro text-content-muted w-8 text-right">{Math.round(stop.offset * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Divider className="my-2" />

      <div className="flex items-center gap-2">
        <label className="text-micro text-content-muted w-12">Stroke</label>
        <input
          type="color"
          value={node.stroke || content.inverse}
          onChange={(e) => updateNode(node.id, { stroke: e.target.value })}
          className="w-6 h-6 rounded-sm border border-border-default cursor-pointer"
          aria-label="Stroke color"
        />
        <NumberInput
          value={node.strokeWidth}
          onChange={(v) => updateNode(node.id, { strokeWidth: v })}
          min={0}
          max={50}
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-micro text-content-muted w-12">Radius</label>
        <NumberInput
          value={node.cornerRadius}
          onChange={(v) => updateNode(node.id, { cornerRadius: v })}
          min={0}
          max={200}
        />
      </div>

      {recentColors.length > 0 && (
        <>
          <Divider className="my-2" />
          <div>
            <label className="text-micro text-content-muted block mb-1">Recent</label>
            <div className="flex gap-1 flex-wrap">
              {recentColors.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setFill(c)}
                  className="w-5 h-5 rounded-sm border border-border-default hover:scale-110 transition-transform"
                  style={{ background: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── Text Fields ────────────────────────────────────────────────

const TextFields: React.FC<{ node: DesignNode }> = ({ node }) => {
  const { updateNode } = useKreathiefStore();

  const fonts = [
    'system-ui',
    'Arial',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
  ];

  return (
    <div className="space-y-2">
      <div>
        <label className="text-micro text-content-muted block mb-1">Font</label>
        <select
          value={node.fontFamily || 'system-ui'}
          onChange={(e) => updateNode(node.id, { fontFamily: e.target.value })}
          className="w-full h-7 px-2 text-body-sm bg-surface-2 border border-border-default rounded-sm text-content-primary"
        >
          {fonts.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          value={node.fontSize || 16}
          onChange={(v) => updateNode(node.id, { fontSize: v })}
          label="Size"
          min={1}
          max={200}
        />
        <NumberInput
          value={node.fontWeight || 400}
          onChange={(v) => updateNode(node.id, { fontWeight: v })}
          label="Weight"
          min={100}
          max={900}
          step={100}
        />
      </div>
      <div>
        <label className="text-micro text-content-muted block mb-1">Align</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              onClick={() => updateNode(node.id, { textAlign: a })}
              className={`flex-1 h-7 rounded-sm flex items-center justify-center transition-colors ${node.textAlign === a ? 'bg-content-primary text-content-inverse' : 'bg-surface-3 text-content-muted hover:bg-surface-5'}`}
            >
              {a === 'left' ? (
                <AlignLeft size={14} />
              ) : a === 'center' ? (
                <AlignCenter size={14} />
              ) : (
                <AlignRight size={14} />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          value={(node as any).lineHeight || 1.2}
          onChange={(v) => updateNode(node.id, { lineHeight: v } as any)}
          label="Line H"
          min={0.5}
          max={3}
          step={0.1}
        />
        <NumberInput
          value={(node as any).letterSpacing || 0}
          onChange={(v) => updateNode(node.id, { letterSpacing: v } as any)}
          label="Spacing"
          min={-10}
          max={20}
          step={0.5}
        />
      </div>
    </div>
  );
};

// ── Effects Fields ─────────────────────────────────────────────

const EffectsFields: React.FC<{ node: DesignNode }> = ({ node }) => {
  const { updateNode, expertMode } = useKreathiefStore();

  if (!expertMode) return <p className="text-micro text-content-muted">Enable expert mode to edit effects</p>;

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={!!node.effects?.find((e) => e.type === 'shadow' && e.enabled)}
          onChange={(e) => {
            const effects = [...(node.effects || [])];
            const idx = effects.findIndex((e) => e.type === 'shadow');
            if (e.target.checked) {
              if (idx >= 0) effects[idx] = { ...effects[idx], enabled: true };
              else
                effects.push({
                  type: 'shadow',
                  enabled: true,
                  params: { x: 0, y: 4, blur: 8, color: content.inverse, opacity: 0.25 },
                });
            } else if (idx >= 0) effects[idx] = { ...effects[idx], enabled: false };
            updateNode(node.id, { effects });
          }}
          className="w-4 h-4 rounded-sm border border-border-default bg-surface-2 text-content-primary accent-content-primary"
        />
        <span className="text-body-sm text-content-secondary">Drop Shadow</span>
      </label>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={!!node.effects?.find((e) => e.type === 'blur' && e.enabled)}
          onChange={(e) => {
            const effects = [...(node.effects || [])];
            const idx = effects.findIndex((e) => e.type === 'blur');
            if (e.target.checked) {
              if (idx >= 0) effects[idx] = { ...effects[idx], enabled: true };
              else effects.push({ type: 'blur', enabled: true, params: { radius: 4 } });
            } else if (idx >= 0) effects[idx] = { ...effects[idx], enabled: false };
            updateNode(node.id, { effects });
          }}
          className="w-4 h-4 rounded-sm border border-border-default bg-surface-2 text-content-primary accent-content-primary"
        />
        <span className="text-body-sm text-content-secondary">Blur</span>
      </label>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={!!node.effects?.find((e) => e.type === 'glow' && e.enabled)}
          onChange={(e) => {
            const effects = [...(node.effects || [])];
            const idx = effects.findIndex((e) => e.type === 'glow');
            if (e.target.checked) {
              if (idx >= 0) effects[idx] = { ...effects[idx], enabled: true };
              else
                effects.push({
                  type: 'glow',
                  enabled: true,
                  params: { blur: 12, color: content.primary, opacity: 0.6 },
                });
            } else if (idx >= 0) effects[idx] = { ...effects[idx], enabled: false };
            updateNode(node.id, { effects });
          }}
          className="w-4 h-4 rounded-sm border border-border-default bg-surface-2 text-content-primary accent-content-primary"
        />
        <span className="text-body-sm text-content-secondary">Glow</span>
      </label>
    </div>
  );
};

// ── Layers Panel ───────────────────────────────────────────────

const LayersPanel: React.FC = () => {
  const { nodes, selectedIds, selectNode, updateNode } = useKreathiefStore();
  const [search, setSearch] = useState('');
  const layers = useMemo(() => {
    const arr = Array.from(nodes.values()).sort((a, b) => (b as any).zIndex - (a as any).zIndex);
    return search ? arr.filter((n) => n.name.toLowerCase().includes(search.toLowerCase())) : arr;
  }, [nodes, search]);

  return (
    <div className="space-y-2">
      <Input
        placeholder="Search layers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<Search size={14} />}
      />
      <div className="space-y-0.5">
        {layers.length === 0 && <p className="text-body-sm text-content-muted text-center py-4">No layers yet</p>}
        {layers.map((node) => (
          <div
            key={node.id}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer transition-colors ${
              selectedIds.has(node.id)
                ? 'bg-surface-5 text-content-primary'
                : 'text-content-secondary hover:bg-surface-4'
            }`}
            onClick={() => selectNode([node.id])}
          >
            <span className="text-content-tertiary">{NODE_TYPE_ICONS[node.type] || <Layers size={14} />}</span>
            <span className="flex-1 text-body-sm truncate">{node.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateNode(node.id, { visible: !node.visible });
              }}
              className="p-0.5 text-content-muted hover:text-content-secondary"
              aria-label={node.visible ? 'Hide' : 'Show'}
            >
              {node.visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateNode(node.id, { locked: !node.locked });
              }}
              className="p-0.5 text-content-muted hover:text-content-secondary"
              aria-label={node.locked ? 'Unlock' : 'Lock'}
            >
              {node.locked ? <Lock size={12} /> : <Unlock size={12} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
