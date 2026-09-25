import React from 'react';
import { motion } from 'framer-motion';

const TESTIMONIALS_ROW_1 = [
  {
    quote: "Kreathief completely retired our 5-tool design stack. From prompt generation to vector curves and team review, everything happens in seconds.",
    author: "Sarah Chen",
    role: "Head of Product Design",
    company: "Stripe",
    avatar: "/images/avatar_1_1772614969136.png",
  },
  {
    quote: "The vector engine handles 100k nodes without lagging a millisecond. We threw complex architectural diagrams at it and it never blinked.",
    author: "Marcus Rodriguez",
    role: "VP Creative",
    company: "R/GA",
    avatar: "/images/avatar_2_1772614992003.png",
  },
  {
    quote: "I thought browser-based creative suites couldn't touch native apps. Kreathief proved me delightfully wrong. It's actually twice as fast.",
    author: "Emily Watson",
    role: "Lead Brand Identity",
    company: "Airbnb",
    avatar: "/images/avatar_3_1772615019487.png",
  },
  {
    quote: "The generative fill inpainting preserves shadows and ambient light better than any dedicated generative tool I've tested.",
    author: "James Park",
    role: "Design Director",
    company: "Shopify",
    avatar: "/images/avatar_4_1772615076735.png",
  },
];

const TESTIMONIALS_ROW_2 = [
  {
    quote: "As a solo creative director, having multi-model synthesis and vector editing in one place makes me feel like a 20-person agency.",
    author: "Priya Nair",
    role: "Independent Art Director",
    company: "Studio Noir",
    avatar: "/images/avatar_5_1772615099721.png",
  },
  {
    quote: "We switched our entire 40-designer branding department from Photoshop + Figma over to Kreathief. We shipped our rebranding 3 weeks early.",
    author: "Tom Okafor",
    role: "Design Systems Lead",
    company: "Meta",
    avatar: "/images/avatar_6_1772615117433.png",
  },
  {
    quote: "CMYK proofing right in the browser saved us from 3 expensive print mistakes already. The color management is pristine.",
    author: "Helena Lindqvist",
    role: "Print & Packaging Architect",
    company: "Acne Studios",
    avatar: "/images/avatar_1_1772614969136.png",
  },
  {
    quote: "Multiplayer with zero sync lag. Our client presentations happen directly inside the active artboard now.",
    author: "Alex Vane",
    role: "Creative Partner",
    company: "Pentagram Alumni",
    avatar: "/images/avatar_2_1772614992003.png",
  },
];

export const Testimonials: React.FC = () => {
  return (
    <section className="py-36 relative bg-[#08080d] overflow-hidden">
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.08] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-purple-600/10 blur-[180px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center mb-20">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono tracking-widest text-purple-300 uppercase mb-6"
        >
          <span>♥</span>
          <span>Verified Creative Feedback</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white mb-6"
        >
          Loved by innovators <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">
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

      <div className="relative w-full space-y-6 select-none" style={{ maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)' }}>
        <div className="flex gap-6 animate-marquee-row hover:[animation-play-state:paused]">
          {[...TESTIMONIALS_ROW_1, ...TESTIMONIALS_ROW_1].map((item, idx) => (
            <div
              key={idx}
              className="w-[380px] sm:w-[440px] shrink-0 p-8 rounded-[30px] bg-[#0e0e16] border border-white/10 hover:border-purple-500/40 transition-all duration-500 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">★</span>
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
                  className="w-11 h-11 rounded-full object-cover border border-white/20"
                />
                <div className="text-left">
                  <div className="text-white font-bold text-sm tracking-tight">{item.author}</div>
                  <div className="text-neutral-400 text-xs font-mono">
                    {item.role} • <span className="text-purple-300 font-semibold">{item.company}</span>
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
              className="w-[380px] sm:w-[440px] shrink-0 p-8 rounded-[30px] bg-[#0e0e16] border border-white/10 hover:border-pink-500/40 transition-all duration-500 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">★</span>
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
                  className="w-11 h-11 rounded-full object-cover border border-white/20"
                />
                <div className="text-left">
                  <div className="text-white font-bold text-sm tracking-tight">{item.author}</div>
                  <div className="text-neutral-400 text-xs font-mono">
                    {item.role} • <span className="text-pink-300 font-semibold">{item.company}</span>
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
