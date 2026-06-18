import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';

export const Stats: React.FC = () => {
  const stats = [
    { label: 'AI Generations', value: '2.5M+', icon: Icons.Magic },
    { label: 'Active Creators', value: '10K+', icon: Icons.User },
    { label: 'Projects Created', value: '850K+', icon: Icons.Pen },
    { label: 'Time Saved', value: '73%', icon: Icons.Zap },
  ];

  return (
    <div className="py-20 border-y border-white/5 bg-[#0a0a0c]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group cursor-default"
            >
              <div className="text-5xl md:text-6xl font-black mb-3 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-500">
                {stat.value}
              </div>
              <div className="text-xs font-black text-gray-500 group-hover:text-purple-400 uppercase tracking-[0.25em] transition-colors">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface PricingProps {
  onPlanSelect: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onPlanSelect }) => {
  const [annualBilling, setAnnualBilling] = React.useState(true);

  const plans = [
    {
      name: 'Free',
      price: '0',
      description: 'Perfect for exploring',
      features: [
        '100 AI generations/month',
        'Basic vector tools',
        'Standard export (PNG, JPG)',
        'Community support',
        '5 projects',
      ],
      button: 'Start Free',
      accent: 'border-white/10',
    },
    {
      name: 'Pro',
      price: annualBilling ? '16' : '20',
      description: 'For serious creators',
      features: [
        'Unlimited AI generations',
        'Advanced vector suite',
        'Premium export (SVG, PDF)',
        'Brand kits & templates',
        'Priority support',
        'Unlimited projects',
        'Remove watermarks',
      ],
      button: 'Go Pro',
      accent: 'border-purple-500 shadow-2xl shadow-purple-500/20',
      popular: true,
    },
    {
      name: 'Team',
      price: annualBilling ? '39' : '49',
      description: 'Scale your workflow',
      features: [
        'Everything in Pro',
        'Real-time collaboration',
        'Shared workspaces',
        'Team analytics',
        'Custom fonts upload',
        'API access',
        'Dedicated support',
      ],
      button: 'Start Team Trial',
      accent: 'border-white/10',
    },
  ];

  return (
    <section id="pricing" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block mb-6"
          >
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-purple-400">Simple Pricing</span>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black mb-6 tracking-tighter text-white"
          >
            Choose your plan
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 font-medium max-w-2xl mx-auto mb-10"
          >
            Start free, upgrade when you need more power. No hidden fees, cancel anytime.
          </motion.p>

          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-bold ${!annualBilling ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setAnnualBilling(!annualBilling)}
              className="w-14 h-8 bg-white/5 rounded-full relative p-1 border border-white/10"
            >
              <motion.div
                animate={{ x: annualBilling ? 24 : 0 }}
                className="w-6 h-6 bg-white rounded-full shadow-lg shadow-white/20"
              />
            </button>
            <span className={`text-sm font-bold ${annualBilling ? 'text-white' : 'text-gray-500'}`}>
              Annual <span className="text-purple-500 ml-1">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`p-10 rounded-[40px] bg-[#0a0a0c] border-2 ${plan.popular ? 'border-transparent animated-border-wrapper shadow-2xl shadow-purple-500/20' : plan.accent} flex flex-col relative overflow-hidden group`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-purple-500/50">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em] mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-6">{plan.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-white tracking-tighter">${plan.price}</span>
                  <span className="text-gray-500 font-bold">/month</span>
                </div>
                {plan.price !== '0' && (
                  <p className="text-xs text-gray-600 mt-2">{annualBilling ? 'Billed annually' : 'Billed monthly'}</p>
                )}
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm font-medium text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icons.Check className="w-3 h-3 text-purple-400" />
                    </div>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={onPlanSelect}
                className={`w-full py-4 rounded-2xl font-bold text-sm transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40'
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                }`}
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
