import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FEATURES_DATA, FeaturePageData } from '../../data/featuresData';
import { SEO } from '../SEO';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';
import { Helmet } from 'react-helmet-async';
import {
  EraserDemo,
  BgRemoveDemo,
  MockupDemo,
  VectorizerDemo,
  SmartResizeDemo,
  DesignStylesDemo,
} from './featureDemos/FeatureDemos';

export const FeatureLandingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const feature: FeaturePageData | undefined = slug ? FEATURES_DATA[slug] : undefined;

  if (!feature) {
    return (
      <div className="min-h-screen bg-surface-dark-1 text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-extrabold mb-4">Creative Tool Not Found</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          Explore our suite of agentic creative tools or head back to the editor.
        </p>
        <Link
          to="/tools"
          className="px-6 py-3 bg-brand-600 hover:bg-brand-500 rounded-xl font-bold transition-all"
        >
          View All Creative Tools
        </Link>
      </div>
    );
  }

  const handleLaunchEditor = (customTool?: string) => {
    // Open editor with tool pre-selected or guest entry
    const toolParam = customTool || feature.editorToolParam;
    if (toolParam) {
      navigate(`/editor?tool=${toolParam}`);
    } else {
      navigate('/editor');
    }
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: feature.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-surface-dark-1 text-white selection:bg-brand-500 selection:text-white">
      {/* Dynamic SEO Meta & Microdata */}
      <SEO
        title={feature.metaTitle}
        description={feature.metaDescription}
        url={`https://www.kreathief.com/tools/${feature.slug}`}
        type="article"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Global Minimal Header */}
      <header className="h-16 border-b border-white/10 px-6 sm:px-12 flex items-center justify-between bg-surface-dark-2/80 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-surface-dark-3 border border-white/10 flex items-center justify-center p-1.5 shadow-sm group-hover:border-brand-500/50 transition-colors">
            <img src="/logo.svg" alt="Kreathief" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold tracking-tight text-lg text-white">Kreathief</span>
          <span className="text-gray-500 text-sm hidden sm:inline">/</span>
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider hidden sm:inline">
            Tools
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/tools"
            className="text-xs text-gray-300 hover:text-white font-medium transition-colors hidden md:block"
          >
            All Creative Tools
          </Link>
          <button
            onClick={() => handleLaunchEditor()}
            className="px-4 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-lg shadow-glow-brand transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
          >
            <span>Open Canvas</span>
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-bold uppercase tracking-wider mb-6">
            <Icons.Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>{feature.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-400">
            {feature.headline}
          </h1>

          <p className="text-base sm:text-lg text-gray-400 leading-relaxed mb-8">
            {feature.subheadline}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleLaunchEditor()}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-purple-950/50 hover:scale-105 transition-all text-sm flex items-center justify-center gap-2"
            >
              <span>{feature.heroCta}</span>
              <Icons.ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/tools"
              className="w-full sm:w-auto px-6 py-4 bg-surface-dark-2 hover:bg-surface-dark-3 text-gray-300 hover:text-white font-semibold rounded-xl border border-white/10 transition-colors text-sm text-center"
            >
              Explore 6+ Free Tools
            </Link>
          </div>
          <p className="text-[11px] text-gray-500 mt-3">
            ✨ 100% Free to use in browser • No credit card required • Instant export
          </p>
        </div>

        {/* Interactive Feature Demo Sandbox */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-surface-dark-2/50 backdrop-blur-xl shadow-2xl p-4 sm:p-8 max-w-4xl mx-auto mb-24">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs text-gray-400 font-mono ml-2">
                kreathief.app/canvas?tool={feature.slug}
              </span>
            </div>
            <span className="text-[11px] bg-brand-500/20 text-brand-300 font-bold px-2 py-0.5 rounded">
              Interactive Preview
            </span>
          </div>

          {/* Deeply Interactive Custom Feature Demos */}
          {feature.demoType === 'eraser' && (
            <EraserDemo onLaunchEditor={handleLaunchEditor} />
          )}

          {feature.demoType === 'bg_remove' && (
            <BgRemoveDemo onLaunchEditor={handleLaunchEditor} />
          )}

          {feature.demoType === 'mockup' && (
            <MockupDemo onLaunchEditor={handleLaunchEditor} />
          )}

          {feature.demoType === 'vector' && (
            <VectorizerDemo onLaunchEditor={handleLaunchEditor} />
          )}

          {feature.demoType === 'resize' && (
            <SmartResizeDemo onLaunchEditor={handleLaunchEditor} />
          )}

          {feature.demoType === 'styles' && (
            <DesignStylesDemo onLaunchEditor={handleLaunchEditor} />
          )}
        </div>

        {/* Core Value Proposition Grid */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Why creators love our {feature.title.toLowerCase()}
            </h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">
              Engineered with modern browser technologies and production AI models for speed and privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {feature.benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-surface-dark-2 border border-white/5 hover:border-brand-500/30 transition-all hover:translate-y-[-2px] group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4 group-hover:scale-110 transition-transform">
                  <Icons.Check className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3-Step Walkthrough */}
        <section className="mb-24 bg-surface-dark-2/40 border border-white/5 rounded-3xl p-8 sm:p-12">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2">
              How to use the {feature.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {feature.steps.map((st, idx) => (
              <div key={idx} className="flex flex-col relative">
                <span className="text-4xl font-black text-white/10 mb-2 font-mono">{st.step}</span>
                <h3 className="text-lg font-bold text-white mb-2">{st.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{st.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Accordion Section (Schema.org Microdata Backed) */}
        <section className="max-w-3xl mx-auto mb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-400 text-sm">Everything you need to know about {feature.title}.</p>
          </div>

          <div className="space-y-4">
            {feature.faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-surface-dark-2 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full text-left px-6 py-4 flex items-center justify-between font-bold text-sm text-gray-200 hover:text-white"
                  >
                    <span>{faq.question}</span>
                    <span className="text-brand-400 text-lg ml-4">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-gray-400 text-xs sm:text-sm leading-relaxed border-t border-white/5 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Related Tools Internal Linking Cluster */}
        <section className="border-t border-white/10 pt-16">
          <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 gap-2">
            <div>
              <h2 className="text-xl font-bold">Related Creative Tools</h2>
              <p className="text-gray-400 text-xs mt-1">Supercharge your designs with our companion utilities.</p>
            </div>
            <Link to="/tools" className="text-xs text-brand-400 hover:underline font-semibold">
              View All Tools →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {feature.relatedSlugs.map((relSlug) => {
              const rel = FEATURES_DATA[relSlug];
              if (!rel) return null;
              return (
                <Link
                  key={relSlug}
                  to={`/tools/${relSlug}`}
                  className="p-5 rounded-xl bg-surface-dark-2 border border-white/5 hover:border-brand-500/40 hover:bg-surface-dark-3 transition-all group"
                >
                  <span className="text-[10px] text-brand-400 uppercase font-black tracking-widest block mb-2">
                    {rel.badge}
                  </span>
                  <h3 className="font-bold text-white group-hover:text-brand-300 transition-colors mb-1.5 text-sm">
                    {rel.title}
                  </h3>
                  <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                    {rel.headline}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      {/* Global Minimal Footer */}
      <footer className="border-t border-white/10 py-10 px-6 sm:px-12 bg-surface-dark-2 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>© {new Date().getFullYear()} Kreathief AI Inc. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <Link to="/" className="hover:text-gray-300">Home</Link>
          <Link to="/tools" className="hover:text-gray-300">Creative Tools</Link>
          <Link to="/blog" className="hover:text-gray-300">Blog & Insights</Link>
          <Link to="/privacy" className="hover:text-gray-300">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-gray-300">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
};
