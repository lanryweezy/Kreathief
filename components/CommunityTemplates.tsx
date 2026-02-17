import React from 'react';
import { useStore } from '../store/useStore';

// Mock Data
const COMMUNITY_TEMPLATES = [
    {
        id: 'tpl_c1',
        title: 'Neon Cyberpunk Poster',
        author: 'PixelMaster',
        likes: 1240,
        downloads: 450,
        thumbnail: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=400&q=80',
        tags: ['Cyberpunk', 'Poster', 'Neon']
    },
    {
        id: 'tpl_c2',
        title: 'Minimalist Instagram Story',
        author: 'SarahDesigns',
        likes: 890,
        downloads: 320,
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
        tags: ['Instagram', 'Minimal', 'Social']
    },
    {
        id: 'tpl_c3',
        title: 'Vintage Coffee Menu',
        author: 'RetroKing',
        likes: 2100,
        downloads: 800,
        thumbnail: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&q=80',
        tags: ['Vintage', 'Menu', 'Coffee']
    },
    {
        id: 'tpl_c4',
        title: 'Tech Conference Banner',
        author: 'DevArt',
        likes: 560,
        downloads: 120,
        thumbnail: 'https://images.unsplash.com/photo-1540575467063-17e6fc425284?w=400&q=80',
        tags: ['Tech', 'Banner', 'Conference']
    }
];

const CommunityTemplates: React.FC = () => {
    const { handleApplyTemplate } = useStore();

    return (
        <div className="h-full flex flex-col bg-slate-900 text-white">
            <div className="p-4 border-b border-slate-700">
                <h3 className="font-bold text-lg">Community</h3>
                <p className="text-xs text-slate-400 mt-1">
                    Discover and remix designs from the community.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                    {COMMUNITY_TEMPLATES.map((template) => (
                        <div key={template.id} className="group relative break-inside-avoid mb-4">
                            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-slate-800 relative cursor-pointer" onClick={() => handleApplyTemplate(template)}>
                                <img
                                    src={template.thumbnail}
                                    alt={template.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    <h4 className="font-medium text-sm truncate">{template.title}</h4>
                                    <div className="flex items-center gap-1 text-xs text-slate-300 mt-1">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        {template.author}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-2 px-1">
                                <div className="flex gap-3 text-xs text-slate-400">
                                    <span className="flex items-center gap-1 hover:text-red-400 cursor-pointer transition-colors">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                        {template.likes}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                        {template.downloads}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CommunityTemplates;
