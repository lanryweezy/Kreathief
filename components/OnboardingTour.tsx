import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

const STORAGE_KEY = 'kreathief_onboarding_seen';

const steps = [
  {
    title: 'Create your first design',
    description: 'Start with a template from the Templates panel. Pick a layout and make it yours.',
    icon: '🎨',
  },
  {
    title: 'Use AI to generate',
    description: 'Click the AI Magic button in the sidebar to generate designs, remove backgrounds, and more.',
    icon: '✨',
  },
  {
    title: 'Export & share',
    description: 'When you are ready, hit the Export button in the header to download or share your work.',
    icon: '🚀',
  },
];

export const OnboardingTour: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setTimeout(() => setVisible(true), 800);
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

  const current = steps[step];

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-overlay"
            onClick={close}
          />

          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-[380px] bg-surface-dark-3 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-brand-400 tracking-wider uppercase">
                  {step + 1} / {steps.length}
                </span>
                <button
                  onClick={close}
                  className="text-gray-500 hover:text-white text-xs font-medium transition-colors"
                >
                  Skip
                </button>
              </div>

              <div className="text-4xl mt-3 mb-4">{current.icon}</div>

              <h3 className="text-white font-bold text-lg mb-2">{current.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">{current.description}</p>

              <div className="flex items-center gap-2 mb-4">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step ? 'w-6 bg-brand-600' : 'w-1.5 bg-white/15'
                    }`}
                  />
                ))}
              </div>

              <Button variant="primary" size="md" className="w-full" onClick={next}>
                {step === steps.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
