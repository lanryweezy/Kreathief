import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';

export const TrustEthics: React.FC = () => {
  const principles = [
    {
      icon: Icons.Lock,
      title: "Privacy Vault",
      description: "Your design data is ephemeral and project-isolated. We never share your creative context with third parties or other users."
    },
    {
      icon: Icons.Shield,
      title: "No Training",
      description: "We do not use your sketches, inputs, or final exports to train our AI models. Your proprietary work stays yours."
    },
    {
      icon: Icons.Check,
      title: "Traceable & Ethical",
      description: "Transparent sourcing for all AI-generated assets. We prioritize licensed and ethically sourced datasets for our creative loop."
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-[#0a0a0c] to-black border-y border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-16">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-6"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Built for Professionals
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold mb-6 tracking-tight text-white"
            >
              Enterprise-Grade <span className="text-emerald-400">Trust & Ethics.</span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-neutral-400 font-medium leading-relaxed mb-12"
            >
              In a world of generative AI, we protect the most valuable asset you have: your unique creative intent.
            </motion.p>

            <div className="grid grid-cols-1 gap-8">
              {principles.map((p, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <p.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base mb-1">{p.title}</h4>
                    <p className="text-neutral-500 text-sm leading-relaxed">{p.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Ethical Seal Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-emerald-500/20 blur-[120px] rounded-full" />
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full border-2 border-emerald-500/20 flex items-center justify-center">
              <div className="w-[85%] h-[85%] rounded-full border border-emerald-500/30 flex items-center justify-center border-dashed animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <Icons.Shield className="w-16 h-16 text-emerald-400 mb-4" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-1">Authenticated</span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Privacy First</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
