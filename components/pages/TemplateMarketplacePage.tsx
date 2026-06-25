import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../Button';
import { Icons } from '../../constants';
import { templateMarketplace, MarketplaceTemplate } from '../../services/templateMarketplace';
import TemplateSubmitModal from '../modals/TemplateSubmitModal';

interface Props { onApplyTemplate: (t: MarketplaceTemplate) => void; }
const CATS = ['All', 'Posters', 'Social', 'Print', 'Corporate', 'Branding', 'UI/UX', 'Illustration'];
type SortOpt = 'popular' | 'recent' | 'likes';

const TemplateMarketplacePage: React.FC<Props> = ({ onApplyTemplate }) => {
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<SortOpt>('popular');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);

  const fetchTemplates = useCallback(async (p: number, reset = false) => {
    setLoading(true);
    const r = await templateMarketplace.getTemplates(category === 'All' ? undefined : category, p, sort);
    setTemplates((prev) => (reset ? r.data : [...prev, ...r.data]));
    setHasMore(r.hasMore); setLoading(false);
  }, [category, sort]);

  useEffect(() => { setPage(1); fetchTemplates(1, true); }, [fetchTemplates]);

  const doSearch = async () => {
    if (!search.trim()) { setPage(1); fetchTemplates(1, true); return; }
    setLoading(true);
    setTemplates(await templateMarketplace.searchTemplates(search));
    setHasMore(false); setLoading(false);
  };

  useEffect(() => { if (!search) doSearch(); }, [search]);

  const like = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await templateMarketplace.likeTemplate(id);
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, likes: t.likes + 1 } : t)));
  };

  return (
    <div className="flex flex-col bg-surface-dark-0 min-h-[600px] text-white p-6 md:p-10 border border-white/5 rounded-3xl relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/5 pb-6 relative z-10">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3 uppercase tracking-wider">
            <Icons.Templates className="w-6 h-6 text-brand-600" /> Template Marketplace
          </h2>
          <p className="text-xs text-gray-400 mt-2 font-medium tracking-wide">Discover and apply community-created templates</p>
        </div>
        <Button onClick={() => setShowSubmit(true)} size="sm">Submit Template</Button>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative z-10">
        <div className="relative w-full max-w-md">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="SEARCH TEMPLATES..." value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-xs font-medium uppercase tracking-wider text-white focus:outline-none focus:border-brand-600 transition-all placeholder:text-gray-600" />
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${category === c ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{c}</button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-6 relative z-10">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Sort:</span>
        {[{ id: 'popular', l: 'Popular' }, { id: 'recent', l: 'Recent' }, { id: 'likes', l: 'Most Liked' }].map((o) => (
          <button key={o.id} onClick={() => setSort(o.id as SortOpt)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${sort === o.id ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{o.l}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-1 relative z-10">
        {templates.map((t) => (
          <div key={t.id} onClick={() => onApplyTemplate(t)} className="group bg-surface-dark-1 border border-white/5 hover:border-white/20 rounded-2xl overflow-hidden cursor-pointer flex flex-col transition-all duration-300 shadow-xl">
            <div className="aspect-[4/3] bg-surface-dark-0 flex items-center justify-center relative overflow-hidden border-b border-white/5">
              {t.thumbnailUrl ? <img src={t.thumbnailUrl} alt={t.title} className="w-full h-full object-cover" /> : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-dark-1 to-surface-dark-2"><Icons.Templates className="w-12 h-12 text-gray-700" /></div>
              )}
              <div className="absolute top-2 left-2 flex gap-1">
                {t.tags.slice(0, 2).map((tag) => <span key={tag} className="text-[9px] font-bold uppercase bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-white border border-white/10">{tag}</span>)}
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30"><Button size="sm">Apply</Button></div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-white truncate group-hover:text-brand-400 transition-colors">{t.title}</h3>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                  <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] border border-white/10">{t.authorName[0]}</span>{t.authorName}
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                <div className="flex gap-3 text-[10px] font-bold text-gray-400">
                  <span onClick={(e) => like(e, t.id)} className="flex items-center gap-1 cursor-pointer hover:text-red-400 transition-colors"><Icons.Heart className="w-3 h-3" /> {t.likes}</span>
                  <span className="flex items-center gap-1"><Icons.History className="w-3 h-3" /> {t.downloads}</span>
                </div>
                <span className="text-[9px] font-bold uppercase bg-white/5 border border-white/10 text-brand-400 px-2 py-0.5 rounded-full">{t.category}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {loading && <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>}
      {!loading && hasMore && <div className="flex justify-center py-6"><Button variant="ghost" onClick={() => { setPage((p) => p + 1); fetchTemplates(page + 1); }}>Load More</Button></div>}
      {!loading && !templates.length && <div className="flex flex-col items-center justify-center py-16 text-gray-500"><Icons.Templates className="w-16 h-16 mb-4 opacity-30" /><p className="text-sm font-medium">No templates found</p><p className="text-xs mt-1">Try adjusting filters or submit a new template</p></div>}
      <TemplateSubmitModal isOpen={showSubmit} onClose={() => setShowSubmit(false)} onSuccess={() => fetchTemplates(1, true)} />
    </div>
  );
};

export default TemplateMarketplacePage;
