import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icons as GlobalIcons } from '../../constants';
import { Footer } from '../landing/BlogAndFooter';
import { SEO } from '../SEO';

interface ContentPageProps {
  title: string;
  children: React.ReactNode;
}

export const ContentPage: React.FC<ContentPageProps> = ({ title, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#7d2ae8] selection:text-white font-sans overflow-x-hidden">
      <SEO />

      {/* Navigation */}
      <nav className="py-6 bg-[#050505]/90 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-all duration-300">
              <GlobalIcons.Magic className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-2xl tracking-tighter uppercase">Kreathief</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              to="/auth"
              className="bg-white text-black px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-200 transition-all shadow-xl shadow-white/10"
            >
              Go to App
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-32 min-h-[70vh]">
        <h1 className="text-4xl md:text-6xl font-black mb-12 tracking-tighter">{title}</h1>
        <div className="space-y-8 text-gray-400 font-medium leading-relaxed">{children}</div>
      </main>

      <Footer />
    </div>
  );
};
