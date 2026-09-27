import React from 'react';
import { Link } from 'react-router-dom';
import { FEATURES_DATA } from '../../data/featuresData';
import { SEO } from '../SEO';
import { Icons } from '../../constants';

export const ToolsDirectoryPage: React.FC = () => {
  const tools = Object.values(FEATURES_DATA);

  return (
    <div className="min-h-screen bg-surface-dark-1 text-white selection:bg-brand-500 selection:text-white">
      <SEO
        title="Free AI Creative Tools & Utilities Directory | Kreathief"
        description="Explore Kreathief's suite of free AI design tools: Magic Object Eraser, Background Remover, 3D Mockup Generator, SVG Vectorizer, Smart Resize, and 60+ Style Presets."
        url="https://www.kreathief.com/tools"
      />

      {/* Header */}
      <header className="h-16 border-b border-white/10 px-6 sm:px-12 flex items-center justify-between bg-surface-dark-2/80 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-surface-dark-3 border border-white/10 flex items-center justify-center p-1.5 shadow-sm group-hover:border-brand-500/50 transition-colors">
            <img src="/logo.svg" alt="Kreathief" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold tracking-tight text-lg text-white">Kreathief</span>
          <span className="text-gray-500 text-sm hidden sm:inline">/</span>
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider hidden sm:inline">
            Tools Directory
          </span>
        </Link>

        <Link
          to="/editor"
          className="px-4 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-lg shadow-glow-brand transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
        >
          <span>Open Full Editor</span>
          <Icons.ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-bold uppercase tracking-wider mb-6">
            <Icons.Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Creative Utilities</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-400">
            Professional AI Design Tools, 100% Free
          </h1>

          <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
            Specialized micro-tools powered by state-of-the-art computer vision, neural inpainting, and vector intelligence.
          </p>
        </div>

        {/* Tools Directory Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.slug}
              to={`/tools/${tool.slug}`}
              className="p-6 rounded-2xl bg-surface-dark-2 border border-white/5 hover:border-brand-500/50 hover:bg-surface-dark-3/80 transition-all hover:translate-y-[-4px] group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                    {tool.badge}
                  </span>
                  <Icons.ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
                </div>

                <h2 className="text-xl font-bold text-white group-hover:text-brand-200 transition-colors mb-2">
                  {tool.title}
                </h2>

                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-6">
                  {tool.subheadline}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-brand-400">
                <span>Try Online Free</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-6 sm:px-12 bg-surface-dark-2 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>© {new Date().getFullYear()} Kreathief AI Inc. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <Link to="/" className="hover:text-gray-300">Home</Link>
          <Link to="/blog" className="hover:text-gray-300">Blog</Link>
          <Link to="/privacy" className="hover:text-gray-300">Privacy</Link>
          <Link to="/terms" className="hover:text-gray-300">Terms</Link>
        </div>
      </footer>
    </div>
  );
};
