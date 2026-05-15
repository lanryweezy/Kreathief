import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Hero } from './landing/Hero';
import { LogoTicker } from './landing/LogoTicker';
import { ReplacementNarrative } from './landing/ReplacementNarrative';
import { SpeedProof } from './landing/SpeedProof';
import { Features } from './landing/Features';
import { TrustEthics } from './landing/TrustEthics';
import { ScrollShowcase } from './landing/ScrollShowcase';
import { TemplateGallery } from './landing/TemplateGallery';
import { Stats, Pricing } from './landing/StatsAndPricing';
import { Testimonials } from './landing/Testimonials';
import { FeatureComparison } from './landing/FeatureComparison';
import { FAQSection } from './landing/FAQSection';

import { BlogPreview, Footer } from './landing/BlogAndFooter';
import { SEO } from './SEO';
import { Icons } from '../constants';

interface LandingPageProps {
  onGetStarted: () => void;
  onTryGuest?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onTryGuest }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-[#8b5cf6] selection:text-white font-sans overflow-x-hidden relative">
      {/* Global tactile noise overlay */}
      <div className="fixed inset-0 pointer-events-none z-[999] bg-noise opacity-[0.025] mix-blend-overlay"></div>
      <SEO />



      {/* Navigation */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? 'py-3 bg-black/80 backdrop-blur-2xl border-b border-white/10 shadow-2xl shadow-black/50' : 'py-6 bg-transparent'
        }`}
      >
        {/* Navigation Laser Top Border */}
        {scrolled && (
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        )}

        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 aspect-square rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg group-hover:shadow-purple-500/50 transition-all duration-500 overflow-hidden flex items-center justify-center">
              <img src="/logo.svg" alt="Kreathief" className="w-6 h-6 object-contain" />
            </div>
            <span className="font-black text-xl tracking-tighter">Kreathief</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Templates', 'Pricing', 'Blog'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-bold text-gray-400 hover:text-white transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transition-all group-hover:w-full"></span>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">

            <button className="hidden sm:block text-sm font-bold text-gray-400 hover:text-white transition-colors">
              Sign In
            </button>
            <button
              onClick={onTryGuest || onGetStarted}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105 active:scale-95"
            >
              Get Started
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <Icons.X className="w-6 h-6" /> : <Icons.Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <motion.div
          initial={false}
          animate={isMobileMenuOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
          className="md:hidden overflow-hidden bg-[#0a0a0a] border-b border-white/5 px-6"
        >
          <div className="flex flex-col py-8 gap-6">
            {['Features', 'Templates', 'Pricing', 'Blog'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
            <button
              onClick={onGetStarted}
              className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white"
            >
              Log In
            </button>
          </div>
        </motion.div>
      </nav>

      <main>
        <Hero onGetStarted={onTryGuest || onGetStarted} />
        <LogoTicker />
        <Features />
        <ScrollShowcase />
        <TemplateGallery />
        <Testimonials />
        <Pricing onPlanSelect={onGetStarted} />
        <BlogPreview />
      </main>

      <Footer />
    </div>
  );
};
