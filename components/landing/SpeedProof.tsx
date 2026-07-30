import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';

export const SpeedProof: React.FC = () => {
  return (
    <section className="py-32 relative bg-gradient-to-b from-[#0a0a0c] to-[#050505] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.05] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block mb-6"
          >
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              <Icons.Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-black uppercase tracking-[0.2em] text-yellow-400">Speed Proof</span>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-8xl font-black mb-6 tracking-tighter text-white"
          >
            10x faster. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              Literally.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 font-medium max-w-2xl mx-auto"
          >
            Same design. Different timeline. See the difference.
          </motion.p>
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Figma */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center">
                  <span className="text-gray-400 font-black">F</span>
                </div>
                <div>
                  <div className="text-white font-bold">Figma</div>
                  <div className="text-sm text-gray-500">Traditional workflow</div>
                </div>
              </div>
              <div className="text-4xl font-black text-red-400">12 min</div>
            </div>

            <div className="space-y-3">
              {[
                { step: 'Open Figma', time: '30s' },
                { step: 'Create artboard', time: '20s' },
                { step: 'Add shapes manually', time: '3m' },
                { step: 'Adjust typography', time: '2m' },
                { step: 'Fine-tune spacing', time: '2m' },
                { step: 'Add effects', time: '1m 30s' },
                { step: 'Export settings', time: '40s' },
                { step: 'Generate assets', time: '2m' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{item.step}</span>
                  <span className="text-gray-500 font-mono">{item.time}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Kreathief */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 relative overflow-hidden"
          >
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <span className="text-white font-black">K</span>
                </div>
                <div>
                  <div className="text-white font-bold">Kreathief</div>
                  <div className="text-sm text-purple-400">AI-powered workflow</div>
                </div>
              </div>
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                30s
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              {[
                { step: 'Describe what you want', time: '10s' },
                { step: 'AI generates design', time: '5s' },
                { step: 'Refine with vector tools', time: '10s' },
                { step: 'Export instantly', time: '5s' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icons.Zap className="w-3 h-3 text-yellow-400" />
                    <span className="text-gray-200 font-medium">{item.step}</span>
                  </div>
                  <span className="text-purple-400 font-mono font-bold">{item.time}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 relative z-10">
              <div className="flex items-center justify-center gap-2 text-green-400 font-black">
                <Icons.TrendingUp className="w-5 h-5" />
                <span>10x faster than traditional tools</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
        >
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-4xl font-black text-white mb-2">10x</div>
            <div className="text-sm text-gray-500 uppercase tracking-wider">Faster Creation</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-4xl font-black text-white mb-2">73%</div>
            <div className="text-sm text-gray-500 uppercase tracking-wider">Time Saved</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-4xl font-black text-white mb-2">850K+</div>
            <div className="text-sm text-gray-500 uppercase tracking-wider">Designs Created</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
