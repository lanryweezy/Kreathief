import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';

export const Features: React.FC = () => {
    return (
        <section id="features" className="py-32 relative light-section">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>

            <div className="max-w-[1400px] mx-auto px-6">
                <div className="mb-20 text-center flex flex-col items-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-7xl font-black mb-8 tracking-tighter text-black"
                    >
                        Everything you need <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">to create masterpieces.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-600 max-w-3xl mx-auto font-medium leading-relaxed"
                    >
                        Combining the creative freedom of AI with the structural power of professional design software. Uncompromising speed and precision in the browser.
                    </motion.p>
                </div>

                {/* MASSIVE BENTO GRID */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[400px]">

                    {/* BENTO 1: Vector Engine (Large 8 cols) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        className="col-span-1 md:col-span-8 rounded-[40px] bg-white border border-black/5 relative overflow-hidden group hover:shadow-2xl hover:shadow-black/10 transition-all duration-700"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="p-12 relative z-10 w-full md:w-1/2">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
                                <Icons.Pen className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-3xl font-black mb-4 tracking-tight text-black">Pro Vector Engine</h3>
                            <p className="text-gray-600 font-medium leading-relaxed">
                                Full control over bezier curves, anchor points, and boolean operations. Import SVGs or vectorize raster images instantly with pixel-perfect precision.
                            </p>
                        </div>

                        <img
                            src="/images/feature_vector_pro.png"
                            alt="Vector Tool"
                            className="absolute -bottom-10 -right-10 w-[80%] md:w-[65%] h-auto rounded-tl-3xl shadow-2xl transition-transform duration-700 group-hover:scale-105 group-hover:-translate-x-4 group-hover:-translate-y-4"
                        />
                    </motion.div>

                    {/* BENTO 2: AI Generative Fill (4 cols) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: 0.1 }}
                        className="col-span-1 md:col-span-4 rounded-[40px] bg-white border border-black/5 relative overflow-hidden group hover:shadow-2xl hover:shadow-black/10 transition-all duration-700 flex flex-col"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="p-12 relative z-10">
                            <h3 className="text-2xl font-black mb-3 tracking-tight text-black flex items-center gap-3">
                                <Icons.Magic className="w-6 h-6 text-purple-600" />
                                Generative Fill
                            </h3>
                            <p className="text-gray-600 font-medium text-sm">
                                Describe what you want and watch AI seamlessly blend new elements into your existing compositions.
                            </p>
                        </div>

                        <div className="flex-1 w-full relative mt-auto px-6 pb-6">
                            <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 relative">
                                <img
                                    src="/images/feature_gen_fill_pro.png"
                                    alt="Generative Fill"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                />
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-10 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 flex items-center px-4">
                                    <span className="text-[10px] text-white/70 font-mono typing-animation">add glowing cyberpunk city...</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* BENTO 3: 1-Click Cutout (4 cols) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        className="col-span-1 md:col-span-4 rounded-[40px] bg-white border border-black/5 relative overflow-hidden group hover:shadow-2xl hover:shadow-black/10 transition-all duration-700"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="p-12 relative z-10 h-full flex flex-col">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-400 to-purple-500 flex items-center justify-center mb-6 shadow-xl shadow-fuchsia-500/20">
                                <Icons.Scissors className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-black mb-3 tracking-tight text-black">AI Subject Isolation</h3>
                            <p className="text-gray-600 font-medium text-sm mb-6">
                                Professional-grade cutouts in a single click. Our neural engine perfectly handles complex edges like hair, fur, and glass.
                            </p>

                            <div className="relative mt-auto w-[120%] -ml-[10%] aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 group-hover:-translate-y-2 transition-transform duration-500">
                                <img
                                    src="/images/feature_cutout_mockup_1772615585150.png"
                                    alt="AI Background Removal"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* BENTO 4: Realtime Collaboration (8 cols) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: 0.1 }}
                        className="col-span-1 md:col-span-8 rounded-[40px] bg-white border border-black/5 relative overflow-hidden group hover:shadow-2xl hover:shadow-black/10 transition-all duration-700"
                    >
                        <div className="absolute inset-0 bg-gradient-to-bl from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="p-12 relative z-10 w-full md:w-1/2 flex flex-col h-full justify-center">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-6 shadow-xl shadow-green-500/20">
                                <Icons.Users className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-3xl font-black mb-4 tracking-tight text-black">Real-Time Multiplayer</h3>
                            <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                Invite your team, share cursor presence, and edit the same document simultaneously without conflicts. Never send a &quot;vFinal_final.psd&quot; again.
                            </p>
                        </div>

                        <img
                            src="/images/feature_collab_pro.png"
                            alt="Multiplayer Collaboration"
                            className="absolute top-1/2 -translate-y-1/2 -right-5 w-[75%] md:w-[60%] h-auto shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/10 rounded-2xl transition-transform duration-700 group-hover:-translate-x-4 group-hover:scale-105"
                        />
                    </motion.div>

                    {/* BENTO 5: Mockup Studio (4 cols) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        className="col-span-1 md:col-span-4 rounded-[40px] bg-white border border-black/5 relative overflow-hidden group hover:shadow-2xl hover:shadow-black/10 transition-all duration-700"
                    >
                        <div className="p-10 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 border border-orange-500/20">
                                <Icons.Mockup className="w-6 h-6 text-orange-600" />
                            </div>
                            <h3 className="text-xl font-black mb-2 text-black">Pro Mockup Studio</h3>
                            <p className="text-gray-600 text-xs font-medium">High-resolution 4K exports with interactive surface depth and reflections.</p>
                        </div>
                        <img
                            src="/images/feature_mockup_pro.png"
                            className="absolute -bottom-4 left-0 w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700 shadow-2xl"
                            alt="Mockup Studio"
                        />
                    </motion.div>

                    {/* BENTO 6: Brand Kits (4 cols) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        className="col-span-1 md:col-span-4 rounded-[40px] bg-white border border-black/5 relative overflow-hidden group hover:shadow-2xl hover:shadow-black/10 transition-all duration-700"
                    >
                        <div className="p-10 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
                                <Icons.Brand className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-black mb-2 text-black">Smart Brand Kits</h3>
                            <p className="text-gray-600 text-xs font-medium">Keep your identity consistent across every asset.</p>
                        </div>
                        <img
                            src="/images/landing_feature_brand_kit.png"
                            className="absolute -bottom-4 right-0 w-[90%] h-auto rounded-tl-2xl border-l border-t border-white/10 group-hover:-translate-x-2 transition-transform duration-500"
                            alt="Brand Kits"
                        />
                    </motion.div>

                    {/* BENTO 7: AI Suggestions (4 cols) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        className="col-span-1 md:col-span-4 rounded-[40px] bg-white border border-black/5 relative overflow-hidden group hover:shadow-2xl hover:shadow-black/10 transition-all duration-700"
                    >
                        <div className="p-10 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20">
                                <Icons.Zap className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-black mb-2 text-black">AI Copilot</h3>
                            <p className="text-gray-600 text-xs font-medium">Intelligent layout and content suggestions as you work.</p>
                        </div>
                        <img
                            src="/images/landing_feature_suggestions.png"
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[85%] h-auto rounded-t-2xl shadow-2xl"
                            alt="AI Suggestions"
                        />
                    </motion.div>

                </div>
            </div>
        </section>
    );
};
