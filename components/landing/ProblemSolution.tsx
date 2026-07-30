import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Icons } from '../../constants';

const problems = [
  { icon: Icons.Brush, tool: 'Canva', issue: 'No vector editing, no layers, no precision' },
  { icon: Icons.Edit, tool: 'Figma', issue: 'No AI generation, no image editing, no export variety' },
  { icon: Icons.Bot, tool: 'Midjourney', issue: 'No editing after generation, no text control, no layout' },
  { icon: Icons.Layout, tool: 'Illustrator', issue: 'Desktop-only, expensive, no AI, no collaboration' },
];

const solutions = [
  { icon: Icons.Magic, label: 'AI Generation', desc: 'Generate any design from text' },
  { icon: Icons.Edit, label: 'Vector Editing', desc: 'Professional path tools in-browser' },
  { icon: Icons.Layers, label: 'Layers & Masks', desc: 'Full layer system with masking' },
  { icon: Icons.Download, label: 'Any Format', desc: 'PNG, SVG, PDF, PSD export' },
];

export const ProblemSolution: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0.3, 0.5], [0, 1]);

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c] via-[#0d0d12] to-[#0a0a0c]" />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        {/* THE PROBLEM */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-20"
        >
          <div className="inline-block mb-6">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-red-400 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">
              The Problem
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
            You're using 5 tools
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
              to do 1 job.
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Switching between apps kills your flow. Every context switch costs time, money, and creativity.
          </p>
        </motion.div>

        {/* Problem Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-32">
          {problems.map((p, i) => (
            <motion.div
              key={p.tool}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface-dark-1 border border-white/5 rounded-xl p-5 text-center group hover:border-red-500/30 transition-all"
            >
              <div className="flex justify-center mb-3">
                <p.icon className="w-8 h-8 text-white/50 group-hover:text-red-400 transition-colors" />
              </div>
              <div className="text-sm font-bold text-white mb-1">{p.tool}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{p.issue}</div>
            </motion.div>
          ))}
        </div>

        {/* THE SOLUTION */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-16"
        >
          <div className="inline-block mb-6">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-green-400 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
              The Solution
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
            One tool.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Everything.
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Kreathief combines AI generation, vector editing, layer management, and export into one seamless experience.
          </p>
        </motion.div>

        {/* Solution Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {solutions.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface-dark-1 border border-white/5 rounded-xl p-5 text-center group hover:border-purple-500/30 transition-all hover:bg-purple-500/5"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                <s.icon className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-white mb-1">{s.label}</div>
              <div className="text-xs text-gray-500">{s.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Before/After Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Before */}
          <div className="bg-surface-dark-1 border border-red-500/20 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <Icons.X className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-sm font-black text-red-400 uppercase tracking-wider">Before</span>
            </div>
            <div className="space-y-3">
              {[
                'Open Canva for quick graphics',
                'Switch to Figma for UI design',
                'Use Midjourney for AI images',
                'Export from 3 different tools',
                'Pay for 5 subscriptions',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="text-2xl font-black text-red-400">$84/mo</div>
              <div className="text-xs text-gray-500">5 subscriptions</div>
            </div>
          </div>

          {/* After */}
          <div className="bg-surface-dark-1 border border-green-500/20 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Icons.Check className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-sm font-black text-green-400 uppercase tracking-wider">After</span>
            </div>
            <div className="space-y-3">
              {[
                'Open Kreathief',
                'AI generates your design',
                'Edit with vector tools',
                'Export any format',
                'One tool, one price',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="text-2xl font-black text-green-400">$0/mo</div>
              <div className="text-xs text-gray-500">Free forever plan</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
