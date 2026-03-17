import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const ScrollShowcase: React.FC = () => {
    const { scrollYProgress } = useScroll();

    // Mapping scroll progress to opacity and y-transforms for text blocks
    const opacity1 = useTransform(scrollYProgress, [0.3, 0.4, 0.5], [1, 1, 0.2]);
    const opacity2 = useTransform(scrollYProgress, [0.45, 0.55, 0.65], [0.2, 1, 0.2]);
    const opacity3 = useTransform(scrollYProgress, [0.6, 0.7, 0.8], [0.2, 1, 1]);

    const img1Opacity = useTransform(scrollYProgress, [0.3, 0.45, 0.5], [1, 1, 0]);
    const img2Opacity = useTransform(scrollYProgress, [0.45, 0.55, 0.65], [0, 1, 0]);
    const img3Opacity = useTransform(scrollYProgress, [0.6, 0.7, 0.8], [0, 1, 1]);

    return (
        <section className="relative h-[300vh] bg-[#050505] hidden lg:block">
            <div className="sticky top-0 h-screen overflow-hidden flex items-center">
                <div className="max-w-[1400px] mx-auto w-full px-6 flex justify-between items-center h-[80%]">

                    {/* Left side: Sticky Text that fades in and out based on scroll */}
                    <div className="w-5/12 relative h-full flex flex-col justify-center gap-12">

                        <motion.div style={{ opacity: opacity1 }} className="absolute inset-x-0 top-1/2 -translate-y-1/2">
                            <span className="text-purple-500 font-bold tracking-[0.2em] text-xs uppercase mb-4 block">1. Raw Power</span>
                            <h2 className="text-5xl xl:text-7xl font-black mb-6 tracking-tighter text-white">Pixel-Perfect<br />Control.</h2>
                            <p className="text-xl text-gray-400 font-medium">Unlike basic editors, we give you professional vector tools that never compromise your vision.</p>
                        </motion.div>

                        <motion.div style={{ opacity: opacity2 }} className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none">
                            <span className="text-blue-500 font-bold tracking-[0.2em] text-xs uppercase mb-4 block">2. AI Native</span>
                            <h2 className="text-5xl xl:text-7xl font-black mb-6 tracking-tighter text-white">Generate<br />Instantly.</h2>
                            <p className="text-xl text-gray-400 font-medium">Describe your ideas and watch them materialize into fully editable vectors and graphics in real-time.</p>
                        </motion.div>

                        <motion.div style={{ opacity: opacity3 }} className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none">
                            <span className="text-fuchsia-500 font-bold tracking-[0.2em] text-xs uppercase mb-4 block">3. Workflow</span>
                            <h2 className="text-5xl xl:text-7xl font-black mb-6 tracking-tighter text-white">Export<br />Anywhere.</h2>
                            <p className="text-xl text-gray-400 font-medium">Export to SVG, High-res PNG, or full PDF in one click. Web-hooks into your favorite CMS.</p>
                        </motion.div>

                    </div>

                    {/* Right side: Sticky Image container */}
                    <div className="w-6/12 h-[75%] rounded-[40px] border border-white/10 bg-[#0a0a0a] relative overflow-hidden shadow-2xl">
                        <motion.img
                            style={{ opacity: img1Opacity }}
                            src="/images/screenshot_editor_main.png"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
                            alt="Pro Editor"
                        />
                        <motion.img
                            style={{ opacity: img2Opacity }}
                            src="/images/screenshot_magic_panel.png"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 scale-110"
                            alt="AI Magic Tools"
                        />
                        <motion.img
                            style={{ opacity: img3Opacity }}
                            src="/images/screenshot_export_modal.png"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 scale-125"
                            alt="Premium Export"
                        />

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#050505]/50 to-transparent pointer-events-none" />
                    </div>

                </div>
            </div>
        </section>
    );
};
