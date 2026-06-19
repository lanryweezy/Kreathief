import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';

export const FeatureComparison: React.FC = () => {
  const features = [
    { name: 'AI Image Generation', kreathief: true, figma: false, canva: true, photoshop: false },
    { name: 'Vector Editing', kreathief: true, figma: true, canva: false, photoshop: false },
    { name: 'Real-time Collaboration', kreathief: true, figma: true, canva: true, photoshop: false },
    { name: 'Background Removal', kreathief: true, figma: false, canva: true, photoshop: true },
    { name: 'Custom Fonts', kreathief: true, figma: true, canva: false, photoshop: true },
    { name: 'SVG Export', kreathief: true, figma: true, canva: false, photoshop: false },
    { name: 'Browser-based', kreathief: true, figma: true, canva: true, photoshop: false },
    { name: 'Offline Mode', kreathief: false, figma: false, canva: false, photoshop: true },
    { name: 'Free Plan', kreathief: true, figma: true, canva: true, photoshop: false },
  ];

  return (
    <section className="py-32 relative bg-[#0a0a0c] overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.05] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block mb-6"
          >
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
              <Icons.Check className="w-3 h-3 text-green-400" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-green-400">Feature Comparison</span>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black mb-6 tracking-tighter text-white"
          >
            See how we stack up
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 font-medium max-w-2xl mx-auto"
          >
            Compare Kreathief with other popular design tools
          </motion.p>
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-x-auto"
        >
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-6 px-6 text-sm font-black uppercase tracking-wider text-gray-500">
                  Feature
                </th>
                <th className="py-6 px-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                      <span className="text-white font-black text-xs">K</span>
                    </div>
                    <span className="text-sm font-black text-white">Kreathief</span>
                  </div>
                </th>
                <th className="py-6 px-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
                      <span className="text-gray-400 font-black text-xs">F</span>
                    </div>
                    <span className="text-sm font-bold text-gray-500">Figma</span>
                  </div>
                </th>
                <th className="py-6 px-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
                      <span className="text-gray-400 font-black text-xs">C</span>
                    </div>
                    <span className="text-sm font-bold text-gray-500">Canva</span>
                  </div>
                </th>
                <th className="py-6 px-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
                      <span className="text-gray-400 font-black text-xs">P</span>
                    </div>
                    <span className="text-sm font-bold text-gray-500">Photoshop</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, idx) => (
                <motion.tr
                  key={feature.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-5 px-6 text-sm font-medium text-gray-300">{feature.name}</td>
                  <td className="py-5 px-6 text-center">
                    {feature.kreathief ? (
                      <div className="inline-flex w-6 h-6 rounded-full bg-purple-500/20 items-center justify-center">
                        <Icons.Check className="w-4 h-4 text-purple-400" />
                      </div>
                    ) : (
                      <div className="inline-flex w-6 h-6 rounded-full bg-gray-800 items-center justify-center">
                        <Icons.X className="w-3 h-3 text-gray-600" />
                      </div>
                    )}
                  </td>
                  <td className="py-5 px-6 text-center">
                    {feature.figma ? (
                      <div className="inline-flex w-6 h-6 rounded-full bg-gray-700 items-center justify-center">
                        <Icons.Check className="w-4 h-4 text-gray-400" />
                      </div>
                    ) : (
                      <div className="inline-flex w-6 h-6 rounded-full bg-gray-800 items-center justify-center">
                        <Icons.X className="w-3 h-3 text-gray-600" />
                      </div>
                    )}
                  </td>
                  <td className="py-5 px-6 text-center">
                    {feature.canva ? (
                      <div className="inline-flex w-6 h-6 rounded-full bg-gray-700 items-center justify-center">
                        <Icons.Check className="w-4 h-4 text-gray-400" />
                      </div>
                    ) : (
                      <div className="inline-flex w-6 h-6 rounded-full bg-gray-800 items-center justify-center">
                        <Icons.X className="w-3 h-3 text-gray-600" />
                      </div>
                    )}
                  </td>
                  <td className="py-5 px-6 text-center">
                    {feature.photoshop ? (
                      <div className="inline-flex w-6 h-6 rounded-full bg-gray-700 items-center justify-center">
                        <Icons.Check className="w-4 h-4 text-gray-400" />
                      </div>
                    ) : (
                      <div className="inline-flex w-6 h-6 rounded-full bg-gray-800 items-center justify-center">
                        <Icons.X className="w-3 h-3 text-gray-600" />
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-sm text-gray-500">Data accurate as of 2026. Feature availability may vary by plan.</p>
        </motion.div>
      </div>
    </section>
  );
};
