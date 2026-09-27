import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

const models = [
  { name: 'Black Forest Labs', image: '/images/poster_flux_1790408621681.jpg', tag: 'Ultra-Res Typography' },
  { name: 'Google', image: '/images/mockup_google_1790408643182.jpg', tag: 'Photorealistic Mockups' },
  { name: 'Recraft', image: '/images/vector_recraft_1790408632581.jpg', tag: 'Pure SVG Vectors' },
  { name: 'Luma', image: '/images/3d_luma_1790408654195.jpg', tag: '3D Asset Generation' },
  { name: 'OpenAI', image: '/images/hero_slide_3.webp', tag: 'Concept Illustration' },
  { name: 'Runway', image: '/images/hero_slide_6.webp', tag: 'Avant-Garde VFX' },
  { name: 'Kling', image: '/images/hero_slide_2.webp', tag: 'Kinetic Motion' },
  { name: 'Bytedance', image: '/images/hero_slide_4.webp', tag: 'Studio Photography' },
];

const ModelItem = ({ name, tag, index, setActiveIndex }: { name: string, tag: string, index: number, setActiveIndex: (idx: number) => void }) => {
  const ref = useRef(null);
  // Extremely tight margin so only the item exactly in the middle is active
  const isInView = useInView(ref, { margin: "-49% 0px -49% 0px" });

  useEffect(() => {
    if (isInView) {
      setActiveIndex(index);
    }
  }, [isInView, index, setActiveIndex]);

  return (
    <div ref={ref} className="py-8 flex flex-col justify-center">
      <h3
        className={`text-4xl md:text-7xl font-black tracking-tighter transition-all duration-700 cursor-default ${
          isInView ? 'text-white translate-x-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]' : 'text-neutral-700 hover:text-neutral-500'
        }`}
      >
        {name}
      </h3>
      <div className={`transition-all duration-700 font-mono text-sm tracking-[0.3em] uppercase mt-2 ${
        isInView ? 'text-[#e6ff00] translate-x-4 opacity-100' : 'text-neutral-700 opacity-0'
      }`}>
        {tag}
      </div>
    </div>
  );
};

export const ModelIntegration: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="relative bg-[#08080d] w-full" style={{ height: `${models.length * 20 + 90}vh` }}>
      {/* Sticky Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        
        {/* Background Images with Crossfade */}
        {models.map((model, idx) => (
          <motion.div
            key={model.name}
            className="absolute inset-0 w-full h-full"
            initial={false}
            animate={{ opacity: activeIndex === idx ? 1 : 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <img
              src={model.image}
              alt={model.name}
              width="1920"
              height="1080"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover filter brightness-[0.85] contrast-[1.05]"
            />
            {/* Added a very subtle gradient just so the left panel isn't completely lost on white images, but mostly clear */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#08080d]/40 to-transparent w-1/2" />
          </motion.div>
        ))}

        {/* Left Fixed Content */}
        <div className="absolute inset-0 z-10 max-w-[1400px] mx-auto px-6 flex items-center">
          <div className="w-full md:w-1/2 pt-20">
            <div className="bg-black/30 backdrop-blur-2xl border border-white/10 p-12 rounded-3xl max-w-xl shadow-2xl">
              <h2 className="text-5xl md:text-7xl lg:text-[80px] font-black tracking-tighter leading-[0.95] text-white mb-6 drop-shadow-xl">
                Use all AI<br />
                models,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e6ff00] to-emerald-400">together</span> at<br />
                last.
              </h2>
              <p className="text-neutral-200 text-lg md:text-xl leading-relaxed font-normal">
                Seamlessly combine different models in a single node-based workspace. Generate typography with Flux, scale vectors with Recraft, and compose lighting with Bytedance—all on one limitless canvas.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Right Scrolling List */}
      <div className="absolute top-0 right-0 w-full md:w-1/2 h-full z-20 pointer-events-none">
        <div className="max-w-md mx-auto pl-6 pr-6 md:pr-12 pointer-events-auto" style={{ paddingTop: '45vh', paddingBottom: '45vh' }}>
          {models.map((model, idx) => (
            <div key={model.name} style={{ height: '20vh' }} className="flex items-center">
              <ModelItem name={model.name} tag={model.tag} index={idx} setActiveIndex={setActiveIndex} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
