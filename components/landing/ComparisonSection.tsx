import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';

export const ComparisonSection: React.FC = () => {
    return (
        <section className="py-32 relative bg-[#050505]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-24">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-black mb-6 tracking-tighter text-white"
                    >
                        Enough with the <br />
                        <span className="text-red-500">Subscription Trap.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-gray-400 font-medium max-w-2xl mx-auto"
                    >
                        Other tools lock you into expensive monthly fees just to access basic features. We believe in empowering creators, not taxing them.
                    </motion.p>
                </div>

                <div className="flex flex-col lg:flex-row items-center justify-center gap-10">

                    {/* The Old Way */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex-1 w-full bg-[#0a0a0a] border border-red-900/30 rounded-3xl p-10 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500"
                    >
                        <h3 className="text-2xl font-black text-gray-500 mb-8 tracking-widest uppercase text-center">The Other Guys</h3>
                        <div className="space-y-6">
                            {[
                                "Pay $30/month for basic AI",
                                "Clunky, slow web performance",
                                "Hidden fees for exports",
                                "Requires 5 different tools",
                                "No real-time collaboration"
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 text-gray-400 font-medium">
                                    <Icons.X className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-10 pt-10 border-t border-red-900/20 text-center">
                            <span className="text-4xl font-black text-gray-300">$360</span>
                            <span className="text-gray-500 ml-2">/ year</span>
                        </div>
                    </motion.div>

                    {/* Kreathief Way */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex-1 w-full bg-gradient-to-b from-[#111111] to-[#050505] border border-purple-500/30 rounded-3xl p-10 relative overflow-hidden shadow-[0_0_80px_rgba(168,85,247,0.15)] transform scale-105 z-10"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>

                        <div className="absolute -top-4 -right-4 bg-purple-500 text-white text-[10px] font-black tracking-widest uppercase py-1 px-8 rotate-45 shadow-lg">
                            Winner
                        </div>

                        <h3 className="text-3xl font-black text-white mb-8 tracking-tighter text-center">Kreathief</h3>
                        <div className="space-y-6">
                            {[
                                "Unlimited AI Generation",
                                "Instant WebGL performance",
                                "Free high-res exports",
                                "All-in-one Editor ecosystem",
                                "Multiplayer built-in natively"
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 text-white font-medium">
                                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                        <Icons.Check className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-10 pt-10 border-t border-purple-500/20 text-center">
                            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">Free</span>
                            <span className="text-gray-400 ml-2 font-medium">to get started</span>
                        </div>

                        <button className="w-full mt-8 py-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-gray-200 transition-all shadow-xl shadow-white/10">
                            Claim Your Free Account
                        </button>
                    </motion.div>

                </div>


            </div>
        </section>
    );
};
