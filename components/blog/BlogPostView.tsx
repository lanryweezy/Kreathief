import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { BLOG_POSTS } from '../../data/blogPosts';
import { Icons } from '../../constants';
import { SEO } from '../SEO';

export const BlogPostView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const post = BLOG_POSTS.find((p) => p.id === id);

    if (!post) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4 rotate-3">Post Not Found</h1>
                    <Link to="/blog" className="text-purple-400 hover:text-white transition-colors underline decoration-purple-500/20">
                        Back to Blog
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-[#7d2ae8] pt-32 pb-20">
            <SEO
                title={post.title}
                description={post.excerpt}
                image={post.image}
            />

            <div className="max-w-4xl mx-auto px-6 relative z-10">
                <Link to="/blog" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-12 group">
                    <Icons.ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    Back to Blog
                </Link>

                <header className="mb-16">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] border border-purple-500/20">
                            {post.category}
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            {post.date} • {post.readTime}
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1] mb-8">
                        {post.title}
                    </h1>
                    <div className="flex items-center gap-4 py-8 border-y border-white/5">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center font-bold text-lg">
                            SA
                        </div>
                        <div>
                            <div className="font-bold text-white uppercase tracking-tight italic">By {post.author}</div>
                            <div className="text-xs text-gray-500 font-bold tracking-widest">CEO, Street Heart Technologies</div>
                        </div>
                    </div>
                </header>

                <div className="aspect-video rounded-3xl overflow-hidden mb-16 shadow-2xl border border-white/5 bg-white/5">
                    <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                <article className="prose prose-invert prose-purple max-w-none">
                    <div className="text-gray-300 leading-relaxed text-lg space-y-8">
                        {/* Simple content rendering for markdown-like string */}
                        {post.content.split('\n').map((line, i) => {
                            if (line.trim().startsWith('# ')) return <h1 key={i} className="text-4xl font-black text-white mt-12 mb-6">{line.replace('# ', '')}</h1>;
                            if (line.trim().startsWith('## ')) return <h2 key={i} className="text-3xl font-bold text-white mt-10 mb-4">{line.replace('## ', '')}</h2>;
                            if (line.trim().startsWith('### ')) return <h3 key={i} className="text-2xl font-bold text-purple-400 mt-8 mb-4">{line.replace('### ', '')}</h3>;
                            if (line.trim().startsWith('- ')) return <li key={i} className="ml-6 mb-2">{line.replace('- ', '')}</li>;
                            return <p key={i} className="mb-4">{line}</p>;
                        })}
                    </div>
                </article>

                <div className="mt-32 pt-16 border-t border-white/5 text-center">
                    <h2 className="text-4xl font-black mb-8">Ready to start designing?</h2>
                    <Link
                        to="/"
                        className="inline-flex px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-sm rounded-full hover:bg-gray-200 transition-all transform hover:scale-110 active:scale-95 shadow-2xl shadow-white/20"
                    >
                        Launch Editor
                    </Link>
                </div>
            </div>
        </div>
    );
};
