import React from 'react';
import { motion } from 'framer-motion';

const TESTIMONIALS_ROW_1 = [
  {
    quote:
      'Kreathief consolidated our entire concept-to-vector workflow. Going from prompt exploration to editable Bezier curves and print-ready layouts happens in one tab.',
    author: 'Elena Rostova',
    role: 'Principal Brand Designer',
    company: 'Atelier North',
    avatar: '/images/avatar_1_1772614969136.webp',
  },
  {
    quote:
      'The vector engine handles dense multi-artboard packaging layouts without frame drops. Having live CMYK and SVG inspection directly in the browser is a game changer.',
    author: 'Marcus Vance',
    role: 'Creative Director',
    company: 'Vance & Co. Studio',
    avatar: '/images/avatar_2_1772614992003.webp',
  },
  {
    quote:
      'Most browser design tools treat typography as an afterthought. Kreathief gives us real kerning, path text, and brand kit locks right alongside generative fill.',
    author: 'Claire Sterling',
    role: 'Lead Identity Designer',
    company: 'Form & Signal',
    avatar: '/images/avatar_3_1772615019487.webp',
  },
];

const TESTIMONIALS_ROW_2 = [
  {
    quote:
      'Inpainting and background isolation preserve edge lighting accurately enough for commercial product key visuals without round-tripping to desktop raster editors.',
    author: 'David Kwon',
    role: 'Founder & Art Director',
    company: 'Kwon Visual Lab',
    avatar: '/images/avatar_4_1772615076735.webp',
  },
  {
    quote:
      'As an independent creative director, having multi-model synthesis, smart mockups, and precision layer controls in one workspace lets me deliver agency-grade pitches solo.',
    author: 'Priya Nair',
    role: 'Independent Art Director',
    company: 'Studio Noir',
    avatar: '/images/avatar_5_1772615099721.webp',
  },
  {
    quote:
      'Our design systems team uses the node graph and batch export pipelines to generate localized campaign assets across six aspect ratios in minutes instead of days.',
    author: 'Tunde Okafor',
    role: 'Design Systems Architect',
    company: 'Apex Digital Collective',
    avatar: '/images/avatar_6_1772615117433.webp',
  },
];

export const Testimonials: React.FC = () => {
  return (
    <section className="py-36 relative bg-surface-dark-0 overflow-hidden">
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.08] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-neutral-600/10 blur-[180px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center mb-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white mb-6"
        >
          Loved by innovators <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-300 to-neutral-500">
            across the globe.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg sm:text-xl text-neutral-400 font-normal max-w-2xl mx-auto"
        >
          Over 10,000 product designers, agency partners, and visionaries ship groundbreaking work daily on Kreathief.
        </motion.p>
      </div>

      <div
        className="relative w-full space-y-6 select-none"
        style={{ maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)' }}
      >
        <div className="flex gap-6 animate-marquee-row hover:[animation-play-state:paused]">
          {[...TESTIMONIALS_ROW_1, ...TESTIMONIALS_ROW_1].map((item, idx) => (
            <div
              key={idx}
              className="w-[380px] sm:w-[440px] shrink-0 p-8 rounded-[30px] bg-[#0e0e16] border border-white/10 hover:border-neutral-500/40 transition-all duration-500 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-neutral-300 font-normal leading-relaxed text-sm sm:text-base italic mb-6">
                  "{item.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <img
                  src={item.avatar}
                  alt={item.author}
                  width="44"
                  height="44"
                  loading="lazy"
                  decoding="async"
                  className="w-11 h-11 rounded-full object-cover border border-white/20"
                />
                <div className="text-left">
                  <div className="text-white font-bold text-sm tracking-tight">{item.author}</div>
                  <div className="text-neutral-400 text-xs font-mono">
                    {item.role} • <span className="text-neutral-300 font-semibold">{item.company}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-6 animate-marquee-reverse-row hover:[animation-play-state:paused]">
          {[...TESTIMONIALS_ROW_2, ...TESTIMONIALS_ROW_2].map((item, idx) => (
            <div
              key={idx}
              className="w-[380px] sm:w-[440px] shrink-0 p-8 rounded-[30px] bg-[#0e0e16] border border-white/10 hover:border-neutral-500/40 transition-all duration-500 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-neutral-300 font-normal leading-relaxed text-sm sm:text-base italic mb-6">
                  "{item.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <img
                  src={item.avatar}
                  alt={item.author}
                  width="44"
                  height="44"
                  loading="lazy"
                  decoding="async"
                  className="w-11 h-11 rounded-full object-cover border border-white/20"
                />
                <div className="text-left">
                  <div className="text-white font-bold text-sm tracking-tight">{item.author}</div>
                  <div className="text-neutral-400 text-xs font-mono">
                    {item.role} • <span className="text-neutral-300 font-semibold">{item.company}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
