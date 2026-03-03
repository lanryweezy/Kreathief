import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';

interface HeroProps {
    onGetStarted: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
    return (
        <section className="relative pt-32 pb-20 overflow-hidden min-h-[90vh] flex items-center justify-center">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.4, scale: 1 }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                    className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-purple-900/10 rounded-full blur-[120px]"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.3, scale: 1 }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse', delay: 1 }}
                    className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-900/10 rounded-full blur-[120px]"
                />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-pointer group"
                >
                    <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
                    <span className="text-xs font-semibold text-gray-300 tracking-wide uppercase">New: Adobe-Grade Cut Out Tool</span>
                    <Icons.ArrowRight className="w-3 h-3 text-gray-500 group-hover:translate-x-1 transition-transform" />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-6xl md:text-8xl lg:text-[120px] font-black tracking-tighter mb-8 leading-[0.85] text-white"
                >
                    Design at the <br />
                    <span className="text-purple-500">Speed of AI.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
                >
                    Powerful generative AI meets professional vector precision. Create high-conversion graphics in seconds, not hours.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
                >
                    <button
                        onClick={onGetStarted}
                        className="w-full sm:w-auto px-10 py-5 bg-white text-black rounded-full font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-all transform hover:scale-110 active:scale-95 shadow-2xl shadow-white/20 flex items-center justify-center gap-2 group"
                    >
                        Start Creating Free
                        <Icons.ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="w-full sm:w-auto px-10 py-5 bg-white/5 text-white rounded-full font-black uppercase tracking-widest text-sm hover:bg-white/10 border border-white/10 transition-all backdrop-blur-md flex items-center justify-center gap-2 group">
                        <Icons.Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Watch Demo
                    </button>
                </motion.div>

                {/* Hero Visual Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40, rotateX: 10 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full max-w-6xl mx-auto aspect-[16/9] rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-[0_50px_100px_-20px_rgba(125,42,232,0.3)] overflow-hidden group perspective-2000"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10" />

                    {/* Real App Screenshot */}
                    <img
                        src="/screenshots/dashboard.png"
                        alt="Kreathief Dashboard"
                        className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000 transform group-hover:scale-[1.02]"
                    />

                    {/* Floating Overlay Elements */}
                    <div className="absolute inset-0 pointer-events-none p-4">
                        <div className="absolute left-10 top-20 w-48 h-12 bg-white/10 rounded-xl border border-white/20 backdrop-blur-xl flex items-center px-4 gap-3 animate-float shadow-2xl">
                            <div className="w-6 h-6 rounded-full bg-purple-500 animate-pulse" />
                            <div className="text-[10px] font-black tracking-widest uppercase">Live Editing</div>
                        </div>
                        <div className="absolute right-10 bottom-24 w-56 h-14 bg-white/10 rounded-xl border border-white/20 backdrop-blur-xl flex items-center px-4 gap-3 animate-float shadow-2xl" style={{ animationDelay: '1s' }}>
                            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                                <Icons.Magic className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-[10px] font-black tracking-widest uppercase">AI Synthesis Active</div>
                        </div>
                    </div>

                    {/* Bottom Fade */}
                    <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#050505] to-transparent" />
                </motion.div>
            </div>
        </section>
    );
};
