import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Icons } from '../constants';
import { Project } from '../types';

interface CommunityTemplatesProps {
  onOpenProject: (project: Project) => void;
}

const INITIAL_COMMUNITY_TEMPLATES = [
  {
    id: 'tpl_c1',
    title: 'Neon Cyberpunk Poster',
    author: 'PixelMaster',
    likes: 1240,
    downloads: 450,
    thumbnail: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&q=80',
    tags: ['Cyberpunk', 'Poster', 'Neon'],
    category: 'Posters',
    state: {
      layers: [
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
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#00ffff',
          fontFamily: 'Space Grotesk, sans-serif',
          textAlign: 'left',
          letterSpacing: 4,
          lineHeight: 1.0,
          textTransform: 'uppercase',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0,
        },
        {
          id: 'cb_title_1',
          type: 'text',
          name: 'Title Word 1',
          text: 'NEON NIGHTS',
          x: 120,
          y: 200,
          width: 840,
          height: 150,
          rotation: 0,
          fontSize: 110,
          fontWeight: '900',
          fontStyle: 'italic',
          textDecoration: 'none',
          color: '#ffffff',
          fontFamily: 'Space Grotesk, sans-serif',
          textAlign: 'left',
          letterSpacing: -5,
          lineHeight: 0.9,
          textTransform: 'uppercase',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0,
          shadow: { color: '#ff0055', blur: 30, offsetX: -5, offsetY: 0 },
        },
      ],
      canvasBackgroundColor: '#07051a',
      canvasFilters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, opacity: 1, vignette: 0, sepia: 0, grayscale: 0, hueRotate: 0 },
      canvasSize: { width: 1080, height: 1350, name: 'Instagram Portrait' }
    }
  },
  {
    id: 'tpl_c2',
    title: 'Minimalist Instagram Story',
    author: 'SarahDesigns',
    likes: 890,
    downloads: 320,
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
    tags: ['Instagram', 'Minimal', 'Social'],
    category: 'Social',
    state: {
      layers: [
        {
          id: 'ig_tag',
          type: 'text',
          height: 50,
          name: 'Tag',
          text: '✦ NEW DROP',
          x: 110,
          y: 130,
          width: 180,
          rotation: 0,
          fontSize: 18,
          fontWeight: '800',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#022c22',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: 2.5,
          lineHeight: 1.4,
          textTransform: 'uppercase',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0,
        },
      ],
      canvasBackgroundColor: '#0a0a0a',
      canvasFilters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, opacity: 1, vignette: 0, sepia: 0, grayscale: 0, hueRotate: 0 },
      canvasSize: { width: 1080, height: 1920, name: 'Story / Reel' }
    }
  },
  {
    id: 'tpl_c3',
    title: 'Vintage Coffee Menu',
    author: 'RetroKing',
    likes: 2100,
    downloads: 800,
    thumbnail: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80',
    tags: ['Vintage', 'Menu', 'Coffee'],
    category: 'Print',
    state: {
      layers: [
        {
          id: 'coffee_title',
          type: 'text',
          name: 'Main Title',
          text: 'VINTAGE COFFEE',
          x: 100,
          y: 100,
          width: 800,
          height: 80,
          rotation: 0,
          fontSize: 48,
          fontWeight: '800',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#3e2723',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: -1,
          lineHeight: 1.0,
          textTransform: 'uppercase',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0,
        },
      ],
      canvasBackgroundColor: '#fdfbf7',
      canvasFilters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, opacity: 1, vignette: 0, sepia: 0, grayscale: 0, hueRotate: 0 },
      canvasSize: { width: 1080, height: 1080, name: 'Instagram Post' }
    }
  },
  {
    id: 'tpl_c4',
    title: 'Tech Conference Banner',
    author: 'DevArt',
    likes: 560,
    downloads: 120,
    thumbnail: 'https://images.unsplash.com/photo-1540575467063-17e6fc425284?w=800&q=80',
    tags: ['Tech', 'Banner', 'Conference'],
    category: 'Corporate',
    state: {
      layers: [
        {
          id: 'tech_subtitle',
          type: 'text',
          name: 'Subtitle',
          text: 'ANNUAL TECH CON 2026',
          x: 80,
          y: 180,
          width: 900,
          height: 100,
          rotation: 0,
          fontSize: 48,
          fontWeight: '800',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#00ffff',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: -1,
          lineHeight: 1.0,
          textTransform: 'uppercase',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0,
        },
      ],
      canvasBackgroundColor: '#020617',
      canvasFilters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, opacity: 1, vignette: 0, sepia: 0, grayscale: 0, hueRotate: 0 },
      canvasSize: { width: 1280, height: 720, name: 'YouTube Thumbnail' }
    }
  }
];

