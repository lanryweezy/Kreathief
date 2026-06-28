import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import { MagneticButton } from './LandingUtils';

interface FinalCTAProps {
  onGetStarted: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onGetStarted }) => {
  return (
    <section className="py-32 relative bg-[#0a0a0c] overflow-hidden">
      {/* Dramatic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-[150px] rounded-full"></div>
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Badge */}
          <div className="inline-block mb-8">
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-black uppercase tracking-[0.2em] text-purple-400">Ready When You Are</span>
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tighter text-white leading-[0.9]">
            Start creating <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 animate-text-gradient">
              in seconds.
            </span>
          </h2>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-400 font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
            No credit card. No trial limits. No BS. Just pure creative power at your fingertips.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <MagneticButton strength={30}>
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-12 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-base hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform active:scale-95 flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 animate-shimmer"></div>
                <span className="relative z-10 flex items-center gap-2">
                  Get Started Free
                  <Icons.ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </MagneticButton>

            <button
              className="px-12 py-5 rounded-full font-bold text-base text-white/70 hover:text-white transition-colors flex items-center gap-3 group border border-white/10 hover:border-white/20"
              onClick={onGetStarted}
            >
              <Icons.Play className="w-4 h-4 fill-white" />
              Watch 2-min Demo
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Icons.Check className="w-4 h-4 text-green-500" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2">
              <Icons.Check className="w-4 h-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Icons.Check className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-16 pt-16 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-center gap-12">
              <div className="text-center">
                <div className="text-4xl font-black text-white mb-2">10,000+</div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">Active Creators</div>
              </div>
              <div className="hidden md:block w-px h-12 bg-white/10"></div>
              <div className="text-center">
                <div className="text-4xl font-black text-white mb-2">2.5M+</div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">AI Generations</div>
              </div>
              <div className="hidden md:block w-px h-12 bg-white/10"></div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Icons.Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <div className="text-4xl font-black text-white">4.9</div>
                </div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">Average Rating</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
