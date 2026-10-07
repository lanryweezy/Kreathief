import React, { useState, useEffect, useRef } from 'react';
import { motion, MotionConfig } from 'framer-motion';
import { Hero } from './landing/Hero';
import { LogoTicker } from './landing/LogoTicker';
import { ModelIntegration } from './landing/ModelIntegration';
import { AgentDemo } from './landing/AgentDemo';
import { Features } from './landing/Features';
import { ScrollShowcase } from './landing/ScrollShowcase';
import { TemplateGallery } from './landing/TemplateGallery';
import { Stats, Pricing } from './landing/StatsAndPricing';
import { Testimonials } from './landing/Testimonials';
import { FAQSection } from './landing/FAQSection';
import { Footer } from './landing/BlogAndFooter';
import { FinalCTA } from './landing/FinalCTA';
import { SEO } from './SEO';
import { Icons } from '../constants';

interface LandingPageProps {
  onGetStarted: () => void;
  onTryGuest?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onTryGuest }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setScrolled(!entry.isIntersecting);
        },
        { threshold: 0 }
      );
      observer.observe(sentinel);
      return () => observer.disconnect();
    } else {
      let ticking = false;
      const handleScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            setScrolled(window.scrollY > 20);
            ticking = false;
          });
          ticking = true;
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh bg-surface-dark-0 text-white selection:bg-[#8b5cf6] selection:text-white font-sans overflow-x-hidden relative">
      {/* Global tactile noise overlay */}
      <div className="fixed inset-0 pointer-events-none z-[999] bg-noise opacity-[0.025] mix-blend-overlay"></div>
      <div ref={sentinelRef} className="absolute top-0 left-0 w-full h-8 pointer-events-none -z-10" aria-hidden="true" />
      <SEO />

            {/* Skip navigation link for keyboard/screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-bold focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <header>
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'py-3 bg-black/80 backdrop-blur-2xl border-b border-white/10 shadow-2xl shadow-black/50'
            : 'py-6 bg-transparent'
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
            <div className="w-10 h-10 aspect-square rounded-xl bg-[#0E1318] border border-white/10 shadow-lg group-hover:shadow-purple-500/30 transition-all duration-500 overflow-hidden flex items-center justify-center">
              <img src="/logo.svg" alt="Kreathief" className="w-7 h-7 object-contain" />
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
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-neutral-400 to-white transition-all group-hover:w-full"></span>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/auth"
              className="hidden sm:block text-sm font-bold text-gray-400 hover:text-white transition-colors"
            >
              Sign In
            </a>
            <button
              onClick={onTryGuest || onGetStarted}
              className="bg-gradient-to-b from-white via-neutral-200 to-neutral-400 text-black px-6 py-2.5 rounded-full text-sm font-black tracking-wide shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_12px_rgba(255,255,255,0.1)] hover:shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_6px_20px_rgba(255,255,255,0.2)] transition-all transform hover:scale-105 active:scale-95"
            >
              Get Started
            </button>

            {/* Mobile Menu Toggle */}
            <button
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
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
            <a
              href="/auth"
              className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white text-center block"
            >
              Log In
            </a>
          </div>
        </motion.div>
      </nav>
      </header>

      <main id="main-content">
        <Hero onGetStarted={onTryGuest || onGetStarted} />
        <LogoTicker />
        <ModelIntegration />
        <AgentDemo onGetStarted={onTryGuest || onGetStarted} />
        <Features />
        <ScrollShowcase />
        <TemplateGallery onGetStarted={onTryGuest || onGetStarted} />
        <Stats />
        <Testimonials />
        <Pricing onPlanSelect={onGetStarted} />
        <FAQSection />
        <FinalCTA onGetStarted={onTryGuest || onGetStarted} />
      </main>

      <Footer />
      </div>
    </MotionConfig>
  );
};
