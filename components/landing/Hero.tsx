import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Icons } from '../../constants';
import { MagneticButton } from './LandingUtils';

interface HeroProps {
  onGetStarted: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  const { scrollY } = useScroll();

  // Parallax scrolling effects for the exploded UI elements
  const y1 = useTransform(scrollY, [0, 1000], [0, -150]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -250]);
  const y3 = useTransform(scrollY, [0, 1000], [0, -100]);
  const y4 = useTransform(scrollY, [0, 1000], [0, -300]);

  return (
    <section className="relative pt-32 pb-32 overflow-hidden min-h-[110vh] flex flex-col items-center justify-start bg-[#0a0a0c]">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <img
          src="/images/hero_rings_bg.png"
          alt="Abstract glowing 3D space rings representing AI design tools background"
          className="absolute inset-0 w-full h-full object-cover opacity-80 z-0 mix-blend-screen"
        />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-black z-20"></div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 relative z-10 w-full flex flex-col items-center">
        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center w-full max-w-5xl mb-10 relative flex flex-col items-center"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
          >
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm font-black uppercase tracking-[0.2em] text-white">10x Faster Than Figma</span>
            </div>
          </motion.div>

          <div className="absolute -inset-10 bg-white/5 blur-[100px] -z-10 rounded-full"></div>
          <h1 className="text-6xl md:text-[90px] lg:text-[140px] font-black tracking-tighter leading-[0.85] text-white select-none text-balance">
            From idea to design <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 animate-text-gradient">
              in 30 seconds.
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-xl md:text-3xl text-gray-300 max-w-4xl text-center mb-8 leading-relaxed font-semibold text-balance"
        >
          AI + vector tools + real-time engine. <br className="hidden md:block" />
          Replace Figma, Canva, and Midjourney with one system.
        </motion.p>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-8 mb-12 text-base text-gray-400 font-medium"
        >
          <div className="flex items-center gap-2">
            <Icons.Check className="w-5 h-5 text-green-400" />
            <span>No credit card</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
          <div className="flex items-center gap-2">
            <Icons.Zap className="w-5 h-5 text-yellow-400" />
            <span>10x faster than Figma</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
          <div className="flex items-center gap-2">
            <Icons.Users className="w-5 h-5 text-purple-400" />
            <span>10,000+ creators</span>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24 z-20"
        >
          <MagneticButton strength={30}>
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-12 py-5 bg-white text-black rounded-full font-black text-base hover:bg-gray-100 transition-all transform active:scale-95 flex items-center justify-center gap-3 group relative overflow-hidden shadow-[0_0_60px_rgba(255,255,255,0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 animate-shimmer"></div>
              <span className="relative z-10 flex items-center gap-2 uppercase tracking-wide">
                Get Started
                <Icons.ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </MagneticButton>

          <button 
            onClick={onGetStarted}
            className="px-10 py-5 rounded-full font-bold text-base text-white/70 hover:text-white transition-colors flex items-center gap-3 group border border-white/20 hover:border-white/40 bg-white/5 backdrop-blur-sm"
          >
            <Icons.User className="w-5 h-5 text-purple-400" />
            Try as Guest
          </button>

          <button className="hidden lg:flex px-10 py-5 rounded-full font-bold text-base text-white/70 hover:text-white transition-colors items-center gap-3 group border border-white/20 hover:border-white/40">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Icons.Play className="w-4 h-4 fill-white" />
            </div>
            Watch Demo
          </button>
        </motion.div>

        {/* EXPLODED UI HERO VISUAL */}
        <div className="relative w-full max-w-[1200px] h-[600px] md:h-[800px] perspective-[2000px] mt-10">
          {/* Main Central Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 100, rotateX: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, rotateX: 5, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 -translate-x-1/2 top-0 w-full md:w-[85%] rounded-[30px] border border-transparent animated-border-wrapper bg-[#0a0a0c]/80 backdrop-blur-3xl overflow-hidden z-10 ring-1 ring-white/5"
          >
            <div className="h-8 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <img
              src="/images/screenshot_editor_main.png"
              alt="Kreathief AI graphic design software and professional vector editor dashboard interface showing creative design tools"
              fetchPriority="high"
              decoding="async"
              className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity duration-700"
            />
          </motion.div>

          {/* Floating UI Element 1: Abstract Glass */}
          <motion.div
            style={{ y: y1 }}
            initial={{ opacity: 0, x: -100, y: 50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
            className="hidden md:block absolute -left-10 md:left-0 top-[10%] w-[250px] md:w-[350px] rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/10 z-20 group"
          >
            <img
              src="/images/hero_abstract_glass_1772614949077.png"
              alt="3D Apple-like glassmorphism generative fill and asset engine interface used in Kreathief AI design tool"
              loading="lazy"
              decoding="async"
              className="w-full h-auto scale-105 group-hover:scale-110 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-5">
              <span className="text-white font-bold text-sm bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                3D Glass Asset Engine
              </span>
            </div>
          </motion.div>

          {/* Floating UI Element 2: Typography Panel */}
          <motion.div
            style={{ y: y2 }}
            initial={{ opacity: 0, x: 100, y: 150 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1.2, delay: 1, ease: 'easeOut' }}
            className="hidden md:block absolute -right-5 md:right-5 top-[30%] w-[250px] md:w-[350px] rounded-2xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.7)] border border-white/10 z-30 group"
          >
            <img
              src="/images/landing_feature_layers.png"
              alt="Advanced layer orchestration and UI management panel for vector editing software AI inside Kreathief"
              className="w-full h-auto scale-105 group-hover:scale-110 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-5">
              <span className="text-white font-bold text-sm bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                Advanced Layer Orchestration
              </span>
            </div>
          </motion.div>

          {/* Floating UI Element 3: Palette Panel */}
          <motion.div
            style={{ y: y3 }}
            initial={{ opacity: 0, y: 150 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.2, ease: 'easeOut' }}
            className="hidden md:block absolute -left-5 md:left-20 bottom-[10%] w-[200px] md:w-[280px] rounded-2xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.5)] border border-white/10 z-30 group"
          >
            <img
              src="/images/hero_floating_palette_1772559659004.png"
              alt="Smart brand kits AI and intelligent color palette generator panel tool interface"
              className="w-full h-auto scale-105 group-hover:scale-110 transition-transform duration-1000"
            />
          </motion.div>

          {/* Floating UI Element 4: Real-time Cursors */}
          <motion.div
            style={{ y: y4 }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 1.4, ease: 'easeOut' }}
            className="absolute right-[15%] bottom-[5%] z-40 bg-white/10 backdrop-blur-2xl px-6 py-4 rounded-3xl border border-white/20 flex flex-col items-center gap-3 shadow-2xl"
          >
            <div className="flex -space-x-3">
              <img
                src="/images/avatar_1_1772614969136.png"
                className="w-10 h-10 rounded-full border-2 border-[#111] object-cover"
                loading="lazy"
                decoding="async"
                alt="Designer collaborating in real-time on Kreathief"
              />
              <img
                src="/images/avatar_2_1772614992003.png"
                className="w-10 h-10 rounded-full border-2 border-[#111] object-cover"
                loading="lazy"
                decoding="async"
                alt="Marketer using Kreathief canvas"
              />
              <img
                src="/images/avatar_3_1772615019487.png"
                className="w-10 h-10 rounded-full border-2 border-[#111] object-cover"
                loading="lazy"
                decoding="async"
                alt="Creative director reviewing designs in Kreathief"
              />
            </div>
            <span className="text-[10px] font-black tracking-widest uppercase text-white/80">3 Editing Now</span>
          </motion.div>

          {/* Bottom Fade Gradient for smooth transition */}
          <div className="absolute bottom-[-20%] inset-x-0 h-[60%] bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/80 to-transparent z-50 pointer-events-none" />
        </div>
      </div>
    </section>
  );
};
