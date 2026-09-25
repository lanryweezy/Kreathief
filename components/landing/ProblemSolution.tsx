import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';

export const ProblemSolution: React.FC = () => {
  return (
    <section className="py-36 relative bg-[#08080d] overflow-hidden">
      <div className="max-w-[1300px] mx-auto px-6 relative z-10">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-mono tracking-widest text-red-400 uppercase mb-4"
          >
            <span>✕</span>
            <span>The Fragmented Design Crisis</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white mb-6 leading-[0.92]"
          >
            Stop juggling 5 tools <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-orange-400">
              to make 1 high-end design.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto"
          >
            Exporting PNGs from Midjourney, vectorizing in Illustrator, laying out in Figma, and retouching in Photoshop is killing your creative momentum.
          </motion.p>
        </div>

        {/* Side by Side Contrast Arena */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* THE OLD WAY (CHAOS) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 sm:p-12 rounded-[36px] bg-[#110e12] border border-red-500/20 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-mono uppercase tracking-[0.25em] text-red-400 font-bold">
                  Legacy Stack // Disconnected
                </span>
                <span className="text-xs font-mono px-3 py-1 rounded-md bg-red-500/10 text-red-300 border border-red-500/20">
                  $108 / month
                </span>
              </div>

              <div className="space-y-4 mb-8">
                {[
                  { tool: 'Midjourney', pain: 'Generates flat bitmaps; zero text or layer editability' },
                  { tool: 'Figma', pain: 'No native neural generation; complex workarounds for AI art' },
                  { tool: 'Photoshop', pain: 'Heavy desktop install; destructive edits and version conflict' },
                  { tool: 'Illustrator', pain: 'Steep learning curve; no generative prompt iteration' },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3.5">
                    <span className="text-red-400 font-bold shrink-0 mt-0.5">✕</span>
                    <div>
                      <div className="text-white font-bold text-sm">{item.tool}</div>
                      <div className="text-neutral-400 text-xs">{item.pain}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-950/20 border border-red-900/30 text-center">
              <span className="text-red-300 font-mono text-xs">
                Result: 4 hours per asset • 12 version exports • Creative fatigue
              </span>
            </div>
          </motion.div>

          {/* THE KREATHIEF WAY (ELEGANCE) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 sm:p-12 rounded-[36px] bg-[#0e0e18] border-2 border-purple-500/60 shadow-[0_0_80px_rgba(168,85,247,0.15)] flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 blur-[100px] pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-mono uppercase tracking-[0.25em] text-purple-400 font-bold">
                  Kreathief Studio // Unified
                </span>
                <span className="text-xs font-mono px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  $0 Free Forever
                </span>
              </div>

              <div className="space-y-4 mb-8">
                {[
                  { feature: 'Prompt to Vector Canvas', benefit: 'Every AI generation yields editable shapes, text paths, and layers' },
                  { feature: 'Sub-Pixel Bézier Precision', benefit: 'Mathematical path editing alongside generative raster fill' },
                  { feature: 'Spatial 3D & Inpainting', benefit: 'Warp text along 3D curves and erase objects with neural inpainting' },
                  { feature: 'Universal Zero-Friction Export', benefit: 'One click export to SVG, 300 DPI CMYK PDF/X, or layered PSD' },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-purple-500/[0.04] border border-purple-500/20 flex items-start gap-3.5">
                    <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                    <div>
                      <div className="text-white font-bold text-sm">{item.feature}</div>
                      <div className="text-purple-200/70 text-xs">{item.benefit}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/50 text-center">
              <span className="text-purple-300 font-mono text-xs font-bold">
                Result: 30 seconds idea-to-design • Infinite non-destructive editing
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
