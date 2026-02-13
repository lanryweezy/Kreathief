import React, { useState, useEffect } from 'react';
import { Icons } from '../../constants';
import * as unsplashService from '../../services/unsplashService';
import * as freepikService from '../../services/freepikService';

interface AssetsPanelProps {
    onAddImageLayer: (src: string) => void;
}

interface PhotoItem {
    id: string;
    url: string;
    thumbnail: string;
    alt: string;
    author: string;
    authorLink?: string;
    source: 'unsplash' | 'freepik';
}

export const AssetsPanel: React.FC<AssetsPanelProps> = ({ onAddImageLayer }) => {
    const [query, setQuery] = useState('');
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [activeSource, setActiveSource] = useState<'all' | 'unsplash' | 'freepik'>('all');

    useEffect(() => {
        handleSearch('nature');
    }, []);

    const handleSearch = async (searchQuery: string) => {
        setIsLoading(true);
        setHasSearched(true);
        try {
            const combined: PhotoItem[] = [];

            if (activeSource === 'all' || activeSource === 'unsplash') {
                try {
                    const unsplashResults = await unsplashService.searchPhotos(searchQuery || 'trending');
                    unsplashResults.forEach(p => {
                        combined.push({
                            id: `us-${p.id}`,
                            url: p.url,
                            thumbnail: p.thumbnail,
                            alt: p.alt,
                            author: p.user.name,
                            authorLink: p.user.link,
                            source: 'unsplash',
                        });
                    });
                } catch (e) {
                    console.error('Unsplash search failed:', e);
                }
            }

            if (activeSource === 'all' || activeSource === 'freepik') {
                try {
                    const freepikResults = await freepikService.searchPhotos(searchQuery || 'trending');
                    freepikResults.items.forEach(r => {
                        combined.push({
                            id: `fp-${r.id}`,
                            url: r.imageUrl,
                            thumbnail: r.thumbnailUrl || r.imageUrl,
                            alt: r.title,
                            author: r.author,
                            source: 'freepik',
                        });
                    });
                } catch (e) {
                    console.error('Freepik search failed:', e);
                }
            }

            // Interleave results from both sources for variety
            if (activeSource === 'all' && combined.length > 0) {
                const unsplash = combined.filter(p => p.source === 'unsplash');
                const freepik = combined.filter(p => p.source === 'freepik');
                const interleaved: PhotoItem[] = [];
                const maxLen = Math.max(unsplash.length, freepik.length);
                for (let i = 0; i < maxLen; i++) {
                    if (i < unsplash.length) interleaved.push(unsplash[i]);
                    if (i < freepik.length) interleaved.push(freepik[i]);
                }
                setPhotos(interleaved);
            } else {
                setPhotos(combined);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const sources = [
        { id: 'all' as const, label: 'All' },
        { id: 'unsplash' as const, label: 'Unsplash' },
        { id: 'freepik' as const, label: 'Freepik' },
    ];

    return (
        <div className="flex flex-col h-full bg-[#13161a] p-4 overflow-hidden">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Icons.Image className="w-5 h-5 text-[#00c4cc]" />
                Pro Photos
            </h3>

            {/* Source Tabs */}
            <div className="flex gap-1 mb-4 p-0.5 bg-[#1a1a1a] rounded-lg">
                {sources.map(src => (
                    <button
                        key={src.id}
                        onClick={() => { setActiveSource(src.id); if (hasSearched) handleSearch(query || 'nature'); }}
                        className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${activeSource === src.id
                                ? 'bg-[#00c4cc] text-white'
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        {src.label}
                    </button>
                ))}
            </div>

            <div className="relative mb-4">
                <input
                    type="text"
                    placeholder="Search millions of photos..."
                    className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00c4cc] transition-colors"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                />
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                        <div className="animate-spin w-8 h-8 border-4 border-[#00c4cc] border-t-transparent rounded-full"></div>
                        <p className="text-xs text-gray-500">Searching photos...</p>
                    </div>
                ) : photos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 pb-12 content-start">
                        {photos.map((photo) => (
                            <div
                                key={photo.id}
                                className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer bg-[#1e1e1e] border border-gray-700 hover:border-[#00c4cc] transition-all"
                                onClick={() => onAddImageLayer(photo.url)}
                            >
                                <img src={photo.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={photo.alt} loading="lazy" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="text-[9px] text-white truncate max-w-[70%]">
                                            by {photo.authorLink ? (
                                                <a href={photo.authorLink} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#00c4cc]" onClick={e => e.stopPropagation()}>{photo.author}</a>
                                            ) : (
                                                <span>{photo.author}</span>
                                            )}
                                        </div>
                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${photo.source === 'unsplash'
                                                ? 'bg-white/20 text-white'
                                                : 'bg-emerald-500/30 text-emerald-300'
                                            }`}>
                                            {photo.source === 'unsplash' ? 'U' : 'F'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : hasSearched && (
                    <div className="text-center text-gray-500 mt-10">
                        <p className="text-sm">No photos found for "{query}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};
