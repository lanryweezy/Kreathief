import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => (
  <main className="min-h-screen bg-[#0a0a0c] px-6 py-24 text-white">
    <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
      <img src="/logo.svg" alt="Kreathief" className="mb-10 h-14 w-14 object-contain" />
      <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-purple-300">404 — Page not found</p>
      <h1 className="mb-6 text-5xl font-black tracking-tight md:text-7xl">That page is off canvas.</h1>
      <p className="mb-10 max-w-xl text-lg leading-relaxed text-gray-400">
        The link may be outdated or the page may have moved. Return to Kreathief and start creating with AI design and
        professional vector tools.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link to="/" className="rounded-full bg-white px-7 py-3 font-bold text-black transition hover:bg-gray-200">
          Back to home
        </Link>
        <Link
          to="/blog"
          className="rounded-full border border-white/15 px-7 py-3 font-bold text-white transition hover:border-white/30 hover:bg-white/5"
        >
          Read the blog
        </Link>
      </div>
    </div>
  </main>
);

export default NotFoundPage;
