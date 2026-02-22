import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';
import { Auth } from './Auth';
import { User } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [showAuth, setShowAuth] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const heroRef = useRef<HTMLDivElement>(null);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse tracking for parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5,
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleGetStarted = () => {
    setShowAuth(true);
  };

  const handleLogin = (_user: User) => {
    onGetStarted();
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setSubscribeStatus('success');
      setEmail('');
      setTimeout(() => setSubscribeStatus('idle'), 3000);
    } else {
      setSubscribeStatus('error');
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  if (showAuth) {
    return <Auth onLogin={handleLogin} />;
  }

  const features = [
    {
      title: 'AI Image Generation',
      desc: 'Turn text into stunning visuals instantly.',
      icon: Icons.Magic,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      colSpan: 'col-span-12 md:col-span-8',
    },
    {
      title: 'Smart Layers',
      desc: 'Professional non-destructive editing.',
      icon: Icons.Layers,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      colSpan: 'col-span-12 md:col-span-4',
    },
    {
      title: 'Brand Hub',
      desc: 'Keep your visual identity consistent.',
      icon: Icons.Brand,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
      colSpan: 'col-span-12 md:col-span-4',
    },
    {
      title: 'Pro Export',
      desc: 'SVG, PDF, PNG, WEBP at 300 DPI.',
      icon: Icons.Download,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      colSpan: 'col-span-12 md:col-span-4',
    },
    {
      title: 'Magic Resize',
      desc: 'One click adaption for all social platforms.',
      icon: Icons.Layout,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      colSpan: 'col-span-12 md:col-span-4',
    },
  ];

  const testimonials = [
    {
      content:
        "Kreathief is the missing link between Midjourney and Figma. It's an absolute game-changer for our marketing team.",
      author: 'Alex Rivera',
      role: 'Creative Director @ TechFlow',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
    {
      content:
        'I used to spend hours on simple social posts. Now I generate, edit, and export in minutes. The brand kit feature is a lifesaver.',
      author: 'Sarah Wu',
      role: 'Freelance Designer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    },
    {
      content:
        "The best AI design tool I've used. The layer control gives me the freedom I miss in other AI generators.",
      author: 'James Kim',
      role: 'Founder @ StartScale',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-auto selection:bg-[#7d2ae8] selection:text-white font-sans">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-900/20 rounded-full blur-[120px] opacity-50 animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-900/20 rounded-full blur-[120px] opacity-50 animate-pulse-slow delay-1000"></div>
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[40vw] h-[40vw] bg-pink-900/10 rounded-full blur-[100px] opacity-30 animate-pulse-slow delay-2000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      </div>

      {/* Navigation */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#050505]/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent py-4'}`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-all duration-300">
              <Icons.Magic className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Kreathief</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Templates', 'Pricing', 'FAQ'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-purple-500 transition-all group-hover:w-full"></span>
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button className="text-sm font-medium text-white/70 hover:text-white transition-colors">Log In</button>
            <button
              onClick={handleGetStarted}
              className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
            >
              Get Started
            </button>
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <Icons.X /> : <Icons.Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#050505] pt-24 px-6 md:hidden animate-fade-in">
          <div className="flex flex-col gap-6 text-2xl font-bold">
            {['Features', 'Templates', 'Pricing', 'FAQ'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className="text-left text-white/50 hover:text-white transition-colors"
              >
                {item}
              </button>
            ))}
            <div className="h-px bg-white/10 my-4"></div>
            <button
              onClick={handleGetStarted}
              className="bg-purple-600 text-white py-4 rounded-xl text-center shadow-lg shadow-purple-900/50"
            >
              Get Started Free
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-pointer">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-medium text-gray-300">New: SVG Vectorizer & Magic Eraser</span>
              <Icons.ArrowRight className="w-3 h-3 text-gray-500" />
            </div>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8 leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50">
              Design at the
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x">
                Speed of AI
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed">
              Create professional graphics, logos, and marketing materials in seconds. The power of generative AI meets
              the precision of vector design.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 mb-20 w-full sm:w-auto">
              <button
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-white/20 flex items-center justify-center gap-2 group"
              >
                Start Creating Free
                <Icons.ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white rounded-full font-bold text-lg hover:bg-white/10 border border-white/10 transition-all backdrop-blur-md flex items-center justify-center gap-2">
                <Icons.Play className="w-5 h-5" />
                See How It Works
              </button>
            </div>

            {/* Hero Visual */}
            <div
              className="relative w-full max-w-5xl aspect-video rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl shadow-purple-900/20 overflow-hidden group perspective-1000"
              style={{
                transform: `rotateX(${mousePosition.y * 5}deg) rotateY(${mousePosition.x * 5}deg)`,
                transition: 'transform 0.1s ease-out',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              {/* Fake UI Interface */}
              <div className="absolute top-0 inset-x-0 h-12 bg-[#1a1a1a] border-b border-white/5 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <div className="ml-4 h-6 w-64 bg-white/5 rounded-md"></div>
              </div>

              {/* Grid content placeholder */}
              <div className="absolute inset-0 top-12 grid grid-cols-12 gap-4 p-4">
                <div className="col-span-2 bg-white/5 rounded-lg h-full animate-pulse-slow"></div>
                <div className="col-span-8 bg-[#050505] rounded-lg border border-white/5 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-[#050505] to-[#050505]"></div>
                  <div className="text-center transform transition-transform group-hover:scale-105 duration-700">
                    <h2 className="text-4xl font-black text-white mb-2">
                      NEON
                      <br />
                      FUTURE
                    </h2>
                    <div className="text-purple-400 font-mono text-sm">CYBERPUNK AESTHETICS</div>
                  </div>
                </div>
                <div className="col-span-2 bg-white/5 rounded-lg h-full animate-pulse-slow delay-500"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="w-full overflow-hidden border-y border-white/5 bg-white/[0.02] py-10">
        <div className="flex w-[200%] animate-scroll">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="flex min-w-full justify-around items-center gap-12 px-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500"
            >
              <span className="text-2xl font-bold flex items-center gap-2">
                <Icons.Layers /> ADOBE
              </span>
              <span className="text-2xl font-bold flex items-center gap-2">
                <Icons.Image /> FIGMA
              </span>
              <span className="text-2xl font-bold flex items-center gap-2">
                <Icons.Pen /> SKETCH
              </span>
              <span className="text-2xl font-bold flex items-center gap-2">
                <Icons.Layout /> FRAMER
              </span>
              <span className="text-2xl font-bold flex items-center gap-2">
                <Icons.Box /> CANVA
              </span>
              <span className="text-2xl font-bold flex items-center gap-2">
                <Icons.Globe /> WEBFLOW
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bento Grid Features */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Everything you need to <br />
              <span className="text-purple-400">create masterpieces.</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Combining the best of generative AI with professional vector design tools.
            </p>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={`${feature.colSpan} relative group rounded-3xl bg-[#0a0a0a] border border-white/10 p-8 overflow-hidden hover:border-white/20 transition-all duration-500`}
              >
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent`}
                ></div>
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <Icons.ArrowRight className="w-5 h-5 text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-32 bg-[#0a0a0a] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Loved by Designers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-[#151515] p-8 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all hover:-translate-y-1"
              >
                <div className="flex gap-1 mb-4 text-yellow-500">
                  {[...Array(5)].map((_, j) => (
                    <Icons.Star key={j} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">&quot;{t.content}&quot;</p>
                <div className="flex items-center gap-4">
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="w-10 h-10 rounded-full object-cover grayscale group-hover:grayscale-0"
                  />
                  <div>
                    <div className="font-bold text-white text-sm">{t.author}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple Pricing</h2>
            <div className="flex items-center justify-center gap-4 mt-8">
              <span className={!annualBilling ? 'text-white' : 'text-gray-500'}>Monthly</span>
              <button
                onClick={() => setAnnualBilling(!annualBilling)}
                className="w-14 h-8 bg-white/10 rounded-full relative transition-colors hover:bg-white/20"
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 ${annualBilling ? 'left-7' : 'left-1'}`}
                ></div>
              </button>
              <span className={annualBilling ? 'text-white' : 'text-gray-500'}>
                Annual{' '}
                <span className="text-green-400 text-xs font-bold bg-green-400/10 px-2 py-0.5 rounded ml-1">-20%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 flex flex-col">
              <h3 className="text-xl font-bold text-gray-400 mb-2">Free</h3>
              <div className="text-4xl font-bold mb-6">
                $0<span className="text-lg text-gray-500 font-normal">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex gap-3 text-sm text-gray-300">
                  <Icons.Check className="w-5 h-5 text-green-500" /> Unlimited Projects
                </li>
                <li className="flex gap-3 text-sm text-gray-300">
                  <Icons.Check className="w-5 h-5 text-green-500" /> 10 AI Generations/mo
                </li>
                <li className="flex gap-3 text-sm text-gray-300">
                  <Icons.Check className="w-5 h-5 text-green-500" /> Standard Support
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full py-3 rounded-xl border border-white/20 hover:bg-white/5 transition-colors font-bold"
              >
                Get Started
              </button>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-purple-500 relative flex flex-col transform md:-translate-y-4 shadow-2xl shadow-purple-900/20">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-6">
                ${annualBilling ? '12' : '15'}
                <span className="text-lg text-gray-500 font-normal">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex gap-3 text-sm text-white">
                  <Icons.Check className="w-5 h-5 text-purple-400" /> Unlimited Projects
                </li>
                <li className="flex gap-3 text-sm text-white">
                  <Icons.Check className="w-5 h-5 text-purple-400" /> Unlimited AI Generations
                </li>
                <li className="flex gap-3 text-sm text-white">
                  <Icons.Check className="w-5 h-5 text-purple-400" /> Remove Backgrounds
                </li>
                <li className="flex gap-3 text-sm text-white">
                  <Icons.Check className="w-5 h-5 text-purple-400" /> Vector Exports
                </li>
                <li className="flex gap-3 text-sm text-white">
                  <Icons.Check className="w-5 h-5 text-purple-400" /> Priority Support
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 transition-colors font-bold shadow-lg shadow-purple-900/50"
              >
                Start Free Trial
              </button>
            </div>

            <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 flex flex-col">
              <h3 className="text-xl font-bold text-gray-400 mb-2">Team</h3>
              <div className="text-4xl font-bold mb-6">
                ${annualBilling ? '29' : '39'}
                <span className="text-lg text-gray-500 font-normal">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex gap-3 text-sm text-gray-300">
                  <Icons.Check className="w-5 h-5 text-green-500" /> Everything in Pro
                </li>
                <li className="flex gap-3 text-sm text-gray-300">
                  <Icons.Check className="w-5 h-5 text-green-500" /> 5 Team Members
                </li>
                <li className="flex gap-3 text-sm text-gray-300">
                  <Icons.Check className="w-5 h-5 text-green-500" /> Shared Brand Kits
                </li>
                <li className="flex gap-3 text-sm text-gray-300">
                  <Icons.Check className="w-5 h-5 text-green-500" /> Collaborative Editing
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full py-3 rounded-xl border border-white/20 hover:bg-white/5 transition-colors font-bold"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-black mb-8 tracking-tight">Ready to create?</h2>
          <p className="text-xl text-gray-400 mb-10">Join thousands of designers creating the future with Kreathief.</p>

          <form onSubmit={handleSubscribe} className="max-w-md mx-auto relative mb-12">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-6 pr-32 text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 bg-white text-black px-6 rounded-full font-bold hover:bg-gray-200 transition-colors"
            >
              {subscribeStatus === 'success' ? 'Joined!' : 'Join Now'}
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Twitter
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Instagram
            </a>
          </div>
          <p className="mt-8 text-xs text-gray-600">© 2026 Kreathief Inc. All rights reserved.</p>
        </div>
      </section>
    </div>
  );
};
