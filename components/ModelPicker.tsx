import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icons } from '../constants';
import { IMAGE_GEN_MODELS, IMAGE_MODEL_CATEGORIES, ImageModelCategory } from '../config/imageModels';

interface ModelPickerProps {
  value: string;
  onChange: (modelId: string) => void;
  /** Direction the dropdown opens. Dashboard sits at the bottom of the screen → 'up'. */
  dropDirection?: 'up' | 'down';
  className?: string;
}

const CATEGORY_ORDER: ImageModelCategory[] = ['google', 'chinese', 'fast', 'quality', 'vector'];

/**
 * Shared AI image model picker — used by the Dashboard bootstrapper and the
 * editor's Image Gen panel so both surfaces expose the same model catalog.
 */
export const ModelPicker: React.FC<ModelPickerProps> = ({ value, onChange, dropDirection = 'up', className }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = IMAGE_GEN_MODELS.find((m) => m.id === value);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className={`relative ${className || ''}`} ref={rootRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Choose AI model"
        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-muted hover:text-white hover:border-brand-500/50 transition-all flex items-center gap-1.5"
      >
        <span>{selected?.icon}</span>
        <span className="hidden sm:inline">{selected?.name}</span>
        <Icons.ChevronDown className="w-3 h-3" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: dropDirection === 'up' ? -8 : 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropDirection === 'up' ? -8 : 8, scale: 0.95 }}
            className={`absolute right-0 ${dropDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} w-80 bg-surface-dark-1 border border-white/10 rounded-xl shadow-2xl z-50 p-2 max-h-96 overflow-y-auto`}
          >
            {CATEGORY_ORDER.map((cat) => (
              <div key={cat} className="mb-2">
                <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-muted">
                  {IMAGE_MODEL_CATEGORIES[cat].label} — {IMAGE_MODEL_CATEGORIES[cat].description}
                </div>
                {IMAGE_GEN_MODELS.filter((m) => m.category === cat).map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onChange(model.id);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-3 ${
                      value === model.id
                        ? 'bg-brand-600 text-white'
                        : 'text-muted-light hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{model.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{model.name}</div>
                      <div className="text-[9px] opacity-60">
                        {model.provider} · {model.outputType === 'svg' ? 'SVG Vector' : 'Raster Image'}
                      </div>
                    </div>
                    {value === model.id && <Icons.Check className="w-3.5 h-3.5 text-white shrink-0" />}
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