const CATEGORIES = ['All', 'Posters', 'Social', 'Print', 'Corporate'];

const CommunityTemplates: React.FC<CommunityTemplatesProps> = ({ onOpenProject }) => {
  const { createProject, loadProject, communityProjects } = useStore();
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
      setTemplates(
        templates.map((t) => (t.id === id ? { ...t, likes: t.likes - 1 } : t))
      );
    } else {
      setLikedIds([...likedIds, id]);
      setTemplates(
        templates.map((t) => (t.id === id ? { ...t, likes: t.likes + 1 } : t))
      );
    }
  };

  const handleRemix = async (e: React.MouseEvent, template: any) => {
    e.stopPropagation();
    const remixedState = {
      artboards: template.state.artboards || [{
        id: 'default',
        name: 'Artboard 1',
        x: 0,
        y: 0,
        width: template.state.canvasSize?.width || 1080,
        height: template.state.canvasSize?.height || 1080,
        layers: template.state.layers || [],
      }],
      activeArtboardId: template.state.activeArtboardId || 'default',
      canvasBackgroundColor: template.state.canvasBackgroundColor || '#ffffff',
      canvasFilters: template.state.canvasFilters || { brightness: 100, contrast: 100, saturation: 100, blur: 0, opacity: 1, vignette: 0, sepia: 0, grayscale: 0, hueRotate: 0 },
      canvasSize: template.state.canvasSize || { width: 1080, height: 1080, name: 'Instagram Post' }
    };
    const newProjectId = await createProject(
      `${template.title} (Remix)`,
      template.state.canvasSize,
      remixedState
    );
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
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));

  return (
    <div className="flex flex-col bg-[#050505] min-h-[600px] text-white p-6 md:p-10 border border-white/5 rounded-3xl relative overflow-hidden shadow-2xl backdrop-blur-3xl">
      {/* Decorative Grid Lines / Background Glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header with search and Category buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-white/5 pb-8 relative z-10">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3 uppercase tracking-wider">
            <Icons.Templates className="w-6 h-6 text-purple-500" />
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
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-500'
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-xs font-black uppercase tracking-widest text-white focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all placeholder:text-gray-600"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-3 hidden sm:inline select-none">
            Sort by:
          </span>
          {[
            { id: 'likes', label: 'Most Liked' },
            { id: 'downloads', label: 'Trending' }
          ].map((sort) => (
            <button
              key={sort.id}
              onClick={() => setSortBy(sort.id as any)}
              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                sortBy === sort.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
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
            className="group bg-[#0c0c0e] border border-white/5 hover:border-white/20 rounded-2xl overflow-hidden cursor-pointer flex flex-col relative transition-all duration-300 shadow-xl select-none"
          >
            {/* Image/Live Thumbnail Area */}
            <div className="aspect-[4/3] bg-[#0c0c0e] flex items-center justify-center relative overflow-hidden group border-b border-white/5 select-none">
              
              {/* High-fidelity Miniature Render (Always Visible) */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-2 select-none pointer-events-none bg-[#0a0a0c]">
                <div 
                  style={{
                    width: `${template.state?.canvasSize?.width || 1080}px`,
                    height: `${template.state?.canvasSize?.height || 1080}px`,
                    transform: `scale(${Math.min(260 / (template.state?.canvasSize?.width || 1080), 195 / (template.state?.canvasSize?.height || 1080))})`,
                    transformOrigin: 'center center',
                    backgroundColor: template.state?.canvasBackgroundColor || '#0f172a',
                  }}
                  className="relative flex-shrink-0 shadow-2xl rounded-sm border border-white/5 overflow-hidden"
                >
                  {template.state?.layers?.map((l: any, idx: number) => {
                    if (l.type === 'rectangle') {
                      return (
                        <div
                          key={l.id || idx}
                          style={{
                            position: 'absolute',
                            left: `${l.x}px`,
                            top: `${l.y}px`,
                            width: `${l.width}px`,
                            height: `${l.height}px`,
                            backgroundColor: l.color || '#fff',
                            borderRadius: `${l.cornerRadius || 0}px`,
                            opacity: l.opacity ?? 1,
                            transform: `rotate(${l.rotation || 0}deg) skew(${l.skewX || 0}deg, ${l.skewY || 0}deg)`,
                          }}
                        />
                      );
                    }
                    if (l.type === 'circle') {
                      return (
                        <div
                          key={l.id || idx}
                          style={{
                            position: 'absolute',
                            left: `${l.x}px`,
                            top: `${l.y}px`,
                            width: `${l.width}px`,
                            height: `${l.height}px`,
                            backgroundColor: l.color || '#fff',
                            borderRadius: '50%',
                            opacity: l.opacity ?? 1,
                            transform: `rotate(${l.rotation || 0}deg)`,
                          }}
                        />
                      );
                    }
                    if (l.type === 'text') {
                      return (
                        <div
                          key={l.id || idx}
                          style={{
                            position: 'absolute',
                            left: `${l.x}px`,
                            top: `${l.y}px`,
                            width: `${l.width}px`,
                            height: `${l.height}px`,
                            color: l.color || '#fff',
                            fontSize: `${l.fontSize || 16}px`,
                            fontFamily: l.fontFamily || 'sans-serif',
                            fontWeight: l.fontWeight || '400',
                            textAlign: l.textAlign || 'left',
                            opacity: l.opacity ?? 1,
                            transform: `rotate(${l.rotation || 0}deg) skew(${l.skewX || 0}deg, ${l.skewY || 0}deg)`,
                            whiteSpace: 'pre-wrap',
                            overflow: 'hidden',
                          }}
                        >
                          {l.text}
                        </div>
                      );
                    }
                    if (l.type === 'path' || l.type === 'svg' || l.pathData) {
                      const isDrawing = l.id?.startsWith('draw_') || l.brushType;
                      const strokeColor = l.stroke?.color || l.color || '#fff';
                      const strokeWidth = l.stroke?.width || 2;
                      return (
                        <svg
                          key={l.id || idx}
                          style={{
                            position: 'absolute',
                            left: `${l.x}px`,
                            top: `${l.y}px`,
                            width: `${l.width}px`,
                            height: `${l.height}px`,
                            opacity: l.opacity ?? 1,
                            transform: `rotate(${l.rotation || 0}deg)`,
                            overflow: 'visible',
                          }}
                          viewBox={l.viewBox || `0 0 ${l.width || 512} ${l.height || 512}`}
                        >
                          <path 
                            d={l.pathData || l.path || l.d} 
                            fill={isDrawing ? 'none' : (l.color || '#fff')} 
                            stroke={isDrawing ? strokeColor : 'none'}
                            strokeWidth={isDrawing ? strokeWidth : 0}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      );
                    }
                    if (l.type === 'image') {
                      return (
                        <img
                          key={l.id || idx}
                          src={l.src}
                          style={{
                            position: 'absolute',
                            left: `${l.x}px`,
                            top: `${l.y}px`,
                            width: `${l.width}px`,
                            height: `${l.height}px`,
                            opacity: l.opacity ?? 1,
                            transform: `rotate(${l.rotation || 0}deg)`,
                            objectFit: 'cover',
                          }}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
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
                  className="bg-[#7d2ae8] text-white hover:bg-[#6a1fc5] px-5 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-purple-900/40 transform scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 pointer-events-auto duration-300"
                >
                  <Icons.Magic className="w-4 h-4" /> Remix Design
                </button>
              </div>
            </div>

            {/* Bottom Card Footer */}
            <div className="p-5 bg-[#0c0c0e] flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-white truncate mb-1 group-hover:text-purple-400 transition-colors">
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

                <span className="text-[9px] font-black uppercase tracking-wider bg-white/5 border border-white/10 text-purple-400 px-2 py-0.5 rounded-full">
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
