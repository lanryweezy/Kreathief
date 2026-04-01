import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { haptics } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Mobile Onboarding - First-time user tutorial
 * Beautiful, interactive guide for mobile gestures and features
 */
export const MobileOnboarding: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('mobile-onboarding-seen');
    if (!hasSeenOnboarding && window.innerWidth < 768) {
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, []);

  const steps = [
    {
      icon: Icons.Hand,
      title: 'Welcome to Mobile Design',
      description: 'Learn the essential gestures to design like a pro on your phone',
      illustration: '👋',
    },
    {
      icon: Icons.ZoomIn,
      title: 'Pinch to Zoom',
      description: 'Use two fingers to pinch in and out to zoom the canvas',
      illustration: '🤏',
    },
    {
      icon: Icons.RotateCw,
      title: 'Two-Finger Rotate',
      description: 'Select a layer and use two fingers to rotate it',
      illustration: '🔄',
    },
    {
      icon: Icons.Move,
      title: 'Long Press for Menu',
      description: 'Long press on any layer to open the context menu',
      illustration: '👆',
    },
    {
      icon: Icons.Zap,
      title: 'Shake to Undo',
      description: 'Shake your device to quickly undo your last action',
      illustration: '📱',
    },
    {
      icon: Icons.Sparkles,
      title: 'Quick Actions',
      description: 'Tap the + button in the corner for quick actions',
      illustration: '✨',
    },
  ];

  const handleNext = () => {
    haptics.light();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleSkip = () => {
    haptics.light();
    handleClose();
  };

  const handleClose = () => {
    localStorage.setItem('mobile-onboarding-seen', 'true');
    setIsOpen(false);
  };

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300]"
          />

          {/* Onboarding Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[301] bg-gradient-to-b from-[#1a1d21] to-[#0e1318] rounded-3xl shadow-2xl border border-white/10 overflow-hidden max-w-md mx-auto"
          >
            {/* Progress Bar */}
            <div className="h-1 bg-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Illustration */}
              <motion.div
                key={currentStep}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-7xl text-center mb-6"
              >
                {step.illustration}
              </motion.div>

              {/* Title */}
              <motion.h2
                key={`title-${currentStep}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-white text-center mb-3"
              >
                {step.title}
              </motion.h2>

              {/* Description */}
              <motion.p
                key={`desc-${currentStep}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-base text-gray-400 text-center mb-8"
              >
                {step.description}
              </motion.p>

              {/* Step Indicators */}
              <div className="flex justify-center gap-2 mb-8">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'w-2 bg-white/20'
                    }`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSkip}
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-base active:scale-95 transition-all"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base active:scale-95 transition-all shadow-lg shadow-purple-500/30"
                >
                  {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
