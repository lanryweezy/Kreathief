import React from 'react';
import { motion } from 'framer-motion';

export const ScrollShowcase: React.FC = () => {
    const showcases = [
        {
            subtitle: "1. Raw Power",
            subtitleColor: "text-purple-500",
            title: "Pixel-Perfect Control.",
            desc: "Unlike basic editors, we give you professional vector tools that never compromise your vision.",
            image: "/images/screenshot_editor_main.png"
        },
        {
            subtitle: "2. AI Native",
            subtitleColor: "text-blue-500",
            title: "Generate Instantly.",
            desc: "Describe your ideas and watch them materialize into fully editable vectors and graphics in real-time.",
            image: "/images/new_magic_panel.png" 
        },
        {
            subtitle: "3. Workflow",
            subtitleColor: "text-fuchsia-500",
            title: "Export Anywhere.",
            desc: "Export to SVG, High-res PNG, or full PDF in one click. Web-hooks into your favorite CMS.",
            image: "/images/new_export_modal.png" 
        }
    ];

    return (
        <section className="py-32 bg-[#050505] relative border-y border-white/5">
            <div className="max-w-[1400px] mx-auto px-6">
                
                <div className="flex flex-col gap-32">
                    {showcases.map((item, idx) => (
                        <div key={idx} className={`flex flex-col lg:flex-row items-center gap-16 ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                            <div className="w-full lg:w-5/12">
                                <span className={`${item.subtitleColor} font-bold tracking-[0.2em] text-xs uppercase mb-4 block`}>
                                    {item.subtitle}
                                </span>
                                <h2 className="text-5xl xl:text-7xl font-black mb-6 tracking-tighter text-white leading-[1.1]">
                                    {item.title}
                                </h2>
                                <p className="text-xl text-gray-400 font-medium">
                                    {item.desc}
                                </p>
                            </div>
                            
                            <div className="w-full lg:w-7/12 relative group h-[400px] md:h-[600px] rounded-[40px] border border-white/10 bg-[#0a0a0a] overflow-hidden shadow-2xl">
                                <motion.img
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8 }}
                                    src={item.image}
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    alt={item.title}
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#050505]/50 to-transparent pointer-events-none" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
