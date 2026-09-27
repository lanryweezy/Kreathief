import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Icons } from '../../constants';
import { MagneticButton } from './LandingUtils';

interface HeroProps {
  onGetStarted: () => void;
}

const HERO_SLIDES = [
  {
    image: '/images/hero_slide_1.webp',
    tag: 'FASHION & EDITORIAL',
    title: 'Cybernetic Avant-Garde',
  },
  {
    image: '/images/hero_slide_6.webp',
    tag: 'CINEMATOGRAPHY',
    title: 'Kinetic Pyrotechnics',
  },
  {
    image: '/images/hero_ai_cinematic.webp',
    tag: 'CREATIVE DIRECTION',
    title: 'Chiaroscuro Arena Synthesis',
  },
  {
    image: '/images/hero_slide_3.webp',
    tag: 'SPATIAL SURREALISM',
    title: 'Open Field Narrative Architecture',
  },
];

export const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const { scrollY } = useScroll();

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 12000); // Slower transition (12s instead of 5.5s)
    return () => clearInterval(timer);
  }, []);

  const bgY = useTransform(scrollY, [0, 800], [0, 80]);
  const previewRotateX = useTransform(scrollY, [0, 600], [5, 0]);
  const previewScale = useTransform(scrollY, [0, 600], [0.97, 1]);

  return (
    <section className="relative pt-36 pb-28 md:pt-44 md:pb-36 overflow-hidden min-h-[115vh] flex flex-col items-center justify-start bg-[#08080d]">
      {/* Background Rotating Cinematic Imagery - Limited to top screen */}
      <div className="absolute top-0 inset-x-0 h-[85vh] pointer-events-none overflow-hidden select-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ y: bgY }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={HERO_SLIDES[activeSlide].image}
              alt={HERO_SLIDES[activeSlide].title}
              width="1920"
              height="1080"
              fetchPriority={activeSlide === 0 ? 'high' : 'auto'}
              decoding={activeSlide === 0 ? 'sync' : 'async'}
              className="w-full h-full object-cover object-top filter contrast-105"
            />
          </motion.div>
        </AnimatePresence>

        {/* Clean Vignette & Minimal Tint — blend out at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#08080d]/20 via-transparent via-85% to-[#08080d]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_20%,rgba(255,255,255,0.02),transparent)]" />
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 relative z-10 w-full flex flex-col items-center">
        {/* Main Headline - Rendered without JS opacity delay for sub-second LCP */}
        <div className="text-center w-full max-w-6xl mt-16 mb-8 relative flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[80px] font-black tracking-tighter leading-[0.95] text-white select-none text-balance">
            Design at the <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-300 to-neutral-500">
              speed of thought.
            </span>
          </h1>
        </div>

        {/* Subtitle & Value Proposition */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="text-lg sm:text-xl md:text-2xl text-neutral-300/90 max-w-3xl text-center mb-10 leading-relaxed font-normal text-balance"
        >
          The intelligent creative engine unifying <span className="text-white font-semibold">Generative AI</span>,{' '}
          <span className="text-white font-semibold">Vector Artistry</span>, and <span className="text-white font-semibold">Spatial Mockups</span> into a zero-latency canvas.
        </motion.p>

        {/* Call to Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="flex items-center justify-center mb-10 z-20"
        >
          <MagneticButton strength={25}>
            <button
              onClick={onGetStarted}
              className="px-10 py-4 border border-white/20 bg-gradient-to-b from-white via-neutral-200 to-neutral-400 text-black hover:bg-neutral-100 rounded-full font-black text-sm tracking-wide uppercase transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_8px_30px_rgba(255,255,255,0.3)] group"
            >
              <span>Launch Studio</span>
              <Icons.ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
            </button>
          </MagneticButton>
        </motion.div>



        {/* 3D PRODUCT CANVAS PREVIEW */}
        <div className="relative w-full max-w-[1240px] perspective-[2000px] mt-2">
          {/* Ambient Subtle Glows around the frame */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-neutral-600/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 -left-20 w-72 h-72 bg-amber-600/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 -right-20 w-72 h-72 bg-neutral-600/5 blur-[100px] rounded-full pointer-events-none" />

          {/* Main Central Product Frame */}
          <motion.div
            style={{ rotateX: previewRotateX, scale: previewScale }}
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full rounded-[24px] sm:rounded-[32px] border border-white/15 bg-[#0e0e16]/90 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden relative group"
          >
            {/* Window Title Bar */}
            <div className="h-10 sm:h-12 bg-white/[0.04] border-b border-white/10 flex items-center justify-between px-5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]/90 shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]/90 shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]/90 shadow-sm" />
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 bg-white/[0.03] px-3 py-1 rounded-md border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Kreathief Studio — Cyberpunk_City_2026.art</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-400 w-24">
                {/* Spacer to maintain flex layout */}
              </div>
            </div>

            {/* High Fidelity Editor Visual - Actual App Screenshot */}
            <div className="relative overflow-hidden w-full bg-[#0c0c10] flex items-center justify-center">
              <img
                src="/images/screenshot_editor_main.png"
                alt="Kreathief Editor Interface preview with canvas, layers, and AI toolbars"
                width="1920"
                height="1080"
                fetchPriority="high"
                decoding="async"
                className="w-full h-auto object-cover object-top"
              />
            </div>
          </motion.div>

          {/* Floating Artwork Card Left (Avant-Garde Chrome) */}
          <motion.div
            initial={{ opacity: 0, x: -60, y: 30 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1.2, delay: 0.8 }}
            className="hidden xl:block absolute -left-12 top-1/4 w-52 rounded-2xl overflow-hidden border border-white/15 bg-black/80 backdrop-blur-xl shadow-2xl z-30 group perspective-1000"
          >
            <div className="aspect-[3/4] overflow-hidden relative transform-style-3d transition-transform duration-700 group-hover:rotate-x-12 group-hover:rotate-y-12">
              <div className="absolute inset-0 transition-transform duration-700 group-hover:translate-z-[-20px] opacity-30 bg-purple-900/50" />
              <img
                src="/images/downloads/art_chrome_baddie.jpg"
                alt="Chrome Avant-Garde Vector Artwork"
                width="208"
                height="277"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:translate-z-10"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-3.5 transition-transform duration-700 group-hover:translate-z-20">
                <div>
                  <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest block">
                    3D Chrome
                  </span>
                  <span className="text-xs font-black text-white">Avant-Garde Poster</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating Artwork Card Right (Kinetic Campaign) */}
          <motion.div
            initial={{ opacity: 0, x: 60, y: 40 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1.2, delay: 1.0 }}
            className="hidden xl:block absolute -right-12 top-1/3 w-52 rounded-2xl overflow-hidden border border-white/15 bg-black/80 backdrop-blur-xl shadow-2xl z-30 group perspective-1000"
          >
            <div className="aspect-[3/4] overflow-hidden relative transform-style-3d transition-transform duration-700 group-hover:rotate-x-12 group-hover:-rotate-y-12">
              <div className="absolute inset-0 transition-transform duration-700 group-hover:translate-z-[-20px] opacity-30 bg-emerald-900/50" />
              <img
                src="/images/downloads/art_nike_editorial.jpg"
                alt="Commercial Kinetic Athletic Campaign"
                width="208"
                height="277"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:translate-z-10"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-3.5 transition-transform duration-700 group-hover:translate-z-20">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-widest block">
                    Commercial Campaign
                  </span>
                  <span className="text-xs font-black text-white">Kinetic Layout</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Smooth Bottom Fade Transition */}
          <div className="absolute -bottom-10 inset-x-0 h-40 bg-gradient-to-t from-[#08080d] via-[#08080d]/80 to-transparent z-20 pointer-events-none" />
        </div>
      </div>
    </section>
  );
};
