import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';

export interface AIModelShowcase {
  id: string;
  name: string;
  provider: string;
  tag: string;
  description: string;
  image: string;
  accentColor: string;
  prompt: string;
}

const MODELS: AIModelShowcase[] = [
  {
    id: 'flux',
    name: 'Black Forest Labs',
    provider: 'Flux.1 Pro / Schnell',
    tag: 'Ultra-Res Typography',
    description: 'Crisp typographic rendering, exact letterforms, and high-contrast editorial poster layouts.',
    image: '/images/showcase_flux_typography.webp',
    accentColor: '#f97316',
    prompt: 'Modernist Swiss graphic design poster, bold crisp typography reading KREATHIEF STUDIO',
  },
  {
    id: 'google',
    name: 'Google',
    provider: 'Imagen 3 / Nano Banana',
    tag: 'Photorealistic Mockups',
    description: 'Sub-millimeter material lighting, reflections, luxury packaging, and studio product setups.',
    image: '/images/showcase_google_mockup.webp',
    accentColor: '#3b82f6',
    prompt: 'Photorealistic luxury matte black cosmetic bottle on wet slate stone, water droplets, cinematic studio rim lighting',
  },
  {
    id: 'recraft',
    name: 'Recraft',
    provider: 'Recraft V3 Vector',
    tag: 'Pure SVG Vectors',
    description: 'Infinite resolution scalable vector geometry, clean anchor points, and icon designs.',
    image: '/images/showcase_recraft_vector.webp',
    accentColor: '#10b981',
    prompt: 'Clean precise vector illustration of a cybernetic falcon in flight, sharp geometric paths, neon cyan and violet gradients',
  },
  {
    id: 'luma',
    name: 'Luma',
    provider: 'Photon / Ray 2',
    tag: '3D Asset Generation',
    description: 'Volumetric depth, complex caustics, subsurface refraction, and spatial lighting geometry.',
    image: '/images/showcase_luma_3d.webp',
    accentColor: '#a855f7',
    prompt: 'Futuristic iridescent glass 3D sculpture floating in dark space, holographic caustics, subsurface scattering',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    provider: 'DALL-E 3 / GPT-4o',
    tag: 'Concept Illustration',
    description: 'Nuanced semantic prompt comprehension, storyboarding, and imaginative surrealist vistas.',
    image: '/images/showcase_openai_concept.webp',
    accentColor: '#06b6d4',
    prompt: 'Epic surreal concept art of a colossal glowing monolith in a misty desert valley under starry nebula sky',
  },
  {
    id: 'runway',
    name: 'Runway',
    provider: 'Gen-3 Alpha',
    tag: 'Avant-Garde VFX',
    description: 'Temporal continuity, liquid chrome simulation, and high-fashion visual effects passes.',
    image: '/images/showcase_runway_vfx.webp',
    accentColor: '#ec4899',
    prompt: 'High fashion avant-garde visual effects, chrome liquid ribbons swirling around silhouette, dramatic volumetric lighting',
  },
  {
    id: 'kling',
    name: 'Kling',
    provider: 'Kling 1.5 HD',
    tag: 'Kinetic Motion',
    description: 'Physical dynamics, particle bursts, cinematic motion blur, and explosive energy choreography.',
    image: '/images/showcase_kling_motion.webp',
    accentColor: '#eab308',
    prompt: 'Kinetic explosion of glowing neon gold and crimson energy particles, high speed motion blur trails',
  },
  {
    id: 'bytedance',
    name: 'ByteDance',
    provider: 'Seedream 4.5',
    tag: 'Studio Photography',
    description: 'Editorial portraiture, natural skin pores, high-end fashion styling, and balanced keylights.',
    image: '/images/showcase_bytedance_studio.webp',
    accentColor: '#6366f1',
    prompt: 'Vogue editorial studio fashion portrait, avant-garde sculptural metallic coat, dramatic chiaroscuro high-fashion lighting',
  },
];

