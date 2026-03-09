import React from 'react';
import { Link } from 'react-router-dom';
import { BLOG_POSTS } from '../../data/blogPosts';
import { Icons } from '../../constants';
import { SEO } from '../SEO';

export const BlogList: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-[#7d2ae8] pt-32 pb-20">
            <SEO
                title="Blog | Creative Insights & Tutorials"
                description="Learn how to master generative design, AI cutouts, and professional vector tools with the Kreathief blog."
                url="https://kreathief.app/blog"
                type="website"
            />

            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-900/10 rounded-full blur-[100px] opacity-30 animate-pulse-slow"></div>
                <div className="absolute bottom-[20%] left-[-10%] w-[40vw] h-[40vw] bg-purple-900/10 rounded-full blur-[100px] opacity-30 animate-pulse-slow delay-1000"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="mb-16">
                    <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group">
                        <Icons.ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">
                        Creative <span className="text-purple-500">Insights</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl">
                        Tutorials, industry news, and product updates from the convergence of AI and design.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {BLOG_POSTS.map((post) => (
                        <Link
                            key={post.id}
                            to={`/blog/${post.id}`}
                            className="group relative flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-2 shadow-2xl hover:shadow-purple-500/10"
                        >
                            <div className="aspect-video overflow-hidden">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale-[20%] group-hover:grayscale-0"
                                />
                            </div>
                            <div className="p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-widest border border-purple-500/20">
                                        {post.category}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest underline decoration-purple-500/30">
                                        {post.date}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold mb-4 group-hover:text-purple-400 transition-colors">
                                    {post.title}
                                </h2>
                                <p className="text-gray-400 line-clamp-2 leading-relaxed mb-6">
                                    {post.excerpt}
                                </p>
                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 tracking-tighter italic">
                                        By {post.author}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                                        Read Post
                                        <Icons.ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};
