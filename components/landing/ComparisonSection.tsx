import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';

export const ComparisonSection: React.FC = () => {
  return (
    <section className="py-32 relative bg-[#0a0a0c] overflow-hidden flex flex-col justify-center min-h-screen">
      {/* Background Image and Effects */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[#0a0a0c]/50 z-10" />
        <img
          src="/images/comparison_rings_bg.png"
          alt="Space rings alternative"
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen z-0 grayscale-[30%]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0a0a0c]/80 to-[#0a0a0c] z-20" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent z-30" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent z-30" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-30">
        <div className="text-center mb-24">



          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black mb-6 tracking-tighter text-white"
          >
            One tool. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
              Not five subscriptions.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 font-medium max-w-2xl mx-auto"
          >
            Stop juggling Figma, Photoshop, Midjourney, and three other tools. Everything you need in one place.
          </motion.p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-10">
          {/* The Old Way */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 w-full bg-[#0a0a0c] border border-red-900/30 rounded-3xl p-10 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500"
          >
            <h3 className="text-2xl font-black text-gray-500 mb-8 tracking-widest uppercase text-center line-through">
              Traditional Workflow
            </h3>
            <div className="space-y-6">
              {[
                'Juggling Figma, Photoshop, & AI',
                'Clunky, fragmented workflows',
                'Hidden fees for SVG exports',
                'Paying for 5 different subscriptions',
                'No real-time collaboration',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 text-gray-400 font-medium">
                  <Icons.X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-10 border-t border-red-900/20 text-center">
              <div className="text-sm text-gray-500 mb-2 uppercase tracking-wider">Total Cost</div>
              <span className="text-5xl font-black text-gray-300 line-through">$360</span>
              <span className="text-gray-500 ml-2">/ year</span>
              <p className="text-xs text-gray-600 mt-3">Figma + Adobe + Midjourney + Storage</p>
            </div>
          </motion.div>

          {/* Kreathief Way */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex-1 w-full bg-gradient-to-b from-[#111111] to-[#0a0a0c] border border-white/10 rounded-3xl p-10 relative overflow-hidden transform scale-105 z-10 hover:border-white/20 transition-all duration-500"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>

            <div className="absolute -top-4 -right-4 bg-purple-500 text-white text-[10px] font-black tracking-widest uppercase py-1 px-8 rotate-45 shadow-lg">
              Winner
            </div>

            <h3 className="text-3xl font-black text-white mb-8 tracking-tighter text-center">Kreathief</h3>
            <div className="space-y-6">
              {[
                'One AI-native vector workspace',
                'Instant WebGL rendering',
                'Free SVG & PDF exports',
                'All-in-one professional ecosystem',
                'Multiplayer built-in natively',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 text-white font-medium">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Icons.Check className="w-4 h-4 text-purple-400" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-10 border-t border-purple-500/20 text-center">
              <div className="text-sm text-purple-400 mb-2 uppercase tracking-wider font-black">All-In-One Price</div>
              <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                $192
              </span>
              <span className="text-gray-400 ml-2 font-medium">/ year</span>
              <p className="text-xs text-gray-500 mt-3">Everything included. No hidden fees.</p>
              <div className="mt-4 inline-block px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                <span className="text-green-400 font-black text-sm">Save $168/year</span>
              </div>
            </div>

            <button className="w-full mt-8 py-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-gray-200 transition-all">
              Claim Your Free Account
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
