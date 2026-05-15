import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import { communityService, CommunityTemplate } from '../../services/communityService';
import { SuperLabel } from './LandingUtils';

export const CommunityShowcase: React.FC = () => {
  const [templates, setTemplates] = useState<CommunityTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await communityService.fetchTemplates('All');
      setTemplates(data.slice(0, 8));
      setLoading(false);
    };
    load();
  }, []);

  if (loading && templates.length === 0) {return null;}

  return (
    <section className="py-32 relative bg-[#0a0a0c] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 mb-20 text-center flex flex-col items-center">

        <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">
          Inspired by <span className="text-orange-500">Thousands.</span>
        </h2>
        <p className="text-xl text-neutral-400 max-w-2xl font-medium">
          The next generation of designers are already building on Kreathief. 
          Browse community templates and start from a masterpiece.
        </p>
      </div>

      {/* Infinite Horizontal Scroll of Community Designs */}
      <div className="relative flex overflow-x-hidden group">
        <div className="flex gap-8 animate-marquee whitespace-nowrap py-10 px-10 group-hover:[animation-play-state:paused]">
          {[...templates, ...templates].map((tmpl, idx) => (
            <motion.div
              key={`${tmpl.id}-${idx}`}
              whileHover={{ y: -10, scale: 1.02 }}
              className="w-[350px] aspect-video bg-[#13161a] rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative shrink-0 group/card"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
              
              {/* Mock Preview Content */}
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <Icons.Layout className="w-16 h-12" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-bold text-white truncate">{tmpl.name}</h4>
                  <div className="flex items-center gap-1.5 bg-orange-500/20 px-2 py-1 rounded-full border border-orange-500/20">
                    <Icons.Heart className="w-3 h-3 text-orange-500 fill-orange-500" />
                    <span className="text-[10px] text-orange-400 font-black">{tmpl.likes}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center text-[8px] font-bold text-neutral-400">
                    {tmpl.userName[0]}
                  </div>
                  <span className="text-xs text-neutral-400 font-medium">by {tmpl.userName}</span>
                </div>
              </div>

              {/* Hover Action */}
              <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center z-30 backdrop-blur-sm">
                <button className="bg-white text-black px-6 py-2 rounded-full font-bold text-xs shadow-xl transform translate-y-4 group-hover/card:translate-y-0 transition-transform">
                  Remix Design
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-20 flex justify-center">
        <button className="px-8 py-3 rounded-full border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-all flex items-center gap-2 group">
          Explore Community Gallery
          <Icons.ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  );
};
