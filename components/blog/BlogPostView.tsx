import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BLOG_POSTS } from '../../data/blogPosts';
import { Icons } from '../../constants';
import { SEO } from '../SEO';

export const BlogPostView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const post = BLOG_POSTS.find((p) => p.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 rotate-3 text-red-500">404: Post Not Found</h1>
          <Link
            to="/blog"
            className="text-purple-400 hover:text-white transition-colors underline decoration-purple-500/20"
          >
            Return to the Archives
          </Link>
        </div>
      </div>
    );
  }

  // A simple, dependency-free Markdown-like text formatter for bold text
  const formatText = (text: string) => {
    // Simple bold rendering
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="text-white font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Simple italics
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={index} className="text-gray-300 italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-brand-600 pt-32 pb-32">
      <SEO
        title={post.title}
        description={post.excerpt}
        image={`https://kreathief.app${post.image}`}
        url={`https://kreathief.app/blog/${post.id}`}
        type="article"
      />
      {/* JSON-LD Schema for Blog Posting */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          image: [`https://kreathief.app${post.image}`],
          datePublished: new Date(post.date).toISOString(),
          author: [
            {
              '@type': 'Person',
              name: post.author,
              url: 'https://kreathief.app/',
            },
          ],
        })}
      </script>

      <div className="max-w-[1200px] mx-auto px-6 relative z-10 flex flex-col md:flex-row gap-12">
        {/* Sticky Left Sidebar (Share & Meta) */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-32">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-12 group text-xs uppercase tracking-widest font-bold"
            >
              <Icons.ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
              Back to Blog
            </Link>

            <div className="mb-8">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Published</div>
              <div className="text-white font-medium">{post.date}</div>
            </div>

            <div className="mb-8">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Read Time</div>
              <div className="flex items-center gap-2 text-white font-medium">
                <Icons.Play className="w-3 h-3 text-purple-500" />
                {post.readTime}
              </div>
            </div>

            <div className="pt-8 border-t border-white/10">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Share Article</div>
              <div className="flex gap-4">
                <button
                  aria-label="Share on Twitter"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-purple-500/20 hover:border-purple-500/30 transition-all flex items-center justify-center group"
                >
                  <Icons.Twitter className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
                </button>
                <button
                  aria-label="Visit Author Website"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all flex items-center justify-center group"
                >
                  <Icons.Monitor className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
                </button>
                <button
                  aria-label="Copy Link"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-pink-500/20 hover:border-pink-500/30 transition-all flex items-center justify-center group"
                >
                  <Icons.Link className="w-4 h-4 text-gray-400 group-hover:text-pink-400" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 max-w-3xl">
          <header className="mb-12">
            <span className="inline-block px-3 py-1 mb-6 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] border border-purple-500/20">
              {post.category}
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter leading-[1.05] mb-8 text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 py-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 p-[2px]">
                <div className="w-full h-full bg-[#050505] rounded-full flex items-center justify-center text-white font-black">
                  {post.author.charAt(0)}
                </div>
              </div>
              <div>
                <div className="font-bold text-white text-lg tracking-tight">{post.author}</div>
                <div className="text-xs text-gray-500 font-bold tracking-widest uppercase">Editor in Chief</div>
              </div>
            </div>
          </header>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="aspect-[21/9] rounded-[32px] overflow-hidden mb-16 shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/10 bg-[#111] relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10 opacity-60" />
            <img src={post.image} alt={post.title} className="w-full h-full object-cover relative z-0" />
          </motion.div>

          <article className="prose prose-invert prose-purple max-w-none prose-lg">
            <div className="text-gray-400 leading-[1.8] text-xl font-medium space-y-8">
              {post.content.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) {
                  return null;
                }

                if (trimmed.startsWith('# ')) {
                  return (
                    <h1 key={i} className="text-5xl font-black text-white mt-16 mb-8 tracking-tight">
                      {formatText(trimmed.replace('# ', ''))}
                    </h1>
                  );
                }
                if (trimmed.startsWith('## ')) {
                  return (
                    <h2 key={i} className="text-3xl font-bold text-white mt-14 mb-6">
                      {formatText(trimmed.replace('## ', ''))}
                    </h2>
                  );
                }
                if (trimmed.startsWith('### ')) {
                  return (
                    <h3 key={i} className="text-2xl font-bold text-purple-400 mt-10 mb-4">
                      {formatText(trimmed.replace('### ', ''))}
                    </h3>
                  );
                }
                if (trimmed.startsWith('- ')) {
                  return (
                    <li key={i} className="ml-8 mb-3 list-disc marker:text-purple-500 pl-2">
                      {formatText(trimmed.replace('- ', ''))}
                    </li>
                  );
                }
                if (trimmed.startsWith('![') && trimmed.includes('](')) {
                  const src = trimmed.split('](')[1].split(')')[0];
                  const alt = trimmed.split('![')[1].split(']')[0];
                  return (
                    <figure key={i} className="my-16 relative group">
                      <div className="absolute -inset-4 bg-purple-500/20 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      <img
                        src={src}
                        alt={alt}
                        className="w-full rounded-2xl relative z-10 border border-white/10 shadow-2xl"
                      />
                      <figcaption className="text-center text-sm text-gray-500 mt-4 font-medium italic">
                        {alt}
                      </figcaption>
                    </figure>
                  );
                }
                return (
                  <p key={i} className="mb-6">
                    {formatText(trimmed)}
                  </p>
                );
              })}
            </div>
          </article>

          <div className="mt-32 p-12 rounded-[40px] border border-white/10 bg-gradient-to-br from-[#111] to-[#050505] text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>

            <h2 className="text-4xl font-black mb-6 relative z-10 text-white">Experience the Future of Design</h2>
            <p className="text-xl text-gray-400 mb-10 relative z-10">
              Join thousands of creative professionals building without limits.
            </p>
            <Link
              to="/"
              className="inline-flex relative z-10 px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-[11px] rounded-full hover:bg-gray-200 transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            >
              Open Kreathief Free
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};
