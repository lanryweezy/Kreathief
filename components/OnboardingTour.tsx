import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { Icons } from '../constants';

const STORAGE_KEY = 'kreathief_onboarding_seen_v2';

interface OnboardingStep {
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  tip?: string;
}

const steps: OnboardingStep[] = [
  {
    title: 'Start with a Template',
    description: 'Pick any format from the Templates panel on the left. Every size from Instagram Stories to Presentation slides is ready to go.',
    Icon: Icons.Layers,
    accentColor: '#8b5cf6',
    tip: 'Press T to add text, S for shapes',
  },
  {
    title: 'AI Magic on Any Layer',
    description: 'Right-click any layer to access AI Actions inline. Generate variations, remove backgrounds, or fix contrast without leaving the canvas.',
    Icon: Icons.Sparkles,
    accentColor: '#22d3ee',
    tip: 'Right-click a layer to open AI Actions',
  },
  {
    title: 'Real-Time Collaboration',
    description: 'Share your project link and invite teammates. See live cursors and layer edits stream in as you co-design together.',
    Icon: Icons.Users,
    accentColor: '#34d399',
    tip: 'Click Share in the header to invite',
  },
  {
    title: 'Export Anywhere',
    description: 'Export as PNG, SVG, PDF, or a true multi-layer Photoshop PSD. You can also drag PSD files onto the canvas to import them.',
    Icon: Icons.Download,
    accentColor: '#f59e0b',
    tip: 'Press Ctrl+E to open Export',
  },
];

export const OnboardingTour: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const location = useLocation();

  // This tour teaches the editor (layers, AI actions, export) — it belongs in
  // the product, not on marketing surfaces. Never hijack the landing page,
  // auth, dashboard, or blog routes with a modal aimed at canvas users.
  const isEditorRoute = location.pathname.startsWith('/editor');

  useEffect(() => {
    if (!isEditorRoute) return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      setTimeout(() => setVisible(true), 900);
    }
  }, [isEditorRoute]);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else close();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const current = steps[step];
  const StepIcon = current.Icon;

  return (
    <AnimatePresence>
      {visible && (
        // Non-blocking coach card: pinned bottom-right, no backdrop, so the
        // canvas, toolbar and layers panel stay fully interactive while it runs.
        <motion.div
          key={step}
          role="dialog"
          aria-label={`Onboarding step ${step + 1} of ${steps.length}: ${current.title}`}
          initial={{ opacity: 0, x: 32, y: 8 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 32 }}
          transition={{ type: 'spring', damping: 30, stiffness: 340 }}
          className="fixed bottom-6 right-6 z-[200] w-[340px] max-w-[calc(100vw-24px)] bg-[#111118]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.65)] overflow-hidden"
        >
            {/* Accent glow bar at top */}
            <div
              className="absolute top-0 inset-x-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${current.accentColor}60, transparent)` }}
            />
            
            {/* Mesh gradient background */}
            <div
              className="absolute top-0 right-0 w-[200px] h-[200px] blur-[80px] rounded-full opacity-20 pointer-events-none"
              style={{ background: current.accentColor }}
              aria-hidden="true"
            />
            
            <div className="relative p-5">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: current.accentColor }}>
                {step + 1} / {steps.length}
              </span>
              <button
                onClick={close}
                aria-label="Dismiss onboarding tour"
                className="text-gray-400 hover:text-white text-xs font-medium transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5"
              >
                Skip
              </button>
            </div>

            {/* Icon */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 border border-white/5"
              style={{ background: `${current.accentColor}18`, color: current.accentColor }}
            >
              <StepIcon className="w-6 h-6" />
            </div>

            {/* Content */}
            <h3 className="text-white font-bold text-lg mb-1.5 tracking-tight">{current.title}</h3>
            <p className="text-gray-300 text-[13px] leading-relaxed mb-4">{current.description}</p>

            {/* Tip chip */}
            {current.tip && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 mb-4">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: current.accentColor }} />
                <span className="text-[11px] text-gray-400 font-medium">{current.tip}</span>
              </div>
            )}

            {/* Progress dots */}
            <div className="flex items-center gap-1 mb-4">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className="min-w-[28px] min-h-[28px] flex items-center justify-center p-1 rounded-full focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
                >
                  <span
                    className="transition-all duration-300 rounded-full block"
                    style={{
                      width: i === step ? '24px' : '6px',
                      height: '6px',
                      background: i === step ? current.accentColor : 'rgba(255,255,255,0.2)',
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button
                  onClick={prev}
                  className="px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  Back
                </button>
              )}
              <Button variant="primary" size="md" className="flex-1" onClick={next}>
                {step === steps.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
