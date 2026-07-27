import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setTimeout(() => setVisible(true), 900);
    }
  }, []);

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
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
            onClick={close}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            key={step}
            role="dialog"
            aria-modal="true"
            aria-label={`Onboarding step ${step + 1} of ${steps.length}: ${current.title}`}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-[400px] max-w-[calc(100vw-32px)] bg-[#111118] border border-white/10 rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.6)] overflow-hidden"
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

            <div className="relative p-6">
              {/* Header row */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: current.accentColor }}>
                  {step + 1} / {steps.length}
                </span>
                <button
                  onClick={close}
                  aria-label="Skip onboarding tour"
                  className="text-gray-500 hover:text-white text-xs font-medium transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                >
                  Skip
                </button>
              </div>

              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border border-white/5"
                style={{ background: `${current.accentColor}18`, color: current.accentColor }}
              >
                <StepIcon className="w-7 h-7" />
              </div>

              {/* Content */}
              <h3 className="text-white font-bold text-xl mb-2 tracking-tight">{current.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">{current.description}</p>

              {/* Tip chip */}
              {current.tip && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: current.accentColor }} />
                  <span className="text-[11px] text-gray-400 font-medium">{current.tip}</span>
                </div>
              )}

              {/* Progress dots */}
              <div className="flex items-center gap-2 mb-5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    aria-label={`Go to step ${i + 1}`}
                    className="transition-all duration-300 rounded-full"
                    style={{
                      width: i === step ? '24px' : '6px',
                      height: '6px',
                      background: i === step ? current.accentColor : 'rgba(255,255,255,0.12)',
                    }}
                  />
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
        </>
      )}
    </AnimatePresence>
  );
};
