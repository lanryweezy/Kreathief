import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import { MagneticButton } from './LandingUtils';

interface FinalCTAProps {
  onGetStarted: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onGetStarted }) => {
  return (
    <section className="py-44 relative bg-[#08080d] overflow-hidden flex flex-col items-center justify-center text-center">
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/images/hero_ai_cinematic.webp"
          alt="Cinematic Creative Canvas"
          width="1920"
          height="1080"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover filter brightness-[0.25] contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#08080d] via-[#08080d]/70 to-[#08080d]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(168,85,247,0.22),transparent)]" />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono tracking-widest text-neutral-300 uppercase mb-8"
        >
          <span>✦</span>
          <span>Zero Learning Curve • Instant Acceleration</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-6xl sm:text-7xl md:text-9xl font-black tracking-tighter text-white leading-[0.88] mb-8"
        >
          Your creative era <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-300 to-neutral-500">
            starts today.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg sm:text-2xl text-neutral-300 max-w-2xl font-normal leading-relaxed mb-12"
        >
          Join 10,000+ creators pushing the boundaries of visual synthesis and vector precision.
        </motion.p>

        <MagneticButton strength={30}>
          <button
            onClick={onGetStarted}
            className="px-12 sm:px-16 py-5 sm:py-6 border border-white/20 bg-gradient-to-b from-white via-neutral-200 to-neutral-400 text-black hover:bg-neutral-100 rounded-full font-black text-base sm:text-lg tracking-wide uppercase transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_8px_30px_rgba(255,255,255,0.3)] group mb-10"
          >
            <span>Launch Studio</span>
            <Icons.ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
          </button>
        </MagneticButton>

        <div className="flex flex-wrap items-center justify-center gap-8 text-xs font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            <span>Free Tier Never Expires</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            <span>No Credit Card</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            <span>Export SVG, PNG, PDF</span>
          </div>
        </div>
      </div>
    </section>
  );
};
