import React, { useState, useEffect } from 'react';

export interface TourStep {
  target: string; // CSS Selector
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ steps, onComplete, onSkip }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = steps[currentStepIdx];

  // Allow closing tour with Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onSkip]);

  useEffect(() => {
    const updateRect = () => {
      const el = document.querySelector(currentStep.target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // If element not found, skip to next step after a short delay
        setTimeout(() => {
          if (currentStepIdx < steps.length - 1) {
            setCurrentStepIdx((prev) => prev + 1);
          } else {
            onComplete();
          }
        }, 500);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [currentStep, currentStepIdx, steps.length, onComplete]);

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  // If target not found, show a minimal tooltip that can be closed
  if (!targetRect) {
    return (
      <div className="fixed inset-0 z-[999] pointer-events-none">
        <div className="fixed top-4 right-4 bg-surface-dark-3 border border-gray-700 rounded-xl shadow-2xl p-4 pointer-events-auto z-[1000]">
          <p className="text-white text-sm mb-3">Tour element not found. Skipping...</p>
          <button
            onClick={onSkip}
            className="w-full px-4 py-2 bg-gradient-to-r from-accent to-brand-600 text-white rounded-lg text-xs font-bold"
          >
            Close Tour
          </button>
        </div>
      </div>
    );
  }

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 1000,
    width: '300px',
  };

  const gap = 12;
  if (currentStep.position === 'bottom') {
    tooltipStyle.top = `${targetRect.bottom + gap}px`;
    tooltipStyle.left = `${targetRect.left + targetRect.width / 2 - 150}px`;
  } else if (currentStep.position === 'top') {
    tooltipStyle.bottom = `${window.innerHeight - targetRect.top + gap}px`;
    tooltipStyle.left = `${targetRect.left + targetRect.width / 2 - 150}px`;
  } else if (currentStep.position === 'right') {
    tooltipStyle.top = `${targetRect.top + targetRect.height / 2 - 50}px`;
    tooltipStyle.left = `${targetRect.right + gap}px`;
  } else if (currentStep.position === 'left') {
    tooltipStyle.top = `${targetRect.top + targetRect.height / 2 - 50}px`;
    tooltipStyle.right = `${window.innerWidth - targetRect.left + gap}px`;
  }

  return (
    <div className="fixed inset-0 z-[999] pointer-events-none">
      {/* Backdrop with hole - click to skip */}
      <div
        className="absolute inset-0 pointer-events-auto cursor-pointer transition-opacity duration-500"
        onClick={onSkip}
        style={{ zIndex: 998, opacity: targetRect ? 1 : 0 }}
      >
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id={`tour-mask-${currentStepIdx}`}>
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                className="transition-all duration-500"
                x={targetRect.left - 4}
                y={targetRect.top - 4}
                width={targetRect.width + 8}
                height={targetRect.height + 8}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.7)"
            mask={`url(#tour-mask-${currentStepIdx})`}
          />
        </svg>
      </div>

      {/* Pulsing highlight */}
      <div
        className="absolute border-2 border-accent rounded-lg animate-pulse transition-all duration-500"
        style={{
          top: targetRect.top - 6,
          left: targetRect.left - 6,
          width: targetRect.width + 12,
          height: targetRect.height + 12,
        }}
      />

      {/* Tooltip */}
      <div
        className="bg-surface-dark-3 border border-gray-700 rounded-xl shadow-2xl p-6 pointer-events-auto flex flex-col gap-4 animate-in fade-in zoom-in duration-300"
        style={{ ...tooltipStyle, zIndex: 1000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <h4 className="text-accent font-bold text-sm uppercase tracking-wider">
            Step {currentStepIdx + 1} of {steps.length}
          </h4>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-white transition-colors text-xs font-bold px-3 py-1 rounded hover:bg-gray-800"
            style={{ zIndex: 1001 }}
          >
            Skip tour
          </button>
        </div>

        <div>
          <h3 className="text-white font-bold text-lg mb-1">{currentStep.title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{currentStep.content}</p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-4 rounded-full transition-colors ${i === currentStepIdx ? 'bg-accent' : 'bg-gray-800'}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStepIdx > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-gradient-to-r from-accent to-brand-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-900/30 hover:scale-105 active:scale-95 transition-all"
            >
              {currentStepIdx === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
