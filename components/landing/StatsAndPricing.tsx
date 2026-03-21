import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';

export const Stats: React.FC = () => {
    const stats = [
        { label: "AI Generations", value: "85K+", icon: Icons.Magic },
        { label: "Active Designers", value: "12K+", icon: Icons.User },
        { label: "Vector Assets", value: "3.2M+", icon: Icons.Pen },
        { label: "Design Time Saved", value: "65%", icon: Icons.Zap }
    ];

    return (
        <div className="py-20 border-y border-white/5 bg-white/[0.01]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <div className="text-4xl md:text-5xl font-black mb-2 tracking-tighter text-white">{stat.value}</div>
                            <div className="text-xs font-black text-purple-500 uppercase tracking-[0.2em]">{stat.label}</div>
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
            name: "Starter",
            price: "0",
            features: ["10 AI Generations", "Basic Vector Tools", "Standard Export", "Community Support"],
            button: "Begin Creating",
            accent: "border-white/10"
        },
        {
            name: "Professional",
            price: annualBilling ? "12" : "15",
            features: ["Unlimited AI Generations", "Client Folders & Brand Kits", "Pro Vector Suite", "Premium SVG/PDF Export", "CMYK-ready Assets"],
            button: "Unlock Pro Power",
            accent: "border-purple-500 shadow-2xl shadow-purple-500/20",
            popular: true
        },
        {
            name: "Studio",
            price: annualBilling ? "29" : "39",
            features: ["Everything in Pro", "Team Collaboration", "Shared Brand Kits", "Custom Font Uploads", "API Access"],
            button: "Scale Your Studio",
            accent: "border-white/10"
        }
    ];

    return (
        <section id="pricing" className="py-32 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-black mb-8 tracking-tight"
                    >
                        Transparent <span className="text-purple-500">Pricing.</span>
                    </motion.h2>

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
                            className={`p-10 rounded-[40px] bg-white/[0.02] border-2 ${plan.accent} flex flex-col relative overflow-hidden group`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-10 bg-purple-500 text-white px-4 py-2 rounded-b-xl text-[10px] font-black uppercase tracking-[0.2em]">
                                    Ideal for Freelancers
                                </div>
                            )}

                            <div className="mb-10">
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-4">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-white">$</span>
                                    <span className="text-7xl font-black text-white tracking-tighter">{plan.price}</span>
                                    <span className="text-gray-500 font-bold">/mo</span>
                                </div>
                            </div>

                            <ul className="space-y-6 mb-12 flex-1">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-gray-400">
                                        <Icons.Check className="w-4 h-4 text-purple-500" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={onPlanSelect}
                                className={`w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all ${plan.popular ? 'bg-white text-black hover:bg-gray-200' : 'bg-white/5 text-white hover:bg-white/10'}`}
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
