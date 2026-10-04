import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Icons } from '../../constants';

const AnimatedNumber: React.FC<{ value: number; suffix?: string; prefix?: string }> = ({ value, suffix = '', prefix = '' }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1600;
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(start + (value - start) * ease);
      setDisplay(current);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
};

export const Stats: React.FC = () => {
  return (
    <div className="py-24 border-y border-white/5 bg-[#0a0a10]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center items-center">
          <div className="group">
            <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1.5 tracking-tight text-white group-hover:text-neutral-300 transition-colors">
              <AnimatedNumber value={2500000} suffix="+" />
            </div>
            <div className="text-xs font-mono uppercase tracking-[0.25em] text-neutral-400">
              Generations Run
            </div>
          </div>

          <div className="group">
            <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1.5 tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              <AnimatedNumber value={10000} suffix="+" />
            </div>
            <div className="text-xs font-mono uppercase tracking-[0.25em] text-neutral-400">
              Active Creators
            </div>
          </div>

          <div className="group">
            <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1.5 tracking-tight text-white group-hover:text-neutral-300 transition-colors">
              <AnimatedNumber value={850000} suffix="+" />
            </div>
            <div className="text-xs font-mono uppercase tracking-[0.25em] text-neutral-400">
              Projects Saved
            </div>
          </div>

          <div className="group">
            <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1.5 tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              <AnimatedNumber value={73} suffix="%" />
            </div>
            <div className="text-xs font-mono uppercase tracking-[0.25em] text-neutral-400">
              Workflow Time Saved
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PricingProps {
  onPlanSelect: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onPlanSelect }) => {
  const [annualBilling, setAnnualBilling] = useState(true);

  const plans = [
    {
      name: 'Starter',
      price: '0',
      description: 'Ideal for testing autonomous AI tools and small experiments.',
      features: [
        '100 Neural AI generations/mo',
        'Full precision vector editor',
        'Web export (PNG, JPG)',
        'Up to 5 active canvas projects',
        'Standard community support',
      ],
      button: 'Start Free Forever',
      popular: false,
    },
    {
      name: 'Studio Pro',
      price: annualBilling ? '16' : '20',
      description: 'The power suite for individual creators, freelancers, and designers.',
      features: [
        'Unlimited AI Image Generations',
        'Magic Erase & Inpainting engine',
        'High-Res Vector & CMYK Export (SVG, PDF/X)',
        'Unlimited canvas documents',
        'Custom brand kits & typography sync',
        'Priority GPU synthesis queue',
        'Zero platform watermarks',
      ],
      button: 'Unlock Studio Pro',
      popular: true,
    },
    {
      name: 'Team Studio',
      price: annualBilling ? '39' : '49',
      description: 'Full multiplayer collaboration for agile branding and creative teams.',
      features: [
        'Everything in Studio Pro included',
        'Multiplayer live-canvas editing',
        'Shared organizational asset library',
        'Team access controls & version rollback',
        'Custom font server upload',
        'Full API access (Generative endpoint)',
        'Dedicated account manager',
      ],
      button: 'Start Team Trial',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-36 relative bg-surface-dark-0">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono tracking-widest text-neutral-300 uppercase mb-6"
          >
            <span>✦</span>
            <span>Transparent Creative Investment</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl sm:text-6xl md:text-8xl font-black mb-6 tracking-tighter text-white"
          >
            Simple, transparent plans.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-xl text-neutral-400 font-normal max-w-2xl mx-auto mb-10"
          >
            Begin completely free. Upgrade when your volume scales. Cancel whenever you choose.
          </motion.p>

          <div className="inline-flex items-center gap-4 p-1.5 rounded-full bg-[#11111a] border border-white/10">
            <button
              onClick={() => setAnnualBilling(false)}
              aria-label="Switch to monthly billing"
              aria-pressed={!annualBilling}
              className={"px-5 py-2 rounded-full text-xs font-bold transition-all " + (!annualBilling ? "bg-white text-black shadow-md" : "text-neutral-400 hover:text-white")}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setAnnualBilling(true)}
              aria-label="Switch to annual billing"
              aria-pressed={annualBilling}
              className={"px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 " + (annualBilling ? "bg-neutral-600 text-white shadow-lg shadow-neutral-500/30" : "text-neutral-400 hover:text-white")}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/20 text-white font-black">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.12 }}
              className={"p-8 sm:p-10 rounded-[36px] bg-[#0e0e16] flex flex-col justify-between relative overflow-hidden transition-all duration-500 " + (plan.popular ? "border-2 border-neutral-500/80 shadow-[0_0_80px_rgba(168,85,247,0.2)] md:-translate-y-3" : "border border-white/10 hover:border-white/20")}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-neutral-400 to-neutral-600 text-white text-[10px] font-mono font-black uppercase tracking-widest px-5 py-1.5 rounded-bl-2xl shadow-lg">
                  Most Popular
                </div>
              )}

              <div>
                <div className="text-xs font-mono uppercase tracking-[0.25em] text-neutral-400 mb-2">
                  {plan.name}
                </div>
                <div className="text-sm text-neutral-400 mb-6 min-h-[40px]">
                  {plan.description}
                </div>

                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-6xl font-black text-white tracking-tighter">
                    {"$" + plan.price}
                  </span>
                  <span className="text-neutral-400 text-sm font-medium">/ month</span>
                </div>

                <div className="h-px bg-white/10 w-full mb-8" />

                <ul className="space-y-3.5 mb-10">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-neutral-300">
                      <Icons.Check className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={onPlanSelect}
                className={"w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all transform active:scale-95 " + (plan.popular ? "bg-gradient-to-r from-neutral-400 to-neutral-600 text-white shadow-lg shadow-neutral-500/30 hover:shadow-neutral-600/50" : "bg-white/5 hover:bg-white/10 text-white border border-white/10")}
              >
                {plan.button}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
