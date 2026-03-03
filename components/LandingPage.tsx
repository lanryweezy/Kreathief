import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import * as Icons from './icons';
import { Icons as GlobalIcons } from '../constants';
import { Hero } from './landing/Hero';
import { Features } from './landing/Features';
import { Stats, Pricing } from './landing/StatsAndPricing';
import { BlogPreview, Footer } from './landing/BlogAndFooter';
import { SEO } from './SEO';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#7d2ae8] selection:text-white font-sans overflow-x-hidden">
      <SEO />

      {/* Dynamic Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-purple-500 origin-left z-[100]"
        style={{ scaleX }}
      />

      {/* Navigation */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled
          ? 'py-4 bg-[#050505]/80 backdrop-blur-2xl border-b border-white/5'
          : 'py-8 bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-all duration-300">
              <GlobalIcons.Magic className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-2xl tracking-tighter uppercase">Kreathief</span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            {['Features', 'Templates', 'Pricing', 'Blog'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-purple-500 transition-all group-hover:w-full"></span>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <button className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors">Log In</button>
            <button
              onClick={onGetStarted}
              className="bg-white text-black px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-200 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
            >
              Start Free
            </button>
          </div>
        </div>
      </nav>

      <main>
        <Hero onGetStarted={onGetStarted} />

        {/* Social Proof Marquee */}
        <div className="py-12 border-y border-white/5 bg-white/[0.01] overflow-hidden">
          <div className="flex gap-20 animate-marquee whitespace-nowrap px-10">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-20 items-center">
                {['Adobe', 'Figma', 'Sketch', 'Canva', 'Webflow', 'Framer', 'Procreate', 'InVision'].map((brand) => (
                  <span key={brand} className="text-xl font-black text-gray-700 uppercase tracking-[0.4em] hover:text-gray-500 transition-colors cursor-default">
                    {brand}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <Features />
        <Stats />
        <Pricing onPlanSelect={onGetStarted} />
        <BlogPreview />
      </main>

      <Footer />
    </div>
  );
};
