import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';

interface TemplateItem {
  id: string;
  title: string;
  category: 'Y2K & Chrome' | 'High Fashion' | 'Streetwear' | '3D & Spatial';
  src: string;
  tag: string;
  aspect: string;
}

const TEMPLATE_COLLECTIONS: TemplateItem[] = [
  {
    id: 'chrome-baddie',
    title: 'Avant-Garde Chrome Editorial',
    category: 'Y2K & Chrome',
    src: '/images/downloads/art_chrome_baddie.jpg',
    tag: '3D Chrome Vector',
    aspect: 'aspect-[3/4]',
  },
  {
    id: 'nike-editorial',
    title: 'Kinetic Athletic Campaign',
    category: 'High Fashion',
    src: '/images/downloads/art_nike_editorial.jpg',
    tag: 'Editorial Print Ready',
    aspect: 'aspect-[3/4]',
  },
  {
    id: 'y2k-jennie',
    title: 'Holographic Cyber Pop',
    category: 'Y2K & Chrome',
    src: '/images/downloads/art_y2k_jennie.jpg',
    tag: 'Holographic Vector',
    aspect: 'aspect-[3/4]',
  },
  {
    id: 'neon-streetwear',
    title: 'Brutalist Tech Wear Poster',
    category: 'Streetwear',
    src: '/images/downloads/art_neon_streetwear.jpg',
    tag: 'Grid System',
    aspect: 'aspect-[3/4]',
  },
  {
    id: 'summer-kinetic',
    title: 'Spatial Wrapped 3D Type',
    category: '3D & Spatial',
    src: '/images/downloads/art_summer_kinetic.jpg',
    tag: '3D Depth Warp',
    aspect: 'aspect-[3/4]',
  },
  {
    id: 'danger-essence',
    title: 'Metallic Bandana Streetwear',
    category: 'Streetwear',
    src: '/images/downloads/art_danger_essence.jpg',
    tag: 'Typography Layout',
    aspect: 'aspect-[3/4]',
  },
  {
    id: 'sixseven-bubble',
    title: 'Inflatable Liquid Glass',
    category: '3D & Spatial',
    src: '/images/downloads/art_sixseven_bubble.jpg',
    tag: 'Glassmorphic 3D',
    aspect: 'aspect-[3/4]',
  },
  {
    id: 'idontcare-acid',
    title: 'Acid Pixel Rebellion',
    category: 'Streetwear',
    src: '/images/downloads/art_idontcare_acid.jpg',
    tag: 'Acid Graphics',
    aspect: 'aspect-[3/4]',
  },
];

const CATEGORIES = ['All', 'Y2K & Chrome', 'High Fashion', 'Streetwear', '3D & Spatial'] as const;

export const TemplateGallery: React.FC<{ onGetStarted?: () => void }> = ({ onGetStarted }) => {
  const [activeTab, setActiveTab] = useState<string>('All');

  const filtered = activeTab === 'All'
    ? TEMPLATE_COLLECTIONS
    : TEMPLATE_COLLECTIONS.filter((t) => t.category === activeTab);

  return (
    <section id="templates" className="py-36 relative bg-surface-dark-0 overflow-hidden">
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.06] pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-neutral-600/10 blur-[180px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white leading-[0.95]"
            >
              Studio-grade styles. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-300 to-neutral-500">
                Instantly customizable.
              </span>
            </motion.h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                aria-pressed={activeTab === cat}
                className={`px-4 py-2 rounded-full text-xs font-mono font-bold tracking-wide uppercase transition-all shrink-0 ${
                  activeTab === cat
                    ? 'bg-white text-black shadow-lg shadow-white/20'
                    : 'bg-white/[0.04] text-neutral-400 hover:text-white border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <motion.div layout id="templates-grid" data-testid="dashboard-templates-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {filtered.map((item, idx) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.45, delay: idx * 0.05 }}
                className="group relative rounded-[32px] overflow-hidden border border-white/10 hover:border-neutral-500/50 bg-[#0e0e16] shadow-2xl transition-all duration-700 cursor-pointer"
                onClick={onGetStarted}
              >
                {/* Artwork Preview */}
                <div className={`w-full ${item.aspect} overflow-hidden relative`}>
                  <img
                    src={item.src}
                    alt={item.title}
                    width="320"
                    height="426"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover filter brightness-[0.92] group-hover:brightness-105 group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                </div>

                {/* Top Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold uppercase tracking-widest text-white shadow-lg">
                    {item.tag}
                  </span>
                </div>

                {/* Bottom Interactive Layer */}
                <div className="absolute bottom-0 inset-x-0 p-6 z-10 flex items-end justify-between">
                  <div>
                    <h3 className="text-white font-black text-lg tracking-tight mb-1 group-hover:text-neutral-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-neutral-400 text-xs font-mono">
                      Fully Layered • Click to Clone
                    </p>
                  </div>

                  <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-45 transition-transform duration-300 shadow-xl shrink-0">
                    <Icons.ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Footer Call to Action */}
        <div className="mt-16 text-center">
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/25 text-white text-xs font-mono font-bold uppercase tracking-widest transition-all"
          >
            <span>Explore 500+ Editorial & Streetwear Presets</span>
            <Icons.ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
