import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';

const faqs = [
  {
    question: 'Is Kreathief really free to use?',
    answer:
      'Yes! Our free plan includes 100 AI generations per month, basic vector tools, and standard exports. No credit card required. Upgrade to Pro when you need unlimited AI generations and advanced features.',
  },
  {
    question: 'Can I use Kreathief for commercial projects?',
    answer:
      'Absolutely. All designs, exports, and AI-generated content created in Kreathief are 100% yours. Use them for client work, products, marketing - whatever you need. Full commercial rights included.',
  },
  {
    question: 'What export formats do you support?',
    answer:
      'We support all industry-standard formats: SVG, PNG, JPG, WEBP, and PDF. Pro users get access to high-resolution exports up to 8K and print-ready CMYK color spaces.',
  },
  {
    question: 'Does Kreathief work offline?',
    answer:
      'Kreathief is a web-based platform that requires an internet connection for AI features and cloud sync. However, your work is automatically saved and you can continue editing existing projects with limited connectivity.',
  },
  {
    question: 'How does real-time collaboration work?',
    answer:
      'Invite team members to your workspace and see their cursors, edits, and comments in real-time. No more sending files back and forth. Everyone works on the same canvas simultaneously with zero conflicts.',
  },
  {
    question: 'Can I import my existing design files?',
    answer:
      'Yes! Import SVG, PNG, JPG, and WEBP files directly into Kreathief. We also support importing Photoshop .abr brush libraries and custom fonts to match your existing workflow.',
  },
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-32 relative bg-[#0a0a0c] border-t border-white/5 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-purple-900/10 via-[#0a0a0c] to-[#0a0a0c] pointer-events-none -z-10"></div>
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block mb-6"
          >
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Icons.Help className="w-3 h-3 text-blue-400" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">Got Questions?</span>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black mb-6 tracking-tighter text-white"
          >
            We've got answers
          </motion.h2>
          <p className="text-gray-400 font-medium text-lg max-w-2xl mx-auto">
            Everything you need to know about Kreathief. Can't find what you're looking for?{' '}
            <a href="/contact" className="text-purple-400 hover:text-purple-300 underline">
              Chat with us
            </a>
            .
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
