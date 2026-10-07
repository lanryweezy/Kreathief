import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Icons } from '../../constants';
import { MagneticButton } from './LandingUtils';

interface HeroProps {
  onGetStarted: () => void;
}

type StudioMode = 'diffusion' | 'vector' | 'spatial' | 'director';

interface HeroSlide {
  image: string;
  tag: string;
  title: string;
  prompt: string;
  palette: string[];
  vectorNodes: number;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    image: '/images/hero_slide_1.webp',
    tag: 'FASHION & EDITORIAL',
    title: 'Cybernetic Avant-Garde',
    prompt: 'avant-garde fashion portrait, chrome liquid jewelry, hyper-detailed chiaroscuro, high-gloss studio lighting, 8k resolution',
    palette: ['#0A0A0F', '#8B5CF6', '#EC4899', '#E0E7FF'],
    vectorNodes: 184,
  },
  {
    image: '/images/hero_slide_6.webp',
    tag: 'CINEMATOGRAPHY',
    title: 'Kinetic Pyrotechnics',
    prompt: 'kinetic dynamic motion blur, high-velocity sparks, neon ember trails, cinematic anamorphic widescreen bokeh',
    palette: ['#07070B', '#F59E0B', '#EF4444', '#FDE68A'],
    vectorNodes: 242,
  },
  {
    image: '/images/hero_ai_cinematic.webp',
    tag: 'CREATIVE DIRECTION',
    title: 'Chiaroscuro Arena Synthesis',
    prompt: 'cinematic gladiatorial arena, dramatic baroque lighting, sculptural silhouette, gold Leaf embroidery, architectural tension',
    palette: ['#09090E', '#6366F1', '#A855F7', '#C7D2FE'],
    vectorNodes: 156,
  },
  {
    image: '/images/hero_slide_3.webp',
    tag: 'SPATIAL SURREALISM',
    title: 'Open Field Narrative Architecture',
    prompt: 'surrealist brutalist monolith in open misty grassland, atmospheric fog, photorealistic natural materials, dawn ambient glow',
    palette: ['#060609', '#10B981', '#06B6D4', '#A7F3D0'],
    vectorNodes: 198,
  },
];

