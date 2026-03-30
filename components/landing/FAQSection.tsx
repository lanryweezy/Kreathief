import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';

const faqs = [
  {
    question: 'What makes Kreathief different from legacy design tools?',
    answer:
      'Unlike traditional vector editors that require manual path manipulation, Kreathief is a completely AI-Native design platform. It embeds generative diffusion models directly into the WebGL canvas, allowing you to construct complex vector SVGs, high-fidelity UI mockups, and layouts instantly via natural language, while still retaining absolute layer-level control.',
  },
  {
    question: 'Can I use Kreathief for commercial enterprise projects?',
    answer:
      'Yes, absolutely. All graphic assets, typography styles, and vector paths generated and refined within the Kreathief studio grant you full, unencumbered commercial usage rights. Whether you are an independent freelancer or an enterprise marketing team, you own your exports forever.',
  },
  {
    question: 'What high-resolution export formats are currently supported?',
    answer:
      'We support loss-less, high-fidelity exports across all industry standard formats. This includes infinite-resolution SVG, 8K uncompressed PNG, highly optimized WEBP for web performance, and print-ready PDF. There are never any watermarks or hidden export fees.',
  },
  {
    question: 'Does the platform support real-time multiplayer collaboration?',
    answer:
      'Yes! Kreathief features robust native multiplayer capabilities synchronized via edge-network WebSockets. Multiple designers, copywriters, and stakeholders can inhabit the identical canvas, viewing live cursors and generative edits in literal real-time without polling delays or sync conflicts.',
  },
  {
    question: 'Is there a free tier for independent designers?',
    answer:
      'We fundamentally believe in empowering the global creator economy. Kreathief provides a highly generous free tier that includes unrestricted access to our core rendering engine, basic AI generation quotas, and unlimited standard exports. For intensive daily generative workloads, we offer a transparent Pro tier.',
  },
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-32 relative bg-[#0a0a0c] border-t border-white/5 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-purple-900/10 via-[#0a0a0c] to-[#0a0a0c] pointer-events-none -z-10"></div>
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black mb-6 tracking-tighter"
          >
            Frequently Asked Questions
          </motion.h2>
          <p className="text-gray-400 font-medium text-lg">
            Answers to common questions regarding commercial rights, rendering engines, and team collaboration.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              key={faq.question}
              className="bg-[#0a0a0c] border border-white/5 rounded-2xl overflow-hidden glass-edge group hover:border-white/10 transition-all duration-300 shadow-xl"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                aria-expanded={openIndex === idx}
                aria-controls={`faq-answer-${idx}`}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="text-lg font-bold text-white tracking-tight">{faq.question}</span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${openIndex === idx ? 'bg-purple-500 rotate-180' : 'bg-white/5'}`}
                >
                  <Icons.ChevronDown className={`w-4 h-4 ${openIndex === idx ? 'text-white' : 'text-gray-400'}`} />
                </div>
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    id={`faq-answer-${idx}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="px-6 pb-6 text-gray-400 font-medium leading-relaxed">{faq.answer}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
