import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../constants';
import { useStore } from '../store/useStore';

interface IntentCard {
  id: string;
  title: string;
  description: string;
  width: number;
  height: number;
  icon: React.ComponentType<{ className?: string }>;
}

const INTENTS: IntentCard[] = [
  {
    id: 'social',
    title: 'Social Post',
    description: 'Square format for Instagram, Facebook',
    width: 1080,
    height: 1080,
    icon: Icons.Share2,
  },
  {
    id: 'flyer',
    title: 'Flyer',
    description: 'Standard 8.5 × 11 inch print',
    width: 2550,
    height: 3300,
    icon: Icons.FileText,
  },
  {
    id: 'presentation',
    title: 'Presentation',
    description: 'Widescreen 16:9 slides',
    width: 1920,
    height: 1080,
    icon: Icons.Monitor,
  },
  {
    id: 'brand-kit',
    title: 'Brand Kit',
    description: 'Colors, fonts & logo system',
    width: 1080,
    height: 1080,
    icon: Icons.Palette,
  },
  { id: 'logo', title: 'Logo', description: 'Square logo at 1024px', width: 1024, height: 1024, icon: Icons.Hexagon },
  {
    id: 'youtube',
    title: 'YouTube Thumbnail',
    description: 'Optimized for YouTube (1280×720)',
    width: 1280,
    height: 720,
    icon: Icons.Youtube,
  },
  {
    id: 'mockup',
    title: 'Product Mockup',
    description: 'Custom size for product visuals',
    width: 1200,
    height: 1200,
    icon: Icons.Box,
  },
  {
    id: 'website',
    title: 'Website Hero',
    description: 'Full-width hero banner (1920×1080)',
    width: 1920,
    height: 1080,
    icon: Icons.Globe,
  },
  {
    id: 'business-card',
    title: 'Business Card',
    description: 'Standard 3.5 × 2 inch card',
    width: 1050,
    height: 600,
    icon: Icons.CreditCard,
  },
  {
    id: 'poster',
    title: 'Poster',
    description: 'Large format 24 × 36 inch',
    width: 7200,
    height: 10800,
    icon: Icons.Image,
  },
];

interface CreativeIntentModeProps {
  onSelect: () => void;
  onSkip: () => void;
}

export const CreativeIntentMode: React.FC<CreativeIntentModeProps> = ({ onSelect, onSkip }) => {
  const setIntent = useStore((s) => s.setIntent);
  const setCanvasSize = useStore((s) => s.setCanvasSize);

  const handleSelect = (intent: IntentCard) => {
    setIntent(intent.id, intent.width, intent.height);
    setCanvasSize({ width: intent.width, height: intent.height, name: intent.title });
    onSelect();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-surface-dark-0 flex items-center justify-center p-6"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/8 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-4xl animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
            What are you trying to create?
          </h1>
          <p className="text-gray-500 text-sm">Pick a starting point — we'll set up the canvas for you.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {INTENTS.map((intent, i) => (
            <motion.button
              key={intent.id}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', damping: 20 }}
              onClick={() => handleSelect(intent)}
              className="group relative p-5 bg-surface-dark-2 border border-white/5 rounded-2xl hover:border-brand-600/50 hover:bg-surface-dark-3 transition-all text-left overflow-hidden"
            >
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />
              </div>

              <intent.icon className="w-6 h-6 text-brand-600 mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-sm font-bold text-white mb-1">{intent.title}</div>
              <div className="text-[11px] text-gray-500 leading-snug mb-2">{intent.description}</div>
              <div className="text-[9px] font-mono text-gray-600 uppercase tracking-wider">
                {intent.width} × {intent.height}
              </div>
            </motion.button>
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={onSkip}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2"
          >
            Skip — I'll figure it out
          </button>
        </div>
      </div>
    </motion.div>
  );
};