export const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeMode, setActiveMode] = useState<StudioMode>('diffusion');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [seed, setSeed] = useState(8492041);
  const { scrollY } = useScroll();

  // 3D Parallax Tilt for product canvas preview
  const frameRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 120, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 20 });

  const handleFrameMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x * 6);
    mouseY.set(-y * 6);
  };

  const handleFrameMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 14000);
    return () => clearInterval(timer);
  }, []);

  const triggerSynthesisSimulation = () => {
    setIsSynthesizing(true);
    setSeed(Math.floor(Math.random() * 9000000) + 1000000);
    setTimeout(() => {
      setIsSynthesizing(false);
    }, 1200);
  };

  const bgY = useTransform(scrollY, [0, 800], [0, 80]);
  const previewRotateX = useTransform(scrollY, [0, 600], [4, 0]);
  const previewScale = useTransform(scrollY, [0, 600], [0.98, 1]);

  const currentSlide = HERO_SLIDES[activeSlide];

  return (
    <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden min-h-[115vh] flex flex-col items-center justify-start bg-[#08080d]">
      {/* Background Rotating Cinematic Imagery */}
      <div className="absolute top-0 inset-x-0 h-[85vh] pointer-events-none overflow-hidden select-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ y: bgY }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={currentSlide.image}
              alt={currentSlide.title}
              width="1920"
              height="1080"
              fetchPriority={activeSlide === 0 ? 'high' : 'auto'}
              decoding={activeSlide === 0 ? 'sync' : 'async'}
              className="w-full h-full object-cover object-top filter contrast-105"
            />
          </motion.div>
        </AnimatePresence>

        {/* Cinematic Vignette & Grain */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#08080d]/25 via-transparent via-80% to-[#08080d]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_20%,rgba(255,255,255,0.02),transparent)]" />
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 relative z-10 w-full flex flex-col items-center">
        {/* Subtle Category Pill */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md mb-6 shadow-inner"
        >
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-[11px] font-mono tracking-widest text-neutral-300 uppercase font-semibold">
            Next-Gen AI Creative Direction Engine
          </span>
        </motion.div>

        {/* Main Headline */}
        <div className="text-center w-full max-w-6xl mb-6 relative flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[80px] font-black tracking-tighter leading-[0.95] text-white select-none text-balance">
            Design at the <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-400">
              speed of thought.
            </span>
          </h1>
        </div>

        {/* Subtitle & Value Proposition */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg sm:text-xl md:text-2xl text-neutral-300/90 max-w-3xl text-center mb-8 leading-relaxed font-normal text-balance"
        >
          The intelligent creative engine unifying <span className="text-white font-semibold">Generative AI</span>,{' '}
          <span className="text-white font-semibold">Vector Artistry</span>, and <span className="text-white font-semibold">Spatial Mockups</span> into a zero-latency canvas.
        </motion.p>

        {/* Action Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 z-20"
        >
          <MagneticButton strength={25}>
            <button
              onClick={onGetStarted}
              className="px-9 py-4 border border-white/20 bg-gradient-to-b from-white via-neutral-200 to-neutral-400 text-black hover:bg-neutral-100 rounded-full font-black text-sm tracking-wide uppercase transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_8px_30px_rgba(255,255,255,0.3)] group"
            >
              <span>Launch Studio</span>
              <Icons.ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
            </button>
          </MagneticButton>
          <a
            href="#live-demo"
            className="px-6 py-4 rounded-full text-xs font-mono font-bold tracking-wider text-neutral-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-colors flex items-center gap-2"
          >
            <Icons.Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Test-Drive Live Agent</span>
          </a>
        </motion.div>

        {/* Interactive Style Switcher Chips */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-8 z-20 max-w-4xl px-4"
        >
          {HERO_SLIDES.map((slide, index) => {
            const isActive = activeSlide === index;
            return (
              <button
                key={slide.title}
                onClick={() => setActiveSlide(index)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all duration-300 flex items-center gap-2 border ${
                  isActive
                    ? 'bg-white/15 border-purple-400/50 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'bg-white/[0.03] border-white/5 text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-purple-400 shadow-[0_0_6px_#a855f7]' : 'bg-neutral-600'
                  }`}
                />
                <span className="font-bold">{slide.title}</span>
              </button>
            );
          })}
        </motion.div>

        {/* 3D PRODUCT CANVAS PREVIEW */}
        <div
          ref={frameRef}
          onMouseMove={handleFrameMouseMove}
          onMouseLeave={handleFrameMouseLeave}
          className="relative w-full max-w-[1240px] perspective-[2000px] mt-2"
        >
          {/* Ambient Subtle Glow based on active mode */}
          <div
            className={`absolute -top-12 left-1/2 -translate-x-1/2 w-3/4 h-32 blur-[110px] rounded-full pointer-events-none transition-colors duration-700 ${
              activeMode === 'diffusion'
                ? 'bg-purple-600/15'
                : activeMode === 'vector'
                ? 'bg-emerald-600/15'
                : activeMode === 'spatial'
                ? 'bg-cyan-600/15'
                : 'bg-pink-600/15'
            }`}
          />
          <div className="absolute top-1/3 -left-20 w-72 h-72 bg-amber-600/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 -right-20 w-72 h-72 bg-neutral-600/5 blur-[100px] rounded-full pointer-events-none" />

          {/* Main Central Product Frame */}
          <motion.div
            style={{
              rotateX: previewRotateX,
              scale: previewScale,
              rotateY: springX,
            }}
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full rounded-[24px] sm:rounded-[32px] border border-white/15 bg-[#0e0e16]/95 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.85)] overflow-hidden relative group"
          >
            {/* Window Title & Mode Selector Bar */}
            <div className="min-h-12 bg-white/[0.04] border-b border-white/10 flex flex-wrap items-center justify-between px-4 py-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]/90 shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]/90 shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]/90 shadow-sm" />
                <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-neutral-400 bg-white/[0.03] px-3 py-1 rounded-md border border-white/5 ml-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Kreathief Studio — {currentSlide.title.replace(/\s+/g, '_')}.art</span>
                </div>
              </div>

              {/* Studio Interactive Mode Tabs */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setActiveMode('diffusion')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                    activeMode === 'diffusion'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Icons.Magic className="w-3 h-3" />
                  <span>Diffusion</span>
                </button>
                <button
                  onClick={() => setActiveMode('vector')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                    activeMode === 'vector'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Icons.Edit className="w-3 h-3" />
                  <span>Vector Path</span>
                </button>
                <button
                  onClick={() => setActiveMode('spatial')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                    activeMode === 'spatial'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Icons.Eye className="w-3 h-3" />
                  <span>3D Chrome</span>
                </button>
                <button
                  onClick={() => setActiveMode('director')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                    activeMode === 'director'
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Icons.Sparkles className="w-3 h-3" />
                  <span>AI Director</span>
                </button>
              </div>
            </div>

            {/* High Fidelity Editor Visual with Interactive Overlay */}
            <div className="relative overflow-hidden w-full bg-[#0c0c10] flex items-center justify-center min-h-[420px] sm:min-h-[580px]">
              {/* Underlying Base Canvas Image */}
              <img
                src="/images/screenshot_editor_main.png"
                alt="Kreathief Editor Interface preview with canvas, layers, and AI toolbars"
                width="1920"
                height="1080"
                fetchPriority="high"
                decoding="async"
                className="w-full h-auto object-cover object-top select-none pointer-events-none"
              />

              {/* Scanning Laser Sheen when synthesizing */}
              <AnimatePresence>
                {isSynthesizing && (
                  <motion.div
                    initial={{ top: '-10%' }}
                    animate={{ top: '110%' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, ease: 'easeInOut' }}
                    className="absolute inset-x-0 h-2 bg-gradient-to-b from-transparent via-purple-400 to-transparent shadow-[0_0_20px_#c084fc] z-40 pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {/* MODE 1: DIFFUSION SYNTHESIS HUD OVERLAY */}
              {activeMode === 'diffusion' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-x-4 sm:inset-x-8 top-6 z-30 pointer-events-auto"
                >
                  <div className="bg-black/85 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-3.5 sm:p-4 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                        <Icons.Magic className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">
                            Model: Gemini 2.5 Flash / Neural Canvas
                          </span>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                            LIVE
                          </span>
                        </div>
                        <p className="text-xs font-mono text-neutral-300 truncate">
                          "{currentSlide.prompt}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-neutral-400 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                        <span>Seed: #{seed}</span>
                        <span>•</span>
                        <span>Steps: 32</span>
                      </div>
                      <button
                        onClick={triggerSynthesisSimulation}
                        disabled={isSynthesizing}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg text-xs font-mono font-bold tracking-wider transition-all transform active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-purple-900/30"
                      >
                        <Icons.Refresh className={`w-3 h-3 ${isSynthesizing ? 'animate-spin' : ''}`} />
                        <span>{isSynthesizing ? 'Synthesizing...' : 'Re-Sample'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* MODE 2: VECTOR MATRIX OVERLAY */}
              {activeMode === 'vector' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center p-6"
                >
                  {/* Interactive SVG Vector Curve & Anchors */}
                  <svg className="w-full h-full max-w-[850px] max-h-[450px]" viewBox="0 0 850 450">
                    <defs>
                      <linearGradient id="vectorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="50%" stopColor="#06B6D4" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>

                    {/* Vector Path */}
                    <path
                      d="M 120,280 C 220,120 380,360 480,200 S 680,100 750,260"
                      fill="none"
                      stroke="url(#vectorGrad)"
                      strokeWidth="3"
                      strokeDasharray="6 4"
                      className="animate-pulse"
                    />

                    {/* Tangent Handles */}
                    <line x1="120" y1="280" x2="220" y2="120" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.6" />
                    <line x1="480" y1="200" x2="380" y2="360" stroke="#06b6d4" strokeWidth="1.5" strokeOpacity="0.6" />
                    <line x1="480" y1="200" x2="580" y2="100" stroke="#06b6d4" strokeWidth="1.5" strokeOpacity="0.6" />
                    <line x1="750" y1="260" x2="680" y2="100" stroke="#8b5cf6" strokeWidth="1.5" strokeOpacity="0.6" />

                    {/* Handle Endpoints */}
                    <circle cx="220" cy="120" r="4.5" fill="#10B981" />
                    <circle cx="380" cy="360" r="4.5" fill="#06B6D4" />
                    <circle cx="580" cy="100" r="4.5" fill="#06B6D4" />
                    <circle cx="680" cy="100" r="4.5" fill="#8B5CF6" />

                    {/* Main Anchor Points */}
                    {[
                      { x: 120, y: 280, id: 'P0' },
                      { x: 480, y: 200, id: 'P1' },
                      { x: 750, y: 260, id: 'P2' },
                    ].map((pt) => (
                      <g key={pt.id}>
                        <rect
                          x={pt.x - 7}
                          y={pt.y - 7}
                          width="14"
                          height="14"
                          fill="#ffffff"
                          stroke="#0e0e16"
                          strokeWidth="2"
                          rx="2"
                        />
                        <text x={pt.x + 12} y={pt.y - 10} fill="#ffffff" fontSize="10" fontFamily="monospace">
                          {pt.id} [{pt.x}, {pt.y}]
                        </text>
                      </g>
                    ))}
                  </svg>

                  {/* Vector HUD Badge */}
                  <div className="absolute top-6 left-8 bg-black/85 backdrop-blur-xl border border-emerald-500/30 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-mono text-emerald-300 font-bold">
                      {currentSlide.vectorNodes} Scalable Bézier Curves • Sub-Pixel Mathematical Accuracy
                    </span>
                  </div>
                </motion.div>
              )}

              {/* MODE 3: SPATIAL 3D CHROME OVERLAY */}
              {activeMode === 'spatial' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-6 bg-gradient-to-tr from-cyan-900/10 via-transparent to-purple-900/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="bg-black/85 backdrop-blur-xl border border-cyan-500/30 px-4 py-2 rounded-xl text-xs font-mono text-cyan-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span>3D Displacement Geometry • Extrusion Depth: 48mm</span>
                    </div>
                    <div className="bg-black/85 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-mono text-neutral-400">
                      Specular Refraction: 1.45 (Diamond Glass)
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-neutral-300">
                    <span>Move cursor across frame to rotate physical light angle</span>
                  </div>
                </motion.div>
              )}

              {/* MODE 4: AI ART DIRECTOR OVERLAY */}
              {activeMode === 'director' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 pointer-events-none p-6 flex flex-col justify-between"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
                    <div className="bg-black/90 backdrop-blur-xl border border-pink-500/30 p-3 rounded-xl shadow-xl">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-pink-400 block mb-1">
                        Visual Tension
                      </span>
                      <span className="text-sm font-black text-white">98% Optimal</span>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">Baroque Chiaroscuro Focal Point</span>
                    </div>

                    <div className="bg-black/90 backdrop-blur-xl border border-purple-500/30 p-3 rounded-xl shadow-xl">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-purple-400 block mb-1">
                        Palette Harmony
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {currentSlide.palette.map((c) => (
                          <span
                            key={c}
                            className="w-5 h-5 rounded-md border border-white/20 shadow-sm"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="bg-black/90 backdrop-blur-xl border border-emerald-500/30 p-3 rounded-xl shadow-xl">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 block mb-1">
                        Typographic Ratio
                      </span>
                      <span className="text-sm font-black text-white">1:1.618 (Golden)</span>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">Syne 900 + Inter Variable</span>
                    </div>
                  </div>

                  <div className="bg-black/85 backdrop-blur-xl border border-white/15 p-3 rounded-xl max-w-md self-start text-xs font-mono text-neutral-300 flex items-center gap-3">
                    <Icons.Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Creative Agent Recommendation: Increase contrast on foreground typography layer by +12%.</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bottom Engine Telemetry Bar */}
            <div className="h-10 bg-black/80 border-t border-white/10 px-5 flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>120 FPS Realtime</span>
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline text-neutral-400">4ms Zero-Lag Canvas</span>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline text-neutral-400">Non-Destructive Graph</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-neutral-500 hidden sm:inline">Active Style:</span>
                <span className="text-purple-300 font-bold">{currentSlide.tag}</span>
              </div>
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
