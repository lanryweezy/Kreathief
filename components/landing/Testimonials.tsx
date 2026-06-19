import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';

export const Testimonials: React.FC = () => {
  const testimonials = [
    {
      quote:
        'Kreathief replaced my entire design stack. I went from juggling 5 tools to just one. The AI features are insanely good.',
      author: 'Sarah Chen',
      role: 'Product Designer',
      company: 'Stripe',
      avatar: '/images/avatar_1_1772614969136.png',
      rating: 5,
    },
    {
      quote:
        "The vector engine is faster than anything I've used. Real-time collaboration actually works. This is the future.",
      author: 'Marcus Rodriguez',
      role: 'Creative Director',
      company: 'R/GA',
      avatar: '/images/avatar_2_1772614992003.png',
      rating: 5,
    },
    {
      quote:
        "I was skeptical about browser-based design tools. Kreathief proved me wrong. It's faster than native apps.",
      author: 'Emily Watson',
      role: 'Brand Designer',
      company: 'Airbnb',
      avatar: '/images/avatar_3_1772615019487.png',
      rating: 5,
    },
  ];

  return (
    <section className="py-32 relative bg-[#0a0a0c] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.08] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block mb-6"
          ></motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black mb-6 tracking-tighter text-white"
          >
            Loved by creators <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              worldwide.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 font-medium max-w-2xl mx-auto"
          >
            Join thousands of designers, agencies, and teams shipping better work faster.
          </motion.p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-500 group backdrop-blur-sm"
            >
              {/* Rating Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Icons.Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-300 font-medium leading-relaxed mb-6 text-sm">"{testimonial.quote}"</p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-6 border-t border-white/10">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
                />
                <div>
                  <div className="text-white font-bold text-sm">{testimonial.author}</div>
                  <div className="text-gray-500 text-xs">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
