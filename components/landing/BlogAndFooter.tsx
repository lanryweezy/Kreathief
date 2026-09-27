import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BLOG_POSTS } from '../../data/blogPosts';
import { Icons } from '../../constants';

export const BlogPreview: React.FC = () => {
  const recentPosts = BLOG_POSTS.slice(0, 3);

  return (
    <section id="blog" className="py-32 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
          <div className="max-w-xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white"
            >
              Creative <span className="text-purple-400">Insights.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-neutral-400 font-medium"
            >
              Master the art of modern design with our latest tutorials and industry analysis.
            </motion.p>
          </div>
          <Link
            to="/blog"
            className="px-8 py-4 bg-white/5 border border-white/10 rounded-full text-xs font-bold transition-all flex items-center gap-2 group text-white hover:bg-white/10"
          >
            Visit Full Blog
            <Icons.ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recentPosts.map((post, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative bg-[#0a0a0c] rounded-[32px] overflow-hidden border border-white/5 transition-all duration-700 hover:-translate-y-2 hover:border-white/20"
            >
              <div className="aspect-[16/10] overflow-hidden relative">
                <img
                  src={post.image}
                  alt={post.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                />
                <div className="absolute top-4 left-4 px-4 py-1.5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                  {post.category}
                </div>
              </div>
              <div className="p-10">
                <div className="text-[10px] font-bold text-neutral-400 mb-4 uppercase tracking-[0.2em]">
                  {post.date} • {post.readTime}
                </div>
                <h3 className="text-xl font-bold mb-6 leading-tight group-hover:text-purple-400 transition-colors tracking-tight text-white">
                  {post.title}
                </h3>
                <Link
                  to={`/blog/${post.id}`}
                  className="inline-flex items-center gap-2 text-[10px] font-bold text-neutral-300 hover:text-white transition-colors uppercase tracking-[0.3em]"
                >
                  Read Post <Icons.ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const Footer: React.FC = () => {
  const creativeTools = [
    { label: 'Magic Object Eraser', href: '/tools/magic-eraser', badge: 'Hot' },
    { label: 'AI Background Remover', href: '/tools/background-remover' },
    { label: 'Image to SVG Vectorizer', href: '/tools/vectorizer', badge: 'New' },
    { label: 'AI Image Upscaler', href: '/tools/image-upscaler' },
    { label: 'Outpaint & Canvas Expand', href: '/tools/ai-expand-image' },
    { label: 'AI Background Changer', href: '/tools/change-background' },
    { label: 'Canvas to Video Motion', href: '/tools/image-to-video' },
    { label: 'All 9 Free AI Tools →', href: '/tools', highlight: true },
  ];

  const designStudio = [
    { label: '3D Mockup Generator', href: '/tools/mockup-generator' },
    { label: 'Smart Format Auto-Resize', href: '/tools/smart-resize' },
    { label: '60+ Aesthetic Movements', href: '/tools/design-styles' },
    { label: 'Typography Harmonizer', href: '/editor?tool=text' },
    { label: 'Multi-Artboard Canvas', href: '/editor' },
    { label: 'Vector Pen & Anchors', href: '/editor?tool=draw' },
    { label: 'Presentation Slides', href: '/editor?tool=slides' },
    { label: 'WCAG Design Linter', href: '/editor' },
  ];

  const useCases = [
    { label: 'Social Posts & TikTok 9:16', href: '/tools/smart-resize' },
    { label: 'Apparel & Streetwear Mockups', href: '/tools/mockup-generator' },
    { label: 'Transparent PNG Cutouts', href: '/tools/background-remover' },
    { label: 'Vector Logos & Clean SVGs', href: '/tools/vectorizer' },
    { label: 'Photo Blemish Removal', href: '/tools/magic-eraser' },
    { label: 'eCommerce Product Staging', href: '/tools/product-staging' },
    { label: 'Historic Design Movement Posters', href: '/tools/design-styles' },
    { label: 'Interactive Slide Decks', href: '/editor?tool=slides' },
  ];

  const resources = [
    { label: 'Design Templates', href: '/dashboard' },
    { label: 'Creative Blog & Guides', href: '/blog' },
    { label: 'Node Workspace Canvas', href: '/canvas' },
    { label: 'Help Center & Docs', href: '/help' },
    { label: 'Product Changelog', href: '/changelog' },
    { label: 'Tools Directory', href: '/tools' },
  ];

  const company = [
    { label: 'About Kreathief', href: '/about' },
    { label: 'Contact & Support', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Security & Safety', href: '/security' },
  ];

  return (
    <footer className="pt-24 pb-12 bg-[#08080a] border-t border-white/5 text-gray-400">
      <div className="max-w-7xl mx-auto px-6">
        {/* Top Brand & Status Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-16 mb-16 border-b border-white/5 gap-8">
          <div className="max-w-md">
            <Link to="/" className="flex items-center gap-3 mb-4 group inline-flex">
              <div className="w-9 h-9 rounded-xl bg-surface-dark-2 border border-white/10 flex items-center justify-center p-1.5 shadow-lg group-hover:border-brand-500/50 transition-colors">
                <img src="/logo.svg" alt="Kreathief" className="w-full h-full object-contain" />
              </div>
              <span className="font-black text-2xl tracking-tighter text-white">Kreathief</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              The browser-first creative studio combining multi-agent generative intelligence with precision vector craftsmanship.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>•</span>
              <span>100% In-Browser Privacy</span>
              <span>•</span>
              <span>Zero Artificial Watermarks</span>
            </div>

            <div className="flex items-center gap-2 ml-auto lg:ml-4">
              {[
                { Icon: Icons.Twitter, label: 'Twitter / X', href: 'https://twitter.com/kreathief' },
                { Icon: Icons.Instagram, label: 'Instagram', href: 'https://instagram.com/kreathief' },
                { Icon: Icons.Facebook, label: 'Facebook', href: 'https://facebook.com/kreathief' },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg border border-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all text-gray-400 hover:text-white"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* 5-Column Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-10 mb-20 text-sm">
          {/* Column 1: AI Creative Tools */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-1.5">
              <span>AI Creative Tools</span>
            </h3>
            <ul className="space-y-3">
              {creativeTools.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className={`transition-colors flex items-center justify-between group ${
                      item.highlight
                        ? 'text-brand-400 font-bold hover:text-brand-300'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Design Studio */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6">
              Design Studio
            </h3>
            <ul className="space-y-3">
              {designStudio.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Use Cases */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6">
              Use Cases
            </h3>
            <ul className="space-y-3">
              {useCases.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Resources */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6">
              Resources
            </h3>
            <ul className="space-y-3">
              {resources.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Company & Trust */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6">
              Company & Legal
            </h3>
            <ul className="space-y-3">
              {company.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Ask AI Intelligence Row */}
        <div className="py-10 border-t border-white/5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-1.5">
                Questions about Kreathief?
              </h3>
              <p className="text-neutral-400 text-xs">
                Query the world's most intelligent AI models directly about our architecture and features.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {[
                {
                  label: 'ChatGPT',
                  color: 'hover:text-emerald-400 hover:border-emerald-500/40',
                  href: 'https://chatgpt.com/?q=Tell+me+about+Kreathief+AI+Design+Suite+and+how+its+multi-agent+system+works.',
                },
                {
                  label: 'Claude',
                  color: 'hover:text-orange-400 hover:border-orange-500/40',
                  href: 'https://claude.ai/new?q=What+is+Kreathief+and+how+does+it+compare+to+Figma+and+Canva?',
                },
                {
                  label: 'Gemini',
                  color: 'hover:text-blue-400 hover:border-blue-500/40',
                  href: 'https://gemini.google.com/app?q=Summarize+the+key+features+of+Kreathief+AI+Design+Suite.',
                },
                {
                  label: 'Perplexity',
                  color: 'hover:text-cyan-400 hover:border-cyan-500/40',
                  href: 'https://www.perplexity.ai/search?q=Is+Kreathief+AI+Design+Suite+the+best+tool+for+AI+vector+design?',
                },
              ].map((ai) => (
                <a
                  key={ai.label}
                  href={ai.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold transition-all text-gray-300 ${ai.color} hover:bg-white/10`}
                >
                  {ai.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Metadata & Copyright */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div>© {new Date().getFullYear()} Kreathief Inc. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/security" className="hover:text-white transition-colors">Security</Link>
            <span className="text-gray-700">•</span>
            <span>Crafted for modern visual creators</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
