import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';
import { communityService, CommunityTemplate } from '../../services/communityService';

interface CommunityModalProps {
  onClose: () => void;
}

const CATEGORIES = ['All', 'Social', 'Marketing', 'Web', 'Corporate', 'Events'];

export const CommunityModal: React.FC<CommunityModalProps> = ({ onClose }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<CommunityTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'likes' | 'downloads' | 'newest'>('likes');
  const handleApplyTemplate = useStore((state) => state.handleApplyTemplate);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    const data = await communityService.fetchTemplates(
      activeCategory === 'All' ? undefined : activeCategory,
      searchQuery || undefined,
      sortBy
    );
    setTemplates(data);
    setLoading(false);
  }, [activeCategory, searchQuery, sortBy]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const onRemix = async (template: CommunityTemplate) => {
    // Record the download
    communityService.recordDownload(template.id);

    // Parse the state if it's a string
    let state = template.state;
    if (typeof state === 'string') {
      try { state = JSON.parse(state); } catch {}
    }

    const templateWithState = {
      ...template,
      state,
    };
    handleApplyTemplate(templateWithState);
    onClose();
  };

  const onLike = async (template: CommunityTemplate) => {
    await communityService.likeTemplate(template.id);
    setTemplates((prev) =>
      prev.map((t) => (t.id === template.id ? { ...t, likes: t.likes + 1 } : t))
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 overflow-hidden"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="relative w-full max-w-7xl h-full max-h-[90vh] bg-[#0e1318] border border-white/10 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7d2ae8] to-[#6b23c5] flex items-center justify-center shadow-[0_0_20px_rgba(125,42,232,0.3)]">
              <Icons.Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white uppercase">Community Hub</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                Discover & Remix Premium Designs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-xl mx-12">
            <div className="relative w-full group">
              <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#7d2ae8] transition-colors" />
              <input
                type="text"
                placeholder="Search templates, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7d2ae8]/50 focus:bg-white/10 transition-all"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-white/5 border border-white/5 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7d2ae8]/50"
            >
              <option value="likes">Most Liked</option>
              <option value="downloads">Most Downloaded</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          <button
            onClick={onClose}
            className="p-3 hover:bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-all border border-transparent hover:border-white/10"
          >
            <Icons.Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Filters */}
          <div className="w-64 border-r border-white/5 p-6 flex flex-col gap-2">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Categories</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-[#7d2ae8] text-white shadow-[0_4px_15px_rgba(125,42,232,0.4)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
                {cat === activeCategory && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_5px_white]" />}
              </button>
            ))}
          </div>

          {/* Grid Area */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar scrollbar-hide">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[4/3] rounded-3xl bg-white/5" />
                    <div className="mt-4 h-4 bg-white/5 rounded w-2/3" />
                    <div className="mt-2 h-3 bg-white/5 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : templates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {templates.map((template, idx) => (
                    <motion.div
                      key={template.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group relative"
                    >
                      <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-[#1e1e1e] border border-white/5 relative shadow-lg group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:border-[#7d2ae8]/30 transition-all duration-500">
                        {template.thumbnailUrl ? (
                          <img
                            src={template.thumbnailUrl}
                            alt={template.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7d2ae8]/20 to-[#1e1e1e]">
                            <Icons.Magic className="w-12 h-12 text-[#7d2ae8]/40" />
                          </div>
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 flex flex-col justify-end p-6 pointer-events-none z-10">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onRemix(template)}
                            className="w-full py-3 bg-[#7d2ae8] text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(125,42,232,0.5)] flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto"
                          >
                            <Icons.Magic className="w-4 h-4" />
                            Remix Design
                          </motion.button>
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute top-4 left-4 flex gap-2">
                          <div className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-wider text-white">
                            {template.category}
                          </div>
                          {template.remixOf && (
                            <div className="px-3 py-1 rounded-full bg-[#7d2ae8]/50 backdrop-blur-md border border-[#7d2ae8]/30 text-[9px] font-black uppercase tracking-wider text-white">
                              Remix
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between px-2">
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-[#7d2ae8] transition-colors">
                            {template.name}
                          </h3>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                            by {template.userName}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-gray-400">
                          <button
                            onClick={() => onLike(template)}
                            className="flex items-center gap-1 hover:text-red-500 transition-colors"
                          >
                            <Icons.Heart className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">{template.likes}</span>
                          </button>
                          <div className="flex items-center gap-1">
                            <Icons.Download className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">{template.downloads}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Icons.Search className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No templates found</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  {searchQuery
                    ? `No results for "${searchQuery}". Try different keywords.`
                    : 'Be the first to publish a design to the community!'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('All');
                  }}
                  className="mt-6 text-[#7d2ae8] text-sm font-bold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CommunityModal;
