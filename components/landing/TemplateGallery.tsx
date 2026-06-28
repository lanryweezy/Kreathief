import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';

export const TemplateGallery: React.FC<{ onGetStarted?: () => void }> = ({ onGetStarted }) => {
  const templates = [
    // Original Templates
    { id: 1, src: '/images/template_thumb_1_1772615134954.png', style: 'md:col-span-1 md:row-span-2' },
    { id: 2, src: '/images/template_thumb_2_1772615154321.png', style: 'md:col-span-1 md:row-span-1' },
    { id: 3, src: '/images/template_thumb_3_1772615229047.png', style: 'md:col-span-1 md:row-span-1' },
    { id: 4, src: '/images/template_thumb_4_1772615492900.png', style: 'md:col-span-1 md:row-span-2' },
    { id: 5, src: '/images/template_thumb_5_1772615512770.png', style: 'md:col-span-2 md:row-span-1' },
    { id: 6, src: '/images/template_thumb_6_1772615671327.png', style: 'md:col-span-1 md:row-span-1' },

    // New Templates
    { id: 7, src: '/images/template_cyberpunk.png', style: 'md:col-span-1 md:row-span-2' },
    { id: 8, src: '/images/template_minimalist.png', style: 'md:col-span-1 md:row-span-1' },
    { id: 9, src: '/images/template_abstract.png', style: 'md:col-span-1 md:row-span-1' },
    { id: 10, src: '/images/template_retro.png', style: 'md:col-span-1 md:row-span-2' },
    { id: 11, src: '/images/template_fashion.png', style: 'md:col-span-2 md:row-span-1' },
    { id: 12, src: '/images/template_hitech.png', style: 'md:col-span-1 md:row-span-1' },
    { id: 13, src: '/images/template_cute.png', style: 'md:col-span-1 md:row-span-1' },

    // Requested by User
    { id: 14, src: '/images/template_business.png', style: 'md:col-span-1 md:row-span-2' },
    { id: 15, src: '/images/template_church.png', style: 'md:col-span-1 md:row-span-1' },
    { id: 16, src: '/images/template_club.png', style: 'md:col-span-2 md:row-span-1' },
  ];

  return (
    <section id="templates" className="py-32 relative bg-[#0a0a0c] overflow-hidden z-0">
      {/* Ambient Background Grid */}
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.2] [mask-image:radial-gradient(ellipse_at_top_right,white,transparent_75%)] pointer-events-none -z-10"></div>

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
          <div className="max-w-2xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-white"
            >
              Start from <br />
              <span className="text-purple-400">Inspiration.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-400 font-medium"
            >
              Browse 100,000+ premium templates designed by world-class creators. Fully editable, absolutely stunning.
            </motion.p>
          </div>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            onClick={onGetStarted}
            className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold tracking-[0.2em] text-[11px] uppercase hover:bg-white/10 transition-colors flex items-center gap-3"
          >
            Explore Library
            <Icons.ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>

        <div id="templates-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-[250px] gap-6">
          {templates.map((tpl, idx) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className={`rounded-[32px] overflow-hidden relative group cursor-pointer border border-white/5 glass-edge ${tpl.style}`}
            >
              <div className={`w-full h-full ${idx % 3 === 0 ? 'animate-float-slow' : ''}`}>
                <img
                  src={tpl.src}
                  alt={`Template ${tpl.id}`}
                  className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>

              <div className="absolute bottom-6 left-6 right-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 flex justify-between items-center">
                <div>
                  <p className="text-white font-black text-lg">Pro Template</p>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Fully Editable</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  <Icons.Plus className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
