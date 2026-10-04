import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import { MouseSpotlight, LaserSeparator } from './LandingUtils';

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-36 relative bg-[#08080d]">
      <LaserSeparator className="absolute top-0 inset-x-0" />

      <div className="max-w-[1400px] mx-auto px-6">
        {/* Section Header */}
        <div className="mb-28 text-center flex flex-col items-center">

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl sm:text-6xl md:text-8xl font-black mb-6 tracking-tighter text-white text-balance leading-[0.94]"
          >
            Built for those who <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-400 via-neutral-300 to-neutral-300">
              refuse creative compromise.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-lg sm:text-xl text-neutral-400 max-w-3xl mx-auto font-normal leading-relaxed text-balance"
          >
            The fluidity of AI generation meets the rigorous mathematical precision of professional vector engines. Zero context-switching. Infinite possibilities.
          </motion.p>
        </div>

        {/* CATEGORY 1: GENERATIVE AI SUITE */}
        <div className="mb-32">
          <div className="flex items-center gap-3 mb-10">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-500 shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-neutral-400 font-bold">
              01 // Generative AI Engines
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[440px]">
            {/* Bento Card 1: Multi-Model Image Synthesis */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="col-span-1 md:col-span-8 rounded-[36px] bg-[#0e0e16] border border-white/10 hover:border-neutral-500/30 transition-all duration-700 overflow-hidden relative group"
            >
              <MouseSpotlight color="rgba(168, 85, 247, 0.12)" radius={650} className="h-full flex flex-col justify-between p-8 sm:p-12">
                <div className="relative z-10 max-w-md">
                  <div className="inline-block px-3 py-1 rounded-md bg-neutral-500/10 border border-neutral-500/20 text-neutral-300 text-[10px] font-mono font-bold tracking-widest uppercase mb-4">
                    Text-to-Masterpiece
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-3">
                    Multi-Model Image Synthesis
                  </h3>
                  <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                    Direct access to state-of-the-art visual models directly within an infinite canvas. Generate hyper-detailed compositions with exact style adherence.
                  </p>
                </div>

                <div className="absolute top-0 right-0 w-full sm:w-[58%] h-full pointer-events-none overflow-hidden">
                  <img
                    src="/images/hero_ai_cinematic.webp"
                    alt="AI Visual Synthesis in action"
                    width="700"
                    height="440"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-center filter brightness-90 group-hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e16] via-[#0e0e16]/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e16] via-transparent to-transparent" />
                </div>

                <div className="relative z-10 w-full max-w-lg bg-black/80 backdrop-blur-xl border border-white/15 rounded-2xl p-3 flex items-center gap-3 shadow-2xl">
                  <div className="w-7 h-7 rounded-lg bg-neutral-500/20 flex items-center justify-center text-neutral-300 shrink-0">
                    <Icons.Magic className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-mono text-neutral-300 truncate">
                    "cinematic arena, chiaroscuro lighting, haute couture samurai..."
                  </span>
                  <span className="ml-auto text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold shrink-0">
                    RENDERED
                  </span>
                </div>
              </MouseSpotlight>
            </motion.div>

            {/* Bento Card 2: Neural Magic Erase */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="col-span-1 md:col-span-4 rounded-[36px] bg-[#0e0e16] border border-white/10 hover:border-neutral-500/30 transition-all duration-700 overflow-hidden relative group"
            >
              <MouseSpotlight color="rgba(236, 72, 153, 0.12)" className="h-full flex flex-col justify-between p-8">
                <div className="absolute inset-0 pointer-events-none">
                  <img
                    src="/images/landing_feature_magic_erase.webp"
                    alt="Neural Magic Erase"
                    width="400"
                    height="440"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover filter brightness-75 group-hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e16] via-[#0e0e16]/60 to-black/30" />
                </div>

                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 rounded-md bg-neutral-500/20 border border-neutral-500/30 text-neutral-300 text-[10px] font-mono font-bold tracking-widest uppercase mb-3">
                    Sub-pixel Inpainting
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight mb-2">
                    Neural Magic Erase
                  </h3>
                  <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                    Brush away unwanted elements, photobombers, and artifacts. The neural network rebuilds the scene's geometry effortlessly.
                  </p>
                </div>

                <div className="relative z-10 flex items-center justify-between bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-white">Object Removed Cleanly</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">12ms</span>
                </div>
              </MouseSpotlight>
            </motion.div>

            {/* Bento Card 3: Instant Subject Cutout */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="col-span-1 md:col-span-4 rounded-[36px] bg-[#0e0e16] border border-white/10 hover:border-cyan-500/30 transition-all duration-700 overflow-hidden relative group"
            >
              <MouseSpotlight color="rgba(34, 211, 238, 0.12)" className="h-full flex flex-col justify-between p-8">
                <div className="absolute inset-0 pointer-events-none">
                  <img
                    src="/images/feature_cutout_mockup_1772615585150.webp"
                    alt="One-click Subject Masking"
                    width="400"
                    height="440"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover filter brightness-75 group-hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e16] via-[#0e0e16]/60 to-black/30" />
                </div>

                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold tracking-widest uppercase mb-3">
                    Hair-Level Precision
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight mb-2">
                    Alpha Masking & Cutout
                  </h3>
                  <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                    Zero-effort matting of complex organic edges, fabrics, and fine details with studio-grade alpha channels.
                  </p>
                </div>

                <div className="relative z-10 flex items-center gap-2 text-xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/50 px-3 py-2 rounded-xl">
                  <Icons.Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Full Transparency Export</span>
                </div>
              </MouseSpotlight>
            </motion.div>

            {/* Bento Card 4: Generative Fill & Outpainting */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="col-span-1 md:col-span-8 rounded-[36px] bg-[#0e0e16] border border-white/10 hover:border-neutral-500/30 transition-all duration-700 overflow-hidden relative group"
            >
              <MouseSpotlight color="rgba(168, 85, 247, 0.12)" radius={650} className="h-full flex flex-col justify-between p-8 sm:p-12">
                <div className="relative z-10 max-w-md">
                  <div className="inline-block px-3 py-1 rounded-md bg-neutral-500/10 border border-neutral-500/20 text-neutral-300 text-[10px] font-mono font-bold tracking-widest uppercase mb-4">
                    Infinite Aspect Ratio
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-3">
                    Outpainting & Canvas Expansion
                  </h3>
                  <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                    Expand any image beyond its original boundaries. Turn a portrait square into a cinematic 16:9 banner with contextual narrative harmony.
                  </p>
                </div>

                <div className="absolute top-0 right-0 w-full sm:w-[60%] h-full pointer-events-none overflow-hidden">
                  <img
                    src="/images/feature_gen_fill_pro.webp"
                    alt="Generative Outpainting Canvas"
                    width="700"
                    height="440"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e16] via-[#0e0e16]/30 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e16] via-transparent to-transparent" />
                </div>

                <div className="relative z-10 flex items-center gap-4 text-xs font-mono text-neutral-400 bg-white/[0.04] backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-xl w-fit">
                  <span className="text-neutral-400">Expand Direction:</span>
                  <span className="text-white font-bold">All 360° Axis</span>
                  <span className="text-white/20">|</span>
                  <span className="text-emerald-400">Seamless Blend</span>
                </div>
              </MouseSpotlight>
            </motion.div>
          </div>
        </div>

        {/* CATEGORY 2: VECTOR & STUDIO TOOLS */}
        <div className="mb-32">
          <div className="flex items-center gap-3 mb-10">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-cyan-400 font-bold">
              02 // Mathematical Vector Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[440px]">
            {/* Vector & Raster Unified Canvas */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="col-span-1 md:col-span-8 rounded-[36px] bg-[#0e0e16] border border-white/10 hover:border-cyan-500/30 transition-all duration-700 overflow-hidden relative group"
            >
              <MouseSpotlight color="rgba(34, 211, 238, 0.12)" radius={650} className="h-full flex flex-col justify-between p-8 sm:p-12">
                <div className="relative z-10 max-w-md">
                  <div className="inline-block px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold tracking-widest uppercase mb-4">
                    Vector + Raster Fusion
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-3">
                    Sub-Pixel Bézier Precision
                  </h3>
                  <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                    Full pen tool, Boolean operations, non-destructive path modifiers, and infinite zoom capability alongside photorealistic raster rendering.
                  </p>
                </div>

                <div className="absolute bottom-0 right-0 w-[85%] sm:w-[62%] h-[80%] pointer-events-none">
                  <img
                    src="/images/feature_vector_pro.webp"
                    alt="Precision Vector Editing"
                    width="600"
                    height="400"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain object-bottom-right group-hover:scale-105 transition-transform duration-1000 drop-shadow-2xl"
                  />
                </div>

                <div className="relative z-10 flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
                    SVG 1.1 / 2.0 Export
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-neutral-300 text-xs font-mono">
                    Node Precision 64-bit
                  </span>
                </div>
              </MouseSpotlight>
            </motion.div>

            {/* Smart Typography */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="col-span-1 md:col-span-4 rounded-[36px] bg-[#0e0e16] border border-white/10 hover:border-indigo-500/30 transition-all duration-700 overflow-hidden relative group"
            >
              <MouseSpotlight color="rgba(99, 102, 241, 0.12)" className="h-full flex flex-col justify-between p-8">
                <div>
                  <span className="inline-block px-3 py-1 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-neutral-300 text-[10px] font-mono font-bold tracking-widest uppercase mb-4">
                    Dynamic Typesetting
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight mb-3">
                    Type-on-Path & Variable Fonts
                  </h3>
                  <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                    Connect curves to typography, convert text into editable vectors in one shortcut, and fine-tune ligatures.
                  </p>
                </div>

                <div className="w-full p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-center font-black text-3xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-neutral-300 select-none">
                  KREATHIEF
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                  <span>Kerning: Optical</span>
                  <span className="text-emerald-400 font-bold">OTF/TTF/WOFF2</span>
                </div>
              </MouseSpotlight>
            </motion.div>

            {/* Brand Kits */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="col-span-1 md:col-span-4 rounded-[36px] bg-[#0e0e16] border border-white/10 hover:border-neutral-500/30 transition-all duration-700 overflow-hidden relative group"
            >
              <MouseSpotlight color="rgba(236, 72, 153, 0.12)" className="h-full flex flex-col justify-between p-8">
                <div>
                  <span className="inline-block px-3 py-1 rounded-md bg-neutral-500/20 border border-neutral-500/30 text-neutral-300 text-[10px] font-mono font-bold tracking-widest uppercase mb-4">
                    Brand Governance
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight mb-3">
                    Live Brand Kits
                  </h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    Lock hex codes, logo safe zones, and typography scales across every campaign. Auto-enforce brand consistency with one click.
                  </p>
                </div>

                <div className="flex gap-2 my-4">
                  {['#7c3aed', '#ec4899', '#06b6d4', '#10b981'].map((c, i) => (
                    <div key={i} className="flex-1 h-12 rounded-xl border border-white/15" style={{ backgroundColor: c }} />
                  ))}
                </div>

                <div className="text-xs text-neutral-400 font-mono flex items-center justify-between">
                  <span>Colors Synced</span>
                  <span className="text-neutral-400 font-bold">100% Locked</span>
                </div>
              </MouseSpotlight>
            </motion.div>

            {/* Real-time Multiplayer */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="col-span-1 md:col-span-8 rounded-[36px] bg-[#0e0e16] border border-white/10 hover:border-emerald-500/30 transition-all duration-700 overflow-hidden relative group"
            >
              <MouseSpotlight color="rgba(16, 185, 129, 0.12)" radius={650} className="h-full flex flex-col justify-between p-8 sm:p-12">
                <div className="relative z-10 max-w-md">
                  <div className="inline-block px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold tracking-widest uppercase mb-4">
                    CRDT Peer-to-Peer Engine
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-3">
                    Multiplayer Without Conflict
                  </h3>
                  <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                    Work live with 50+ designers on the exact same artboard. Live cursor paths, instant layer locks, and millisecond sync without version mess.
                  </p>
                </div>

                <div className="absolute top-0 right-0 w-full sm:w-[58%] h-full pointer-events-none overflow-hidden">
                  <img
                    src="/images/feature_collab_pro.webp"
                    alt="Multiplayer Collaboration Live"
                    width="700"
                    height="440"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e16] via-[#0e0e16]/30 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e16] via-transparent to-transparent" />
                </div>

                <div className="relative z-10 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <img src="/images/avatar_1_1772614969136.webp" alt="Collaborator 1" width="32" height="32" loading="lazy" decoding="async" className="w-8 h-8 rounded-full border-2 border-black object-cover" />
                    <img src="/images/avatar_2_1772614992003.webp" alt="Collaborator 2" width="32" height="32" loading="lazy" decoding="async" className="w-8 h-8 rounded-full border-2 border-black object-cover" />
                    <img src="/images/avatar_3_1772615019487.webp" alt="Collaborator 3" width="32" height="32" loading="lazy" decoding="async" className="w-8 h-8 rounded-full border-2 border-black object-cover" />
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    3 Teammates Active Right Now
                  </span>
                </div>
              </MouseSpotlight>
            </motion.div>
          </div>
        </div>

        {/* CATEGORY 3: ASSETS & ECOSYSTEM */}
        <div>
          <div className="flex items-center gap-3 mb-10">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-amber-400 font-bold">
              03 // Resource Vault & Production Pipeline
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-[32px] bg-[#0e0e16] border border-white/10 hover:border-amber-500/30 transition-all duration-700 p-8 flex flex-col justify-between group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300">
                <Icons.Grid className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-white tracking-tight mb-2">11M+ Studio Assets</h4>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Direct royalty-free access to 3D icons, vector motifs, video loops, and Unsplash library built-in.
                </p>
              </div>
              <div className="text-xs font-mono text-amber-400/90 font-bold uppercase tracking-wider">
                Commercial License Included
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-[32px] bg-[#0e0e16] border border-white/10 hover:border-neutral-500/30 transition-all duration-700 p-8 flex flex-col justify-between group"
            >
              <div className="w-12 h-12 rounded-2xl bg-neutral-500/10 border border-neutral-500/20 flex items-center justify-center text-neutral-300">
                <Icons.Filter className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-white tracking-tight mb-2">True CMYK Proofing</h4>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Live color-space emulation with 300 DPI PDF/X-1a exports. What you see on screen is what prints.
                </p>
              </div>
              <div className="text-xs font-mono text-neutral-400/90 font-bold uppercase tracking-wider">
                ISO 12647 Calibrated
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="rounded-[32px] bg-[#0e0e16] border border-white/10 hover:border-indigo-500/30 transition-all duration-700 p-8 flex flex-col justify-between group"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-neutral-300">
                <Icons.Brush className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-white tracking-tight mb-2">Photoshop .ABR & PSD</h4>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Drag and drop your existing Photoshop brush libraries and layered PSD files without converting anything.
                </p>
              </div>
              <div className="text-xs font-mono text-indigo-400/90 font-bold uppercase tracking-wider">
                100% Layer Fidelity
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
