import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import { MouseSpotlight, SuperLabel, LaserSeparator } from './LandingUtils';

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-32 relative">
      <LaserSeparator className="absolute top-0 inset-x-0" />

      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-32 text-center flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>

          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-6xl md:text-8xl font-black mb-6 tracking-tighter text-white text-balance leading-[0.95]"
          >
            Everything you need <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 to-neutral-500">
              to create masterpieces.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-neutral-400 max-w-3xl mx-auto font-medium leading-relaxed text-balance"
          >
            Combining the creative freedom of AI with the structural power of professional design software.
            Uncompromising speed and precision in the browser.
          </motion.p>
        </div>

        {/* Ambient Grid Pattern */}
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.15] [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)] pointer-events-none -z-20 mt-32"></div>

        {/* Atmospheric Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[80vw] max-w-[1000px] h-[800px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* AI FEATURES CATEGORY */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-purple-400">AI</h3>
          </div>
          <h4 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-4">
            Think bigger, create faster
          </h4>
          <p className="text-lg text-neutral-400 max-w-2xl font-medium">
            Leverage the best AI models to generate and refine images, then continue designing with your creations in one seamless workspace.
          </p>
        </motion.div>

        {/* AI BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[400px] mb-32">
          {/* BENTO 1: Vector Engine (Large 8 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="col-span-1 md:col-span-8 rounded-[40px] bg-[#0a0a0c] glass-edge border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all duration-700"
          >
            <MouseSpotlight color="rgba(168, 85, 247, 0.1)" className="h-full flex flex-col">
              <div className="p-12 relative z-10">
                <h3 className="text-3xl font-black mb-3 tracking-tight text-white flex items-center gap-3">
                  Image generation
                </h3>
                <p className="text-neutral-400 font-medium text-base max-w-xl">
                  Your project deserves better visuals. Generate images that perfectly fit your campaign, or edit existing images to match your guidelines. Create designs with them on an infinite canvas.
                </p>
              </div>

              <div className="flex-1 w-full relative mt-auto px-6 pb-6">
                <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 relative">
                  <img
                    src="/images/feature_gen_fill_pro.png"
                    alt="AI Image Generation"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                </div>
              </div>
            </MouseSpotlight>
          </motion.div>

          {/* BENTO 2: AI Generative Fill (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: 0.1 }}
            className="col-span-1 md:col-span-4 rounded-[40px] bg-[#0a0a0c] glass-edge border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all duration-700 flex flex-col"
          >
            <MouseSpotlight color="rgba(168, 85, 247, 0.1)" className="h-full flex flex-col">
              <div className="p-12 relative z-10">
                <h3 className="text-2xl font-black mb-3 tracking-tight text-white flex items-center gap-3">
                  Remove background
                </h3>
                <p className="text-neutral-400 font-medium text-sm">
                  Instantly remove backgrounds from your images with professional-grade precision.
                </p>
              </div>

              <div className="flex-1 w-full relative mt-auto px-6 pb-6">
                <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 relative">
                  <img
                    src="/images/feature_cutout_mockup_1772615585150.png"
                    alt="Background Removal"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                </div>
              </div>
            </MouseSpotlight>
          </motion.div>

          {/* BENTO 3: Upscale (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="col-span-1 md:col-span-4 rounded-[40px] bg-[#0a0a0c] glass-edge border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all duration-700"
          >
            <MouseSpotlight color="rgba(251, 113, 133, 0.1)" className="h-full">
              <div className="p-12 relative z-10 h-full flex flex-col">
                <h3 className="text-2xl font-black mb-3 tracking-tight text-white">Upscale</h3>
                <p className="text-neutral-400 font-medium text-sm mb-6">
                  Make the resolution of your images sharper and bigger with AI enhancement.
                </p>
              </div>
            </MouseSpotlight>
          </motion.div>

          {/* BENTO 4: Generative Fill (8 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: 0.1 }}
            className="col-span-1 md:col-span-8 rounded-[40px] bg-[#0a0a0c] glass-edge border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all duration-700"
          >
            <MouseSpotlight color="rgba(168, 85, 247, 0.1)" radius={600} className="h-full">
              <div className="p-16 relative z-10 w-full md:w-1/2 flex flex-col h-full justify-center">
                <h3 className="text-3xl font-black mb-4 tracking-tight text-white">Generative Fill</h3>
                <p className="text-neutral-400 font-medium leading-relaxed mb-6">
                  Describe what you want and watch AI seamlessly blend new elements into your existing compositions. Perfect for extending images or replacing objects.
                </p>
              </div>

              <div className="absolute top-1/2 -translate-y-1/2 -right-5 w-[75%] md:w-[50%] h-[70%] rounded-2xl overflow-hidden border border-white/10 relative transition-transform duration-700 group-hover:-translate-x-4 group-hover:scale-105">
                <img
                  src="/images/feature_gen_fill_pro.png"
                  alt="Generative Fill"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-10 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 flex items-center px-4">
                  <span className="text-[10px] text-white/70 font-mono typing-animation">
                    add glowing cyberpunk city...
                  </span>
                </div>
              </div>
            </MouseSpotlight>
          </motion.div>
        </div>

        {/* DESIGN TOOLS CATEGORY */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400">Design Tools</h3>
          </div>
          <h4 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-4">
            Professional design power
          </h4>
          <p className="text-lg text-neutral-400 max-w-2xl font-medium">
            A powerful infinite canvas for creation and ideation, giving you complete control with your brand assets and styles always at hand.
          </p>
        </motion.div>

        {/* DESIGN TOOLS BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[400px] mb-32">
          {/* Vector Engine */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="col-span-1 md:col-span-8 rounded-[40px] bg-[#0a0a0c] glass-edge border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all duration-700"
          >
            <MouseSpotlight color="rgba(34, 211, 238, 0.1)" radius={500} className="h-full">
              <div className="p-16 relative z-10 w-full md:w-1/2">
                <h3 className="text-3xl font-black mb-4 tracking-tight text-white">Vector and raster together</h3>
                <p className="text-neutral-400 font-medium leading-relaxed">
                  Create and edit vector and raster content on a single, powerful infinite canvas focused on the essential tools for professional design and editing.
                </p>
              </div>

              <img
                src="/images/feature_vector_pro.png"
                alt="Vector Tool"
                className="absolute -bottom-10 -right-10 w-[80%] md:w-[65%] h-auto rounded-tl-3xl shadow-2xl transition-transform duration-700 group-hover:scale-105 group-hover:-translate-x-4 group-hover:-translate-y-4"
              />
            </MouseSpotlight>
          </motion.div>

          {/* BENTO 5: Infinite Resources (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="col-span-1 md:col-span-4 rounded-[40px] bg-[#0a0a0c] glass-edge border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all duration-700"
          >
            <MouseSpotlight color="rgba(34, 211, 238, 0.1)" className="h-full">
              <div className="p-12 relative z-10">
                <h3 className="text-xl font-black mb-2 text-white">Advanced typography</h3>
                <p className="text-neutral-400 text-sm font-medium">
                  Upload custom fonts, add text on paths or turn text layers into editable vectors.
                </p>
              </div>
            </MouseSpotlight>
          </motion.div>

          {/* BENTO 6: Professional CMYK (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: 0.1 }}
            className="col-span-1 md:col-span-4 rounded-[40px] bg-[#0a0a0c] glass-edge border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all duration-700"
          >
            <MouseSpotlight color="rgba(236, 72, 153, 0.1)" className="h-full">
              <div className="p-12 relative z-10">
                <h3 className="text-xl font-black mb-2 text-white">Brand guideline creation</h3>
                <p className="text-neutral-400 text-sm font-medium">
                  Bring all your brand assets into one place. Store and organize media and styles to easily adopt your branded content.
                </p>
              </div>
            </MouseSpotlight>
          </motion.div>

          {/* Collaboration */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: 0.1 }}
            className="col-span-1 md:col-span-8 rounded-[40px] bg-[#0a0a0c] glass-edge border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all duration-700"
          >
            <MouseSpotlight color="rgba(34, 197, 94, 0.1)" radius={600} className="h-full">
              <div className="p-16 relative z-10 w-full md:w-1/2 flex flex-col h-full justify-center">
                <h3 className="text-3xl font-black mb-4 tracking-tight text-white">Real-Time Multiplayer</h3>
                <p className="text-neutral-400 font-medium leading-relaxed mb-6">
                  Invite your team, share cursor presence, and edit the same document simultaneously without conflicts.
                  Never send a &quot;vFinal_final.psd&quot; again.
                </p>
              </div>

              <img
                src="/images/feature_collab_pro.png"
                alt="Multiplayer Collaboration"
                className="absolute top-1/2 -translate-y-1/2 -right-5 w-[75%] md:w-[60%] h-auto shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/10 rounded-2xl transition-transform duration-700 group-hover:-translate-x-4 group-hover:scale-105"
              />
            </MouseSpotlight>
          </motion.div>
        </div>

        {/* RESOURCES CATEGORY */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 mt-32"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-orange-400">Resources</h3>
          </div>
          <h4 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-4">
            Everything at your fingertips
          </h4>
          <p className="text-lg text-neutral-400 max-w-2xl font-medium">
            Access millions of professional assets and resources directly in your workspace.
          </p>
        </motion.div>

        {/* RESOURCES BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px]">
          {/* BENTO: Infinite Resources (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="col-span-1 md:col-span-4 rounded-[40px] bg-[#0a0a0c] glass-edge border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all duration-700"
          >
            <MouseSpotlight color="rgba(34, 211, 238, 0.1)" className="h-full">
              <div className="p-12 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 border border-white/10">
                  <Icons.Grid className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-black mb-2 text-white">11M+ Assets</h3>
                <p className="text-neutral-400 text-sm font-medium">
                  Access professional 3D icons, Lottie animations, and 1,500+ Google Fonts directly in-editor.
                </p>
              </div>
              <div className="absolute -bottom-4 left-0 w-full h-1/2 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </MouseSpotlight>
          </motion.div>

          {/* BENTO: Professional CMYK (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: 0.1 }}
            className="col-span-1 md:col-span-4 rounded-[40px] bg-[#0a0a0c] glass-edge border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all duration-700"
          >
            <MouseSpotlight color="rgba(236, 72, 153, 0.1)" className="h-full">
              <div className="p-12 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 border border-white/10">
                  <Icons.Filter className="w-6 h-6 text-pink-500" />
                </div>
                <h3 className="text-xl font-black mb-2 text-white">Print-Ready CMYK</h3>
                <p className="text-neutral-400 text-sm font-medium">
                  Professional color space support with live CMYK readouts for perfect physical production.
                </p>
              </div>
              <div className="absolute -bottom-4 left-0 w-full h-1/2 bg-gradient-to-t from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </MouseSpotlight>
          </motion.div>

          {/* BENTO 7: ABR Brush Import (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: 0.2 }}
            className="col-span-1 md:col-span-4 rounded-[40px] bg-[#0a0a0c] glass-edge border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all duration-700"
          >
            <MouseSpotlight color="rgba(249, 115, 22, 0.1)" className="h-full">
              <div className="p-12 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 border border-white/10">
                  <Icons.Brush className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-black mb-2 text-white">ABR Brush Import</h3>
                <p className="text-neutral-400 text-sm font-medium">
                  Import your favorite Photoshop .abr libraries and create with your custom artistic tools.
                </p>
              </div>
              <div className="absolute -bottom-4 left-0 w-full h-1/2 bg-gradient-to-t from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </MouseSpotlight>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
