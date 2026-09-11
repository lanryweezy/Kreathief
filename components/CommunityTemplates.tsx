import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Icons } from '../constants';
import { Project } from '../types';
import { fuzzyMatch } from '../utils/search';
import { TemplatePreview } from './TemplatePreview';

interface CommunityTemplatesProps {
  onOpenProject: (project: Project) => void;
}

const INITIAL_COMMUNITY_TEMPLATES = [
  {
    id: 'tpl_c1',
    title: 'Neon Cyberpunk Event Poster',
    author: 'PixelMaster',
    likes: 1240,
    downloads: 450,
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
    tags: ['Cyberpunk', 'Poster', 'Neon'],
    category: 'Posters',
    state: {
      canvasBackgroundColor: '#07051a',
      canvasSize: { width: 1080, height: 1350, name: 'Instagram Portrait' },
      layers: [
        {
          id: 'cb_photo',
          type: 'image',
          name: 'Cyberpunk Crowd Photo',
          x: 0,
          y: 0,
          width: 1080,
          height: 1350,
          rotation: 0,
          opacity: 0.5,
          locked: true,
          visible: true,
          src: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
          cornerRadius: 0,
        },
        {
          id: 'cb_top_kicker',
          type: 'text',
          name: 'Top Kicker',
          text: '// 2026.10.31_SYS_LOAD',
          x: 120,
          y: 120,
          width: 840,
          height: 30,
          rotation: 0,
          fontSize: 16,
          fontWeight: '700',
          color: '#00ffff',
          fontFamily: 'Space Grotesk, sans-serif',
          textAlign: 'left',
          letterSpacing: 4,
          opacity: 1,
          locked: false,
          visible: true,
        },
        {
          id: 'cb_title_1',
          type: 'text',
          name: 'Title Word 1',
          text: 'NEON NIGHTS',
          x: 120,
          y: 180,
          width: 840,
          height: 150,
          rotation: 0,
          fontSize: 96,
          fontWeight: '900',
          color: '#ffffff',
          fontFamily: 'Space Grotesk, sans-serif',
          textAlign: 'left',
          letterSpacing: -3,
          lineHeight: 0.9,
          opacity: 1,
          locked: false,
          visible: true,
        },
        {
          id: 'cb_card',
          type: 'rectangle',
          name: 'Event Card',
          x: 120,
          y: 850,
          width: 840,
          height: 280,
          rotation: 0,
          color: '#12092b',
          cornerRadius: 24,
          opacity: 0.92,
          locked: false,
          visible: true,
        },
        {
          id: 'cb_lineup',
          type: 'text',
          name: 'Lineup',
          text: 'FEATURING: KOBOSHI • CYBERWAVE • NEON PROTOCOL',
          x: 160,
          y: 890,
          width: 760,
          height: 50,
          rotation: 0,
          fontSize: 20,
          fontWeight: '800',
          color: '#ff007f',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: 2,
          opacity: 1,
          locked: false,
          visible: true,
        },
        {
          id: 'cb_date',
          type: 'text',
          name: 'Date Text',
          text: 'HALLOWEEN NIGHT • 22:00 - LATE • SHIBUYA WAREHOUSE',
          x: 160,
          y: 960,
          width: 760,
          height: 40,
          rotation: 0,
          fontSize: 18,
          fontWeight: '700',
          color: '#00ffff',
          fontFamily: 'Space Grotesk, sans-serif',
          textAlign: 'left',
          opacity: 1,
          locked: false,
          visible: true,
        },
      ],
    },
  },
  {
    id: 'tpl_c2',
    title: 'Minimalist Editorial Story',
    author: 'SarahDesigns',
    likes: 890,
    downloads: 320,
    thumbnail: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80',
    tags: ['Instagram', 'Minimal', 'Social'],
    category: 'Social',
    state: {
      canvasBackgroundColor: '#0a0a0c',
      canvasSize: { width: 1080, height: 1920, name: 'Story / Reel' },
      layers: [
        {
          id: 'story_photo',
          type: 'image',
          name: 'Model Portrait',
          x: 0,
          y: 0,
          width: 1080,
          height: 1920,
          rotation: 0,
          opacity: 0.6,
          locked: true,
          visible: true,
          src: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80',
          cornerRadius: 0,
        },
        {
          id: 'story_pill',
          type: 'rectangle',
          name: 'Collection Tag',
          x: 100,
          y: 160,
          width: 220,
          height: 44,
          rotation: 0,
          color: '#ffffff',
          cornerRadius: 22,
          opacity: 0.95,
          locked: false,
          visible: true,
        },
        {
          id: 'story_pill_txt',
          type: 'text',
          name: 'Tag Text',
          text: '✦ NEW RELEASE',
          x: 115,
          y: 174,
          width: 190,
          height: 20,
          rotation: 0,
          fontSize: 13,
          fontWeight: '900',
          color: '#09090b',
          fontFamily: 'Space Grotesk, sans-serif',
          textAlign: 'center',
          letterSpacing: 2,
          opacity: 1,
          locked: false,
          visible: true,
        },
        {
          id: 'story_title',
          type: 'text',
          name: 'Title',
          text: 'ARCHITECTURAL\nMINIMALISM',
          x: 100,
          y: 1200,
          width: 880,
          height: 220,
          rotation: 0,
          fontSize: 78,
          fontWeight: '900',
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: -2,
          lineHeight: 0.95,
          opacity: 1,
          locked: false,
          visible: true,
        },
        {
          id: 'story_cta',
          type: 'text',
          name: 'CTA',
          text: 'SWIPE UP TO VIEW LOOKBOOK ➔',
          x: 100,
          y: 1520,
          width: 880,
          height: 40,
          rotation: 0,
          fontSize: 20,
          fontWeight: '700',
          color: '#f8fafc',
          fontFamily: 'Space Grotesk, sans-serif',
          textAlign: 'left',
          letterSpacing: 2,
          opacity: 1,
          locked: false,
          visible: true,
        },
      ],
    },
  },
  {
    id: 'tpl_c3',
    title: 'Artisan Coffee & Bakery Menu',
    author: 'RetroKing',
    likes: 2100,
    downloads: 800,
    thumbnail: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
    tags: ['Vintage', 'Menu', 'Coffee'],
    category: 'Print',
    state: {
      canvasBackgroundColor: '#120d09',
      canvasSize: { width: 1080, height: 1080, name: 'Instagram Post' },
      layers: [
        {
          id: 'coffee_photo',
          type: 'image',
          name: 'Coffee Cup Photo',
          x: 0,
          y: 0,
          width: 1080,
          height: 1080,
          rotation: 0,
          opacity: 0.45,
          locked: true,
          visible: true,
          src: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80',
          cornerRadius: 0,
        },
        {
          id: 'coffee_card',
          type: 'rectangle',
          name: 'Menu Card Frame',
          x: 80,
          y: 80,
          width: 920,
          height: 920,
          rotation: 0,
          color: '#1a130e',
          cornerRadius: 32,
          opacity: 0.9,
          locked: false,
          visible: true,
        },
        {
          id: 'coffee_title',
          type: 'text',
          name: 'Main Title',
          text: 'ROASTERY & CO.',
          x: 120,
          y: 140,
          width: 840,
          height: 70,
          rotation: 0,
          fontSize: 52,
          fontWeight: '900',
          color: '#fed7aa',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
          letterSpacing: 4,
          opacity: 1,
          locked: false,
          visible: true,
        },
        {
          id: 'coffee_sub',
          type: 'text',
          name: 'Sub',
          text: 'SINGLE ORIGIN SPECIALTY COFFEE • FRESH PASTRIES DAILY',
          x: 120,
          y: 220,
          width: 840,
          height: 30,
          rotation: 0,
          fontSize: 14,
          fontWeight: '700',
          color: '#fb923c',
          fontFamily: 'Space Grotesk, sans-serif',
          textAlign: 'center',
          letterSpacing: 3,
          opacity: 1,
          locked: false,
          visible: true,
        },
        {
          id: 'coffee_item_1',
          type: 'text',
          name: 'Item 1',
          text: 'ETHIOPIAN YIRGACHEFFE POUR OVER ............. $6.50\nGUATEMALAN ESPRESSO TONIC .................... $7.00\nCARDAMOM PISTACHIO CROISSANT ............... $5.50',
          x: 160,
          y: 380,
          width: 760,
          height: 200,
          rotation: 0,
          fontSize: 20,
          fontWeight: '600',
          color: '#ffedd5',
          fontFamily: 'Space Grotesk, sans-serif',
          textAlign: 'left',
          lineHeight: 2.2,
          opacity: 1,
          locked: false,
          visible: true,
        },
      ],
    },
  },
  {
    id: 'tpl_c4',
    title: 'Global Tech Conference Banner',
    author: 'DevArt',
    likes: 560,
    downloads: 120,
    thumbnail: 'https://images.unsplash.com/photo-1540575467063-17e6fc425284?w=800&q=80',
    tags: ['Tech', 'Banner', 'Conference'],
    category: 'Corporate',
    state: {
      canvasBackgroundColor: '#040714',
      canvasSize: { width: 1280, height: 720, name: 'YouTube Thumbnail' },
      layers: [
        {
          id: 'conf_photo',
          type: 'image',
          name: 'Conference Audience Photo',
          x: 0,
          y: 0,
          width: 1280,
          height: 720,
          rotation: 0,
          opacity: 0.35,
          locked: true,
          visible: true,
          src: 'https://images.unsplash.com/photo-1540575467063-17e6fc425284?w=1200&q=80',
          cornerRadius: 0,
        },
        {
          id: 'conf_tag',
          type: 'text',
          name: 'Date Tag',
          text: '✦ OCTOBER 18-20, 2026 • SAN FRANCISCO & ONLINE',
          x: 80,
          y: 100,
          width: 1000,
          height: 30,
          rotation: 0,
          fontSize: 16,
          fontWeight: '800',
          color: '#38bdf8',
          fontFamily: 'Space Grotesk, sans-serif',
          textAlign: 'left',
          letterSpacing: 3,
          opacity: 1,
          locked: false,
          visible: true,
        },
        {
          id: 'conf_headline',
          type: 'text',
          name: 'Headline',
          text: 'AI ARCHITECTS SUMMIT 2026',
          x: 80,
          y: 160,
          width: 1100,
          height: 140,
          rotation: 0,
          fontSize: 64,
          fontWeight: '900',
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: -2,
          opacity: 1,
          locked: false,
          visible: true,
        },
        {
          id: 'conf_desc',
          type: 'text',
          name: 'Description',
          text: 'Join 5,000+ AI engineers, researchers, and venture founders shaping autonomous multi-agent computing.',
          x: 80,
          y: 320,
          width: 800,
          height: 60,
          rotation: 0,
          fontSize: 18,
          fontWeight: '500',
          color: '#94a3b8',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          opacity: 1,
          locked: false,
          visible: true,
        },
        {
          id: 'conf_btn',
          type: 'rectangle',
          name: 'Register Button',
          x: 80,
          y: 440,
          width: 280,
          height: 60,
          rotation: 0,
          color: '#0284c7',
          cornerRadius: 30,
          opacity: 1,
          locked: false,
          visible: true,
        },
        {
          id: 'conf_btn_txt',
          type: 'text',
          name: 'Register Text',
          text: 'REGISTER PASSES →',
          x: 100,
          y: 458,
          width: 240,
          height: 25,
          rotation: 0,
          fontSize: 14,
          fontWeight: '900',
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
          letterSpacing: 2,
          opacity: 1,
          locked: false,
          visible: true,
        },
      ],
    },
  },
];
const CATEGORIES = ['All', 'Posters', 'Social', 'Print', 'Corporate'];

