import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';

export const ReplacementNarrative: React.FC = () => {
  const oldTools = [
    { name: 'Figma', purpose: 'Vector design', cost: '$15/mo' },
    { name: 'Canva', purpose: 'Templates', cost: '$13/mo' },
    { name: 'Midjourney', purpose: 'AI generation', cost: '$10/mo' },
    { name: 'Illustrator', purpose: 'Advanced vectors', cost: '$23/mo' },
    { name: 'Photoshop', purpose: 'Image editing', cost: '$23/mo' },
  ];

  return (
    <section className="py-24 relative bg-[#0a0a0c] border-y border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block mb-6"
          >
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20">
              <Icons.X className="w-3 h-3 text-red-400" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-red-400">
                Stop Paying For 5 Tools
              </span>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black mb-6 tracking-tighter text-white"
          >
            Replace your entire stack
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 font-medium max-w-2xl mx-auto"
          >
            Stop juggling subscriptions. One system for everything.
          </motion.p>
        </div>

        {/* Old Stack */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="text-sm font-black uppercase tracking-wider text-gray-500 mb-6">Old Way</div>
            {oldTools.map((tool, idx) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 opacity-60"
              >
                <div className="flex items-center gap-4">
                  <Icons.X className="w-5 h-5 text-red-400" />
                  <div>
                    <div className="text-white font-bold">{tool.name}</div>
                    <div className="text-sm text-gray-500">{tool.purpose}</div>
                  </div>
                </div>
                <div className="text-gray-400 font-bold">{tool.cost}</div>
              </motion.div>
            ))}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-gray-500 font-bold">Total per month</span>
              <span className="text-2xl font-black text-red-400 line-through">$84</span>
            </div>
          </motion.div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center">
            <Icons.ArrowRight className="w-16 h-16 text-purple-500" />
          </div>

          {/* New Way */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl rounded-3xl"></div>
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-purple-500/30">
              <div className="text-sm font-black uppercase tracking-wider text-purple-400 mb-6">New Way</div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <span className="text-white font-black text-2xl">K</span>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">Kreathief</div>
                  <div className="text-sm text-gray-400">Everything in one system</div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  'AI image generation',
                  'Professional vector tools',
                  'Real-time collaboration',
                  'Advanced typography',
                  'Background removal',
                  'Unlimited exports',
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-gray-300">
                    <Icons.Check className="w-4 h-4 text-green-400" />
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-gray-400 font-bold">Total per month</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 line-through">$84</span>
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    $16
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                <span className="text-green-400 font-black text-sm">Save $816/year</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <button className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-base hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105">
            Replace your stack now
          </button>
        </motion.div>
      </div>
    </section>
  );
};
