import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BLOG_POSTS } from '../../data/blogPosts';
import { Icons } from '../../constants';

export const BlogPreview: React.FC = () => {
    const recentPosts = BLOG_POSTS.slice(0, 3);

    return (
        <section id="blog" className="py-32 light-section border-y border-black/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
                    <div className="max-w-xl">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-black"
                        >
                            Creative <span className="text-purple-600">Insights.</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-gray-600 font-medium"
                        >
                            Master the art of modern design with our latest tutorials and industry analysis.
                        </motion.p>
                    </div>
                    <Link to="/blog" className="px-8 py-4 bg-black/5 border border-black/10 rounded-full text-xs font-black uppercase tracking-widest hover:bg-black/10 transition-all flex items-center gap-2 group text-black">
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
                            className="group relative bg-white rounded-[32px] overflow-hidden border border-black/5 hover:border-black/10 transition-all duration-700 hover:-translate-y-2 shadow-xl hover:shadow-2xl hover:shadow-black/5"
                        >
                            <div className="aspect-[16/10] overflow-hidden relative">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                                />
                                <div className="absolute top-4 left-4 px-4 py-1.5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {post.category}
                                </div>
                            </div>
                            <div className="p-10">
                                <div className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">{post.date} • {post.readTime}</div>
                                <h3 className="text-xl font-black mb-6 leading-tight group-hover:text-purple-600 transition-colors uppercase tracking-tight text-black">{post.title}</h3>
                                <Link to={`/blog/${post.id}`} className="inline-flex items-center gap-2 text-[10px] font-black text-black hover:text-purple-600 transition-colors uppercase tracking-[0.3em]">
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
    return (
        <footer className="pt-32 pb-12 bg-[#0a0a0c]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-32">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                <Icons.Magic className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-black text-xl tracking-tighter uppercase">Kreathief</span>
                        </div>
                        <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">
                            The future of professional design, powered by generative intelligence.
                        </p>
                        <div className="flex items-center gap-4">
                            {[Icons.Twitter, Icons.Instagram, Icons.Facebook].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center hover:bg-white/5 transition-all text-gray-400 hover:text-white">
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-8">Platform</h4>
                        <ul className="space-y-4">
                            {[
                                { label: 'Design Tool', href: '/#features' },
                                { label: 'AI Studio', href: '/#features' },
                                { label: 'Features', href: '/#features' },
                                { label: 'Templates', href: '/dashboard' },
                                { label: 'API (Coming soon)', href: '#' }
                            ].map((item) => (
                                <li key={item.label}>
                                    {item.href.startsWith('/') ? (
                                        <Link to={item.href} className="text-gray-500 hover:text-white transition-colors text-sm font-medium">{item.label}</Link>
                                    ) : (
                                        <a href={item.href} className="text-gray-500 hover:text-white transition-colors text-sm font-medium">{item.label}</a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-8">Resources</h4>
                        <ul className="space-y-4">
                            {[
                                { label: 'Help Center', href: '/help' },
                                { label: 'Blog', href: '/blog' },
                                { label: 'Tutorials', href: '/blog' },
                                { label: 'Changelog', href: '/changelog' },
                                { label: 'Status', href: 'https://status.kreathief.com' }
                            ].map((item) => (
                                <li key={item.label}>
                                    {item.href.startsWith('/') ? (
                                        <Link to={item.href} className="text-gray-500 hover:text-white transition-colors text-sm font-medium">{item.label}</Link>
                                    ) : (
                                        <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors text-sm font-medium">{item.label}</a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-8">Company</h4>
                        <ul className="space-y-4">
                            {[
                                { label: 'About', href: '/about' },
                                { label: 'Privacy', href: '/privacy' },
                                { label: 'Terms', href: '/terms' },
                                { label: 'Security', href: '/security' },
                                { label: 'Contact', href: '/contact' }
                            ].map((item) => (
                                <li key={item.label}>
                                    {item.href.startsWith('/') ? (
                                        <Link to={item.href} className="text-gray-500 hover:text-white transition-colors text-sm font-medium">{item.label}</Link>
                                    ) : (
                                        <a href={item.href} className="text-gray-500 hover:text-white transition-colors text-sm font-medium">{item.label}</a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-gray-600 text-xs font-black uppercase tracking-[0.3em]">
                        © 2026 Kreathief Inc.
                    </div>
                    <div className="flex items-center gap-8 text-gray-700 text-[10px] font-black uppercase tracking-[0.2em]">
                        <span>Made in San Francisco</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
