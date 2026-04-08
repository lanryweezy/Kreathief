import React from 'react';
import { motion } from 'framer-motion';
import { LaserSeparator, SuperLabel } from './LandingUtils';

export const ScrollShowcase: React.FC = () => {
  const showcases = [
    {
      subtitle: 'AI Vector Editing Software',
      title: 'Unrestricted Vector Editing.',
      desc: 'Unlike basic editors, we give you professional vector tools that never compromise your vision. Designed specifically for the modern freelance designer and marketing agency.',
      image: '/images/screenshot_editor_main.png',
      alt: 'Kreathief AI graphic design software vector editing interface demonstrating raw power',
    },
    {
      subtitle: 'Generative Fill Vector Engine',
      title: 'Prompt to SVG.',
      desc: 'Describe your ideas and watch them materialize into fully editable vectors and graphics in real-time. The ultimate AI creative engine.',
      image: '/images/new_magic_panel.png',
      alt: 'Generative AI design tool translating text prompts into editable SVG graphics',
    },
    {
      subtitle: 'Seamless Agency Workflow',
      title: 'Client-Ready Hand-offs.',
      desc: 'Export to SVG, High-res PNG, or full PDF in one click. Web-hooks into your favorite CMS. The premier Canva alternative for professionals.',
      image: '/images/new_export_modal.png',
      alt: 'High resolution export modal for professional AI design tools and client hand-offs',
    },
  ];

  return (
    <section className="py-32 bg-[#0a0a0c] relative border-y border-white/5 overflow-hidden">
      <LaserSeparator className="absolute top-0 inset-x-0" />

      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-0 w-[800px] h-[800px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none -z-10 translate-y-[-50%]"></div>

      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex flex-col gap-10 md:gap-32">
          {showcases.map((item, idx) => (
            <div
              key={item.subtitle}
              className={`flex flex-col lg:flex-row gap-16 min-h-[50vh] md:min-h-[80vh] py-16 ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
            >
              <div className="w-full lg:w-5/12 relative">
                <div className="lg:sticky lg:top-1/3">
                  <SuperLabel text={`${idx + 1}. ${item.subtitle}`} className="mb-4" />
                  <h2 className="text-5xl xl:text-7xl font-black mb-6 tracking-tighter text-white leading-[1.1] text-balance">
                    {item.title}
                  </h2>
                  <p className="text-xl text-gray-400 font-medium leading-relaxed text-balance">{item.desc}</p>
                </div>
              </div>

              <div className="w-full lg:w-7/12 flex items-center">
                <div className="relative w-full h-[400px] md:h-[700px] rounded-[40px] border border-white/5 bg-[#0a0a0c] glass-edge overflow-hidden group shadow-2xl">
                  <motion.img
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    src={item.image}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    alt={item.alt}
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a0c]/80 via-transparent to-transparent pointer-events-none opacity-60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
