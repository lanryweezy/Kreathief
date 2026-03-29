import React from 'react';
import { motion } from 'framer-motion';

export const ScrollShowcase: React.FC = () => {
  const showcases = [
    {
      subtitle: '1. AI Vector Editing Software',
      subtitleColor: 'text-purple-500',
      title: 'Unrestricted Vector Editing.',
      desc: 'Unlike basic editors, we give you professional vector tools that never compromise your vision. Designed specifically for the modern freelance designer and marketing agency.',
      image: '/images/screenshot_editor_main.png',
      alt: 'Kreathief AI graphic design software vector editing interface demonstrating raw power',
    },
    {
      subtitle: '2. Generative Fill Vector Engine',
      subtitleColor: 'text-blue-500',
      title: 'Prompt to SVG.',
      desc: 'Describe your ideas and watch them materialize into fully editable vectors and graphics in real-time. The ultimate AI creative engine.',
      image: '/images/new_magic_panel.png',
      alt: 'Generative AI design tool translating text prompts into editable SVG graphics',
    },
    {
      subtitle: '3. Seamless Agency Workflow',
      subtitleColor: 'text-fuchsia-500',
      title: 'Client-Ready Hand-offs.',
      desc: 'Export to SVG, High-res PNG, or full PDF in one click. Web-hooks into your favorite CMS. The premier Canva alternative for professionals.',
      image: '/images/new_export_modal.png',
      alt: 'High resolution export modal for professional AI design tools and client hand-offs',
    },
  ];

  return (
    <section className="py-32 bg-[#0a0a0c] relative border-y border-white/5 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-0 w-[800px] h-[800px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none -z-10 translate-y-[-50%]"></div>

      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex flex-col gap-10 md:gap-32">
          {showcases.map((item, idx) => (
            <div
              key={idx}
              className={`flex flex-col lg:flex-row gap-16 min-h-[50vh] md:min-h-[80vh] py-16 ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
            >
              <div className="w-full lg:w-5/12 relative">
                <div className="lg:sticky lg:top-1/3">
                  <h3 className={`${item.subtitleColor} font-bold tracking-[0.2em] text-xs uppercase mb-4 block`}>
                    {item.subtitle}
                  </h3>
                  <h2 className="text-5xl xl:text-7xl font-black mb-6 tracking-tighter text-white leading-[1.1]">
                    {item.title}
                  </h2>
                  <p className="text-xl text-gray-400 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </div>

              <div className="w-full lg:w-7/12 flex items-center">
                <div className="relative w-full h-[400px] md:h-[700px] rounded-[40px] border border-white/5 bg-[#0a0a0c] glass-edge overflow-hidden group shadow-2xl">
                  <motion.img
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    src={item.image}
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
