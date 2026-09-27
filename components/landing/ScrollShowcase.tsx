import React from 'react';
import { motion } from 'framer-motion';

const ART_ROW_1 = [
  { src: '/images/downloads/art_chrome_baddie.jpg', label: 'Avant-Garde Chrome' },
  { src: '/images/downloads/art_nike_editorial.jpg', label: 'Commercial Kinetic' },
  { src: '/images/downloads/art_y2k_jennie.jpg', label: 'Cyberpunk Y2K' },
  { src: '/images/downloads/art_summer_kinetic.jpg', label: '3D Spatial Type' },
  { src: '/images/downloads/art_kitty_disco.jpg', label: 'Bubblegum Liquid' },
  { src: '/images/downloads/art_neon_streetwear.jpg', label: 'Technical Brutalism' },
];

const ART_ROW_2 = [
  { src: '/images/downloads/art_danger_essence.jpg', label: 'Streetwear Chrome' },
  { src: '/images/downloads/art_idontcare_acid.jpg', label: 'Acid Pixel Graphics' },
  { src: '/images/downloads/art_sixseven_bubble.jpg', label: 'Inflatable Glass' },
  { src: '/images/downloads/art_cyber_rave.jpg', label: 'Cyber Rave 3D' },
  { src: '/images/downloads/art_chameleon_risograph.jpg', label: 'Risograph Stipple' },
  { src: '/images/downloads/art_kpop_kood.jpg', label: 'Holographic Pop' },
];

export const ScrollShowcase: React.FC = () => {
  return (
    <section className="py-28 relative bg-[#08080d] overflow-hidden border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6 text-center mb-16 relative z-10">

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white mb-4"
        >
          Synthesized entirely in Kreathief.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-base sm:text-lg text-neutral-400 font-normal max-w-xl mx-auto"
        >
          From chrome 3D lettering and acid graphics to commercial campaign spreads.
        </motion.p>
      </div>

      {/* Infinite Scrolling Galleries */}
      <div className="space-y-6 select-none" style={{ maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)' }}>
        {/* Row 1 */}
        <div className="flex gap-6 animate-marquee-row hover:[animation-play-state:paused]">
          {[...ART_ROW_1, ...ART_ROW_1, ...ART_ROW_1].map((item, i) => (
            <div
              key={i}
              className="w-72 sm:w-80 h-96 sm:h-[420px] rounded-[28px] overflow-hidden border border-white/10 shrink-0 relative group shadow-2xl bg-[#0e0e16]"
            >
              <img
                src={item.src}
                alt={item.label}
                width="320"
                height="420"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-5">
                <div>
                  <span className="text-white text-sm font-black tracking-tight block">{item.label}</span>
                  <span className="text-purple-400 text-xs font-mono">#MadeWithKreathief</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex gap-6 animate-marquee-reverse-row hover:[animation-play-state:paused]">
          {[...ART_ROW_2, ...ART_ROW_2, ...ART_ROW_2].map((item, i) => (
            <div
              key={i}
              className="w-72 sm:w-80 h-96 sm:h-[420px] rounded-[28px] overflow-hidden border border-white/10 shrink-0 relative group shadow-2xl bg-[#0e0e16]"
            >
              <img
                src={item.src}
                alt={item.label}
                width="320"
                height="420"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-5">
                <div>
                  <span className="text-white text-sm font-black tracking-tight block">{item.label}</span>
                  <span className="text-pink-400 text-xs font-mono">#NeuralVectorStudio</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
