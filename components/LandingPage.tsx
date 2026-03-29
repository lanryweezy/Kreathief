import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Hero } from './landing/Hero';
import { LogoTicker } from './landing/LogoTicker';
import { Features } from './landing/Features';
import { ScrollShowcase } from './landing/ScrollShowcase';
import { TemplateGallery } from './landing/TemplateGallery';
import { ComparisonSection } from './landing/ComparisonSection';
import { Stats, Pricing } from './landing/StatsAndPricing';
import { FAQSection } from './landing/FAQSection';
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
    restDelta: 0.001,
  });

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

      {/* Dynamic Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-purple-500 origin-left z-[100]" style={{ scaleX }} />

      {/* Navigation */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? 'py-4 bg-black/50 backdrop-blur-2xl border-b border-white/5' : 'py-8 bg-transparent'
        }`}
      >
        {/* Navigation Laser Top Border */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 aspect-square rounded-xl shadow-lg group-hover:shadow-purple-500/30 transition-all duration-500 overflow-hidden flex items-center justify-center">
              <img src="/logo.svg" alt="Kreathief" className="w-full h-full object-cover" />
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
            <button className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors">
              Log In
            </button>
            <button
              onClick={onGetStarted}
              className="bg-white text-black px-6 py-3 rounded-full text-xs font-bold hover:bg-gray-200 transition-all transform hover:scale-105 active:scale-95"
            >
              Start Free
            </button>
          </div>
        </div>
      </nav>

      <main>
        <Hero onGetStarted={onGetStarted} />
        <LogoTicker />
        <Features />
        <ScrollShowcase />
        <TemplateGallery />
        <ComparisonSection />

        <Stats />
        <Pricing onPlanSelect={onGetStarted} />
        <FAQSection />
        <BlogPreview />
      </main>

      <Footer />
    </div>
  );
};
