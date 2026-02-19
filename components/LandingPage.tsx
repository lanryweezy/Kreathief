import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [_activeFeature, setActiveFeature] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const sections = ['features', 'how-it-works', 'templates', 'testimonials', 'pricing'];
      const newVisible = new Set(visibleSections);

      sections.forEach((section) => {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.75) {
            newVisible.add(section);
          }
        }
      });

      setVisibleSections(newVisible);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleSections]);

  // Mouse tracking for parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  // Feature hover effect
  const handleFeatureEnter = useCallback((idx: number) => {
    setActiveFeature(idx);
  }, []);

  const handleFeatureLeave = useCallback(() => {
    setActiveFeature(null);
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
      icon: Icons.Magic,
      title: 'AI Image Generation',
      description:
        'Transform text into stunning visuals. Our AI understands context, style, and composition to create unique designs.',
      color: 'from-[#00c4cc] to-[#00ff95]',
      gradient: 'from-[#00c4cc]/20 to-[#00ff95]/20',
      bgIcon: '✦',
    },
    {
      icon: Icons.Layers,
      title: 'Smart Layer Editing',
      description:
        'Professional layer system with intuitive controls. Group, mask, blend, and organize with precision.',
      color: 'from-[#7d2ae8] to-[#ff6b6b]',
      gradient: 'from-[#7d2ae8]/20 to-[#ff6b6b]/20',
      bgIcon: '⬡',
    },
    {
      icon: Icons.Text,
      title: 'Advanced Typography',
      description:
        '500+ premium fonts with advanced controls. Curved text, letter spacing, line height, and custom effects.',
      color: 'from-[#ff6b6b] to-[#feca57]',
      gradient: 'from-[#ff6b6b]/20 to-[#feca57]/20',
      bgIcon: '⬢',
    },
    {
      icon: Icons.Download,
      title: 'Pro Export Studio',
      description:
        'Export in any format: PNG, JPG, WEBP, SVG, PDF, PSD. Print-ready 300 DPI or web-optimized compression.',
      color: 'from-[#feca57] to-[#5f27cd]',
      gradient: 'from-[#feca57]/20 to-[#5f27cd]/20',
      bgIcon: '✸',
    },
    {
      icon: Icons.Templates,
      title: 'Template Library',
      description: '10,000+ professionally designed templates. Customizable for any brand, occasion, or platform.',
      color: 'from-[#5f27cd] to-[#00c4cc]',
      gradient: 'from-[#5f27cd]/20 to-[#00c4cc]/20',
      bgIcon: '◈',
    },
    {
      icon: Icons.Brand,
      title: 'Brand Hub',
      description: 'Centralize your brand assets. Colors, fonts, logos, and guidelines accessible in one click.',
      color: 'from-[#00c4cc] to-[#7d2ae8]',
      gradient: 'from-[#00c4cc]/20 to-[#7d2ae8]/20',
      bgIcon: '❖',
    },
  ];

  const stats = [
    { value: '10M+', label: 'Designs Created', sublabel: 'Every month', trend: '+25%' },
    { value: '150+', label: 'Countries', sublabel: 'Worldwide reach', trend: '+12%' },
    { value: '99.9%', label: 'Uptime', sublabel: 'Reliability', trend: '99.99%' },
    { value: '24/7', label: 'Support', sublabel: 'Always available', trend: '< 1min' },
  ];

  const useCases = [
    {
      title: 'Social Media',
      description: 'Posts, stories, ads for all platforms',
      icon: Icons.Image,
      examples: ['Instagram Posts', 'Facebook Ads', 'LinkedIn Banners', 'Twitter Headers'],
      color: '#7d2ae8',
      image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop',
    },
    {
      title: 'Marketing',
      description: 'Flyers, brochures, posters that convert',
      icon: Icons.Magic,
      examples: ['Product Flyers', 'Event Posters', 'Business Cards', 'Brochures'],
      color: '#00c4cc',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop',
    },
    {
      title: 'Business',
      description: 'Professional documents & presentations',
      icon: Icons.Text,
      examples: ['Presentations', 'Reports', 'Infographics', 'Proposals'],
      color: '#ff6b6b',
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop',
    },
    {
      title: 'E-commerce',
      description: 'Product images that drive sales',
      icon: Icons.Shapes,
      examples: ['Product Photos', 'Ad Creatives', 'Listing Images', 'Promo Banners'],
      color: '#feca57',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Describe Your Vision',
      description:
        'Type your idea in natural language. Our AI interprets context, style preferences, and composition requirements.',
      icon: Icons.Bot,
      animation: 'Type "modern minimalist logo for coffee shop"',
      result: '✨ AI generates 4 unique concepts',
    },
    {
      number: '02',
      title: 'Customize & Perfect',
      description:
        'Fine-tune with professional tools. Adjust colors, typography, layout, and effects with real-time preview.',
      icon: Icons.Brush,
      animation: 'Drag, drop, resize, recolor - intuitive editing',
      result: '🎨 Real-time preview of changes',
    },
    {
      number: '03',
      title: 'Export & Publish',
      description: 'Download in any format or publish directly. Optimized for print, web, or social media platforms.',
      icon: Icons.Download,
      animation: 'One-click export to PNG, PDF, SVG, or PSD',
      result: '📤 Instant download in any format',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Social Media Manager @ TechCorp',
      avatar: '👩‍💼',
      content:
        'Kreathief has completely transformed our content workflow. What used to take our design team 3 days now takes me 30 minutes. The AI generation is genuinely mind-blowing - it understands brand voice and creates on-brand visuals every time.',
      rating: 5,
      company: 'TechCorp',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop',
      logo: '🏢',
    },
    {
      name: 'Marcus Johnson',
      role: 'Founder @ StartupHub',
      avatar: '👨‍💼',
      content:
        'As a non-designer founder, I was spending thousands on freelance designers. Kreathief gave me professional-quality marketing materials from day one. Our conversion rates increased 40% after switching to Kreathief designs.',
      rating: 5,
      company: 'StartupHub',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
      logo: '🚀',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Content Creator @ 500K followers',
      avatar: '👩‍🎨',
      content:
        "I've tried every design tool out there. Kreathief is the only one that combines AI power with professional controls. My engagement doubled when I started using Kreathief for all my content. It's simply the best.",
      rating: 5,
      company: 'Creator',
      image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&h=600&fit=crop',
      logo: '⭐',
    },
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: 0,
      description: 'Perfect for exploring your creativity',
      features: [
        'Up to 5 projects',
        '10 AI generations/month',
        'Standard export (PNG, JPG)',
        '1,000+ free templates',
        'Basic editing tools',
        '5GB cloud storage',
      ],
      cta: 'Start Free',
      popular: false,
      highlight: false,
    },
    {
      name: 'Pro',
      price: annualBilling ? 9 : 12,
      description: 'For serious creators and professionals',
      features: [
        'Unlimited projects',
        'Unlimited AI generations',
        'All export formats (PNG, JPG, WEBP, SVG, PDF, PSD)',
        'AI Background removal',
        '10,000+ premium templates',
        'Brand kit (3 brands)',
        'Priority 24/7 support',
        '100GB cloud storage',
        'Magic resize for all platforms',
      ],
      cta: 'Start Pro Trial',
      popular: true,
      highlight: true,
      savings: annualBilling ? 'Save 25%' : null,
      badge: 'Most Popular',
    },
    {
      name: 'Team',
      price: annualBilling ? 29 : 39,
      description: 'For teams and agencies',
      features: [
        'Everything in Pro',
        'Up to 5 team members',
        'Shared brand kits',
        'Real-time collaboration',
        'Team templates library',
        'Admin dashboard',
        'Approval workflows',
        'SSO & advanced security',
        'Dedicated account manager',
        'Unlimited storage',
      ],
      cta: 'Contact Sales',
      popular: false,
      highlight: false,
      badge: 'Best Value',
    },
  ];

  const faqs = [
    {
      question: 'Do I need design experience to use Kreathief?',
      answer:
        "Not at all! Kreathief is built for everyone. Our AI handles the complex design decisions, and our drag-and-drop interface is intuitive from day one. 85% of our users had zero design experience when they started. Within minutes, you'll be creating professional-quality designs.",
    },
    {
      question: 'What formats can I export my designs in?',
      answer:
        'Free users can export in PNG and JPG formats at standard quality. Pro users get access to WEBP (web-optimized), SVG (vector), PDF (print-ready), and PSD (Photoshop) formats. All exports support high resolution (300 DPI) perfect for professional printing. You can also export with transparent backgrounds.',
    },
    {
      question: 'Can I use Kreathief designs for commercial purposes?',
      answer:
        "Yes! All designs you create with Kreathief are yours to use commercially, even on the free plan. You own full rights to your creations. Use them for client work, products, advertising, social media - anything you want. We don't claim any ownership of your designs.",
    },
    {
      question: 'How does the AI image generation work?',
      answer:
        "Simply describe what you want in plain English (or 50+ languages). Our AI, powered by Google's latest Gemini models, interprets your description and generates unique, high-quality images in seconds. You can specify style, mood, colors, composition, and even reference artists or movements.",
    },
    {
      question: 'Is my data and designs secure?',
      answer:
        'Absolutely. We use bank-level 256-bit SSL encryption for all data transmission. Your designs are stored in secure, redundant cloud servers. We never use your designs to train our AI models without explicit permission. GDPR and CCPA compliant. You can export or delete your data anytime.',
    },
    {
      question: 'Can I cancel or change my plan anytime?',
      answer:
        'Yes, you can cancel, upgrade, or downgrade at any time with no questions asked. If you cancel, your projects remain accessible and you can download them anytime. No long-term contracts. 30-day money-back guarantee on Pro and Team plans.',
    },
  ];

  const templateCategories = [
    { name: 'Social Media', count: '3,500+', color: '#7d2ae8' },
    { name: 'Marketing', count: '2,800+', color: '#00c4cc' },
    { name: 'Business', count: '2,200+', color: '#ff6b6b' },
    { name: 'E-commerce', count: '1,900+', color: '#feca57' },
    { name: 'Personal', count: '1,500+', color: '#5f27cd' },
    { name: 'Education', count: '1,200+', color: '#00ff95' },
  ];

  const brandLogos = [
    { name: 'TechCorp', logo: '◈' },
    { name: 'StartupHub', logo: '✦' },
    { name: 'DesignCo', logo: '⬡' },
    { name: 'MediaGroup', logo: '⬢' },
    { name: 'CreativeLabs', logo: '✸' },
    { name: 'BrandStudio', logo: '❖' },
  ];

  return (
    <div className="min-h-screen bg-[#0e1318] text-white overflow-x-hidden">
      {/* Custom Cursor Follower */}
      <div
        className="fixed w-8 h-8 border border-[#7d2ae8]/30 rounded-full pointer-events-none z-[100] transition-transform duration-100 hidden lg:block"
        style={{
          left: cursorPosition.x - 16,
          top: cursorPosition.y - 16,
          transform: 'translate(0, 0)',
        }}
      />
      <div
        className="fixed w-2 h-2 bg-[#7d2ae8] rounded-full pointer-events-none z-[100] hidden lg:block"
        style={{
          left: cursorPosition.x - 4,
          top: cursorPosition.y - 4,
        }}
      />

      {/* Animated Background Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse"></div>
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-cyan-900/10 rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#7d2ae8]/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-[#0e1318]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div
              className="flex items-center gap-3 group cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#00c4cc] to-[#7d2ae8] rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/30 group-hover:shadow-purple-900/50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Icons.Magic className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-black text-2xl tracking-tighter text-white group-hover:text-[#00c4cc] transition-colors">
                Kreathief
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-sm text-gray-400 hover:text-white transition-all hover:scale-105 relative group"
              >
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] group-hover:w-full transition-all duration-300"></span>
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-sm text-gray-400 hover:text-white transition-all hover:scale-105 relative group"
              >
                How It Works
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] group-hover:w-full transition-all duration-300"></span>
              </button>
              <button
                onClick={() => scrollToSection('templates')}
                className="text-sm text-gray-400 hover:text-white transition-all hover:scale-105 relative group"
              >
                Templates
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] group-hover:w-full transition-all duration-300"></span>
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-sm text-gray-400 hover:text-white transition-all hover:scale-105 relative group"
              >
                Reviews
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] group-hover:w-full transition-all duration-300"></span>
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-sm text-gray-400 hover:text-white transition-all hover:scale-105 relative group"
              >
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] group-hover:w-full transition-all duration-300"></span>
              </button>
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-4">
              <button className="text-sm text-gray-400 hover:text-white transition-all">Sign In</button>
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] hover:from-[#00b3ba] hover:to-[#6b23c5] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-900/40 hover:shadow-purple-900/60"
              >
                Get Started Free
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <Icons.X className="w-6 h-6" /> : <Icons.Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0e1318]/98 backdrop-blur-xl border-b border-white/5 animate-slide-up">
            <div className="px-6 py-6 space-y-4">
              <button
                onClick={() => scrollToSection('features')}
                className="block w-full text-left text-gray-400 hover:text-white py-2"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="block w-full text-left text-gray-400 hover:text-white py-2"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('templates')}
                className="block w-full text-left text-gray-400 hover:text-white py-2"
              >
                Templates
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="block w-full text-left text-gray-400 hover:text-white py-2"
              >
                Reviews
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="block w-full text-left text-gray-400 hover:text-white py-2"
              >
                Pricing
              </button>
              <div className="pt-4 border-t border-white/5 space-y-3">
                <button className="block w-full text-left text-gray-400 hover:text-white py-2">Sign In</button>
                <button
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] text-white px-6 py-3 rounded-xl font-bold transition-all"
                >
                  Get Started Free
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Announcement Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00c4cc]/10 to-[#7d2ae8]/10 border border-[#00c4cc]/20 rounded-full px-5 py-2.5 mb-8 backdrop-blur-sm hover:scale-105 transition-transform cursor-pointer group">
              <span className="w-2 h-2 bg-[#00c4cc] rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
                Now with Gemini 2.5 Flash — 3x faster AI generation
              </span>
              <Icons.ArrowRight className="w-4 h-4 text-[#00c4cc] group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tighter mb-8 leading-[1.1]">
              Design Anything
              <br />
              <span className="bg-gradient-to-r from-[#00c4cc] via-[#7d2ae8] to-[#ff6b6b] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                In Seconds with AI
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              The world&apos;s most intuitive design platform. Create professional graphics, social media posts,
              presentations, and more — no experience needed.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={handleGetStarted}
                className="group w-full sm:w-auto bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] hover:from-[#00b3ba] hover:to-[#6b23c5] text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-purple-900/50 transition-all hover:scale-105 active:scale-95 hover:shadow-purple-900/70 flex items-center justify-center gap-3"
              >
                Start Creating Free
                <Icons.ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => setShowVideoModal(true)}
                className="group w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white px-10 py-5 rounded-2xl font-bold text-sm transition-all hover:scale-105 flex items-center justify-center gap-3 backdrop-blur-sm"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#00c4cc] to-[#7d2ae8] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Play className="w-4 h-4 ml-0.5" />
                </div>
                Watch 2-min Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 mb-16">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#00c4cc]/20 rounded-full flex items-center justify-center">
                  <Icons.Check className="w-3 h-3 text-[#00c4cc]" />
                </div>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#7d2ae8]/20 rounded-full flex items-center justify-center">
                  <Icons.Check className="w-3 h-3 text-[#7d2ae8]" />
                </div>
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#ff6b6b]/20 rounded-full flex items-center justify-center">
                  <Icons.Check className="w-3 h-3 text-[#ff6b6b]" />
                </div>
                <span>10M+ creators worldwide</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Video */}
          <div className="relative mt-20">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1318] via-[#0e1318]/50 to-transparent z-10 pointer-events-none"></div>
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-900/30 group">
              {/* Browser Chrome */}
              <div className="bg-[#1a1d21] px-4 py-3 flex items-center gap-2 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 text-center">
                  <div className="inline-block bg-[#0e1318] px-4 py-1 rounded-lg text-xs text-gray-500">
                    kreathief.app/editor
                  </div>
                </div>
              </div>
              {/* Screenshot with Parallax */}
              <div className="aspect-[16/9] bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e1b4b] flex items-center justify-center relative overflow-hidden">
                {/* Animated Background Elements with Parallax */}
                <div
                  className="absolute inset-0 transition-transform duration-100"
                  style={{
                    transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px)`,
                  }}
                >
                  <div className="absolute top-[20%] left-[10%] w-32 h-32 bg-[#7d2ae8]/20 rounded-full blur-3xl animate-pulse"></div>
                  <div
                    className="absolute bottom-[20%] right-[10%] w-40 h-40 bg-[#00c4cc]/20 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: '1s' }}
                  ></div>
                  <div
                    className="absolute top-[50%] left-[50%] w-48 h-48 bg-[#ff6b6b]/10 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: '2s' }}
                  ></div>
                </div>
                <div className="text-center relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#00c4cc] to-[#7d2ae8] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-900/50 animate-bounce-subtle">
                    <Icons.Magic className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-gray-400 text-sm mb-2">Product Screenshot</p>
                  <p className="text-gray-600 text-xs">Replace with actual editor screenshot</p>
                  <p className="text-gray-700 text-xs mt-4">
                    Show: Editor with layers panel, AI tools, and sample design
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Logos Section */}
      <section className="py-12 border-y border-white/5 bg-[#13161a]/30 backdrop-blur-sm overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-gray-500 mb-8">TRUSTED BY INNOVATIVE TEAMS WORLDWIDE</p>
          <div className="relative overflow-hidden">
            <div className="flex gap-16 animate-scroll">
              {[...brandLogos, ...brandLogos].map((brand, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 flex items-center gap-3 text-gray-600 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="text-3xl">{brand.logo}</span>
                  <span className="font-bold text-lg">{brand.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-[#13161a]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center group relative">
                {/* Trend Badge */}
                <div className="absolute -top-2 right-1/2 translate-x-full bg-[#00ff95]/10 border border-[#00ff95]/20 rounded-full px-2 py-0.5">
                  <span className="text-xs font-bold text-[#00ff95]">{stat.trend}</span>
                </div>
                <div className="text-4xl md:text-6xl font-display font-black bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                  {stat.value}
                </div>
                <div className="text-lg font-bold text-white mb-1">{stat.label}</div>
                <div className="text-sm text-gray-500">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 bg-[#7d2ae8]/10 border border-[#7d2ae8]/20 rounded-full px-4 py-2 mb-6">
              <span className="text-xs font-bold text-[#7d2ae8] uppercase tracking-wider">Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter mb-6 leading-[1.1]">
              Everything You Need to
              <span className="bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] bg-clip-text text-transparent">
                {' '}
                Create Amazing
              </span>
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              Professional-grade tools powered by cutting-edge AI. From concept to export, we&apos;ve got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                onMouseEnter={() => handleFeatureEnter(idx)}
                onMouseLeave={handleFeatureLeave}
                className={`group relative p-8 rounded-3xl border transition-all duration-500 hover:scale-[1.02] cursor-pointer overflow-hidden ${
                  visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                {/* Animated Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                ></div>

                {/* Background Icon */}
                <div className="absolute -bottom-8 -right-8 text-[200px] font-light text-white/5 group-hover:text-white/10 transition-colors select-none">
                  {feature.bgIcon}
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>

                  {/* Learn More Link */}
                  <div className="mt-6 flex items-center gap-2 text-sm font-bold text-[#00c4cc] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                    Learn more
                    <Icons.ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 md:py-32 bg-[#13161a]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 bg-[#00c4cc]/10 border border-[#00c4cc]/20 rounded-full px-4 py-2 mb-6">
              <span className="text-xs font-bold text-[#00c4cc] uppercase tracking-wider">Use Cases</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter mb-6 leading-[1.1]">
              Create for
              <span className="bg-gradient-to-r from-[#ff6b6b] to-[#feca57] bg-clip-text text-transparent">
                {' '}
                Any Purpose
              </span>
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              From social media to enterprise marketing, Kreathief handles it all.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, idx) => (
              <div key={idx} className="group relative overflow-hidden rounded-3xl cursor-pointer">
                {/* Image */}
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img
                    src={useCase.image}
                    alt={useCase.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] via-[#1e1e1e]/80 to-transparent"></div>
                </div>
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110`}
                    style={{ backgroundColor: `${useCase.color}30` }}
                  >
                    <useCase.icon className="w-6 h-6" style={{ color: useCase.color }} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{useCase.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{useCase.description}</p>
                  <ul className="space-y-1.5">
                    {useCase.examples.slice(0, 2).map((example, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: useCase.color }}></div>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 rounded-full px-4 py-2 mb-6">
              <span className="text-xs font-bold text-[#ff6b6b] uppercase tracking-wider">Simple Process</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter mb-6 leading-[1.1]">
              From Idea to Design
              <span className="bg-gradient-to-r from-[#00ff95] to-[#00c4cc] bg-clip-text text-transparent">
                {' '}
                in 3 Steps
              </span>
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              No learning curve. No complex tutorials. Just describe, customize, and export.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-20 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-[#00c4cc]/50 via-[#7d2ae8]/50 to-[#ff6b6b]/50"></div>

            {steps.map((step, idx) => (
              <div key={idx} className="relative text-center group">
                {/* Number Badge */}
                <div className="w-24 h-24 bg-gradient-to-br from-[#00c4cc] to-[#7d2ae8] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-900/40 relative z-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <step.icon className="w-10 h-10 text-white" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#0e1318] rounded-full flex items-center justify-center text-xs font-black text-white border-2 border-[#7d2ae8]">
                    {step.number}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed mb-4">{step.description}</p>
                <div className="bg-[#1e1e1e] border border-white/5 rounded-xl p-4 text-sm text-gray-500 font-mono mb-3">
                  {step.animation}
                </div>
                <div className="bg-[#00ff95]/10 border border-[#00ff95]/20 rounded-xl p-3 text-sm text-[#00ff95] font-medium">
                  {step.result}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Showcase Section */}
      <section id="templates" className="py-20 md:py-32 bg-[#13161a]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 bg-[#5f27cd]/10 border border-[#5f27cd]/20 rounded-full px-4 py-2 mb-6">
              <span className="text-xs font-bold text-[#5f27cd] uppercase tracking-wider">Template Library</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter mb-6 leading-[1.1]">
              Start with
              <span className="bg-gradient-to-r from-[#5f27cd] to-[#00c4cc] bg-clip-text text-transparent">
                {' '}
                10,000+ Templates
              </span>
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              Professionally designed templates for every occasion. Fully customizable to match your brand.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
            {templateCategories.map((category, idx) => (
              <div
                key={idx}
                className="group p-6 rounded-2xl bg-[#1e1e1e] border border-white/5 hover:border-white/10 transition-all duration-300 hover:scale-105 text-center cursor-pointer"
              >
                <div className="text-3xl font-display font-black mb-2" style={{ color: category.color }}>
                  {category.count}
                </div>
                <div className="text-sm font-bold text-white mb-1">{category.name}</div>
                <div className="text-xs text-gray-500">Templates</div>
              </div>
            ))}
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#1e1e1e] border border-white/5 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#7d2ae8]/20 to-[#00c4cc]/20 flex items-center justify-center">
                  <Icons.Templates className="w-12 h-12 text-gray-600" />
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform">
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 bg-[#feca57]/10 border border-[#feca57]/20 rounded-full px-4 py-2 mb-6">
              <span className="text-xs font-bold text-[#feca57] uppercase tracking-wider">Testimonials</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter mb-6 leading-[1.1]">
              Loved by
              <span className="bg-gradient-to-r from-[#feca57] to-[#ff6b6b] bg-clip-text text-transparent">
                {' '}
                Millions
              </span>
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              See what creators, businesses, and teams are saying about Kreathief.
            </p>
          </div>

          {/* Testimonial Carousel */}
          <div className="relative max-w-5xl mx-auto">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial, idx) => (
                  <div key={idx} className="w-full flex-shrink-0 px-4">
                    <div className="bg-[#1e1e1e] border border-white/5 rounded-3xl p-8 md:p-12">
                      <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* Image */}
                        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
                          <img
                            src={testimonial.image}
                            alt={testimonial.content}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] to-transparent"></div>
                        </div>
                        {/* Content */}
                        <div>
                          {/* Rating */}
                          <div className="flex gap-1 mb-6">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Icons.Star key={i} className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                            ))}
                          </div>
                          {/* Quote */}
                          <p className="text-xl md:text-2xl text-white leading-relaxed mb-8">
                            &quot;{testimonial.content}&quot;
                          </p>
                          {/* Author */}
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#00c4cc] to-[#7d2ae8] rounded-full flex items-center justify-center text-2xl">
                              {testimonial.avatar}
                            </div>
                            <div>
                              <div className="font-bold text-white text-lg">{testimonial.name}</div>
                              <div className="text-gray-400">{testimonial.role}</div>
                            </div>
                          </div>
                          {/* Company Logo */}
                          <div className="flex items-center gap-2 text-gray-500">
                            <span className="text-2xl">{testimonial.logo}</span>
                            <span className="text-sm font-medium">{testimonial.company}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-3 mt-8">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestimonial(idx)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    activeTestimonial === idx ? 'bg-[#7d2ae8] w-8' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 bg-[#13161a]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 bg-[#00ff95]/10 border border-[#00ff95]/20 rounded-full px-4 py-2 mb-6">
              <span className="text-xs font-bold text-[#00ff95] uppercase tracking-wider">Pricing</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter mb-6 leading-[1.1]">
              Simple, Transparent
              <span className="bg-gradient-to-r from-[#00ff95] to-[#00c4cc] bg-clip-text text-transparent">
                {' '}
                Pricing
              </span>
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed mb-8">
              Start free, upgrade when you need more. No hidden fees.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span
                className={`text-sm font-medium transition-colors ${!annualBilling ? 'text-white' : 'text-gray-500'}`}
              >
                Monthly
              </span>
              <button
                onClick={() => setAnnualBilling(!annualBilling)}
                className={`w-16 h-8 rounded-full transition-all relative ${annualBilling ? 'bg-[#7d2ae8]' : 'bg-gray-700'}`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-lg ${annualBilling ? 'left-9' : 'left-1'}`}
                />
              </button>
              <span
                className={`text-sm font-medium transition-colors ${annualBilling ? 'text-white' : 'text-gray-500'}`}
              >
                Annual
                <span className="ml-2 text-[#00ff95] text-xs font-bold bg-[#00ff95]/10 px-2 py-1 rounded-full">
                  Save 25%
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative p-8 rounded-3xl transition-all duration-500 ${
                  plan.highlight
                    ? 'bg-gradient-to-b from-[#7d2ae8]/20 to-[#1e1e1e] border-2 border-[#7d2ae8] scale-105 shadow-2xl shadow-purple-900/30'
                    : 'bg-[#1e1e1e] border border-white/5 hover:border-[#7d2ae8]/30 hover:scale-[1.02]'
                }`}
              >
                {plan.badge && (
                  <div
                    className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                      plan.badge === 'Most Popular' ? 'bg-[#7d2ae8] text-white' : 'bg-[#00ff95] text-black'
                    }`}
                  >
                    {plan.badge}
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    {plan.price > 0 && <span className="text-lg text-gray-500">$</span>}
                    <span className="text-6xl font-display font-black text-white">{plan.price}</span>
                    {plan.price > 0 && <span className="text-gray-500">/month</span>}
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#00ff95]/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Icons.Check className="w-3 h-3 text-[#00ff95]" />
                      </div>
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleGetStarted}
                  className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] text-white hover:scale-105 shadow-lg shadow-purple-900/40'
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Money Back Guarantee */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-[#00ff95]/10 border border-[#00ff95]/20 rounded-full px-6 py-3">
              <div className="w-8 h-8 bg-[#00ff95]/20 rounded-full flex items-center justify-center">
                <Icons.Shield className="w-4 h-4 text-[#00ff95]" />
              </div>
              <span className="text-sm font-medium text-gray-300">
                30-day money-back guarantee on Pro and Team plans
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-[#00c4cc]/10 border border-[#00c4cc]/20 rounded-full px-4 py-2 mb-6">
              <span className="text-xs font-bold text-[#00c4cc] uppercase tracking-wider">FAQ</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter mb-6 leading-[1.1]">
              Frequently Asked
              <span className="bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] bg-clip-text text-transparent">
                {' '}
                Questions
              </span>
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">Everything you need to know about Kreathief.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <FAQItem key={idx} question={faq.question} answer={faq.answer} defaultOpen={idx === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-r from-[#7d2ae8]/10 to-[#00c4cc]/10 border-y border-white/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[#7d2ae8]/20 border border-[#7d2ae8]/30 rounded-full px-5 py-2.5 mb-8">
            <span className="text-xs font-bold text-[#7d2ae8] uppercase tracking-wider">Stay Updated</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black tracking-tighter mb-6">
            Get Design Tips & Updates
          </h2>
          <p className="text-xl text-gray-400 mb-8 leading-relaxed">
            Join our newsletter for weekly design tips, tutorials, and exclusive offers.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 bg-[#1e1e1e] border border-white/10 rounded-xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#7d2ae8] transition-colors"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] text-white px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-purple-900/40 hover:scale-105 transition-transform"
            >
              Subscribe
            </button>
          </form>
          {subscribeStatus === 'success' && (
            <p className="mt-4 text-[#00ff95] font-medium">✓ Thanks for subscribing!</p>
          )}
          {subscribeStatus === 'error' && <p className="mt-4 text-red-500 font-medium">Please enter a valid email</p>}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-[#13161a] to-[#0e1318]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[#7d2ae8]/10 border border-[#7d2ae8]/20 rounded-full px-5 py-2.5 mb-8">
            <span className="text-xs font-bold text-[#7d2ae8] uppercase tracking-wider">Get Started Today</span>
          </div>
          <h2 className="text-4xl md:text-7xl font-display font-black tracking-tighter mb-8 leading-[1.1]">
            Ready to Create
            <span className="bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] bg-clip-text text-transparent">
              {' '}
              Amazing Designs?
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 mb-12 leading-relaxed">
            Join 10M+ creators using Kreathief to bring their ideas to life.
          </p>
          <button
            onClick={handleGetStarted}
            className="group bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] hover:from-[#00b3ba] hover:to-[#6b23c5] text-white px-12 py-6 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-purple-900/50 transition-all hover:scale-105 active:scale-95 hover:shadow-purple-900/70 inline-flex items-center gap-3"
          >
            Start Creating Free
            <Icons.ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-8 text-sm text-gray-500">No credit card required • Free forever plan</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00c4cc] to-[#7d2ae8] rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/20">
                  <Icons.Magic className="w-6 h-6 text-white" />
                </div>
                <span className="font-display font-black text-2xl tracking-tighter text-white">Kreathief</span>
              </div>
              <p className="text-gray-500 text-sm mb-6 max-w-xs leading-relaxed">
                AI-powered design suite for creating stunning graphics in seconds. No experience needed.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-110"
                >
                  <Icons.Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-110"
                >
                  <Icons.Instagram className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-110"
                >
                  <Icons.Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-110"
                >
                  <Icons.Github className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">
                    Pricing
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('templates')} className="hover:text-white transition-colors">
                    Templates
                  </button>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Changelog
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-bold text-white mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Tutorials
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Press
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Cookies
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Licenses
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">© 2026 Kreathief. All rights reserved.</p>
            <p className="text-sm text-gray-600">Made with ❤️ by Street Heart Technologies</p>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {showVideoModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            className="relative w-full max-w-5xl aspect-video bg-[#1e1e1e] rounded-2xl overflow-hidden border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <Icons.X className="w-6 h-6" />
            </button>
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Icons.Play className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Video Placeholder</p>
                <p className="text-gray-600 text-sm mt-2">Embed demo video here</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// FAQ Item Component
const FAQItem: React.FC<{ question: string; answer: string; defaultOpen?: boolean }> = ({
  question,
  answer,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen || false);

  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#1e1e1e] hover:border-white/10 transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-white/5 transition-colors"
      >
        <span className="font-bold text-white text-lg">{question}</span>
        <div
          className={`w-8 h-8 rounded-full bg-[#7d2ae8]/10 flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        >
          <Icons.ChevronDown className="w-5 h-5 text-[#7d2ae8]" />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-6 pb-5 text-gray-400 leading-relaxed">{answer}</div>
      </div>
    </div>
  );
};