export const ModelIntegration: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Bind scroll progress directly to the section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    // Map 0 -> 1 progress to activeIndex (0 to MODELS.length - 1)
    const clamped = Math.min(Math.max(latest, 0), 0.999);
    const index = Math.floor(clamped * MODELS.length);
    setActiveIndex(index);
  });

  const activeModel = MODELS[activeIndex];

  return (
    <section
      ref={containerRef}
      className="relative bg-[#08080d] w-full"
      style={{ height: `${MODELS.length * 50 + 100}vh` }}
    >
      {/* Sticky Fullscreen Viewport Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center">
        
        {/* Background Showcase Images (Crossfade Transition) */}
        {MODELS.map((model, idx) => (
          <motion.div
            key={model.id}
            className="absolute inset-0 w-full h-full pointer-events-none"
            initial={false}
            animate={{
              opacity: activeIndex === idx ? 1 : 0,
              scale: activeIndex === idx ? 1 : 1.05,
            }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src={model.image}
              alt={`${model.name} — ${model.tag}`}
              width="1920"
              height="1080"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.08]"
            />
            {/* Dark Studio Vignette & Edge Shadows */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#08080d]/95 via-[#08080d]/70 to-[#08080d]/85" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#08080d] via-transparent to-[#08080d]/60" />
          </motion.div>
        ))}

        {/* Content Container (Split Grid) */}
        <div className="relative z-10 max-w-[1400px] w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full py-12">
          
          {/* LEFT SIDE: Stays completely still */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-8 sm:p-12 rounded-3xl max-w-xl shadow-2xl">
              {/* Fixed Headline */}
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-[0.98] text-white mb-6">
                Use all AI<br />
                models,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e6ff00] to-emerald-400">
                  together
                </span> at<br />
                last.
              </h2>

              <p className="text-neutral-300 text-base sm:text-lg leading-relaxed font-normal mb-8">
                Seamlessly combine different models in a single node-based workspace. Generate typography with Flux, scale vectors with Recraft, and compose lighting with ByteDance—all on one limitless canvas.
              </p>

              {/* Dynamic Active Model Card */}
              <div className="pt-6 border-t border-white/10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                    Model Specialization
                  </span>
                </div>
                
                <div className="text-white font-bold text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#e6ff00]" />
                  <span>{activeModel.name}</span>
                  <span className="text-xs font-mono text-neutral-400 font-normal">({activeModel.provider})</span>
                </div>

                <p className="text-xs text-neutral-300 italic font-mono bg-white/[0.03] border border-white/5 p-3 rounded-xl mt-1 line-clamp-2">
                  &ldquo;{activeModel.prompt}&rdquo;
                </p>
              </div>

            </div>
          </div>

          {/* RIGHT SIDE: Model list in fixed view; active model is full size, others are small */}
          <div className="lg:col-span-6 flex flex-col justify-center items-start lg:pl-12">
            <div className="flex flex-col gap-2 w-full">
              {MODELS.map((model, idx) => {
                const isActive = activeIndex === idx;
                return (
                  <button
                    key={model.id}
                    onClick={() => setActiveIndex(idx)}
                    className="text-left w-full group transition-all duration-300 py-1 flex flex-col justify-center focus:outline-none"
                  >
                    <div className="flex items-baseline gap-3">
                      {/* Active glowing indicator */}
                      <span
                        className={`transition-all duration-300 rounded-full shrink-0 ${
                          isActive
                            ? 'w-2.5 h-2.5 bg-[#e6ff00] shadow-[0_0_12px_#e6ff00]'
                            : 'w-1.5 h-1.5 bg-transparent'
                        }`}
                      />

                      {/* Model Name */}
                      <h3
                        className={`transition-all duration-300 font-black tracking-tight ${
                          isActive
                            ? 'text-3xl sm:text-5xl lg:text-6xl text-white translate-x-1'
                            : 'text-lg sm:text-2xl text-neutral-500 group-hover:text-neutral-300'
                        }`}
                      >
                        {model.name}
                      </h3>
                    </div>

                    {/* Active Tag & Sub-detail */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -4 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -4 }}
                          transition={{ duration: 0.25 }}
                          className="pl-5 overflow-hidden"
                        >
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs font-mono font-bold tracking-[0.25em] uppercase text-[#e6ff00]">
                              {model.tag}
                            </span>
                            <span className="text-[11px] font-mono text-neutral-400">
                              / {model.description}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </div>

            {/* Scroll Progress Bar Indicator */}
            <div className="mt-8 flex items-center gap-2 pl-5">
              {MODELS.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  onClick={() => setActiveIndex(dotIdx)}
                  aria-label={`Jump to model ${dotIdx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeIndex === dotIdx
                      ? 'w-8 bg-[#e6ff00] shadow-[0_0_8px_#e6ff00]'
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
