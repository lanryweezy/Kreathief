import React, { useState } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';

const features = [
  { icon: '✦', title: 'AI Generation', desc: 'Generate stunning designs from text prompts in seconds.' },
  { icon: '◇', title: 'Template Marketplace', desc: 'Buy and sell premium templates built by African creators.' },
  { icon: '◈', title: 'Creator Earnings', desc: 'Earn revenue every time your templates are downloaded.' },
];

const steps = [
  { num: '01', title: 'Sign Up', desc: 'Create your free account in seconds.' },
  { num: '02', title: 'Create with AI', desc: 'Use AI to generate designs and templates.' },
  { num: '03', title: 'Earn from Downloads', desc: 'Publish to the marketplace and get paid.' },
];

const testimonials = [
  { name: 'Amara O.', role: 'Graphic Designer', text: 'Kreathief transformed my workflow. I create 10x faster and earn from my templates.' },
  { name: 'Tunde K.', role: 'Brand Strategist', text: 'The AI tools are incredible. My clients think I hired a full design team.' },
  { name: 'Fatima A.', role: 'Template Creator', text: 'I earned my first ₦500,000 in 3 months selling templates on Kreathief.' },
];

export const LandingPage: React.FC = () => {
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen bg-surface-dark-0 text-white font-sans">
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-6">
            Design with AI.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent">
              Earn from templates.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-medium mb-10">
            The AI-powered design tool built for African creators
          </p>
          <Button variant="primary" size="lg" onClick={() => (window.location.href = '/auth')}>
            Start Creating
          </Button>
          <div className="mt-16 aspect-video max-w-3xl mx-auto rounded-2xl border border-white/10 bg-surface-dark-3 flex items-center justify-center">
            <span className="text-gray-500 text-sm">Demo Video</span>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6 bg-surface-dark-1 border-y border-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-lg text-gray-400 font-semibold mb-12">
            1,000+ Creators &nbsp;|&nbsp; 5,000+ Templates &nbsp;|&nbsp; 50,000+ Downloads
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-surface-dark-3 border border-white/5 rounded-2xl p-6 text-left">
                <p className="text-gray-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-white font-bold text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-14 tracking-tight">
            Everything you need to create and earn
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-surface-dark-2 border border-white/5 rounded-2xl p-8 text-center hover:border-brand-600/30 transition-colors">
                <div className="text-4xl mb-4 text-brand-400">{f.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-surface-dark-1 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-14 tracking-tight">How it works</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="text-5xl font-black text-brand-600/30 mb-3">{s.num}</div>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Join the Creator Community</h2>
          <p className="text-gray-400 mb-8">Get early access and start earning with AI-powered templates.</p>
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6"
            onSubmit={(e) => { e.preventDefault(); window.location.href = '/auth'; }}
          >
            <Input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button variant="primary" type="submit">Sign Up</Button>
          </form>
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/auth" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</a>
          </p>
        </div>
      </section>
    </div>
  );
};
