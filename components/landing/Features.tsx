import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';

export const Features: React.FC = () => {
    const mainFeatures = [
        {
            title: "AI Subject Isolation",
            description: "Adobe-grade cutouts in a single click. Our neural engine understands depth, lighting, and complex edges like hair and fur.",
            icon: Icons.Scissors,
            color: "from-purple-500 to-indigo-600",
            image: "/screenshots/cutout.png"
        },
        {
            title: "Pro Vector Engine",
            description: "Full control over bezier curves and node points. Import SVGs or vectorize raster images instantly with AI precision.",
            icon: Icons.Pen,
            color: "from-blue-500 to-cyan-600",
            image: "/screenshots/editor.webp"
        },
        {
            title: "Secure & Scalable",
            description: "Built for enterprise-grade performance. Your designs are encrypted and synced across all your devices in real-time.",
            icon: Icons.Shield,
            color: "from-pink-500 to-rose-600",
            image: "/screenshots/auth.png"
        }
    ];

    return (
        <section id="features" className="py-32 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-24 text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-black mb-6 tracking-tight"
                    >
                        Everything you need <br />
                        <span className="text-purple-500">to create masterpieces.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-400 max-w-2xl mx-auto font-medium"
                    >
                        Combining the creative freedom of AI with the structural power of professional design software.
                    </motion.p>
                </div>

                <div className="space-y-32">
                    {mainFeatures.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-16`}
                        >
                            <div className="flex-1">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-8 shadow-2xl shadow-purple-500/20`}>
                                    <feature.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-3xl md:text-4xl font-black mb-6 tracking-tight">{feature.title}</h3>
                                <p className="text-lg text-gray-400 mb-8 leading-relaxed font-medium">
                                    {feature.description}
                                </p>
                                <button className="flex items-center gap-2 text-white font-bold tracking-widest uppercase text-xs group">
                                    Learn More
                                    <Icons.ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    <span className="h-px w-0 bg-white transition-all group-hover:w-full ml-1" />
                                </button>
                            </div>
                            <div className="flex-1 w-full relative">
                                <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-white/5 bg-white/5 shadow-2xl group transition-transform duration-700 hover:scale-[1.02]">
                                    <img
                                        src={feature.image}
                                        alt={feature.title}
                                        className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