const CommunityTemplates: React.FC<CommunityTemplatesProps> = ({ onOpenProject }) => {
  const { createProject, loadProject, communityProjects } = useStore(
    useShallow((state) => ({
      createProject: state.createProject,
      loadProject: state.loadProject,
      communityProjects: state.communityProjects,
    }))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [templates, setTemplates] = useState([...INITIAL_COMMUNITY_TEMPLATES, ...(communityProjects || [])]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'likes' | 'downloads'>('likes');

  useEffect(() => {
    setTemplates([...INITIAL_COMMUNITY_TEMPLATES, ...(communityProjects || [])]);
  }, [communityProjects]);

  const handleLike = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (likedIds.includes(id)) {
      setLikedIds(likedIds.filter((item) => item !== id));
      setTemplates(templates.map((t) => (t.id === id ? { ...t, likes: t.likes - 1 } : t)));
    } else {
      setLikedIds([...likedIds, id]);
      setTemplates(templates.map((t) => (t.id === id ? { ...t, likes: t.likes + 1 } : t)));
    }
  };

  const handleRemix = async (e: React.MouseEvent, template: any) => {
    e.stopPropagation();
    const remixedState = {
      artboards: template.state.artboards || [
        {
          id: 'default',
          name: 'Artboard 1',
          x: 0,
          y: 0,
          width: template.state.canvasSize?.width || 1080,
          height: template.state.canvasSize?.height || 1080,
          layers: template.state.layers || [],
        },
      ],
      activeArtboardId: template.state.activeArtboardId || 'default',
      canvasBackgroundColor: template.state.canvasBackgroundColor || '#ffffff',
      canvasFilters: template.state.canvasFilters || {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        opacity: 1,
        vignette: 0,
        sepia: 0,
        grayscale: 0,
        hueRotate: 0,
      },
      canvasSize: template.state.canvasSize || { width: 1080, height: 1080, name: 'Instagram Post' },
    };
    const newProjectId = await createProject(`${template.title} (Remix)`, template.state.canvasSize, remixedState);
    // Fetch from updated store and open it
    setTimeout(() => {
      const allProjects = useStore.getState().projects;
      const createdProject = allProjects.find((p) => p.id === newProjectId);
      if (createdProject) {
        loadProject(createdProject.id);
        onOpenProject(createdProject);
      }
    }, 0);
  };

  const filteredTemplates = templates
    .filter((t) => {
      const matchesSearch =
        fuzzyMatch(searchQuery, t.title) ||
        fuzzyMatch(searchQuery, t.author) ||
        t.tags.some((tag: string) => fuzzyMatch(searchQuery, tag));
      const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));

  return (
    <div className="flex flex-col bg-surface-dark-0 min-h-[600px] text-white p-6 md:p-10 border border-white/5 rounded-3xl relative overflow-hidden shadow-2xl backdrop-blur-3xl">
      {/* Decorative Grid Lines / Background Glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header with search and Category buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-white/5 pb-8 relative z-10">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3 uppercase tracking-wider">
            <Icons.Templates className="w-6 h-6 text-brand-600" />
            Community Feed
          </h2>
          <p className="text-xs text-gray-400 mt-2 font-medium tracking-wide max-w-xl">
            Browse high-fidelity designs submitted by the Kreathief creator network. Hit Remix to edit them right away.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 border border-brand-500'
                  : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Sort Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 select-none">
        <div className="relative w-full max-w-md">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="SEARCH COMMUNITY DESIGNS..."
            aria-label="Search community templates"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-xs font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-600 focus:bg-white/10 transition-all placeholder:text-gray-600"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-3 hidden sm:inline select-none">
            Sort by:
          </span>
          {[
            { id: 'likes', label: 'Most Liked' },
            { id: 'downloads', label: 'Trending' },
          ].map((sort) => (
            <button
              key={sort.id}
              onClick={() => setSortBy(sort.id as any)}
              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                sortBy === sort.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {sort.label}
            </button>
          ))}
        </div>
      </div>

      {/* Community Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 flex-1">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={(e) => handleRemix(e, template)}
            className="group bg-surface-dark-1 border border-white/5 hover:border-white/20 rounded-2xl overflow-hidden cursor-pointer flex flex-col relative transition-all duration-300 shadow-xl select-none"
          >
            {/* Image/Live Thumbnail Area */}
            <div className="aspect-[4/3] bg-surface-dark-1 flex items-center justify-center relative overflow-hidden group border-b border-white/5 select-none">
              {/* High-fidelity Miniature Render (Always Visible) */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-2 select-none pointer-events-none bg-surface-dark-0">
                <TemplatePreview
                  template={template}
                  containerWidth={280}
                  containerHeight={210}
                  className="w-full h-full"
                />
              </div>

              {/* Tag Overlays */}
              <div className="absolute top-3 left-3 flex gap-1 flex-wrap pointer-events-none z-10">
                {template.tags.slice(0, 2).map((tag: string) => (
                  <span
                    key={tag}
                    className="text-[9px] font-black uppercase tracking-wider text-white bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action Button: Visible on Hover */}
              <div className="absolute inset-0 flex items-center justify-center p-4 z-20 pointer-events-none">
                <button
                  onClick={(e) => handleRemix(e, template)}
                  className="bg-brand-600 text-white hover:bg-brand-700 px-5 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-purple-900/40 transform scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 pointer-events-auto duration-300"
                >
                  <Icons.Magic className="w-4 h-4" /> Remix Design
                </button>
              </div>
            </div>

            {/* Bottom Card Footer */}
            <div className="p-5 bg-surface-dark-1 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-white truncate mb-1 group-hover:text-brand-400 transition-colors">
                  {template.title}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold tracking-wider">
                  <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] border border-white/10">
                    {template.author[0]}
                  </span>
                  {template.author}
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                <div className="flex gap-4 text-[10px] font-black tracking-widest uppercase text-gray-400">
                  <span
                    onClick={(e) => handleLike(e, template.id)}
                    className={`flex items-center gap-1 cursor-pointer transition-colors ${
                      likedIds.includes(template.id) ? 'text-red-500 font-bold' : 'hover:text-red-400'
                    }`}
                  >
                    <Icons.Heart className={`w-3.5 h-3.5 ${likedIds.includes(template.id) ? 'fill-current' : ''}`} />
                    {template.likes}
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <Icons.History className="w-3.5 h-3.5" />
                    {template.downloads}
                  </span>
                </div>

                <span className="text-[9px] font-black uppercase tracking-wider bg-white/5 border border-white/10 text-brand-400 px-2 py-0.5 rounded-full">
                  {template.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityTemplates;
